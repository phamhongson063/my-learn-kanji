// ── GHOST + TRACE CANVAS ──────────────────────────────────────────
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

// Undo stack — lưu snapshot sau mỗi nét
let undoStack = [];
const MAX_UNDO = 30;

function saveSnapshot() {
  const data = dctx.getImageData(0, 0, SIZE, SIZE);
  undoStack.push(data);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

function undoDraw() {
  if (undoStack.length === 0) return;
  const data = undoStack.pop();
  dctx.putImageData(data, 0, 0);
}

function drawGrid() {
  gctx.clearRect(0, 0, SIZE, SIZE);

  gctx.fillStyle = '#ffffff';
  gctx.fillRect(0, 0, SIZE, SIZE);

  // Viền ngoài
  gctx.strokeStyle = 'rgba(180,160,120,0.6)';
  gctx.lineWidth = 1.5;
  gctx.strokeRect(1, 1, SIZE - 2, SIZE - 2);

  // Đường chéo giữa (nét đứt)
  gctx.strokeStyle = 'rgba(200,168,75,0.25)';
  gctx.lineWidth = 1;
  gctx.setLineDash([6, 4]);
  gctx.beginPath();
  gctx.moveTo(SIZE / 2, 0); gctx.lineTo(SIZE / 2, SIZE);
  gctx.moveTo(0, SIZE / 2); gctx.lineTo(SIZE, SIZE / 2);
  gctx.stroke();
  gctx.setLineDash([]);

  // Đường chéo
  gctx.strokeStyle = 'rgba(200,168,75,0.1)';
  gctx.beginPath();
  gctx.moveTo(0, 0); gctx.lineTo(SIZE, SIZE);
  gctx.moveTo(SIZE, 0); gctx.lineTo(0, SIZE);
  gctx.stroke();

  if (ghostVisible) {
    // Chữ mờ
    gctx.font = `${SIZE * 0.82}px 'Ma Shan Zheng', 'Noto Serif SC', serif`;
    gctx.fillStyle = 'rgba(180, 160, 120, 0.18)';
    gctx.textAlign = 'center';
    gctx.textBaseline = 'middle';
    gctx.fillText('器', SIZE / 2, SIZE / 2 + 10);

    // Số thứ tự nét
    const hints = [
      { x: 78,  y: 78,  label: '①' },
      { x: 200, y: 68,  label: '④⑤⑥⑦' },
      { x: 322, y: 78,  label: '⑧' },
      { x: 78,  y: 322, label: '⑪' },
      { x: 322, y: 322, label: '⑭' },
    ];
    gctx.font = 'bold 13px sans-serif';
    gctx.fillStyle = 'rgba(184,50,50,0.55)';
    gctx.textAlign = 'left';
    gctx.textBaseline = 'top';
    hints.forEach(h => gctx.fillText(h.label, h.x, h.y));
  } else {
    // Chữ rất nhạt khi ẩn
    gctx.font = `${SIZE * 0.82}px 'Ma Shan Zheng', 'Noto Serif SC', serif`;
    gctx.fillStyle = 'rgba(200,168,75,0.04)';
    gctx.textAlign = 'center';
    gctx.textBaseline = 'middle';
    gctx.fillText('器', SIZE / 2, SIZE / 2 + 10);
  }
}

function clearDraw() {
  undoStack = [];
  dctx.clearRect(0, 0, SIZE, SIZE);
}

function setInkColor(c) {
  inkColor = c;
  // Cập nhật style nút
  document.getElementById('btn-black').style.cssText = '';
  document.getElementById('btn-red').style.cssText = 'background:#b83232;color:#fff;border-color:#b83232;';
  if (c === '#1a1008') {
    document.getElementById('btn-black').style.cssText = '';
  } else {
    document.getElementById('btn-red').style.cssText = 'background:#b83232;color:#fff;border-color:#b83232;';
  }
}

function setBrushSize(s) {
  brushSize = s;
  // Reset tất cả về muted rồi bật active
  const ids = ['btn-thin', 'btn-med', 'btn-thick'];
  ids.forEach(id => {
    document.getElementById(id).style.background = 'var(--surface)';
    document.getElementById(id).style.color = 'var(--muted)';
    document.getElementById(id).style.border = '1.5px solid var(--border)';
  });
  const active = s === 3 ? 'btn-thin' : s === 6 ? 'btn-med' : 'btn-thick';
  document.getElementById(active).style.background = 'var(--gold)';
  document.getElementById(active).style.color = '#fff';
  document.getElementById(active).style.border = '1.5px solid var(--gold)';
}

function toggleGhost() {
  ghostVisible = !ghostVisible;
  const btn = document.getElementById('btn-ghost');
  btn.textContent = ghostVisible ? '👁 Ẩn chữ mờ' : '👁 Hiện chữ mờ';
  drawGrid();
}

function getPos(e) {
  const r = drawCanvas.getBoundingClientRect();
  const scaleX = SIZE / r.width;
  const scaleY = SIZE / r.height;
  const src = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - r.left) * scaleX,
    y: (src.clientY - r.top) * scaleY
  };
}

