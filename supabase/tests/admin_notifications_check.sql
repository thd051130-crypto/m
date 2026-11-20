\set ON_ERROR_STOP 0
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000050a'), ('00000000-0000-0000-0000-00000000050b');
update profiles set nickname = 'n' || right(id::text, 2), avatar_key = 'cat';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000050a',false);
insert into posts(category, body) values ('daily', '알림 테스트용 열글자 이상 본문');
select join_group((select id from groups where name='퇴근 후 수다방'));
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000050b',false);
select join_group((select id from groups where name='퇴근 후 수다방'));
insert into comments(post_id, body) select id, '좋아요' from posts;
insert into reactions(target_type, target_id, kind, user_id) select 'post', id, 'empathy', auth.uid() from posts;
insert into reactions(target_type, target_id, kind, user_id) select 'post', id, 'cheer', auth.uid() from posts;
insert into messages(group_id, body) select id, '하나' from groups where name='퇴근 후 수다방';
insert into messages(group_id, body) select id, '둘' from groups where name='퇴근 후 수다방';
insert into messages(group_id, body) select id, '셋' from groups where name='퇴근 후 수다방';
\echo '--- B sees A notifications (0)'
select count(*) from notifications;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000050a',false);
\echo '--- A notifications: comment 1, reaction count 2, group_message count 3'
select type, count, is_read from notifications order by type;
\echo '--- A marks read OK, tries to change type (deny)'
update notifications set is_read = true;
update notifications set type = 'system';
\echo '--- A disables group_message, new message creates none'
insert into notification_settings(user_id, group_message) values (auth.uid(), false);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000050b',false);
select pg_sleep(0);
reset role;
delete from messages; -- clear rate limit window
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000050b',false);
insert into messages(group_id, body) select id, '넷' from groups where name='퇴근 후 수다방';
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000050a',false);
select count(*) as unread_group_msgs from notifications where type='group_message' and is_read=false;
\echo '--- suspend B 7d: cannot post/comment/message; expired suspension allows'
reset role;
update profiles set status='suspended', suspended_until=now() + interval '7 days' where id='00000000-0000-0000-0000-00000000050b';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000050b',false);
insert into posts(category, body) values ('daily', '제한 중에는 못 써야 하는 글');
insert into messages(group_id, body) select id, '제한' from groups where name='퇴근 후 수다방';
reset role;
update profiles set suspended_until=now() - interval '1 minute' where id='00000000-0000-0000-0000-00000000050b';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000050b',false);
insert into posts(category, body) values ('daily', '기간이 지나면 다시 쓸 수 있는 글');
\echo '--- hidden post invisible'
reset role;
update posts set is_hidden = true where body like '알림%';
set role authenticated;
select count(*) as visible_hidden from posts where body like '알림%';
\echo '--- admin_actions / push (own only)'
select count(*) from admin_actions;
