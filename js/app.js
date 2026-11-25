// 오늘의 발견 — 화면 로직. 콘텐츠는 js/data.js 에 있습니다.
(function () {
  const CATS = window.CATEGORIES;
  const ITEMS = window.ITEMS;
  const ALL = '전체';
  const STORE_KEY = 'discoverSavedIds';
  const LEGACY_KEY = 'discoverSaved'; // 예전 단일 파일 버전(배열 인덱스 기반)

  const $ = (id) => document.getElementById(id);
  const byId = new Map(ITEMS.map((it) => [it.id, it]));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---- 북마크 저장소 (localStorage, 실패해도 앱은 동작) ----
  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return new Set(JSON.parse(raw).filter((id) => byId.has(id)));
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const ids = JSON.parse(legacy).map((i) => ITEMS[i] && ITEMS[i].id).filter(Boolean);
        localStorage.setItem(STORE_KEY, JSON.stringify(ids));
        return new Set(ids);
      }
    } catch (e) { /* 저장소 사용 불가 */ }
    return new Set();
  }
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify([...saved])); } catch (e) { /* 무시 */ }
  }
  function toggleSave(id) {
    saved.has(id) ? saved.delete(id) : saved.add(id);
    persist();
  }

  // ---- 상태 ----
  const state = { category: ALL, query: '', onlySaved: false };
  const saved = loadSaved();

  function filtered() {
    const q = state.query.toLowerCase();
    return ITEMS.filter((it) =>
      (state.category === ALL || it.category === state.category) &&
      (!q || [it.category, it.title, it.summary, it.body, it.more].join(' ').toLowerCase().includes(q)) &&
      (!state.onlySaved || saved.has(it.id))
    );
  }

  // ---- 렌더링 ----
  function drawCats() {
    const list = [{ name: ALL, emoji: '🌐' }, ...CATS];
    $('categories').innerHTML = list
      .map((c) => `<button class="cat ${state.category === c.name ? 'active' : ''}" data-cat="${esc(c.name)}">${c.emoji} ${esc(c.name)}</button>`)
      .join('');
  }

  function cardHtml(it) {
    const on = saved.has(it.id);
    return `<article class="card" data-id="${it.id}" tabindex="0">
      <div class="cardtop"><span class="tag">${esc(it.category)}</span><span class="emoji">${it.emoji}</span></div>
      <h3>${esc(it.title)}</h3><p>${esc(it.summary)}</p>
      <div class="cardfoot"><span>약 2분 읽기</span><button class="save ${on ? 'saved' : ''}" data-save="${it.id}" aria-label="${on ? '저장 취소' : '저장'}">${on ? '♥' : '♡'}</button></div>
    </article>`;
  }

  function drawCards() {
    const list = filtered();
    $('listTitle').textContent = state.onlySaved ? '저장한 콘텐츠'
      : state.query ? `‘${state.query}’ 검색 결과`
      : state.category === ALL ? '지금 발견할 이야기' : `${state.category} 탐험`;
    $('listSub').textContent = `${list.length}개의 콘텐츠 · 카드를 눌러 자세히 읽기`;
    $('savedCount').textContent = saved.size;
    $('contentGrid').innerHTML = list.length
      ? list.map(cardHtml).join('')
      : '<div class="empty">해당하는 콘텐츠가 없어요.<br>검색어를 바꾸거나 다른 주제를 선택해 보세요.</div>';
  }

  function render() { drawCats(); drawCards(); }

  // ---- 모달 ----
  function openItem(id) {
    const it = byId.get(id);
    if (!it) return;
    $('modalContent').innerHTML = `<span class="tag">${esc(it.category)}</span>
      <div style="font-size:45px;margin:7px 0">${it.emoji}</div>
      <h2>${esc(it.title)}</h2><p style="color:#77827a">${esc(it.summary)}</p>
      <div class="body"><p>${esc(it.body)}</p><h4>조금 더 알아보기</h4><p>${esc(it.more)}</p></div>
      <button class="pillbtn" id="modalSave" style="margin-top:12px">${saved.has(id) ? '♥ 저장됨 · 저장 취소' : '♡ 저장하기'}</button>`;
    $('modal').classList.add('show');
    $('modalSave').onclick = () => { toggleSave(id); openItem(id); drawCards(); };
  }
  function closeModal() { $('modal').classList.remove('show'); }

  // ---- 이벤트 ----
  $('categories').addEventListener('click', (e) => {
    const b = e.target.closest('.cat');
    if (!b) return;
    Object.assign(state, { category: b.dataset.cat, onlySaved: false });
    render();
  });
  $('contentGrid').addEventListener('click', (e) => {
    const s = e.target.closest('.save');
    if (s) { e.stopPropagation(); toggleSave(s.dataset.save); drawCards(); return; }
    const c = e.target.closest('.card');
    if (c) openItem(c.dataset.id);
  });
  $('contentGrid').addEventListener('keydown', (e) => {
    const c = e.target.closest('.card');
    if (c && e.target === c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openItem(c.dataset.id); }
  });

  function reset(extra) {
    Object.assign(state, { category: ALL, query: '', onlySaved: false }, extra);
    $('searchInput').value = state.query;
    render();
  }
  $('searchBtn').onclick = () => reset({ query: $('searchInput').value.trim() });
  $('searchInput').onkeydown = (e) => { if (e.key === 'Enter') $('searchBtn').click(); };
  $('savedView').onclick = () => reset({ onlySaved: true });
  $('allView').onclick = () => reset();
  $('randomBtn').onclick = (e) => { e.preventDefault(); openItem(ITEMS[Math.floor(Math.random() * ITEMS.length)].id); };

  $('closeModal').onclick = closeModal;
  $('modal').onclick = (e) => { if (e.target === $('modal')) closeModal(); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // ---- 시작 ----
  $('dateLabel').textContent = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) + ' · TODAY’S EXPLORATION';
  $('totalCount').textContent = ITEMS.length;
  $('categoryCount').textContent = CATS.length;
  render();
})();