function startDraw(e) {
  isDrawing = true;
  saveSnapshot(); // lưu trước khi bắt đầu nét mới
  const p = getPos(e);
  lastX = p.x; lastY = p.y;
  dctx.beginPath();
  dctx.moveTo(p.x, p.y);
}

function draw(e) {
  if (!isDrawing) return;
  const p = getPos(e);
  dctx.lineWidth = brushSize;
  dctx.lineCap = 'round';
  dctx.lineJoin = 'round';
  dctx.strokeStyle = inkColor;
  dctx.beginPath();
  dctx.moveTo(lastX, lastY);
  dctx.lineTo(p.x, p.y);
  dctx.stroke();
  lastX = p.x; lastY = p.y;
}

function stopDraw() { isDrawing = false; }

drawCanvas.addEventListener('mousedown', startDraw);
drawCanvas.addEventListener('mousemove', draw);
drawCanvas.addEventListener('mouseup', stopDraw);
drawCanvas.addEventListener('mouseleave', stopDraw);
drawCanvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e); }, { passive: false });
drawCanvas.addEventListener('touchmove',  e => { e.preventDefault(); draw(e); },      { passive: false });
drawCanvas.addEventListener('touchend',   stopDraw);

drawCanvas.style.background = 'transparent';
document.fonts.ready.then(() => {
  drawGrid();
  setBrushSize(6);
});
// ── END GHOST CANVAS ──────────────────────────────────────────────

// ── AUTO DRAW WIDGET (Hanzi Writer) ───────────────────────────────
let writer = null;
let writerInited = false;
let widgetVisible = false;

function initWriter() {
  if (writerInited) return;
  writerInited = true;
  writer = HanziWriter.create('auto-writer', '器', {
    width: 120,
    height: 120,
    padding: 6,
    strokeColor: '#3a2a10',
    outlineColor: 'rgba(138,98,24,0.2)',
    showCharacter: false,
    showOutline: true,
    strokeAnimationSpeed: 0.8,
    delayBetweenStrokes: 300,
  });
}

function loopAnim() {
  if (!writer || !widgetVisible) return;
  writer.hideCharacter();
  writer.animateCharacter({
    strokeAnimationSpeed: 0.8,
    delayBetweenStrokes: 300,
    onComplete: function() {
      // Nghỉ 1.2s rồi lặp lại
      setTimeout(loopAnim, 1200);
    }
  });
}

function showWidget() {
  if (widgetVisible) return;
  widgetVisible = true;
  const widget = document.getElementById('anim-widget');
  widget.style.display = 'block';
  const btnOpen = document.getElementById('btn-open-anim');
  if (btnOpen) {
    btnOpen.textContent = '■ Đóng mẫu';
    btnOpen.style.background = 'var(--surface)';
    btnOpen.style.color = 'var(--muted)';
    btnOpen.style.border = '1.5px solid var(--border)';
  }
  if (typeof HanziWriter !== 'undefined') {
    initWriter();
    setTimeout(loopAnim, 300);
  }
}

function hideWidget() {
  widgetVisible = false;
  try { if (writer) writer.pauseAnimation(); } catch(e) {}
  document.getElementById('anim-widget').style.display = 'none';
  const btnOpen = document.getElementById('btn-open-anim');
  if (btnOpen) {
    btnOpen.textContent = '▶ Xem mẫu';
    btnOpen.style.cssText = '';
  }
}

function toggleWidget() {
  widgetVisible ? hideWidget() : showWidget();
}

// Hiện widget ngay khi trang load
if (typeof HanziWriter !== 'undefined') {
  showWidget();
} else {
  document.querySelector('script[src*="hanzi-writer"]').addEventListener('load', showWidget);
}
// ── END AUTO DRAW WIDGET ──────────────────────────────────────────

