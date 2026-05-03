// ── DATA LOADING ──────────────────────────────────────────────────
const kanji = new URLSearchParams(location.search).get('k') || '器';

fetch(`../db/kanji/${kanji}.json`)
  .then(r => {
    if (!r.ok) throw new Error('Không tìm thấy dữ liệu');
    return r.json();
  })
  .then(data => {
    renderPage(data);
    initCanvas(data.kanji, data.canvasHints);
    initQuiz(data.quiz);
    initWidget(data.kanji);
    initStudyTimer(data.kanji);
  })
  .catch(err => {
    document.getElementById('d-sections').innerHTML =
      `<div class="callout" style="color:var(--red)">⚠ ${err.message}: ${kanji}.json</div>`;
  });

// ── STUDY TIMER ───────────────────────────────────────────────────
function initStudyTimer(k) {
  const SESSION_KEY = `study-counted-${k}`;
  // Avoid counting the same tab session twice
  if (sessionStorage.getItem(SESSION_KEY)) return;

  const STUDY_MS = 10 * 60 * 1000;
  const timer = setTimeout(() => {
    const data = JSON.parse(localStorage.getItem('kanji-study') || '{}');
    data[k] = (data[k] || 0) + 1;
    localStorage.setItem('kanji-study', JSON.stringify(data));
    sessionStorage.setItem(SESSION_KEY, '1');
  }, STUDY_MS);

  // Cancel if user leaves before 10 minutes
  window.addEventListener('beforeunload', () => clearTimeout(timer));
}

// ── RENDER PAGE ───────────────────────────────────────────────────
function renderPage(d) {
  document.title = `${d.kanji} — Bài Giảng Kanji`;

  // Navbar
  document.getElementById('d-nav-char').textContent = d.kanji;
  document.getElementById('d-nav-info').textContent = `JLPT ${d.jlpt} · ${d.strokes} nét`;

  // Hero
  document.getElementById('d-hero').innerHTML = `
    <div class="big-char">${d.kanji}</div>
    <div class="hero-reading">${d.on} (${d.onRomaji}) · ${d.kun} (${d.kunRomaji}) · ${d.hanviet}</div>
    <div class="hero-title">Bài Giảng Kanji: ${d.kanji}</div>
    <div class="hero-sub">CẤU TẠO · Ý NGHĨA · CÁCH VIẾT · LUYỆN TẬP</div>
    <div class="hero-badges">
      <span class="hero-badge badge-jlpt">JLPT ${d.jlpt}</span>
      <span class="hero-badge badge-info">${d.strokes} nét</span>
      <span class="hero-badge badge-info">Bộ ${d.radical}</span>
      <span class="hero-badge badge-info">${d.type}</span>
    </div>
    <div class="scroll-hint">▼ cuộn xuống để học</div>`;

  // Practice hint
  document.getElementById('d-practice-hint').innerHTML = d.practiceHint || '';

  // Footer
  document.getElementById('d-footer').innerHTML = `
    <div style="font-family:'Ma Shan Zheng','Noto Serif SC',serif;font-size:44px;color:var(--gold);letter-spacing:16px;opacity:0.6">${d.kanji}</div>
    <div style="font-size:11px;color:var(--muted);letter-spacing:3px;margin-top:10px">JLPT ${d.jlpt} · ${d.strokes} NÉT · BỘ ${d.radical} · ${d.type.toUpperCase()}</div>
    <a href="../index.html" style="display:inline-block;margin-top:18px;font-size:13px;color:var(--muted);text-decoration:none;letter-spacing:1px;border-bottom:1px solid var(--border);padding-bottom:2px;">← Về danh sách</a>`;

  // Sections 1–6
  document.getElementById('d-sections').innerHTML =
    renderS1(d) + renderS2(d) + renderS3(d) + renderS4(d) + renderS5(d) + renderS6(d);
}

// ── SECTION RENDERERS ─────────────────────────────────────────────
function sec(num, title, body) {
  return `<div class="section" id="s${num}">
    <div class="sec-label">Phần 0${num}</div>
    <div class="sec-title">${title}</div>
    ${body}
  </div>`;
}

