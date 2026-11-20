-- 마음이음 3단계: AI 커뮤니티 매니저 + 안전 기능

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  kind text not null check (kind in ('topic', 'nudge', 'activity')),
  body text not null,
  created_at timestamptz not null default now()
);
create index ai_messages_group_created_idx on public.ai_messages (group_id, created_at desc);

create table public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment', 'message')),
  target_id uuid not null,
  categories jsonb not null default '{}',
  score real,
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned')),
  created_at timestamptz not null default now()
);

create table public.safety_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('post', 'comment', 'message')),
  target_id uuid not null,
  level text not null check (level in ('watch', 'urgent')),
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index safety_alerts_open_idx on public.safety_alerts (created_at desc) where handled_at is null;

-- AI 사용량 (사용자당 문구 추천 하루 20회 등)
create table public.ai_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  kind text not null,
  count int not null default 0,
  primary key (user_id, day, kind)
);

-- 위기 표현이 감지된 글에는 다른 사용자에게도 "도움이 필요하면 109" 배너
alter table public.posts add column safety_flag boolean not null default false;

-- RLS: ai_messages는 그룹 멤버 조회, 나머지는 일반 사용자 접근 불가 (service role만)
alter table public.ai_messages enable row level security;
alter table public.moderation_flags enable row level security;
alter table public.safety_alerts enable row level security;
alter table public.ai_usage enable row level security;

create policy "ai_messages: 그룹 멤버 조회" on public.ai_messages
  for select to authenticated using (public.is_group_member(group_id));

revoke insert, update, delete on public.ai_messages from anon, authenticated;
revoke all on public.moderation_flags, public.safety_alerts, public.ai_usage from anon, authenticated;
revoke all on public.ai_messages from anon;

-- 사용량 1 증가 후 오늘 누적값 반환 (service role에서 호출)
create or replace function public.bump_ai_usage(p_user uuid, p_kind text)
returns int
language sql
security definer set search_path = public
as $$
  insert into ai_usage (user_id, day, kind, count)
  values (p_user, (now() at time zone 'Asia/Seoul')::date, p_kind, 1)
  on conflict (user_id, day, kind) do update set count = ai_usage.count + 1
  returning count;
$$;
revoke execute on function public.bump_ai_usage(uuid, text) from anon, authenticated, public;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.ai_messages;
  end if;
end $$;
