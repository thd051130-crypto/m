-- 마음이음 4단계: 관리자 + 알림 + PWA(웹 푸시 구조)

-- =========================================================
-- 1. 이용 제한 기간
-- =========================================================
alter table public.profiles add column suspended_until timestamptz;

-- 제한 기간이 지나면 자동으로 다시 쓸 수 있다 (영구 제한은 suspended_until = null)
create or replace function public.is_active_user()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and nickname is not null
      and (status = 'active' or (status = 'suspended' and suspended_until is not null and suspended_until < now()))
  );
$$;

-- =========================================================
-- 2. 관리자 조치 로그
-- =========================================================
create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.admin_actions enable row level security;
revoke all on public.admin_actions from anon, authenticated;

-- =========================================================
-- 3. 알림
-- =========================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('comment', 'reaction', 'group_message', 'group_notice', 'system')),
  ref_id uuid,
  count int not null default 1,       -- 그룹 메시지 묶음 개수
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, updated_at desc);
-- 같은 그룹의 안 읽은 메시지 알림은 하나로 묶는다
create unique index notifications_group_unread_uniq on public.notifications (user_id, ref_id)
  where type = 'group_message' and is_read = false;

create table public.notification_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade default auth.uid(),
  comment boolean not null default true,
  reaction boolean not null default true,
  group_message boolean not null default true,
  group_notice boolean not null default true,
  dnd_start smallint not null default 23 check (dnd_start between 0 and 23),
  dnd_end smallint not null default 8 check (dnd_end between 0 and 23),
  updated_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
alter table public.notification_settings enable row level security;

create policy "notifications: 본인만 조회" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications: 본인만 읽음 처리" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (is_read) on public.notifications to authenticated;

create policy "notification_settings: 본인만" on public.notification_settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.notifications, public.notification_settings from anon;

-- 알림 유형이 꺼져 있으면 false
create or replace function public.wants_notification(p_user uuid, p_type text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((
    select case p_type
      when 'comment' then comment
      when 'reaction' then reaction
      when 'group_message' then group_message
      when 'group_notice' then group_notice
      else true end
    from notification_settings where user_id = p_user
  ), true);
$$;
revoke execute on function public.wants_notification(uuid, text) from anon, authenticated, public;

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

-- 내 글에 댓글
create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare v_author uuid;
begin
  select author_id into v_author from posts where id = new.post_id;
  if v_author is not null and v_author <> new.author_id
     and not public.is_blocked_between(v_author, new.author_id)
     and public.wants_notification(v_author, 'comment') then
    insert into notifications (user_id, type, ref_id) values (v_author, 'comment', new.post_id);
  end if;
  return new;
end;
$$;
create trigger comments_notify after insert on public.comments
  for each row execute function public.notify_comment();

-- 내 글에 공감 (같은 글의 안 읽은 공감 알림은 개수만 올린다)
create or replace function public.notify_reaction()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare v_author uuid; v_existing uuid;
begin
  if new.target_type <> 'post' then return new; end if;
  select author_id into v_author from posts where id = new.target_id;
  if v_author is null or v_author = new.user_id
     or public.is_blocked_between(v_author, new.user_id)
     or not public.wants_notification(v_author, 'reaction') then
    return new;
  end if;
  select id into v_existing from notifications
   where user_id = v_author and type = 'reaction' and ref_id = new.target_id and is_read = false limit 1;
  if v_existing is not null then
    update notifications set count = count + 1, updated_at = now() where id = v_existing;
  else
    insert into notifications (user_id, type, ref_id) values (v_author, 'reaction', new.target_id);
  end if;
  return new;
end;
$$;
create trigger reactions_notify after insert on public.reactions
  for each row execute function public.notify_reaction();

-- 그룹 새 메시지: 그룹별로 묶어서 "새 메시지 n개"
create or replace function public.notify_group_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into notifications (user_id, type, ref_id)
  select m.user_id, 'group_message', new.group_id
  from group_members m
  where m.group_id = new.group_id and m.left_at is null and m.user_id <> new.sender_id
    and not public.is_blocked_between(m.user_id, new.sender_id)
    and public.wants_notification(m.user_id, 'group_message')
  on conflict (user_id, ref_id) where type = 'group_message' and is_read = false
  do update set count = notifications.count + 1, updated_at = now();
  return new;
end;
$$;
create trigger messages_notify after insert on public.messages
  for each row execute function public.notify_group_message();

-- 그룹 공지 변경
create or replace function public.notify_group_notice()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.notice is distinct from old.notice and coalesce(new.notice, '') <> '' then
    insert into notifications (user_id, type, ref_id)
    select m.user_id, 'group_notice', new.id
    from group_members m
    where m.group_id = new.id and m.left_at is null and public.wants_notification(m.user_id, 'group_notice');
  end if;
  return new;
end;
$$;
create trigger groups_notice_notify after update of notice on public.groups
  for each row execute function public.notify_group_notice();

-- =========================================================
-- 4. 웹 푸시 (구조만, 기본 꺼짐)
-- =========================================================
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "push: 본인만" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.push_subscriptions from anon;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
