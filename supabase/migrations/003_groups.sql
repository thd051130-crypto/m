-- 마음이음 2단계: 그룹 매칭 + 실시간 그룹 채팅

-- =========================================================
-- 1. 테이블
-- =========================================================
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 30),
  description text not null default '',
  topics text[] not null default '{}',        -- 마음 상태 키와 매핑 (lonely, tired …)
  interests text[] not null default '{}',     -- 관심사 키
  chat_style text not null default 'light' check (chat_style in ('light', 'deep', 'cheer', 'interest')),
  active_times text[] not null default '{}',
  max_members int not null default 8 check (max_members between 2 and 8),
  is_active boolean not null default true,
  notice text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'host')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id) where left_at is null;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null default auth.uid(),
  body text not null check (char_length(body) between 1 and 1000),
  is_hidden boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_group_created_idx on public.messages (group_id, created_at desc);
create index messages_sender_created_idx on public.messages (sender_id, created_at desc);

create table public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('empathy', 'cheer', 'strength')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, kind)
);

-- 맞는 그룹이 부족할 때 같은 조건 대기자 5명이 모이면 새 그룹을 연다
create table public.match_queue (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  match_key text not null,
  chat_style text not null,
  active_time text not null,
  interests text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index match_queue_key_idx on public.match_queue (match_key, created_at);

-- =========================================================
-- 2. 헬퍼 함수
-- =========================================================
create or replace function public.is_group_member(p_group uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group and user_id = auth.uid() and left_at is null
  );
$$;
revoke execute on function public.is_group_member(uuid) from anon, public;
grant execute on function public.is_group_member(uuid) to authenticated;

-- 그룹 목록 + 현재 인원 + 내 참여 여부 + 차단 관계 여부 (매칭용)
create or replace function public.group_candidates()
returns table (
  id uuid, name text, description text, topics text[], interests text[], chat_style text,
  active_times text[], max_members int, notice text,
  member_count int, is_member boolean, has_block_conflict boolean
)
language sql
security definer set search_path = public
stable
as $$
  select g.id, g.name, g.description, g.topics, g.interests, g.chat_style,
         g.active_times, g.max_members, g.notice,
         (select count(*)::int from group_members m where m.group_id = g.id and m.left_at is null),
         exists (select 1 from group_members m where m.group_id = g.id and m.user_id = auth.uid() and m.left_at is null),
         exists (
           select 1 from group_members m
           join blocks b on (b.blocker_id = auth.uid() and b.blocked_id = m.user_id)
                         or (b.blocked_id = auth.uid() and b.blocker_id = m.user_id)
           where m.group_id = g.id and m.left_at is null
         )
  from groups g
  where g.is_active and auth.uid() is not null;
$$;
revoke execute on function public.group_candidates() from anon, public;
grant execute on function public.group_candidates() to authenticated;

-- 참여: 정원 초과는 DB에서 막는다 (그룹 행 잠금으로 동시 참여도 안전)
create or replace function public.join_group(p_group uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_max int;
  v_count int;
begin
  if not public.is_active_user() then return 'not_allowed'; end if;
  select max_members into v_max from groups where id = p_group and is_active for update;
  if not found then return 'not_found'; end if;
  if public.is_group_member(p_group) then return 'already'; end if;
  select count(*) into v_count from group_members where group_id = p_group and left_at is null;
  if v_count >= v_max then return 'full'; end if;
  insert into group_members (group_id, user_id) values (p_group, auth.uid())
  on conflict (group_id, user_id) do update set left_at = null, joined_at = now();
  delete from match_queue where user_id = auth.uid();
  return 'joined';
end;
$$;
revoke execute on function public.join_group(uuid) from anon, public;
grant execute on function public.join_group(uuid) to authenticated;

create or replace function public.leave_group(p_group uuid)
returns void
language sql
security definer set search_path = public
as $$
  update group_members set left_at = now()
  where group_id = p_group and user_id = auth.uid() and left_at is null;
$$;
revoke execute on function public.leave_group(uuid) from anon, public;
grant execute on function public.leave_group(uuid) to authenticated;

-- 본인 메시지 소프트 삭제 (원문은 지운다)
create or replace function public.delete_message(p_message uuid)
returns void
language sql
security definer set search_path = public
as $$
  update messages set deleted_at = now(), body = '삭제된 메시지예요'
  where id = p_message and sender_id = auth.uid() and deleted_at is null;
$$;
revoke execute on function public.delete_message(uuid) from anon, public;
grant execute on function public.delete_message(uuid) to authenticated;

-- 대기열 등록: 조건 키 = 대화 스타일 + 첫 활동 시간. 5명이 모이면 그룹 생성 후 함께 참여.
-- (대기열 등록 화면에서 "5명이 모이면 자동으로 참여돼요"에 본인이 동의한 경우만)
create or replace function public.join_match_queue()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_pref record;
  v_style text;
  v_time text;
  v_key text;
  v_users uuid[];
  v_group uuid;
  v_interests text[];
begin
  if not public.is_active_user() then return jsonb_build_object('status', 'not_allowed'); end if;
  select * into v_pref from mood_preferences where user_id = auth.uid();
  if not found then return jsonb_build_object('status', 'no_preferences'); end if;

  v_style := coalesce(v_pref.chat_styles[1], 'light');
  v_time := coalesce(v_pref.active_times[1], 'evening');
  v_key := v_style || ':' || v_time;

  insert into match_queue (user_id, match_key, chat_style, active_time, interests)
  values (auth.uid(), v_key, v_style, v_time, v_pref.interests)
  on conflict (user_id) do update
    set match_key = excluded.match_key, chat_style = excluded.chat_style,
        active_time = excluded.active_time, interests = excluded.interests, created_at = now();

  perform pg_advisory_xact_lock(hashtext('match_queue:' || v_key));
  select array_agg(user_id order by created_at) into v_users
  from (select user_id, created_at from match_queue where match_key = v_key order by created_at limit 5) q;

  if coalesce(array_length(v_users, 1), 0) < 5 then
    return jsonb_build_object('status', 'queued', 'waiting', coalesce(array_length(v_users, 1), 0));
  end if;

  -- 5명 중 가장 많이 겹치는 관심사 3개
  select coalesce(array_agg(i order by c desc), '{}') into v_interests
  from (select i, count(*) c from match_queue, unnest(interests) i
        where user_id = any (v_users) group by i order by count(*) desc limit 3) t;

  insert into groups (name, description, interests, chat_style, active_times, created_by)
  values (
    case v_time when 'morning' then '아침' when 'lunch' then '점심' when 'evening' then '저녁' else '심야' end
      || '에 만나는 새 모임',
    '비슷한 시간대, 비슷한 대화 스타일을 가진 분들이 모였어요.',
    v_interests, v_style, array[v_time], null
  )
  returning id into v_group;

  insert into group_members (group_id, user_id) select v_group, unnest(v_users);
  delete from match_queue where user_id = any (v_users);
  return jsonb_build_object('status', 'grouped', 'group_id', v_group);
end;
$$;
revoke execute on function public.join_match_queue() from anon, public;
grant execute on function public.join_match_queue() to authenticated;

-- 메시지: 보낸 사람 강제 + 연속 전송 제한 (10초에 5개)
create or replace function public.messages_before_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.sender_id := auth.uid();
  end if;
  new.is_hidden := false;
  new.deleted_at := null;
  if (select count(*) from messages
      where sender_id = new.sender_id and created_at > now() - interval '10 seconds') >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001', hint = '10초에 5개까지 보낼 수 있어요.';
  end if;
  return new;
end;
$$;

create trigger messages_before_insert before insert on public.messages
  for each row execute function public.messages_before_insert();

-- =========================================================
-- 3. RLS
-- =========================================================
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.match_queue enable row level security;

create policy "groups: 로그인 사용자 조회" on public.groups
  for select to authenticated using (is_active = true);
revoke insert, update, delete on public.groups from anon, authenticated;

-- 참여·탈퇴는 join_group / leave_group 함수로만
create policy "group_members: 같은 그룹 현재 멤버만 조회" on public.group_members
  for select to authenticated using (public.is_group_member(group_id));
revoke insert, update, delete on public.group_members from anon, authenticated;

create policy "messages: 현재 멤버만 조회 (차단 제외)" on public.messages
  for select to authenticated using (
    public.is_group_member(group_id)
    and is_hidden = false
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = messages.sender_id
    )
  );
create policy "messages: 현재 멤버만 작성" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid() and public.is_group_member(group_id) and public.is_active_user()
  );