function renderS1(d) {
  return sec(1, 'Tổng Quan', `
    <p class="lead">${d.lead}</p>
    <table>
      <tr><th>Thông tin</th><th>Chi tiết</th></tr>
      <tr><td>Kanji</td><td><span style="font-family:'Ma Shan Zheng','Noto Serif SC',serif;font-size:22px;color:var(--gold)">${d.kanji}</span></td></tr>
      <tr><td>Âm On (音読み)</td><td>${d.on} (${d.onRomaji})</td></tr>
      <tr><td>Âm Kun (訓読み)</td><td>${d.kun} (${d.kunRomaji}) — đồ vật, cái chén</td></tr>
      <tr><td>Âm Hán Việt</td><td>${d.hanviet}</td></tr>
      <tr><td>Cấp độ JLPT</td><td>${d.jlpt}</td></tr>
      <tr><td>Số nét</td><td>${d.strokes} nét</td></tr>
      <tr><td>Bộ thủ</td><td>${d.radical} (${d.radicalReading} — ${d.radicalMeaning}) — bộ ${d.radicalNumber}</td></tr>
      <tr><td>Loại chữ</td><td>${d.type} (${d.typeJa})</td></tr>
      <tr><td>Cấu trúc</td><td>${d.structure}</td></tr>
      <tr><td>Xuất hiện trong</td><td>${d.school}</td></tr>
    </table>
    <div class="callout">
      <div class="callout-label">Ghi nhớ siêu tốc</div>
      <p>${d.mnemonic}</p>
    </div>`);
}

function renderS2(d) {
  const parts = d.decomp.map((p, i) => `
    <div class="decomp-part"><span class="decomp-char">${p.char}</span>
      <div class="name">${p.name}</div><div class="meaning">${p.meaning}</div>
    </div>
    ${i < d.decomp.length - 1 ? '<div class="decomp-op">+</div>' : ''}`).join('');

  return sec(2, 'Nguồn Gốc & Cấu Tạo', `
    <p class="lead">${d.originLead}</p>
    <div class="decomp">
      ${parts}
      <div class="decomp-op">=</div>
      <div class="decomp-part">
        <span class="decomp-char" style="font-size:clamp(60px,15vw,110px)">${d.kanji}</span>
        <div class="name">${d.hanviet}</div>
        <div class="meaning">Đồ vật / Tài năng</div>
      </div>
    </div>
    <p>${d.originDetail}</p>`);
}

function renderS3(d) {
  const meaningCards = d.meanings.map((m, i) => `
    <div class="m-card">
      <div class="num">Nghĩa ${String(i+1).padStart(2,'0')}</div>
      <h4>${m.title}</h4><p>${m.desc}</p>
    </div>`).join('');

  const vocabItems = d.vocab.map(v => `
    <div class="vocab-item">
      <div class="vocab-top">
        <div class="vocab-char">${v.word}</div>
        <div class="vocab-info">
          <div class="vocab-word">${v.word}${v.jlpt ? ` <span class="vocab-tag">${v.jlpt}</span>` : ''}</div>
          <div class="vocab-reading">${v.reading}</div>
          <div class="vocab-vi">${v.vi}</div>
        </div>
      </div>
      <div class="vocab-sentence">
        <span class="jp">${v.jp}</span>
        <span>${v.jpVi}</span>
      </div>
    </div>`).join('');

  return sec(3, 'Ý Nghĩa & Từ Vựng', `
    <div class="meaning-grid">${meaningCards}</div>
    <div class="divider">· · ·</div>
    <p class="lead" style="margin-top:20px">Từ ghép thông dụng</p>
    <div class="example-list">${vocabItems}</div>`);
}

function renderS4(d) {
  const idiomCards = d.idioms.map(id => `
    <div class="idiom-card">
      <h4 style="font-family:'Noto Serif SC',serif;font-size:${id.fontSize || 22}px;color:var(--text)">${id.text}</h4>
      <div class="idiom-kana">${id.kana}</div>
      <div class="idiom-meaning">${id.meaning}</div>
      <div class="idiom-usage">${id.jp}<br><em>${id.jpVi}</em></div>
    </div>`).join('');

  const featured = d.idioms[0];
  return sec(4, 'Thành Ngữ & Ngữ Cảnh', `
    <p>Chữ ${d.kanji} xuất hiện trong nhiều thành ngữ và cách nói quen thuộc của tiếng Nhật — từ văn ngôn cổ đến ngôn ngữ hàng ngày.</p>
    <div class="meaning-grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin:28px 0">
      ${idiomCards}
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:28px;margin:24px 0;text-align:center">
      <div style="font-family:'Ma Shan Zheng','Noto Serif SC',serif;font-size:36px;color:var(--gold);letter-spacing:10px;margin-bottom:14px">${featured.text}</div>
      <div style="font-size:12px;color:var(--muted);letter-spacing:2px;margin-bottom:10px">四字熟語 · ${featured.kana.split(' · ')[0]}</div>
      <div style="font-size:14px;color:var(--text);font-style:italic;line-height:1.8">${featured.jp}<br><span style="color:var(--muted);font-size:13px">${featured.jpVi}</span></div>
    </div>`);
}

