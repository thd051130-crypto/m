-- AI 기능 제거: OpenAI 연동(대화 주제·이어주기·문구 추천·Moderation API)을 뺀다.
-- 위기·욕설·연락처 키워드 감지와 safety_alerts는 그대로 유지.

do $$
begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ai_messages') then
    alter publication supabase_realtime drop table public.ai_messages;
  end if;
end $$;

drop function if exists public.bump_ai_usage(uuid, text);
drop table if exists public.ai_messages;
drop table if exists public.ai_usage;
drop table if exists public.moderation_flags;
