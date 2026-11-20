-- 마음이음 1단계: MVP 스키마 + RLS
-- Supabase SQL Editor에 그대로 붙여 실행하거나 `supabase db push`로 적용.

-- =========================================================
-- 1. profiles
-- =========================================================
-- 이메일은 auth.users에만 있다. profiles에는 저장하지 않는다.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text unique check (char_length(nickname) between 2 and 12),
  avatar_key text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  agreed_terms_at timestamptz,
  is_adult_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 가입 시 profiles 행 자동 생성. 동의 정보는 signUp의 user metadata로 받는다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, agreed_terms_at, is_adult_confirmed)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'agreed_terms_at', '')::timestamptz,
    coalesce((new.raw_user_meta_data ->> 'is_adult_confirmed')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles: 본인 행 조회" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles: 본인 행 수정" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- role·status·동의 컬럼은 본인도 못 바꾸게 컬럼 단위 권한으로 막는다.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (nickname, avatar_key) on public.profiles to authenticated;

-- 다른 사용자에게 보여줄 것은 닉네임·아바타뿐.
create view public.public_profiles as
  select id, nickname, avatar_key from public.profiles;
revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;

-- 닉네임 중복 확인용 (profiles RLS 때문에 직접 조회 불가)
create or replace function public.is_nickname_taken(p_nickname text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where lower(nickname) = lower(p_nickname) and id <> auth.uid()
  );
$$;
revoke execute on function public.is_nickname_taken(text) from anon, public;
grant execute on function public.is_nickname_taken(text) to authenticated;

-- 현재 사용자가 글을 쓸 수 있는 상태인지
create or replace function public.is_active_user()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active' and nickname is not null
  );
$$;

-- =========================================================
-- 2. mood_preferences (본인 외 절대 조회 불가)
-- =========================================================
create table public.mood_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade default auth.uid(),
  moods text[] not null default '{}',
  chat_styles text[] not null default '{}',
  interests text[] not null default '{}' check (cardinality(interests) <= 5),
  active_times text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.mood_preferences enable row level security;

create policy "mood: 본인만 조회" on public.mood_preferences
  for select to authenticated using (user_id = auth.uid());
create policy "mood: 본인만 생성" on public.mood_preferences
  for insert to authenticated with check (user_id = auth.uid());
create policy "mood: 본인만 수정" on public.mood_preferences
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================================================
-- 3. daily_questions
-- =========================================================
create table public.daily_questions (
  id bigint generated always as identity primary key,
  date date unique not null,
  text text not null
);

alter table public.daily_questions enable row level security;
create policy "daily_questions: 로그인 사용자 조회" on public.daily_questions
  for select to authenticated using (true);

-- =========================================================
-- 4. blocks (posts/comments 정책에서 참조하므로 먼저 만든다)
-- =========================================================
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;
create policy "blocks: 본인만 조회" on public.blocks
  for select to authenticated using (blocker_id = auth.uid());
create policy "blocks: 본인만 생성" on public.blocks
  for insert to authenticated with check (blocker_id = auth.uid());
create policy "blocks: 본인만 삭제" on public.blocks
  for delete to authenticated using (blocker_id = auth.uid());

