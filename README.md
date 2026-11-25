# 오늘의 발견 ✦

경제부터 우주, 심리, 역사, 기술까지 — 12개 주제의 지식 카드를 가볍게 탐험하는 개인 지식 포털.
빌드 도구·서버·DB 없이 돌아가는 정적 웹사이트입니다.

## 기능
- 주제(카테고리)별 필터, 키워드 검색
- 카드 클릭 → 상세 읽기 모달 (Esc / 바깥 클릭으로 닫기)
- ♡ 북마크 — 이 기기 브라우저(localStorage)에 저장
- 오늘의 랜덤 지식 뽑기

## 구조
```
index.html            화면 뼈대
css/style.css         디자인
js/data.js            콘텐츠 (카테고리 + 카드) ← 글 추가/수정은 여기만
js/app.js             검색·필터·북마크·모달 로직
scripts/check-data.js 콘텐츠 검사 (node scripts/check-data.js)
```

## 실행
- 그냥 `index.html`을 브라우저로 열면 됩니다.
- 또는 로컬 서버: `python3 -m http.server` → http://localhost:8000

## 콘텐츠 추가
`js/data.js`의 `ITEMS` 끝에 항목을 추가합니다.
```js
{
  "id": "d068",            // 겹치지 않게, 한번 정하면 바꾸지 않기 (북마크가 id로 저장됨)
  "category": "경제·돈",   // CATEGORIES의 name 중 하나
  "emoji": "📈",
  "title": "제목",
  "summary": "카드에 보이는 한 줄 요약",
  "body": "본문",
  "more": "조금 더 알아보기"
}
```
추가 후 `node scripts/check-data.js`로 빠진 칸·중복 id·잘못된 카테고리를 확인하세요.

## 배포 (GitHub Pages, 무료)
1. GitHub 저장소 → **Settings → Pages**
2. Source: **Deploy from a branch**, Branch: **main** / **/(root)** → Save
3. 1~2분 뒤 `https://<계정>.github.io/<저장소>/` 에서 열림

Netlify·Vercel·Cloudflare Pages도 저장소를 연결하고 빌드 명령 없이 루트 폴더를 배포하면 됩니다.