function renderS5(d) {
  const steps = d.strokeSteps.map(s => `
    <div class="stroke-step">
      <span class="step-num">${s.range}</span>
      <span class="step-char">${s.char}</span>
      <span class="step-label">${s.label}${s.detail ? '<br>(' + s.detail + ')' : ''}</span>
    </div>`).join('');

  return sec(5, 'Thứ Tự Viết ' + d.strokes + ' Nét', `
    <p class="lead">${d.strokeRule}</p>
    <div class="stroke-rule"><strong>Quy tắc chính:</strong> Viết hàng trên (${d.decomp[0].char}${d.decomp[1].char}${d.decomp[0].char}) trước, rồi hàng dưới (${d.decomp[0].char}${d.decomp[0].char}). Trong mỗi nhóm, bắt đầu từ bên trái.</div>
    <div class="stroke-steps">${steps}</div>
    <div class="stroke-rule"><strong>Chi tiết từng bộ phận:</strong><br><span style="color:var(--muted)">${d.strokeDetail}</span></div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:24px;margin:20px 0;text-align:center">
      <div style="font-size:11px;color:var(--muted);letter-spacing:2px;margin-bottom:14px">ĐẾM NÉT ĐỂ KIỂM TRA</div>
      <div style="font-family:'Ma Shan Zheng','Noto Serif SC',serif;font-size:clamp(80px,20vw,140px);color:var(--gold);line-height:1">${d.kanji}</div>
      <div style="font-size:13px;color:var(--muted);margin-top:10px">4 chữ ${d.decomp[0].char} × 3 nét = 12, cộng ${d.decomp[1].char} = 4 → <span style="color:var(--gold);font-weight:700">= ${d.strokes} nét ✓</span></div>
    </div>`);
}

function renderS6(d) {
  const styles = [
    { name: 'Khải thư', cn: '楷書 — Chuẩn mực', style: '' },
    { name: 'Hành thư', cn: '行書 — Bán thảo',   style: 'font-size:56px;transform:scaleX(0.85);display:inline-block' },
    { name: 'Thảo thư', cn: '草書 — Phóng khoáng', style: 'opacity:0.85;letter-spacing:-2px' },
    { name: 'Lệ thư',   cn: '隸書 — Cổ điển',    style: 'font-weight:900;letter-spacing:1px' }
  ];
  const cards = styles.map(s => `
    <div class="style-card">
      <span class="style-char" style="${s.style}">${d.kanji}</span>
      <div class="style-name">${s.name}</div>
      <div class="style-cn">${s.cn}</div>
    </div>`).join('');

  return sec(6, 'Phong Cách Thư Pháp', `
    <p>Chữ ${d.kanji} qua các thời đại và trường phái thư pháp có hình dáng rất khác nhau — từ cứng chắc đến mềm mại, phóng khoáng.</p>
    <div class="calli-styles">${cards}</div>
    <div class="stroke-rule"><strong>Mẹo viết đẹp:</strong> ${d.calliNote}</div>`);
}

