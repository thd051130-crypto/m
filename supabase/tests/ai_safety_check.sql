insert into auth.users (id) values ('00000000-0000-0000-0000-000000000301');
insert into ai_messages(group_id, kind, body) select id, 'topic', '오늘 점심 뭐 드셨어요?' from groups limit 1;
insert into safety_alerts(user_id, target_type, target_id, level) values ('00000000-0000-0000-0000-000000000301','post',gen_random_uuid(),'urgent');
select bump_ai_usage('00000000-0000-0000-0000-000000000301','suggest'), bump_ai_usage('00000000-0000-0000-0000-000000000301','suggest');
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000301',false);
\echo '--- non member ai_messages (0)'
select count(*) from ai_messages;
\echo '--- safety_alerts (deny)'
select count(*) from safety_alerts;
\echo '--- bump_ai_usage by user (deny)'
select bump_ai_usage(auth.uid(),'suggest');
\echo '--- user sets safety_flag (deny)'
update posts set safety_flag = false;
