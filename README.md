# 마음이음

비슷한 마음·관심사의 성인을 5~8명 소그룹으로 연결해 주는 익명 소셜 커뮤니티.
Next.js(App Router) + TypeScript + Tailwind CSS + Supabase.

## 진행 단계

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | MVP: 가입 → 마음 선택 → 홈 → 이야기(글·댓글·공감·저장·신고·차단) → 마이(탈퇴 포함) | ✅ 구현 |
| 2 | 그룹 매칭 + 실시간 그룹 채팅 | ✅ 구현 |
| 3 | 위기 대응(109 안내) + 키워드 모더레이션 (AI 기능은 제외) | ✅ 구현 |
| 4 | 관리자 + 알림 + PWA | ✅ 구현 |

## 로컬 실행

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/` 파일을 번호 순서대로 실행
   - `001_init.sql`: 테이블 + RLS + 트리거
   - `002_seed_daily_questions.sql`: 오늘의 질문 30개
   - `003_groups.sql`: 그룹·멤버·메시지·대기열 + RLS + Realtime + 초기 그룹 10개
   - `004_ai_safety.sql`: 위기 알림 (AI 테이블은 006에서 제거)
   - `005_admin_notifications.sql`: 이용 제한 기간, 관리자 로그, 알림(트리거), 알림 설정, 웹 푸시 구독
   - `006_remove_ai.sql`: AI 관련 테이블 제거
3. Authentication → URL Configuration
   - Site URL: `http://localhost:3000`
   - Redirect URLs에 `http://localhost:3000/auth/callback` 추가
4. 환경변수
   ```bash
   cp .env.example .env.local   # 값 채우기 (Project Settings → API)
   ```
5. 실행
   ```bash
   npm install
   npm run dev
   ```

## 안전 기능

- AI(OpenAI) 기능은 쓰지 않는다. 검사는 전부 키워드 기반이다 (`lib/safety/keywords.ts`, `npm test`).
- 저장 전 서버 검사(`lib/safety/check.ts`): 연락처 → 차단 / 명백한 욕설 → 차단 / 위기 표현 → **막지 않고 저장**하고, 작성자에게 109 카드 + `safety_alerts` 기록 + 웹훅(`SAFETY_ALERT_WEBHOOK_URL`, 선택).
- 위기 표현이 있는 글에는 다른 사용자에게도 "도움이 필요하면 109" 배너가 뜬다.

## 관리자 (4단계)

- 관리자 지정은 Supabase SQL Editor에서만: `update profiles set role = 'admin' where id = '<user uuid>';`
- `/admin`: 비로그인은 middleware에서 404, 로그인했어도 `role != 'admin'`이면 서버에서 404.
- 모든 조치는 service role 서버 액션으로 하고 `admin_actions`에 기록. 사용자 이메일은 `ab***@gmail.com`으로 마스킹.
- 이용 제한: `status='suspended'` + `suspended_until` (null이면 영구). 기간이 지나면 자동으로 쓰기 가능.

## 보안 설계 요약

- 이메일은 `auth.users`에만 있고 `profiles`에는 없다. 다른 사용자는 `public_profiles` 뷰(닉네임·아바타)만 조회.
- `profiles.role / status / 동의 컬럼`은 컬럼 권한으로 본인도 수정 불가.
- `mood_preferences`는 본인만 조회 가능.
- `posts / comments / reports`의 작성자 id는 클라이언트 값을 무시하고 트리거가 `auth.uid()`로 강제.
- 차단한 사용자의 글·댓글은 RLS 단계에서 걸러진다.
- 이용 제한(`status='suspended'`)·닉네임 미설정 사용자는 쓰기 불가 (`is_active_user()`).
- 탈퇴: 서버 액션에서 service role로 auth 사용자 삭제 → 글·댓글 `author_id`가 null → "탈퇴한 사용자"로 표시.
- `SUPABASE_SERVICE_ROLE_KEY`는 `lib/supabase/admin.ts`(server-only)에서만 사용.

RLS 동작은 `supabase/tests/rls_check.sql`, `groups_check.sql`로 로컬 Postgres에서 확인할 수 있다 (`auth_stub.sql` 먼저 실행).

## 1단계 완료 기준 체크

- [ ] 새 계정 가입 → 프로필 → 마음 선택 → 홈까지 끊김 없이 진행
- [ ] 글 작성 후 새로고침해도 남아 있고, 다른 계정에서 보임
- [ ] 다른 계정에서 내 이메일이 어디에도(네트워크 응답 포함) 안 보임
- [ ] 다른 계정의 mood_preferences를 Supabase 클라이언트로 조회하면 빈 결과
- [ ] 차단하면 그 사람 글이 목록에서 사라짐, 해제하면 다시 보임
- [ ] 탈퇴 후 같은 이메일로 로그인 불가, 기존 글은 "탈퇴한 사용자"로 표시

## 아직 mock / 임시인 것

- 아바타 12개는 이모지 placeholder (일러스트로 교체 예정)
- 이용약관·개인정보 처리방침은 "샘플" 문서
- 웹 푸시는 구조(`push_subscriptions`, `sw.js` push 핸들러)만 있고 발송은 꺼져 있음
- PWA 아이콘은 임시 디자인