revoke update, delete on public.messages from anon, authenticated;

create policy "message_reactions: 그룹 멤버 조회" on public.message_reactions
  for select to authenticated using (
    exists (select 1 from public.messages m where m.id = message_id and public.is_group_member(m.group_id))
  );
create policy "message_reactions: 본인만 생성" on public.message_reactions
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.messages m where m.id = message_id and public.is_group_member(m.group_id))
  );
create policy "message_reactions: 본인만 삭제" on public.message_reactions
  for delete to authenticated using (user_id = auth.uid());

create policy "match_queue: 본인만 조회" on public.match_queue
  for select to authenticated using (user_id = auth.uid());
create policy "match_queue: 본인만 삭제" on public.match_queue
  for delete to authenticated using (user_id = auth.uid());
revoke insert, update on public.match_queue from anon, authenticated;

revoke all on public.groups, public.group_members, public.messages, public.message_reactions, public.match_queue from anon;

-- =========================================================
-- 4. Realtime (RLS가 그대로 적용됨: 비멤버는 구독해도 수신 불가)
-- =========================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
    alter publication supabase_realtime add table public.message_reactions;
  end if;
end $$;

-- =========================================================
-- 5. 초기 그룹 10개
-- =========================================================
insert into public.groups (name, description, topics, interests, chat_style, active_times, notice) values
  ('퇴근 후 수다방', '하루 끝에 가볍게 오늘 있었던 일을 나눠요.', '{just_chat,want_talk,tired}', '{movie,music,cooking}', 'light', '{evening}', '서로의 하루에 "수고했어요" 한마디부터 시작해요.'),
  ('새벽 마음 나눔방', '잠 못 드는 밤, 조용히 마음을 꺼내 놓는 곳.', '{lonely,tired,want_talk}', '{music,reading}', 'deep', '{night}', '천천히, 편한 만큼만 이야기해요.'),
  ('운동 같이 해요', '혼자 하면 작심삼일, 같이 하면 꾸준히!', '{energy,new_friends}', '{exercise,walk}', 'cheer', '{morning,evening}', '오늘 한 운동을 짧게 인증해요.'),
  ('책 읽는 저녁', '요즘 읽는 책, 밑줄 그은 문장을 나눠요.', '{just_chat,energy}', '{reading,growth}', 'interest', '{evening}', null),
  ('산책 기록 모임', '동네 산책길, 하늘 사진, 계절 이야기.', '{tired,energy,lonely}', '{walk,travel,art}', 'light', '{morning,lunch}', null),
  ('관계 고민 상담소', '사람 사이가 어려울 때, 비슷한 경험을 나눠요.', '{relationship,want_talk}', '{growth,reading}', 'deep', '{evening,night}', '조언보다 먼저 들어주기.'),
  ('취준·이직 응원방', '혼자 준비하는 길, 서로 응원해요.', '{tired,energy,relationship}', '{career,growth}', 'cheer', '{lunch,evening}', null),
  ('집밥 레시피 교환', '오늘 뭐 먹었는지, 간단한 레시피 공유.', '{just_chat,new_friends}', '{cooking,pet}', 'light', '{lunch,evening}', null),
  ('반려동물 자랑방', '우리 집 아이 사진과 일상 이야기.', '{lonely,new_friends,just_chat}', '{pet,walk}', 'light', '{morning,evening}', null),
  ('게임·영화 덕질방', '요즘 하는 게임, 보는 작품 이야기.', '{new_friends,just_chat}', '{game,movie,art}', 'interest', '{night,evening}', null);