// ── QUIZ ──────────────────────────────────────────────────────────
const qs = [
  {
    q: '器 được cấu tạo từ những thành phần nào?',
    opts: ['4 chữ 口 + 1 chữ 犬', '3 chữ 口 + 1 chữ 大', '2 chữ 口 + 2 chữ 人', '5 chữ 口'],
    ans: 0,
    explain: '器 = 4 chữ 口 (miệng/đồ vật) ở bốn góc + 1 chữ 犬 (chó) ở trung tâm. Tổng cộng 5 thành phần, 16 nét.'
  },
  {
    q: '器 đọc âm Kun (訓読み) là gì?',
    opts: ['き (ki)', 'うつわ (utsuwa)', 'きかん (kikan)', 'ようき (yōki)'],
    ans: 1,
    explain: 'Âm Kun của 器 là うつわ (utsuwa) — nghĩa là đồ vật, cái chén. Âm On là き (ki), dùng trong từ ghép như 器官、楽器.'
  },
  {
    q: '器用 (きよう) có nghĩa là gì?',
    opts: ['Khéo léo, tài hoa', 'Vô dụng, vụng về', 'Đồ dùng nhà bếp', 'Cơ quan trong cơ thể'],
    ans: 0,
    explain: '器用 (きよう) là tính từ な nghĩa là khéo léo, khéo tay. 「手先が器用だ」— Đôi tay khéo léo. Trái nghĩa là 不器用 (ぶきよう) — vụng về.'
  },
  {
    q: '楽器 (がっき) có nghĩa là gì?',
    opts: ['Vũ khí', 'Nhạc cụ', 'Cơ quan cơ thể', 'Đồ dùng ăn uống'],
    ans: 1,
    explain: '楽器 (がっき) = 楽 (âm nhạc) + 器 (dụng cụ) = Nhạc cụ. Ví dụ: ピアノ、ギター、太鼓 đều là 楽器.'
  },
  {
    q: '「器が大きい人」có nghĩa là gì?',
    opts: ['Người to lớn về thể xác', 'Người rộng lượng, khoan dung', 'Người ăn nhiều', 'Người giỏi nấu ăn'],
    ans: 1,
    explain: '「器が大きい」là thành ngữ: nghĩa đen "cái chén lớn", nghĩa bóng chỉ người có tâm hồn rộng lượng, không cố chấp vặt vãnh.'
  },
  {
    q: '四字熟語「大器晩成」(たいきばんせい) có nghĩa là gì?',
    opts: ['Đồ vật lớn làm xong sớm', 'Người tài lớn thành công muộn', 'Vũ khí lớn mạnh mẽ', 'Nhạc cụ quý hiếm'],
    ans: 1,
    explain: '大器晩成 — người có tài năng lớn cần thời gian dài để tỏa sáng, như cái bình lớn đúc lâu mới hoàn thành.'
  }
];

let qi = 0, score = 0, done = false;

function renderQ() {
  const q = qs[qi];
  document.getElementById('qcount').textContent = `CÂU ${qi + 1} / ${qs.length}`;
  document.getElementById('qtext').textContent = q.q;
  const opts = document.getElementById('qopts');
  opts.innerHTML = '';
  q.opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'q-opt';
    b.textContent = o;
    b.onclick = () => pick(i);
    opts.appendChild(b);
  });
  const fb = document.getElementById('qfb');
  fb.className = 'q-feedback';
  fb.style.display = 'none';
  document.getElementById('qnext').style.display = 'none';
  done = false;
}

function pick(i) {
  if (done) return;
  done = true;
  const q = qs[qi];
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
}

function nextQ() {
  qi++;
  if (qi >= qs.length) {
    document.getElementById('qbox').style.display = 'none';
    document.getElementById('qresult').style.display = 'block';
    const pct = Math.round(score / qs.length * 100);
    document.getElementById('rscore').textContent = `${score} / ${qs.length} câu đúng`;
    const msgs = [
      'Hãy đọc lại bài và thử lại! がんばって！',
      'Khá tốt! Ôn thêm một chút nữa nhé!',
      'Rất giỏi! Bạn hiểu chữ 器 rất rõ!',
      '完璧！ Hoàn hảo — Bạn đã thông thạo 器 rồi！'
    ];
    document.getElementById('rmsg').textContent = msgs[Math.min(3, Math.floor(pct / 26))];
  } else {
    renderQ();
  }
}

function restartQ() {
  qi = 0; score = 0;
  document.getElementById('qbox').style.display = 'block';
  document.getElementById('qresult').style.display = 'none';
  renderQ();
}

renderQ();
// ── END QUIZ ──────────────────────────────────────────────────────
