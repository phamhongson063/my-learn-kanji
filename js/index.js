let allCards = [];

fetch('db/kanjis/index.json')
  .then(r => r.json())
  .then(list => {
    const sorted = [...list].sort((a, b) => a.sort - b.sort);
    return Promise.all(
      sorted.map(item =>
        fetch(`db/kanjis/${encodeURIComponent(item.kanji)}.json`).then(r => r.json())
      )
    );
  })
  .then(cards => {
    allCards = cards;
    render(cards);
    initSearch();
    initFilters();
  })
  .catch(err => {
    document.getElementById('kanji-grid').innerHTML =
      `<p class="ix-error">⚠ Không tải được danh sách: ${err.message}</p>`;
  });

// ── RENDER ────────────────────────────────────────────────────────
function render(cards) {
  const grid = document.getElementById('kanji-grid');
  const meta = document.getElementById('ix-meta');

  if (!cards.length) {
    grid.innerHTML = `<p class="ix-empty">Không tìm thấy kanji phù hợp 🔍</p>`;
    meta.textContent = '';
    return;
  }

  meta.textContent = `${cards.length} bài giảng`;

  const studyData = JSON.parse(localStorage.getItem('kanji-study') || '{}');

  grid.innerHTML = cards.map(c => {
    const count = studyData[c.kanji] || 0;
    const badge = count > 0
      ? `<span class="kc-study-badge" title="${count} lần học">${count}</span>`
      : '';
    return `
    <a href="pages/kanji-detail.html?k=${encodeURIComponent(c.kanji)}" class="kc">
      ${badge}
      <div class="kc-char">${c.kanji}</div>
      <div class="kc-body">
        <div class="kc-reading">${c.reading}</div>
        <div class="kc-meaning">${c.meaning}</div>
        <div class="kc-tags">
          ${c.jlpt ? `<span class="kc-tag kc-tag-jlpt">${c.jlpt}</span>` : ''}
          <span class="kc-tag kc-tag-stroke">${c.strokes} nét</span>
        </div>
      </div>
      <div class="kc-arrow">›</div>
    </a>`;
  }).join('');
}

// ── SEARCH ────────────────────────────────────────────────────────
function initSearch() {
  const input = document.getElementById('ix-search');
  let activeFilter = 'all';

  window._activeFilter = () => activeFilter;
  window._setFilter    = v => { activeFilter = v; applyFilters(); };

  input.addEventListener('input', applyFilters);

  function applyFilters() {
    const q = input.value.trim().toLowerCase();
    const f = activeFilter;
    const filtered = allCards.filter(c => {
      const matchFilter = f === 'all' || c.jlpt === f;
      if (!matchFilter) return false;
      if (!q) return true;
      return (
        c.kanji.includes(q) ||
        c.reading.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q)
      );
    });
    render(filtered);
  }

  window._applyFilters = applyFilters;
}

// ── FILTERS ───────────────────────────────────────────────────────
function initFilters() {
  document.querySelectorAll('.ix-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ix-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window._setFilter(btn.dataset.filter);
    });
  });
}

// ── STICKY BAR ────────────────────────────────────────────────────
const bar = document.getElementById('ix-bar');
const hero = document.querySelector('.ix-hero');

const obs = new IntersectionObserver(
  ([e]) => bar.classList.toggle('stuck', !e.isIntersecting),
  { threshold: 0 }
);
obs.observe(hero);
