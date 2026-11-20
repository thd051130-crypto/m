import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAbuseKeyword, hasContactInfo, hasCrisisKeyword } from "../lib/safety/keywords.ts";

test("위기 표현 감지", () => {
  assert.ok(hasCrisisKeyword("사라지고 싶어"));
  assert.ok(hasCrisisKeyword("요즘 너무 힘들어서 죽고 싶다는 생각이 들어"));
  assert.ok(hasCrisisKeyword("자 해 하고 싶다"));
  assert.ok(!hasCrisisKeyword("오늘 날씨 좋네요"));
});

test("욕설 감지", () => {
  assert.ok(hasAbuseKeyword("진짜 씨발 짜증나"));
  assert.ok(hasAbuseKeyword("ㅅㅂ 뭐야"));
  assert.ok(!hasAbuseKeyword("오늘도 수고했어요"));
});

test("연락처 감지", () => {
  assert.ok(hasContactInfo("제 번호 010-1234-5678 이에요"));
  assert.ok(hasContactInfo("01012345678"));
  assert.ok(hasContactInfo("메일 abc@test.com"));
  assert.ok(hasContactInfo("open.kakao.com/o/abc 로 와요"));
  assert.ok(hasContactInfo("카톡 아이디 abc123"));
  assert.ok(!hasContactInfo("저는 2024년 3월에 이사했어요"));
  assert.ok(!hasContactInfo("오후 3시에 산책했어요"));
});