// ── QUIZ ──────────────────────────────────────────────────────────
function initQuiz(qs) {
  let qi = 0, score = 0, answered = false;

  function render() {
    const q = qs[qi];
    document.getElementById('d-quiz').innerHTML = `
      <div class="quiz-wrap" id="qbox">
        <div style="font-size:11px;color:var(--gold);letter-spacing:2px;margin-bottom:16px">CÂU ${qi+1} / ${qs.length}</div>
        <div class="q-text">${q.q}</div>
        <div class="q-opts" id="qopts">
          ${q.opts.map((o, i) => `<button class="q-opt" onclick="pick(${i})">${o}</button>`).join('')}
        </div>
        <div class="q-feedback" id="qfb" style="display:none"></div>
        <button class="btn" id="qnext" onclick="next()" style="display:none">Câu tiếp →</button>
      </div>`;
    answered = false;

    // expose to onclick
    window.pick = (i) => {
      if (answered) return;
      answered = true;
      const opts = document.querySelectorAll('.q-opt');
      opts[q.ans].classList.add('correct');
      const fb = document.getElementById('qfb');
      if (i === q.ans) {
        score++;
        fb.className = 'q-feedback show ok';
        fb.innerHTML = '✅ Chính xác! ' + q.explain;
      } else {
        opts[i].classList.add('wrong');
        fb.className = 'q-feedback show bad';
        fb.innerHTML = '❌ Chưa đúng. ' + q.explain;
      }
      fb.style.display = 'block';
      document.getElementById('qnext').style.display = 'inline-block';
    };

    window.next = () => {
      qi++;
      if (qi >= qs.length) {
        const pct = Math.round(score / qs.length * 100);
        const msgs = ['Hãy đọc lại bài và thử lại! がんばって！', 'Khá tốt! Ôn thêm một chút nữa nhé!', 'Rất giỏi! Bạn hiểu rõ rồi!', '完璧！ Hoàn hảo！'];
        document.getElementById('d-quiz').innerHTML = `
          <div style="text-align:center;padding:40px 0">
            <div style="font-family:'Ma Shan Zheng','Noto Serif SC',serif;font-size:100px;color:var(--gold)">${kanji}</div>
            <div style="font-size:24px;font-weight:700;font-family:'Noto Serif SC',serif;margin:10px 0">${score} / ${qs.length} câu đúng</div>
            <div style="color:var(--muted);font-size:14px;margin-bottom:20px">${msgs[Math.min(3,Math.floor(pct/26))]}</div>
            <button class="btn" onclick="restartQuiz()">🔄 Làm lại</button>
          </div>`;
        window.restartQuiz = () => { qi = 0; score = 0; render(); };
      } else {
        render();
      }
    };
  }

  render();
}