-- =========================================================
-- 5. posts / comments
-- =========================================================
-- author_id는 탈퇴 시 null이 되고 화면에는 "탈퇴한 사용자"로 표시한다.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  category text not null check (category in ('daily', 'heart', 'relationship', 'lonely', 'newstart', 'free')),
  body text not null check (char_length(body) between 10 and 2000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index posts_created_at_idx on public.posts (created_at desc);
create index posts_category_created_idx on public.posts (category, created_at desc);
create index posts_author_idx on public.posts (author_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null default auth.uid(),
  body text not null check (char_length(body) between 1 and 1000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

-- 클라이언트가 author_id를 보내도 무시하고 auth.uid()로 강제
create or replace function public.force_author_id()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    new.author_id := auth.uid();
  end if;
  return new;
end;
$$;

create trigger posts_force_author before insert on public.posts
  for each row execute function public.force_author_id();
create trigger comments_force_author before insert on public.comments
  for each row execute function public.force_author_id();

-- 수정 시 author_id·is_hidden은 바꿀 수 없게 (관리자 숨김은 service role로)
revoke update on public.posts from authenticated;
grant update (category, body) on public.posts to authenticated;
revoke update on public.comments from authenticated;
grant update (body) on public.comments to authenticated;

alter table public.posts enable row level security;
alter table public.comments enable row level security;

create policy "posts: 조회 (숨김·차단 제외)" on public.posts
  for select to authenticated using (
    is_hidden = false
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = posts.author_id
    )
  );
create policy "posts: 작성 (활성 사용자만)" on public.posts
  for insert to authenticated with check (author_id = auth.uid() and public.is_active_user());
create policy "posts: 본인만 수정" on public.posts
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts: 본인만 삭제" on public.posts
  for delete to authenticated using (author_id = auth.uid());

create policy "comments: 조회 (숨김·차단 제외)" on public.comments
  for select to authenticated using (
    is_hidden = false
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = comments.author_id
    )
  );
create policy "comments: 작성 (활성 사용자만)" on public.comments
  for insert to authenticated with check (author_id = auth.uid() and public.is_active_user());
create policy "comments: 본인만 수정" on public.comments
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "comments: 본인만 삭제" on public.comments
  for delete to authenticated using (author_id = auth.uid());

-- =========================================================
-- 6. reactions / saved_posts
-- =========================================================
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('empathy', 'cheer', 'strength')),
  created_at timestamptz not null default now(),
  unique (target_type, target_id, user_id, kind)
);
create index reactions_target_idx on public.reactions (target_type, target_id);
create index reactions_recent_idx on public.reactions (target_type, created_at desc);

alter table public.reactions enable row level security;
-- 반응 수 집계를 위해 로그인 사용자 조회 허용 (user_id는 uuid라 이메일 노출 없음)
create policy "reactions: 로그인 사용자 조회" on public.reactions
  for select to authenticated using (true);
create policy "reactions: 본인만 생성" on public.reactions
  for insert to authenticated with check (user_id = auth.uid() and public.is_active_user());
create policy "reactions: 본인만 삭제" on public.reactions
  for delete to authenticated using (user_id = auth.uid());

create table public.saved_posts (
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.saved_posts enable row level security;
create policy "saved: 본인만 조회" on public.saved_posts
  for select to authenticated using (user_id = auth.uid());
create policy "saved: 본인만 생성" on public.saved_posts
  for insert to authenticated with check (user_id = auth.uid());
create policy "saved: 본인만 삭제" on public.saved_posts
  for delete to authenticated using (user_id = auth.uid());

-- =========================================================
-- 7. reports
-- =========================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null default auth.uid(),
  target_type text not null check (target_type in ('post', 'comment', 'user', 'message')),
  target_id uuid not null,
  reason text not null check (reason in ('abuse', 'hate', 'spam', 'contact', 'sexual', 'self_harm', 'other')),
  detail text check (char_length(detail) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned')),
  created_at timestamptz not null default now()
);

create or replace function public.force_reporter_id()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    new.reporter_id := auth.uid();
  end if;
  new.status := 'open';
  return new;
end;
$$;

create trigger reports_force_reporter before insert on public.reports
  for each row execute function public.force_reporter_id();

alter table public.reports enable row level security;
create policy "reports: 본인만 생성" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports: 본인 것만 조회" on public.reports
  for select to authenticated using (reporter_id = auth.uid());
-- 관리자 조회·처리는 4단계에서 service role 서버 액션으로.

-- anon(비로그인)은 어떤 테이블도 못 본다
revoke all on all tables in schema public from anon;
