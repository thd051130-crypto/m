\set ON_ERROR_STOP 0
insert into auth.users (id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','a@x.com','{"agreed_terms_at":"2026-11-20T00:00:00Z","is_adult_confirmed":true}'),
 ('00000000-0000-0000-0000-00000000000b','b@x.com','{}');
select id, agreed_terms_at, is_adult_confirmed from profiles;
-- act as A
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- A: post before nickname (expect RLS fail)'
insert into posts(category, body) values ('daily','열 글자 이상의 본문입니다');
update profiles set nickname='에이', avatar_key='cat' where id=auth.uid();
\echo '--- A: try to set role admin (expect permission denied)'
update profiles set role='admin' where id=auth.uid();
insert into mood_preferences(user_id, moods) values (auth.uid(), '{lonely}');
\echo '--- A: post with spoofed author_id -> forced to A'
insert into posts(author_id, category, body) values ('00000000-0000-0000-0000-00000000000b','daily','열 글자 이상의 본문입니다');
select author_id from posts;
-- act as B
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
update profiles set nickname='비이', avatar_key='dog' where id=auth.uid();
\echo '--- B: A mood (expect 0 rows)'
select count(*) from mood_preferences where user_id='00000000-0000-0000-0000-00000000000a';
\echo '--- B: profiles of A directly (expect 0) / public view (expect 2)'
select count(*) from profiles where id='00000000-0000-0000-0000-00000000000a';
select count(*) from public_profiles;
select is_nickname_taken('에이') as taken;
\echo '--- B sees posts (1), blocks A, sees 0, unblocks 1'
select count(*) from posts;
insert into blocks(blocker_id, blocked_id) values (auth.uid(), '00000000-0000-0000-0000-00000000000a');
select count(*) from posts;
delete from blocks where blocked_id='00000000-0000-0000-0000-00000000000a';
select count(*) from posts;
\echo '--- B reacts + comments + reports'
insert into reactions(target_type,target_id,kind,user_id) select 'post', id, 'empathy', auth.uid() from posts;
insert into comments(post_id, body) select id, '힘내요' from posts;
insert into reports(target_type,target_id,reason,status) select 'post', id, 'spam', 'actioned' from posts;
select status from reports;
\echo '--- B delete A post (expect 0 deleted)'
delete from posts where author_id='00000000-0000-0000-0000-00000000000a';
reset role;
\echo '--- A withdraws: delete auth user'
delete from auth.users where id='00000000-0000-0000-0000-00000000000a';
select author_id is null as anonymized, body from posts;
\echo '--- anon sees nothing'
set role anon;
select count(*) from posts;