// ── CANVAS DRAWING ────────────────────────────────────────────────
function initCanvas(kanjiChar, canvasHints) {
  const ghostCanvas = document.getElementById('ghost-canvas');
  const gctx = ghostCanvas.getContext('2d');
  const drawCanvas = document.getElementById('draw-canvas');
  const dctx = drawCanvas.getContext('2d');
  const SIZE = 400;

  let ghostVisible = true;
  let inkColor = '#1a1008';
  let brushSize = 6;
  let isDrawing = false;
  let lastX = 0, lastY = 0;
  let undoStack = [];

  function drawGrid() {
    gctx.clearRect(0, 0, SIZE, SIZE);
    gctx.fillStyle = '#ffffff';
    gctx.fillRect(0, 0, SIZE, SIZE);

    gctx.strokeStyle = 'rgba(180,160,120,0.6)';
    gctx.lineWidth = 1.5;
    gctx.strokeRect(1, 1, SIZE-2, SIZE-2);

    gctx.strokeStyle = 'rgba(200,168,75,0.25)';
    gctx.lineWidth = 1;
    gctx.setLineDash([6, 4]);
    gctx.beginPath();
    gctx.moveTo(SIZE/2, 0); gctx.lineTo(SIZE/2, SIZE);
    gctx.moveTo(0, SIZE/2); gctx.lineTo(SIZE, SIZE/2);
    gctx.stroke();
    gctx.setLineDash([]);

    gctx.strokeStyle = 'rgba(200,168,75,0.1)';
    gctx.beginPath();
    gctx.moveTo(0,0); gctx.lineTo(SIZE,SIZE);
    gctx.moveTo(SIZE,0); gctx.lineTo(0,SIZE);
    gctx.stroke();

    if (ghostVisible) {
      gctx.font = `${SIZE*0.82}px 'Ma Shan Zheng','Noto Serif SC',serif`;
      gctx.fillStyle = 'rgba(180,160,120,0.18)';
      gctx.textAlign = 'center';
      gctx.textBaseline = 'middle';
      gctx.fillText(kanjiChar, SIZE/2, SIZE/2+10);

      const hints = canvasHints || [];
      gctx.font = 'bold 13px sans-serif';
      gctx.fillStyle = 'rgba(184,50,50,0.55)';
      gctx.textAlign = 'left';
      gctx.textBaseline = 'top';
      hints.forEach(h => gctx.fillText(h.label, h.x, h.y));
    } else {
      gctx.font = `${SIZE*0.82}px 'Ma Shan Zheng','Noto Serif SC',serif`;
      gctx.fillStyle = 'rgba(200,168,75,0.04)';
      gctx.textAlign = 'center';
      gctx.textBaseline = 'middle';
      gctx.fillText(kanjiChar, SIZE/2, SIZE/2+10);
    }
  }

  window.clearDraw  = () => { undoStack = []; dctx.clearRect(0,0,SIZE,SIZE); };
  window.undoDraw   = () => { if (undoStack.length) dctx.putImageData(undoStack.pop(),0,0); };
  window.toggleGhost = () => {
    ghostVisible = !ghostVisible;
    document.getElementById('btn-ghost').textContent = ghostVisible ? '👁 Ẩn chữ mờ' : '👁 Hiện chữ mờ';
    drawGrid();
  };
  window.setInkColor = (c) => { inkColor = c; };
  window.setBrushSize = (s) => {
    brushSize = s;
    const el = document.getElementById('btn-thick');
    if (el) {
      el.style.background = s === 11 ? 'var(--gold)' : 'var(--surface)';
      el.style.color      = s === 11 ? '#fff'        : 'var(--muted)';
      el.style.border     = s === 11 ? '1.5px solid var(--gold)' : '1.5px solid var(--border)';
    }
  };

  function getPos(e) {
    const r = drawCanvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x:(src.clientX-r.left)*(SIZE/r.width), y:(src.clientY-r.top)*(SIZE/r.height) };
  }

  drawCanvas.addEventListener('mousedown', e => {
    isDrawing = true;
    undoStack.push(dctx.getImageData(0,0,SIZE,SIZE));
    if (undoStack.length > 30) undoStack.shift();
    const p = getPos(e); lastX=p.x; lastY=p.y;
  });
  drawCanvas.addEventListener('mousemove', e => {
    if (!isDrawing) return;
    const p = getPos(e);
    dctx.lineWidth=brushSize; dctx.lineCap='round'; dctx.lineJoin='round';
    dctx.strokeStyle=inkColor;
    dctx.beginPath(); dctx.moveTo(lastX,lastY); dctx.lineTo(p.x,p.y); dctx.stroke();
    lastX=p.x; lastY=p.y;
  });
  drawCanvas.addEventListener('mouseup',    () => isDrawing=false);
  drawCanvas.addEventListener('mouseleave', () => isDrawing=false);
  drawCanvas.addEventListener('touchstart', e=>{e.preventDefault();isDrawing=true;undoStack.push(dctx.getImageData(0,0,SIZE,SIZE));const p=getPos(e);lastX=p.x;lastY=p.y;},{passive:false});
  drawCanvas.addEventListener('touchmove',  e=>{e.preventDefault();if(!isDrawing)return;const p=getPos(e);dctx.lineWidth=brushSize;dctx.lineCap='round';dctx.lineJoin='round';dctx.strokeStyle=inkColor;dctx.beginPath();dctx.moveTo(lastX,lastY);dctx.lineTo(p.x,p.y);dctx.stroke();lastX=p.x;lastY=p.y;},{passive:false});
  drawCanvas.addEventListener('touchend',   () => isDrawing=false);

  document.fonts.ready.then(() => { drawGrid(); setBrushSize(6); });
}

// ── AUTO DRAW WIDGET ──────────────────────────────────────────────
function initWidget(kanjiChar) {
  let writer = null, inited = false, visible = false;

  function init() {
    if (inited) return;
    inited = true;
    writer = HanziWriter.create('auto-writer', kanjiChar, {
      width:120, height:120, padding:6,
      strokeColor:'#3a2a10', outlineColor:'rgba(138,98,24,0.2)',
      showCharacter:false, showOutline:true,
      onLoadCharDataError: () => { hideWidget(); },
    });
  }

  function loop() {
    if (!writer || !visible) return;
    writer.hideCharacter();
    writer.animateCharacter({
      strokeAnimationSpeed:0.8, delayBetweenStrokes:300,
      onComplete: () => setTimeout(loop, 1200)
    });
  }

  window.showWidget = () => {
    if (visible) return;
    visible = true;
    document.getElementById('anim-widget').style.display = 'block';
    if (typeof HanziWriter !== 'undefined') { init(); setTimeout(loop, 300); }
  };

  window.hideWidget = () => {
    visible = false;
    try { if (writer) writer.pauseAnimation(); } catch(e) {}
    document.getElementById('anim-widget').style.display = 'none';
  };

  // Tự hiện khi trang load
  if (typeof HanziWriter !== 'undefined') {
    showWidget();
  } else {
    const s = document.querySelector('script[src*="hanzi-writer"]');
    if (s) s.addEventListener('load', showWidget);
  }
}
