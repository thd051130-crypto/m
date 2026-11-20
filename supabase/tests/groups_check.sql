\set ON_ERROR_STOP 0
-- 9 users with nicknames + prefs
insert into auth.users (id) select ('00000000-0000-0000-0000-0000000001' || lpad(n::text,2,'0'))::uuid from generate_series(1,10) n;
update profiles set nickname = 'u' || substr(id::text, 35), avatar_key='cat' where id::text like '%0000001__';
insert into mood_preferences(user_id, moods, chat_styles, interests, active_times)
  select id, '{lonely}', '{deep}', '{reading,music}', '{night}' from profiles where id::text like '%0000001__';
create or replace function pg_temp.as_user(n int) returns void language sql as $$ select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000001' || lpad(n::text,2,'0'), false) $$;
set role authenticated;
select pg_temp.as_user(1);
\echo '--- candidates count (10)'
select count(*) from group_candidates();
\echo '--- direct insert into group_members (deny)'
insert into group_members(group_id,user_id) select id, auth.uid() from groups limit 1;
\echo '--- users 1..8 join 새벽 group, 9th gets full'
select pg_temp.as_user(n), join_group((select id from groups where name='새벽 마음 나눔방')) from generate_series(1,9) n;
\echo '--- user1 sends message; user9 (non member) cannot read or send'
select pg_temp.as_user(1);
insert into messages(group_id, body) select id, '안녕하세요' from groups where name='새벽 마음 나눔방';
select pg_temp.as_user(9);
select count(*) as nonmember_sees from messages;
insert into messages(group_id, body) select id, '침입' from groups where name='새벽 마음 나눔방';
select count(*) as nonmember_sees_members from group_members;
select pg_temp.as_user(2);
select count(*) as member_sees from messages;
select count(*) as member_sees_members from group_members;
\echo '--- rate limit: user2 sends 6 fast'
insert into messages(group_id, body) select id, 'm1' from groups where name='새벽 마음 나눔방';
insert into messages(group_id, body) select id, 'm2' from groups where name='새벽 마음 나눔방';
insert into messages(group_id, body) select id, 'm3' from groups where name='새벽 마음 나눔방';
insert into messages(group_id, body) select id, 'm4' from groups where name='새벽 마음 나눔방';
insert into messages(group_id, body) select id, 'm5' from groups where name='새벽 마음 나눔방';
insert into messages(group_id, body) select id, 'm6' from groups where name='새벽 마음 나눔방';
\echo '--- user2 leaves -> sees 0'
select leave_group((select id from groups where name='새벽 마음 나눔방'));
select count(*) as after_leave from messages;
\echo '--- user2 tries to update others message (deny) / soft delete own after rejoin'
update messages set body='x';
select join_group((select id from groups where name='새벽 마음 나눔방'));
select delete_message((select id from messages where body='m1'));
select body, deleted_at is not null as deleted from messages where sender_id = auth.uid() order by created_at limit 2;
\echo '--- block conflict: user9 blocks user1 -> 새벽 group flagged'
select pg_temp.as_user(9);
insert into blocks(blocker_id, blocked_id) values (auth.uid(), '00000000-0000-0000-0000-000000000101');
select name, member_count, has_block_conflict from group_candidates() where name='새벽 마음 나눔방';
\echo '--- queue: users 9,10 + 3 fresh -> group'
reset role;
insert into auth.users (id) select ('00000000-0000-0000-0000-0000000002' || lpad(n::text,2,'0'))::uuid from generate_series(1,3) n;
update profiles set nickname = 'q' || substr(id::text, 35), avatar_key='dog' where nickname is null;
insert into mood_preferences(user_id, moods, chat_styles, interests, active_times)
  select id, '{lonely}', '{deep}', '{reading}', '{night}' from profiles where id::text like '%0000002__';
set role authenticated;
select pg_temp.as_user(9); select join_match_queue();
select pg_temp.as_user(10); select join_match_queue();
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000201',false); select join_match_queue();
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000202',false); select join_match_queue();
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000203',false); select join_match_queue()->>'status' as fifth;
select name, member_count, is_member from group_candidates() where name like '%새 모임';
