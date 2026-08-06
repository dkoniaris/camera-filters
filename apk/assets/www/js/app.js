/* ============================================================
   ΦΙΛΤΡΑ CAM — κύρια εφαρμογή
   Κάμερα + 50 φίλτρα + 56 εφέ προσώπου (face-api.js 68 landmarks)
   ============================================================ */
(() => {
'use strict';

/* ---------- Στοιχεία ---------- */
const $ = id => document.getElementById(id);
const video = $('video'), canvas = $('display'), ctx = canvas.getContext('2d');
const statusEl = $('status'), startScreen = $('startScreen');
const effectStrip = $('effectStrip'), filterStrip = $('filterStrip');
const btnStart = $('btnStart'), btnStartDemo = $('btnStartDemo'), btnDemo = $('btnDemo');
const btnFlip = $('btnFlip'), btnCapture = $('btnCapture'), btnRecord = $('btnRecord');
const btnGallery = $('btnGallery'), btnBeauty = $('btnBeauty'), beautyPanel = $('beautyPanel');
const beautyRange = $('beautyRange');
const galleryModal = $('galleryModal'), galleryGrid = $('galleryGrid'), galleryEmpty = $('galleryEmpty');
const viewerModal = $('viewerModal'), viewerBody = $('viewerBody'), btnDl = $('btnDl'), btnDel = $('btnDel');
const recTime = document.createElement('div');
recTime.id = 'recTime'; $('stage').appendChild(recTime);

/* Native λειτουργία (APK): η κάμερα έρχεται ως MJPEG από τοπικό server */
const NATIVE = !!(window.FiltraNative && window.FiltraNative.isNative && window.FiltraNative.isNative());
let srcEl = video; // πηγή καρέ: <video> (web) ή <img> MJPEG (APK)

/* ---------- Κατάσταση ---------- */
const state = {
  activeFilter: 'none',
  activeEffect: null,
  fx: { glitch: false, pixel: false, kaleido: false, duotone: false, vignette: false },
  beauty: 0,
  facing: 'user', mirrored: true,
  landmarks: null, lastLmAt: 0,
  recording: false, recStart: 0, recTimer: null, mediaRecorder: null, chunks: [],
  gallery: [], viewing: null,
  demo: false, stream: null,
  modelsReady: false, videoReady: false
};

/* ---------- Φόρτωση μοντέλων ---------- */
async function loadModels() {
  try {
    statusEl.textContent = 'Φόρτωση μοντέλων (1/2)…';
    await faceapi.nets.tinyFaceDetector.loadFromUri('models');
    statusEl.textContent = 'Φόρτωση μοντέλων (2/2)…';
    await faceapi.nets.faceLandmark68Net.loadFromUri('models');
    state.modelsReady = true;
    statusEl.textContent = 'Έτοιμο!';
    setTimeout(() => { if (!state.videoReady) statusEl.style.display = 'none'; }, 600);
  } catch (e) {
    console.error(e);
    statusEl.textContent = '⚠️ Αποτυχία φόρτωσης μοντέλων';
  }
}

/* ---------- Κατασκευή UI ---------- */
function buildUI() {
  // Λωρίδα φίλτρων (ζωντανά μικρογραφίες)
  FILTERS.forEach(f => {
    const item = document.createElement('div');
    item.className = 'stripItem' + (f.id === state.activeFilter ? ' on' : '');
    item.dataset.fid = f.id;
    const thumb = document.createElement('canvas');
    thumb.className = 'thumb'; thumb.width = 52; thumb.height = 52;
    const label = document.createElement('span');
    label.className = 'label'; label.textContent = f.name;
    item.appendChild(thumb); item.appendChild(label);
    item.addEventListener('click', () => {
      state.activeFilter = f.id;
      filterStrip.querySelectorAll('.stripItem').forEach(el => el.classList.toggle('on', el.dataset.fid === f.id));
    });
    filterStrip.appendChild(item);
  });
  // Λωρίδα εφέ
  EFFECTS.forEach(ef => {
    const item = document.createElement('div');
    item.className = 'stripItem effect';
    item.dataset.eid = ef.id;
    const thumb = document.createElement('div');
    thumb.className = 'thumb'; thumb.textContent = ef.emoji;
    const label = document.createElement('span');
    label.className = 'label'; label.textContent = ef.name;
    item.appendChild(thumb); item.appendChild(label);
    item.addEventListener('click', () => {
      state.activeEffect = state.activeEffect === ef.id ? null : ef.id;
      effectStrip.querySelectorAll('.stripItem').forEach(el => el.classList.toggle('on', el.dataset.eid === state.activeEffect));
    });
    effectStrip.appendChild(item);
  });
  // Chips FX
  document.querySelectorAll('.fxchip[data-fx]').forEach(ch => {
    ch.addEventListener('click', () => {
      const k = ch.dataset.fx;
      state.fx[k] = !state.fx[k];
      ch.classList.toggle('on', state.fx[k]);
    });
  });
  // Ομορφιά
  btnBeauty.addEventListener('click', () => beautyPanel.classList.toggle('hidden'));
  beautyRange.addEventListener('input', () => { state.beauty = beautyRange.value / 100; });
}

/* ---------- Ζωντανά thumbnails φίλτρων ---------- */
const thumbEls = [];
function updateThumbs() {
  if (!state.videoReady) return;
  const tw = 52;
  filterStrip.querySelectorAll('.stripItem').forEach((item, i) => {
    const tc = item.querySelector('canvas');
    if (!tc) return;
    const tctx = tc.getContext('2d');
    tctx.setTransform(1, 0, 0, 1, 0, 0);
    tctx.clearRect(0, 0, tw, tw);
    tctx.save();
    if (state.mirrored) { tctx.translate(tw, 0); tctx.scale(-1, 1); }
    tctx.filter = FILTERS[i].css;
    tctx.drawImage(srcEl, 0, 0, tw, tw);
    tctx.restore();
  });
}
setInterval(() => { if (state.videoReady) updateThumbs(); }, 700);

/* ---------- Κάμερα ---------- */
async function startCamera() {
  if (NATIVE) { startNativeCamera(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: state.facing, width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });
    state.stream = stream; state.demo = false;
    video.srcObject = stream;
    await video.play();
    video.addEventListener('loadedmetadata', onVideoReady, { once: true });
  } catch (e) {
    console.error(e);
    alert('Δεν μπόρεσα να ανοίξω την κάμερα 😕\nΒεβαιώσου ότι η σελίδα ανοίγει με HTTPS και δίνεις άδεια κάμερας.');
  }
}
function onVideoReady() {
  state.videoReady = true;
  statusEl.style.display = 'none';
  startScreen.classList.add('hidden');
  sizeCanvas();
  startLoop();
  updateThumbs();
}
function sizeCanvas() {
  const vw = srcEl.videoWidth || srcEl.naturalWidth || 640;
  const vh = srcEl.videoHeight || srcEl.naturalHeight || 480;
  const scale = Math.min(1, 720 / vw);
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);
  if (!blurC) { blurC = document.createElement('canvas'); blurX = blurC.getContext('2d'); }
  blurC.width = canvas.width; blurC.height = canvas.height;
}
async function flipCamera() {
  if (NATIVE) {
    state.facing = state.facing === 'user' ? 'environment' : 'user';
    state.mirrored = state.facing === 'user';
    window.FiltraNative.setFacing(state.facing === 'user');
    return;
  }
  state.facing = state.facing === 'user' ? 'environment' : 'user';
  state.mirrored = state.facing === 'user';
  if (state.stream) state.stream.getTracks().forEach(t => t.stop());
  state.videoReady = false;
  await startCamera();
}
function startNativeCamera() {
  state.demo = false;
  state.facing = 'user';
  startScreen.classList.add('hidden');
  statusEl.textContent = 'Άνοιγμα κάμερας…';
  statusEl.style.display = 'block';
  const img = document.createElement('img');
  img.id = 'nativeImg';
  img.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;';
  document.body.appendChild(img);
  let ready = false;
  img.onload = () => {
    if (!ready) {
      ready = true;
      srcEl = img;
      state.videoReady = true;
      state.mirrored = true;
      statusEl.style.display = 'none';
      sizeCanvas();
      startLoop();
      updateThumbs();
    }
  };
  img.src = 'http://127.0.0.1:8765/stream.mjpeg';
  window.FiltraNative.startCamera(true);
}
window.__nativeDenied = () => alert('Δεν δόθηκε άδεια κάμερας 😕\nΕνεργοποίησέ την από Ρυθμίσεις > Εφαρμογές > Φίλτρα Cam > Άδειες.');
let blurC = null, blurX = null;

