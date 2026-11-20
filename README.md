# 마음이음

AI가 비슷한 마음·관심사의 성인을 5~8명 소그룹으로 연결해 주는 익명 소셜 커뮤니티.
Next.js(App Router) + TypeScript + Tailwind CSS + Supabase.

## 진행 단계

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | MVP: 가입 → 마음 선택 → 홈 → 이야기(글·댓글·공감·저장·신고·차단) → 마이(탈퇴 포함) | ✅ 구현 |
| 2 | 그룹 매칭 + 실시간 그룹 채팅 | ✅ 구현 |
| 3 | AI 커뮤니티 매니저 + 위기 대응(109 안내) | 예정 |
| 4 | 관리자 + 알림 + PWA | 예정 |

## 로컬 실행

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/` 파일을 번호 순서대로 실행
   - `001_init.sql`: 테이블 + RLS + 트리거
   - `002_seed_daily_questions.sql`: 오늘의 질문 30개
   - `003_groups.sql`: 그룹·멤버·메시지·대기열 + RLS + Realtime + 초기 그룹 10개
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
- 알림 탭은 빈 상태 (4단계)