/* ---------- Demo χωρίς κάμερα ---------- */
function startDemo() {
  state.demo = true; state.mirrored = true;
  startScreen.classList.add('hidden'); statusEl.style.display = 'none';
  const dc = document.createElement('canvas');
  dc.width = 480; dc.height = 640;
  const dx = dc.getContext('2d');
  const stream = dc.captureStream(30);
  video.srcObject = stream;
  video.play();
  state.videoReady = true;
  canvas.width = dc.width; canvas.height = dc.height;
  if (!blurC) { blurC = document.createElement('canvas'); blurX = blurC.getContext('2d'); }
  blurC.width = canvas.width; blurC.height = canvas.height;
  startLoop(); updateThumbs();
  (function draw(t) {
    dx.setTransform(1, 0, 0, 1, 0, 0);
    const gr = dx.createLinearGradient(0, 0, 0, 640);
    gr.addColorStop(0, '#2a1a4a'); gr.addColorStop(1, '#0f0f1e');
    dx.fillStyle = gr; dx.fillRect(0, 0, 480, 640);
    drawDemoFace(dx, t / 1000);
    requestAnimationFrame(draw);
  })(0);
}
function demoGeom(t) {
  const w = 480, h = 640, d = w * 0.17, cx = w / 2;
  const bob = Math.sin(t * 0.8) * 5;
  const cy = h * 0.44 + bob;
  const ang = Math.sin(t * 0.5) * 0.03;
  return { w, h, d, cx, cy, ang };
}
function drawDemoFace(x, t) {
  const g = demoGeom(t);
  const { d, cx, cy, ang } = g;
  x.save();
  x.translate(cx, cy); x.rotate(ang);
  // κεφάλι
  x.fillStyle = '#ffd9b3';
  x.beginPath(); x.ellipse(0, 0.4 * d, 1.45 * d, 1.75 * d, 0, 0, Math.PI * 2); x.fill();
  // μαλλιά
  x.fillStyle = '#5a3a1e';
  x.beginPath(); x.ellipse(0, -0.75 * d, 1.5 * d, 0.85 * d, 0, Math.PI, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(0, -0.85 * d, 0.5 * d, 0, Math.PI * 2); x.fill();
  // φρύδια
  x.strokeStyle = '#4a2e14'; x.lineWidth = d * 0.09; x.lineCap = 'round';
  x.beginPath(); x.moveTo(-0.75 * d, -0.62 * d); x.quadraticCurveTo(-0.45 * d, -0.75 * d, -0.15 * d, -0.62 * d); x.stroke();
  x.beginPath(); x.moveTo(0.15 * d, -0.62 * d); x.quadraticCurveTo(0.45 * d, -0.75 * d, 0.75 * d, -0.62 * d); x.stroke();
  // μάτια (με κλείσιμο)
  const blink = (t % 3.2) < 0.14;
  for (const s of [-1, 1]) {
    x.fillStyle = '#fff';
    x.beginPath(); x.ellipse(s * 0.45 * d, -0.18 * d, 0.34 * d, blink ? 0.03 * d : 0.22 * d, 0, 0, Math.PI * 2); x.fill();
    if (!blink) {
      x.fillStyle = '#3a2a1a';
      x.beginPath(); x.arc(s * 0.45 * d, -0.18 * d, 0.14 * d, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff';
      x.beginPath(); x.arc(s * 0.45 * d - 0.05 * d, -0.22 * d, 0.05 * d, 0, Math.PI * 2); x.fill();
    }
  }
  // μύτη
  x.strokeStyle = '#d99a6b'; x.lineWidth = d * 0.06; x.lineCap = 'round';
  x.beginPath(); x.moveTo(0, -0.05 * d); x.quadraticCurveTo(0.12 * d, 0.15 * d, 0, 0.3 * d); x.stroke();
  // στόμα
  x.strokeStyle = '#c96a5a'; x.lineWidth = d * 0.07;
  x.beginPath(); x.arc(0, 0.28 * d, 0.5 * d, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  // μάγουλα
  for (const s of [-1, 1]) {
    const g2 = x.createRadialGradient(s * 0.95 * d, 0.25 * d, 0, s * 0.95 * d, 0.25 * d, 0.5 * d);
    g2.addColorStop(0, 'rgba(255,120,150,.4)'); g2.addColorStop(1, 'rgba(255,120,150,0)');
    x.fillStyle = g2;
    x.beginPath(); x.arc(s * 0.95 * d, 0.25 * d, 0.5 * d, 0, Math.PI * 2); x.fill();
  }
  x.restore();
  // landmarks για τα εφέ — ΙΔΙΑ γεωμετρία με το σχεδιασμένο πρόσωπο
  window.__demoLM = syntheticLM(g);
}
function syntheticLM(g) {
  const { d, cx, cy, ang } = g;
  const rot = (x, y) => {
    const c = Math.cos(ang), s = Math.sin(ang);
    return { x: cx + (x - cx) * c - (y - cy) * s, y: cy + (x - cx) * s + (y - cy) * c };
  };
  const P = (x, y) => rot(x, y);
  const lm = [];
  // σαγόνι 0-16 (έλλειψη: κέντρο (cx, cy+0.55d), rx 1.35d, ry 1.1d)
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI - i / 16 * Math.PI;
    lm.push(P(cx + Math.cos(a) * 1.35 * d, cy + 0.55 * d + Math.sin(a) * 1.1 * d));
  }
  // φρύδια
  for (let i = 0; i < 5; i++) {
    const t2 = i / 4;
    lm.push(P(cx - 0.75 * d + t2 * 0.6 * d, cy - 0.62 * d - 0.08 * d * Math.sin(t2 * Math.PI)));
  }
  for (let i = 0; i < 5; i++) {
    const t2 = i / 4;
    lm.push(P(cx + 0.15 * d + t2 * 0.6 * d, cy - 0.62 * d - 0.08 * d * Math.sin(t2 * Math.PI)));
  }
  // μύτη
  lm.push(P(cx, cy - 0.4 * d));            // 27
  lm.push(P(cx, cy - 0.15 * d));           // 28
  lm.push(P(cx, cy + 0.1 * d));            // 29
  lm.push(P(cx, cy + 0.35 * d));           // 30 (άκρη μύτης)
  lm.push(P(cx - 0.32 * d, cy + 0.35 * d)); // 31
  lm.push(P(cx + 0.32 * d, cy + 0.35 * d)); // 32
  lm.push(P(cx, cy + 0.5 * d));            // 33
  lm.push(P(cx - 0.2 * d, cy + 0.45 * d)); // 34
  lm.push(P(cx + 0.2 * d, cy + 0.45 * d)); // 35
  // αριστερά μάτια 36-41, δεξιά 42-47
  const eL = [P(cx - 0.79 * d, cy - 0.18 * d), P(cx - 0.6 * d, cy - 0.36 * d), P(cx - 0.32 * d, cy - 0.36 * d), P(cx - 0.13 * d, cy - 0.18 * d), P(cx - 0.32 * d, cy - 0.02 * d), P(cx - 0.6 * d, cy - 0.02 * d)];
  const eR = [P(cx + 0.13 * d, cy - 0.18 * d), P(cx + 0.32 * d, cy - 0.36 * d), P(cx + 0.6 * d, cy - 0.36 * d), P(cx + 0.79 * d, cy - 0.18 * d), P(cx + 0.6 * d, cy - 0.02 * d), P(cx + 0.32 * d, cy - 0.02 * d)];
  eL.forEach(p => lm.push(p)); eR.forEach(p => lm.push(p));
  // στόμα εξωτερικό 48-59
  for (let i = 0; i < 6; i++) {
    const a = Math.PI - i / 5 * Math.PI;
    lm.push(P(cx + Math.cos(a) * 0.62 * d, cy + 0.42 * d + Math.sin(a) * 0.32 * d));
  }
  for (let i = 0; i <= 5; i++) {
    const a = -i / 5 * Math.PI;
    lm.push(P(cx + Math.cos(a) * 0.62 * d, cy + 0.42 * d + Math.sin(a) * 0.42 * d));
  }
  // στόμα εσωτερικό 60-67
  const inner = [Math.PI, Math.PI * 0.75, Math.PI * 0.5, Math.PI * 0.25, 0, -Math.PI * 0.25, -Math.PI * 0.5, -Math.PI * 0.75];
  inner.forEach(a => lm.push(P(cx + Math.cos(a) * 0.3 * d, cy + 0.45 * d + Math.sin(a) * 0.22 * d)));
  return lm;
}

/* ---------- Κύριος βρόχος ---------- */
let lastDetect = 0;
function startLoop() {
  function tick(now) {
    const t = now / 1000;
    if (state.videoReady) {
      if (state.demo && window.__demoLM) {
        state.landmarks = window.__demoLM; state.lastLmAt = now;
      } else if (!state.demo && state.modelsReady && now - lastDetect > 150) {
        lastDetect = now; detectFace();
      }
      if (!state.demo && now - state.lastLmAt > 450) state.landmarks = null;
      renderFrame(t);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
async function detectFace() {
  try {
    const res = await faceapi.detectSingleFace(srcEl,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 }))
      .withFaceLandmarks();
    if (res) { state.landmarks = res.landmarks.positions; state.lastLmAt = performance.now(); }
  } catch (e) { /* σιωπηλό */ }
}

/* ---------- Rendering ---------- */
function renderFrame(t) {
  const w = canvas.width, h = canvas.height;
  if (!w || !h) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // 1) βίντεο με φίλτρο (mirror για selfie)
  ctx.save();
  if (state.mirrored) { ctx.translate(w, 0); ctx.scale(-1, 1); }
  ctx.filter = getFilterCss();
  ctx.drawImage(srcEl, 0, 0, w, h);
  ctx.restore();

  // 2) FX
  if (state.fx.pixel) fxPixel(w, h);
  if (state.fx.kaleido) fxKaleido(w, h);
  if (state.fx.glitch) fxGlitch(w, h, t);
  if (state.fx.duotone) fxDuotone(w, h);

  // 3) ομορφιά (λείανση)
  if (state.beauty > 0.01) fxBeauty(w, h);

  // 4) vignette
  const vig = state.fx.vignette ? 0.38 : (getFilter().vig || 0);
  if (vig > 0) fxVignette(w, h, vig);

  // 5) εφέ προσώπου
  if (state.activeEffect && state.landmarks && state.landmarks.length === 68) {
    const ef = EFFECTS.find(e => e.id === state.activeEffect);
    if (ef) {
      ctx.save();
      if (state.mirrored) { ctx.translate(w, 0); ctx.scale(-1, 1); }
      ef.draw(state.landmarks, ctx, t);
      ctx.restore();
    }
  }
}
function getFilter() { return FILTERS.find(f => f.id === state.activeFilter) || FILTERS[0]; }
function getFilterCss() { return getFilter().css; }

function fxPixel(w, h) {
  const tw = Math.max(8, Math.round(w / 14)), th = Math.max(8, Math.round(h / 14));
  const { c, x } = tmpCanvas(tw, th);
  x.drawImage(canvas, 0, 0, tw, th);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, 0, 0, tw, th, 0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
}
function fxKaleido(w, h) {
  const { c, x } = tmpCanvas(w, h);
  x.drawImage(canvas, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(c, 0, 0);
  ctx.save();
  ctx.translate(w, 0); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0);
  ctx.translate(0, h); ctx.scale(1, -1); ctx.drawImage(c, 0, 0);
  ctx.translate(w, 0); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0);
  ctx.restore();
}
function fxGlitch(w, h, t) {
  const { c, x } = tmpCanvas(w, h);
  x.drawImage(canvas, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const n = 3 + Math.floor(t * 4) % 3;
  for (let i = 0; i < n; i++) {
    const sy = Math.random() * h, sh = 4 + Math.random() * 26;
    const dx = (Math.random() - 0.5) * 90;
    ctx.drawImage(c, 0, sy, w, sh, dx, sy, w, sh);
  }
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.22;
  ctx.drawImage(c, 6, 0); ctx.drawImage(c, -6, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function fxDuotone(w, h) {
  ctx.globalCompositeOperation = 'multiply';
  const gr = ctx.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, '#7031ff'); gr.addColorStop(1, '#ff2d78');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.75;
  const gr2 = ctx.createLinearGradient(w, 0, 0, h);
  gr2.addColorStop(0, '#ff9f1c'); gr2.addColorStop(1, '#ffd02d');
  ctx.fillStyle = gr2; ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function fxBeauty(w, h) {
  if (!blurC) return;
  blurX.setTransform(1, 0, 0, 1, 0, 0);
  blurX.clearRect(0, 0, w, h);
  blurX.filter = 'blur(12px) brightness(1.07) saturate(1.1)';
  blurX.drawImage(srcEl, 0, 0, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = state.beauty * 0.55;
  ctx.drawImage(blurC, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function fxVignette(w, h, v) {
  const gr = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(1, `rgba(0,0,0,${v})`);
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, w, h);
}

/* ---------- Φωτογραφία ---------- */
btnCapture.addEventListener('click', () => {
  if (!state.videoReady) return;
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    state.gallery.unshift({ type: 'image', url, ts: Date.now() });
    updateGalleryBtn();
    if (NATIVE) {
      window.FiltraNative.savePhoto(canvas.toDataURL('image/png'), 'filtra-' + Date.now());
    } else {
      const a = document.createElement('a');
      a.href = url; a.download = `filtra-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); a.remove();
    }
  }, 'image/png');
});

/* ---------- Βίντεο ---------- */
btnRecord.addEventListener('click', () => {
  if (!state.videoReady) return;
  if (typeof canvas.captureStream !== 'function') {
    alert('Η εγγραφή βίντεο δεν υποστηρίζεται σε αυτή τη συσκευή 😕');
    return;
  }
  if (!state.recording) {
    try {
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
      state.chunks = [];
      state.mediaRecorder = new MediaRecorder(canvas.captureStream(30), mime ? { mimeType: mime } : undefined);
      state.mediaRecorder.ondataavailable = e => { if (e.data.size) state.chunks.push(e.data); };
      state.mediaRecorder.onstop = () => {
        const blob = new Blob(state.chunks, { type: mime || 'video/webm' });
        const url = URL.createObjectURL(blob);
        state.gallery.unshift({ type: 'video', url, ts: Date.now() });
        updateGalleryBtn();
        if (NATIVE) {
          const fr = new FileReader();
          fr.onload = () => window.FiltraNative.saveVideo(fr.result, 'filtra-video-' + Date.now());
          fr.readAsDataURL(blob);
        } else {
          const a = document.createElement('a');
          a.href = url; a.download = `filtra-video-${Date.now()}.webm`;
          document.body.appendChild(a); a.click(); a.remove();
        }
      };
      state.mediaRecorder.start();
      state.recording = true;
      btnRecord.classList.add('rec');
      state.recStart = Date.now();
      recTime.style.display = 'block';
      state.recTimer = setInterval(() => {
        const s = Math.floor((Date.now() - state.recStart) / 1000);
        recTime.textContent = `🔴 ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      }, 250);
    } catch (e) { console.error(e); alert('Η εγγραφή βίντεο δεν υποστηρίζεται σε αυτό το πρόγραμμα.'); }
  } else {
    state.mediaRecorder.stop();
    state.recording = false;
    btnRecord.classList.remove('rec');
    clearInterval(state.recTimer);
    recTime.style.display = 'none';
  }
});

/* ---------- Γκαλερί ---------- */
function updateGalleryBtn() {
  if (state.gallery.length) btnGallery.textContent = '🖼️';
}
btnGallery.addEventListener('click', () => {
  galleryGrid.innerHTML = '';
  galleryEmpty.classList.toggle('hidden', state.gallery.length > 0);
  state.gallery.forEach((item, i) => {
    const el = document.createElement(item.type === 'image' ? 'img' : 'video');
    el.src = item.url;
    if (item.type === 'video') { el.muted = true; el.playsInline = true; }
    el.addEventListener('click', () => openViewer(i));
    galleryGrid.appendChild(el);
  });
  galleryModal.classList.remove('hidden');
});
function openViewer(i) {
  state.viewing = i;
  viewerBody.innerHTML = '';
  const item = state.gallery[i];
  const el = document.createElement(item.type === 'image' ? 'img' : 'video');
  el.src = item.url;
  if (item.type === 'video') { el.controls = true; }
  viewerBody.appendChild(el);
  viewerModal.classList.remove('hidden');
}
btnDl.addEventListener('click', () => {
  if (state.viewing == null) return;
  const item = state.gallery[state.viewing];
  if (NATIVE) {
    if (item.type === 'image') {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        window.FiltraNative.savePhoto(c.toDataURL('image/png'), 'filtra-' + item.ts);
      };
      img.src = item.url;
    } else {
      fetch(item.url).then(r => r.blob()).then(blob => {
        const fr = new FileReader();
        fr.onload = () => window.FiltraNative.saveVideo(fr.result, 'filtra-video-' + item.ts);
        fr.readAsDataURL(blob);
      });
    }
    return;
  }
  const a = document.createElement('a');
  a.href = item.url;
  a.download = item.type === 'image' ? `filtra-${item.ts}.png` : `filtra-video-${item.ts}.webm`;
  document.body.appendChild(a); a.click(); a.remove();
});
btnDel.addEventListener('click', () => {
  if (state.viewing == null) return;
  const item = state.gallery[state.viewing];
  URL.revokeObjectURL(item.url);
  state.gallery.splice(state.viewing, 1);
  state.viewing = null;
  viewerModal.classList.add('hidden');
  btnGallery.click();
});
document.querySelectorAll('[data-close]').forEach(b => {
  b.addEventListener('click', () => $(b.dataset.close).classList.add('hidden'));
});

/* ---------- Ξεκίνημα ---------- */
btnStart.addEventListener('click', () => { if (!state.modelsReady) { statusEl.style.display = 'block'; } startCamera(); });
btnStartDemo.addEventListener('click', startDemo);
btnDemo.addEventListener('click', startDemo);
btnFlip.addEventListener('click', flipCamera);

buildUI();
loadModels();
})();
