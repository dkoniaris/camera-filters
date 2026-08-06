/* ============================================================
   ΕΦΕΦ ΠΡΟΣΩΠΟΥ — 56 AR lenses (Snapchat στυλ)
   Σχεδίαση με landmarks 68 σημείων (face-api.js)
   Ο ctx είναι ΗΔΗ μέσα σε mirror transform (βλ. app.js),
   άρα όλες οι συντεταγμένες είναι σε video-space.
   ============================================================ */
const EFFECTS = [];
function addEffect(id, name, emoji, draw) { EFFECTS.push({ id, name, emoji, draw }); }

/* ---------- Γεωμετρία προσώπου ---------- */
function G(lm) {
  const avg = (arr) => { let x = 0, y = 0; arr.forEach(i => { x += lm[i].x; y += lm[i].y; }); return { x: x / arr.length, y: y / arr.length }; };
  const eL = avg([36, 37, 38, 39, 40, 41]);
  const eR = avg([42, 43, 44, 45, 46, 47]);
  const browL = avg([17, 18, 19, 20, 21]);
  const browR = avg([22, 23, 24, 25, 26]);
  const d = Math.hypot(eR.x - eL.x, eR.y - eL.y) || 10;
  const ang = Math.atan2(eR.y - eL.y, eR.x - eL.x);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const browY = (browL.y + browR.y) / 2;
  const eyeY = (eL.y + eR.y) / 2;
  return {
    eL, eR, d, ang, browL, browR,
    nose: lm[30], noseB: lm[33],
    mouthC: mid(lm[48], lm[54]), mouthL: lm[48], mouthR: lm[54],
    chin: lm[8], fc: { x: (lm[0].x + lm[16].x) / 2, y: (lm[8].y + lm[27].y) / 2 },
    browY, eyeY, hatY: browY - 0.6 * d
  };
}

/* ---------- Βοηθητικά σχήματα ---------- */
function pointyEar(ctx, x, y, w, h, fill, inner, ang = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.quadraticCurveTo(-w * 0.45, -h * 0.6, 0, -h);
  ctx.quadraticCurveTo(w * 0.45, -h * 0.6, w / 2, 0);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (inner) {
    ctx.save(); ctx.translate(0, -h * 0.18); ctx.scale(0.55, 0.55);
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(-w * 0.45, -h * 0.6, 0, -h);
    ctx.quadraticCurveTo(w * 0.45, -h * 0.6, w / 2, 0);
    ctx.closePath(); ctx.fillStyle = inner; ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
function roundEar(ctx, x, y, r, fill, inner) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  if (inner) { ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.fillStyle = inner; ctx.fill(); }
}
function noseEll(ctx, g, w, h, color) {
  const x = g.nose.x, y = g.nose.y + g.d * 0.04;
  ctx.beginPath(); ctx.ellipse(x, y, w * g.d, h * g.d, 0, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - w * g.d * 0.28, y - h * g.d * 0.3, w * g.d * 0.26, h * g.d * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
}
function heart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y - s * 0.1, x - s * 0.7, y - s * 1.1, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.1, x + s * 1.3, y - s * 0.1, x, y + s * 0.9);
  ctx.closePath(); ctx.fill();
}
function star(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function flower(ctx, x, y, r, petal) {
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = petal; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, Math.PI * 2); ctx.fillStyle = '#ffd02d'; ctx.fill();
}
function mustacheShape(ctx, g, color) {
  ctx.fillStyle = color;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(g.nose.x + s * 0.08 * g.d, g.nose.y + 0.14 * g.d);
    ctx.quadraticCurveTo(g.nose.x + s * 0.4 * g.d, g.nose.y + 0.02 * g.d, g.nose.x + s * 0.62 * g.d, g.nose.y + 0.3 * g.d);
    ctx.quadraticCurveTo(g.nose.x + s * 0.35 * g.d, g.nose.y + 0.38 * g.d, g.nose.x + s * 0.12 * g.d, g.nose.y + 0.22 * g.d);
    ctx.closePath(); ctx.fill();
  }
}
let _tmpC = null, _tmpX = null;
function tmpCanvas(w, h) {
  if (!_tmpC) { _tmpC = document.createElement('canvas'); _tmpX = _tmpC.getContext('2d'); }
  _tmpC.width = w; _tmpC.height = h; _tmpX.setTransform(1, 0, 0, 1, 0, 0);
  return { c: _tmpC, x: _tmpX };
}
function rotCtx(ctx, x, y, a, fn) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); fn(); ctx.restore(); }

/* ============================================================
   ΖΩΑΚΙΑ
   ============================================================ */
addEffect('dog', 'Σκυλάκι', '🐶', (lm, ctx, t) => {
  const g = G(lm);
  for (const s of [-1, 1]) {
    const b = s < 0 ? g.browL : g.browR;
    const ex = b.x, ey = g.browY - 0.75 * g.d; // κορυφή κεφαλιού
    rotCtx(ctx, ex, ey, g.ang * s, () => {
      ctx.scale(s, 1); // καθρέφτης για τη δεξιά πλευρά
      ctx.fillStyle = '#8a5a2b';
      ctx.beginPath();
      ctx.moveTo(-0.05 * g.d, 0);
      ctx.quadraticCurveTo(-0.72 * g.d, 0.12 * g.d, -0.66 * g.d, 0.52 * g.d);
      ctx.quadraticCurveTo(-0.6 * g.d, 0.9 * g.d, -0.14 * g.d, 0.85 * g.d);
      ctx.quadraticCurveTo(0.16 * g.d, 0.8 * g.d, 0.1 * g.d, 0.25 * g.d);
      ctx.quadraticCurveTo(0.07 * g.d, 0.04 * g.d, -0.05 * g.d, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c98a4b';
      ctx.beginPath();
      ctx.moveTo(-0.02 * g.d, 0.16 * g.d);
      ctx.quadraticCurveTo(-0.45 * g.d, 0.26 * g.d, -0.42 * g.d, 0.55 * g.d);
      ctx.quadraticCurveTo(-0.4 * g.d, 0.76 * g.d, -0.1 * g.d, 0.72 * g.d);
      ctx.quadraticCurveTo(0.06 * g.d, 0.68 * g.d, 0.03 * g.d, 0.35 * g.d);
      ctx.closePath(); ctx.fill();
    });
  }
  noseEll(ctx, g, 0.4, 0.3, '#1a1a22');
  // γλώσσα
  ctx.fillStyle = '#ff6b9d';
  ctx.beginPath();
  ctx.moveTo(g.mouthC.x - 0.11 * g.d, g.mouthC.y + 0.08 * g.d);
  ctx.quadraticCurveTo(g.mouthC.x - 0.11 * g.d, g.mouthC.y + 0.42 * g.d, g.mouthC.x, g.mouthC.y + 0.4 * g.d + Math.sin(t * 6) * 0.02 * g.d);
  ctx.quadraticCurveTo(g.mouthC.x + 0.11 * g.d, g.mouthC.y + 0.42 * g.d, g.mouthC.x + 0.11 * g.d, g.mouthC.y + 0.08 * g.d);
  ctx.closePath(); ctx.fill();
});
addEffect('cat', 'Γατάκι', '🐱', (lm, ctx) => {
  const g = G(lm);
  pointyEar(ctx, g.browL.x - 0.1 * g.d, g.browL.y, 0.55 * g.d, 0.85 * g.d, '#4a4a55', '#ff9fc4', -0.18);
  pointyEar(ctx, g.browR.x + 0.1 * g.d, g.browR.y, 0.55 * g.d, 0.85 * g.d, '#4a4a55', '#ff9fc4', 0.18);
  // μουστάκια
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.025 * g.d;
  for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(g.nose.x + s * 0.35 * g.d, g.nose.y + 0.1 * g.d + i * 0.1 * g.d);
    ctx.lineTo(g.nose.x + s * (1.15 + Math.abs(i) * 0.1) * g.d, g.nose.y + 0.05 * g.d + i * 0.22 * g.d);
    ctx.stroke();
  }
  // μυτούλα
  ctx.fillStyle = '#ff8fb5';
  ctx.beginPath();
  ctx.moveTo(g.nose.x, g.nose.y - 0.06 * g.d);
  ctx.lineTo(g.nose.x - 0.16 * g.d, g.nose.y + 0.12 * g.d);
  ctx.lineTo(g.nose.x + 0.16 * g.d, g.nose.y + 0.12 * g.d);
  ctx.closePath(); ctx.fill();
});
addEffect('bunny', 'Κουνελάκι', '🐰', (lm, ctx) => {
  const g = G(lm);
  for (const s of [-1, 1]) {
    const b = s < 0 ? g.browL : g.browR;
    rotCtx(ctx, b.x, b.y, -0.12 * s, () => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, -g.d * 1.1, g.d * 0.26, g.d * 1.15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb3d9';
      ctx.beginPath();
      ctx.ellipse(0, -g.d * 1.0, g.d * 0.12, g.d * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    });
  }
  ctx.fillStyle = '#ff8fb5';
  ctx.beginPath();
  ctx.moveTo(g.nose.x, g.nose.y - 0.05 * g.d);
  ctx.lineTo(g.nose.x - 0.13 * g.d, g.nose.y + 0.09 * g.d);
  ctx.lineTo(g.nose.x + 0.13 * g.d, g.nose.y + 0.09 * g.d);
  ctx.closePath(); ctx.fill();
  // δόντια
  ctx.fillStyle = '#fff';
  ctx.fillRect(g.mouthC.x - 0.11 * g.d, g.mouthC.y + 0.02 * g.d, 0.1 * g.d, 0.18 * g.d);
  ctx.fillRect(g.mouthC.x + 0.01 * g.d, g.mouthC.y + 0.02 * g.d, 0.1 * g.d, 0.18 * g.d);
  ctx.strokeStyle = '#d9d9e0'; ctx.lineWidth = 0.015 * g.d;
  ctx.strokeRect(g.mouthC.x - 0.11 * g.d, g.mouthC.y + 0.02 * g.d, 0.1 * g.d, 0.18 * g.d);
  ctx.strokeRect(g.mouthC.x + 0.01 * g.d, g.mouthC.y + 0.02 * g.d, 0.1 * g.d, 0.18 * g.d);
});
addEffect('lion', 'Λιοντάρι', '🦁', (lm, ctx) => {
  const g = G(lm);
  const R = g.d * 1.55;
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2;
    ctx.fillStyle = i % 2 ? '#d99a3d' : '#c98930';
    ctx.beginPath();
    ctx.moveTo(g.fc.x + Math.cos(a - 0.09) * (R - 0.3 * g.d), g.fc.y + Math.sin(a - 0.09) * (R - 0.3 * g.d));
    ctx.lineTo(g.fc.x + Math.cos(a) * R, g.fc.y + Math.sin(a) * R);
    ctx.lineTo(g.fc.x + Math.cos(a + 0.09) * (R - 0.3 * g.d), g.fc.y + Math.sin(a + 0.09) * (R - 0.3 * g.d));
    ctx.closePath(); ctx.fill();
  }
  roundEar(ctx, g.browL.x - 0.25 * g.d, g.browL.y + 0.1 * g.d, 0.22 * g.d, '#d99a3d', '#f0c088');
  roundEar(ctx, g.browR.x + 0.25 * g.d, g.browR.y + 0.1 * g.d, 0.22 * g.d, '#d99a3d', '#f0c088');
  noseEll(ctx, g, 0.34, 0.26, '#7a4a21');
});
addEffect('tiger', 'Τίγρης', '🐯', (lm, ctx) => {
  const g = G(lm);
  roundEar(ctx, g.browL.x - 0.25 * g.d, g.browL.y + 0.05 * g.d, 0.24 * g.d, '#ff9c35', '#fff');
  roundEar(ctx, g.browR.x + 0.25 * g.d, g.browR.y + 0.05 * g.d, 0.24 * g.d, '#ff9c35', '#fff');
  // ρίγες μετώπου
  ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 0.11 * g.d; ctx.lineCap = 'round';
  for (const dx of [-0.32, 0, 0.32]) {
    ctx.beginPath();
    ctx.moveTo(g.fc.x + dx * g.d, g.browY - 0.35 * g.d);
    ctx.lineTo(g.fc.x + dx * g.d, g.browY - 0.75 * g.d);
    ctx.stroke();
  }
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(g.fc.x + s * 0.55 * g.d, g.browY + 0.1 * g.d);
    ctx.lineTo(g.fc.x + s * 0.85 * g.d, g.browY + 0.05 * g.d);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(g.fc.x + s * 0.5 * g.d, g.eyeY + 0.35 * g.d);
    ctx.lineTo(g.fc.x + s * 0.8 * g.d, g.eyeY + 0.45 * g.d);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  // ρύγχος
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.beginPath(); ctx.ellipse(g.nose.x, g.nose.y + 0.22 * g.d, 0.45 * g.d, 0.3 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  noseEll(ctx, g, 0.3, 0.22, '#ff8fb5');
});
addEffect('panda', 'Πάντα', '🐼', (lm, ctx) => {
  const g = G(lm);
  roundEar(ctx, g.browL.x - 0.3 * g.d, g.browL.y, 0.28 * g.d, '#1a1a22');
  roundEar(ctx, g.browR.x + 0.3 * g.d, g.browR.y, 0.28 * g.d, '#1a1a22');
  ctx.fillStyle = 'rgba(20,20,26,.92)';
  ctx.beginPath(); ctx.ellipse(g.eL.x, g.eL.y, 0.36 * g.d, 0.28 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(g.eR.x, g.eR.y, 0.36 * g.d, 0.28 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath(); ctx.arc(g.eL.x + 0.02 * g.d, g.eL.y - 0.02 * g.d, 0.11 * g.d, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(g.eR.x + 0.02 * g.d, g.eR.y - 0.02 * g.d, 0.11 * g.d, 0, Math.PI * 2); ctx.fill();
  noseEll(ctx, g, 0.3, 0.24, '#1a1a22');
});
addEffect('bear', 'Αρκούδα', '🐻', (lm, ctx) => {
  const g = G(lm);
  roundEar(ctx, g.browL.x - 0.25 * g.d, g.browL.y, 0.26 * g.d, '#8a5a2b', '#d9a86c');
  roundEar(ctx, g.browR.x + 0.25 * g.d, g.browR.y, 0.26 * g.d, '#8a5a2b', '#d9a86c');
  noseEll(ctx, g, 0.3, 0.24, '#4a2e14');
});
addEffect('fox', 'Αλεπού', '🦊', (lm, ctx) => {
  const g = G(lm);
  for (const s of [-1, 1]) {
    const b = s < 0 ? g.browL : g.browR;
    rotCtx(ctx, b.x, b.y, -0.15 * s, () => {
      ctx.fillStyle = '#ff8c42';
      ctx.beginPath();
      ctx.moveTo(-0.28 * g.d, 0);
      ctx.quadraticCurveTo(-0.3 * g.d, -0.7 * g.d, 0, -1.0 * g.d);
      ctx.quadraticCurveTo(0.3 * g.d, -0.7 * g.d, 0.28 * g.d, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a2a32';
      ctx.beginPath();
      ctx.moveTo(-0.2 * g.d, -0.45 * g.d);
      ctx.quadraticCurveTo(-0.22 * g.d, -0.8 * g.d, 0, -1.0 * g.d);
      ctx.quadraticCurveTo(0.22 * g.d, -0.8 * g.d, 0.2 * g.d, -0.45 * g.d);
      ctx.closePath(); ctx.fill();
    });
  }
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.beginPath(); ctx.ellipse(g.nose.x, g.nose.y + 0.2 * g.d, 0.4 * g.d, 0.3 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  noseEll(ctx, g, 0.24, 0.18, '#2a2a32');
});
addEffect('deer', 'Ελάφι', '🦌', (lm, ctx) => {
  const g = G(lm);
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 0.1 * g.d; ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    const b = s < 0 ? g.browL : g.browR;
    ctx.beginPath();
    ctx.moveTo(b.x + s * 0.15 * g.d, g.browY - 0.1 * g.d);
    ctx.bezierCurveTo(
      b.x + s * 0.5 * g.d, g.browY - 0.6 * g.d,
      b.x + s * 0.55 * g.d, g.browY - 1.3 * g.d,
      b.x + s * 0.9 * g.d, g.browY - 1.65 * g.d);
    ctx.stroke();
    // κλαδιά
    for (const [fx, fy, tx, ty] of [
      [0.35, -0.75, 0.75, -1.05], [0.45, -1.1, 0.9, -1.3], [0.6, -1.45, 1.05, -1.5]
    ]) {
      ctx.beginPath();
      ctx.moveTo(b.x + s * fx * g.d, g.browY + fy * g.d);
      ctx.lineTo(b.x + s * tx * g.d, g.browY + ty * g.d);
      ctx.stroke();
    }
  }
  ctx.lineCap = 'butt';
  noseEll(ctx, g, 0.28, 0.22, '#1a1a22');
});
addEffect('unicorn', 'Μονόκερος', '🦄', (lm, ctx, t) => {
  const g = G(lm);
  const hx = g.fc.x, hy = g.hatY + 0.35 * g.d;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(hx - 0.17 * g.d, hy);
  ctx.quadraticCurveTo(hx - 0.05 * g.d, hy - 0.9 * g.d, hx, hy - 1.25 * g.d);
  ctx.quadraticCurveTo(hx + 0.05 * g.d, hy - 0.9 * g.d, hx + 0.17 * g.d, hy);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e8c8ff'; ctx.lineWidth = 0.035 * g.d;
  for (let i = 0; i < 4; i++) {
    const yy = hy - (0.25 + i * 0.28) * g.d;
    ctx.beginPath();
    ctx.moveTo(hx - 0.13 * g.d, yy);
    ctx.quadraticCurveTo(hx, yy + 0.14 * g.d, hx + 0.13 * g.d, yy);
    ctx.stroke();
  }
  // χαίτη ουράνιο τόξο
  const cols = ['#ff4d4d', '#ff9f1c', '#ffd02d', '#7bdff2', '#4d79ff', '#b388ff'];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = cols[i];
    ctx.beginPath();
    ctx.arc(hx + (0.35 + i * 0.13) * g.d, hy + (0.1 + i * 0.14) * g.d, 0.16 * g.d, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd02d';
  star(ctx, hx, hy - 1.5 * g.d - Math.sin(t * 3) * 0.05 * g.d, 0.16 * g.d, t * 0.6);
});
addEffect('dragon', 'Δράκος', '🐲', (lm, ctx) => {
  const g = G(lm);
  ctx.strokeStyle = '#e03131'; ctx.lineWidth = 0.2 * g.d; ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    const b = s < 0 ? g.browL : g.browR;
    ctx.beginPath();
    ctx.moveTo(b.x + s * 0.1 * g.d, b.y + 0.05 * g.d);
    ctx.bezierCurveTo(
      b.x + s * 0.75 * g.d, b.y - 0.5 * g.d,
      b.x + s * 0.3 * g.d, b.y - 1.2 * g.d,
      b.x + s * 0.55 * g.d, b.y - 1.5 * g.d);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#ffd02d';
  ctx.beginPath(); ctx.ellipse(g.nose.x, g.nose.y + 0.1 * g.d, 0.16 * g.d, 0.2 * g.d, 0, 0, Math.PI * 2); ctx.fill();
});
addEffect('duck', 'Παπάκι', '🐤', (lm, ctx) => {
  const g = G(lm);
  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath(); ctx.ellipse(g.nose.x, g.nose.y - 0.1 * g.d, 0.42 * g.d, 0.18 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8890c';
  ctx.beginPath(); ctx.ellipse(g.nose.x, g.nose.y + 0.1 * g.d, 0.3 * g.d, 0.11 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 0.02 * g.d;
  ctx.beginPath(); ctx.moveTo(g.nose.x - 0.42 * g.d, g.nose.y - 0.1 * g.d); ctx.lineTo(g.nose.x + 0.42 * g.d, g.nose.y - 0.1 * g.d); ctx.stroke();
});
addEffect('owl', 'Κουκουβάγια', '🦉', (lm, ctx) => {
  const g = G(lm);
  for (const e of [g.eL, g.eR]) {
    ctx.fillStyle = '#ffd02d';
    ctx.beginPath(); ctx.arc(e.x, e.y, 0.3 * g.d, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath(); ctx.arc(e.x, e.y, 0.15 * g.d, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(e.x - 0.05 * g.d, e.y - 0.05 * g.d, 0.05 * g.d, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#8a5a2b';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(g.eL.x + (s < 0 ? -0.35 : 0.9) * g.d, g.eL.y - 0.3 * g.d);
    ctx.lineTo(g.eL.x + (s < 0 ? -0.15 : 0.7) * g.d, g.eL.y - 0.75 * g.d);
    ctx.lineTo(g.eL.x + (s < 0 ? -0.55 : 0.5) * g.d, g.eL.y - 0.55 * g.d);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath();
  ctx.moveTo(g.nose.x, g.nose.y - 0.18 * g.d);
  ctx.lineTo(g.nose.x - 0.14 * g.d, g.nose.y + 0.14 * g.d);
  ctx.lineTo(g.nose.x + 0.14 * g.d, g.nose.y + 0.14 * g.d);
  ctx.closePath(); ctx.fill();
});
addEffect('frog', 'Βάτραχος', '🐸', (lm, ctx) => {
  const g = G(lm);
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#4caf50';
    ctx.beginPath(); ctx.arc(g.fc.x + s * 0.42 * g.d, g.hatY + 0.1 * g.d, 0.28 * g.d, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath(); ctx.arc(g.fc.x + s * 0.42 * g.d, g.hatY + 0.1 * g.d, 0.13 * g.d, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(g.fc.x + s * 0.42 * g.d - 0.04 * g.d, g.hatY + 0.06 * g.d, 0.04 * g.d, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#2f6b1f'; ctx.lineWidth = 0.09 * g.d; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(g.fc.x, g.mouthC.y + 0.55 * g.d, 1.05 * g.d, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke();
  ctx.lineCap = 'butt';
});

/* ============================================================
   ΚΟΡΩΝΕΣ & ΚΑΠΕΛΑ
   ============================================================ */
addEffect('flowers', 'Στεφάνι', '🌸', (lm, ctx) => {
  const g = G(lm);
  const p0 = g.browL, p1 = g.browR, c = { x: g.fc.x, y: g.browY - 1.15 * g.d };
  const cols = ['#ff6b9d', '#fff', '#c9a7ff', '#ffd02d', '#ff8c42', '#7bdff2'];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const px = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x;
    const py = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y;
    flower(ctx, px, py, 0.3 * g.d, cols[i % cols.length]);
  }
});
addEffect('crown', 'Κορώνα', '👑', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY + 0.15 * g.d;
  ctx.fillStyle = '#ffd02d';
  ctx.beginPath();
  ctx.moveTo(x0 - 0.85 * g.d, y0 + 0.1 * g.d);
  ctx.lineTo(x0 - 0.42 * g.d, y0 + 0.1 * g.d);
  ctx.lineTo(x0 - 0.42 * g.d, y0 - 0.42 * g.d);
  ctx.lineTo(x0, y0 + 0.1 * g.d);
  ctx.lineTo(x0 + 0.42 * g.d, y0 - 0.42 * g.d);
  ctx.lineTo(x0 + 0.42 * g.d, y0 + 0.1 * g.d);
  ctx.lineTo(x0 + 0.85 * g.d, y0 + 0.1 * g.d);
  ctx.lineTo(x0 + 0.85 * g.d, y0 + 0.3 * g.d);
  ctx.lineTo(x0 - 0.85 * g.d, y0 + 0.3 * g.d);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 0.03 * g.d; ctx.stroke();
  for (const [jx, jy, jc, jr] of [[-0.42, -0.42, '#ff4d6d', 0.1], [0.42, -0.42, '#4d79ff', 0.1], [0, 0.2, '#ff4d6d', 0.13]]) {
    ctx.fillStyle = jc;
    ctx.beginPath(); ctx.arc(x0 + jx * g.d, y0 + jy * g.d, jr * g.d, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.arc(x0 + jx * g.d - jr * 0.35 * g.d, y0 + jy * g.d - jr * 0.35 * g.d, jr * 0.3 * g.d, 0, Math.PI * 2); ctx.fill();
  }
});
addEffect('devil', 'Διαβολάκι', '😈', (lm, ctx) => {
  const g = G(lm);
  ctx.fillStyle = '#e03131';
  for (const s of [-1, 1]) {
    const b = s < 0 ? g.browL : g.browR;
    ctx.beginPath();
    ctx.moveTo(b.x + s * 0.15 * g.d, b.y - 0.05 * g.d);
    ctx.quadraticCurveTo(b.x + s * 0.55 * g.d, b.y - 0.4 * g.d, b.x + s * 0.4 * g.d, b.y - 0.95 * g.d);
    ctx.quadraticCurveTo(b.x + s * 0.2 * g.d, b.y - 0.65 * g.d, b.x - s * 0.05 * g.d, b.y - 0.15 * g.d);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath();
  ctx.moveTo(g.chin.x, g.chin.y - 0.1 * g.d);
  ctx.lineTo(g.chin.x - 0.12 * g.d, g.chin.y + 0.25 * g.d);
  ctx.lineTo(g.chin.x + 0.12 * g.d, g.chin.y + 0.25 * g.d);
  ctx.closePath(); ctx.fill();
});
addEffect('halo', 'Φωτοστέφανο', '😇', (lm, ctx, t) => {
  const g = G(lm);
  ctx.save();
  ctx.translate(g.fc.x, g.hatY - 0.55 * g.d);
  ctx.rotate(-0.15 + Math.sin(t * 0.8) * 0.03);
  ctx.strokeStyle = 'rgba(255,208,45,.35)'; ctx.lineWidth = 0.28 * g.d;
  ctx.beginPath(); ctx.ellipse(0, 0, 0.8 * g.d, 0.16 * g.d, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#ffd02d'; ctx.lineWidth = 0.1 * g.d;
  ctx.shadowColor = '#ffd02d'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.ellipse(0, 0, 0.8 * g.d, 0.16 * g.d, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
});
addEffect('angel', 'Αγγελάκι', '👼', (lm, ctx) => {
  const g = G(lm);
  for (const s of [-1, 1]) {
    const wx = g.fc.x + s * 1.15 * g.d, wy = g.eyeY + 0.15 * g.d;
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(s * 0.6);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e0e0f0'; ctx.lineWidth = 0.02 * g.d;
    for (const [rx, ry, ox, oy] of [[0.55, 0.3, 0, 0], [0.45, 0.24, 0.2, 0.22], [0.34, 0.18, 0.38, 0.4]]) {
      ctx.beginPath(); ctx.ellipse(ox * g.d, oy * g.d, rx * g.d, ry * g.d, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.save();
  ctx.translate(g.fc.x, g.hatY - 0.55 * g.d); ctx.rotate(-0.15);
  ctx.strokeStyle = '#ffd02d'; ctx.lineWidth = 0.09 * g.d;
  ctx.beginPath(); ctx.ellipse(0, 0, 0.8 * g.d, 0.15 * g.d, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
});
addEffect('fairy', 'Νεράιδα', '🧚', (lm, ctx, t) => {
  const g = G(lm);
  for (const s of [-1, 1]) {
    const wx = g.fc.x + s * 1.15 * g.d, wy = g.eyeY + 0.15 * g.d;
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(s * 0.6 + Math.sin(t * 4) * 0.1);
    ctx.fillStyle = 'rgba(180,140,255,.75)'; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 0.02 * g.d;
    for (const [rx, ry, ox, oy] of [[0.55, 0.3, 0, 0], [0.45, 0.24, 0.2, 0.22], [0.34, 0.18, 0.38, 0.4]]) {
      ctx.beginPath(); ctx.ellipse(ox * g.d, oy * g.d, rx * g.d, ry * g.d, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  for (let i = 0; i < 3; i++) {
    const a = t * 0.8 + i * 2.1;
    const sx = g.fc.x + Math.cos(a) * 1.5 * g.d, sy = g.hatY - Math.sin(a) * 0.8 * g.d;
    ctx.fillStyle = `hsla(${(i * 90 + 280) % 360}, 90%, 75%, ${0.6 + 0.4 * Math.sin(t * 5 + i)})`;
    star(ctx, sx, sy, 0.13 * g.d, t * 1.2 + i);
  }
});
addEffect('santa', 'Άη Βασίλης', '🎅', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY;
  ctx.fillStyle = '#e03131';
  ctx.beginPath();
  ctx.moveTo(x0 - 0.85 * g.d, y0);
  ctx.quadraticCurveTo(x0 + 0.35 * g.d, y0 - 1.45 * g.d, x0 + 0.95 * g.d, y0 - 0.75 * g.d);
  ctx.quadraticCurveTo(x0 + 0.55 * g.d, y0 - 0.35 * g.d, x0 + 0.85 * g.d, y0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x0 + 0.95 * g.d, y0 - 0.75 * g.d, 0.21 * g.d, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x0 - 0.85 * g.d, y0, 1.7 * g.d, 0.18 * g.d, 0.09 * g.d); ctx.fill();
});
addEffect('witch', 'Μάγισσα', '🧙‍♀️', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY + 0.05 * g.d;
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath(); ctx.ellipse(x0, y0 + 0.08 * g.d, 1.15 * g.d, 0.18 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x0 - 0.55 * g.d, y0 + 0.02 * g.d);
  ctx.quadraticCurveTo(x0 - 0.1 * g.d, y0 - 1.4 * g.d, x0 - 0.05 * g.d, y0 - 1.85 * g.d);
  ctx.quadraticCurveTo(x0 + 0.3 * g.d, y0 - 1.15 * g.d, x0 + 0.55 * g.d, y0 + 0.02 * g.d);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff9f1c';
  ctx.fillRect(x0 - 0.4 * g.d, y0 - 0.28 * g.d, 0.8 * g.d, 0.16 * g.d);
  ctx.fillStyle = '#ffd02d';
  ctx.fillRect(x0 - 0.06 * g.d, y0 - 0.38 * g.d, 0.12 * g.d, 0.34 * g.d);
});
addEffect('wizard', 'Μάγος', '🧙', (lm, ctx, t) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY + 0.05 * g.d;
  ctx.fillStyle = '#3b5bdb';
  ctx.beginPath();
  ctx.moveTo(x0 - 0.6 * g.d, y0 + 0.05 * g.d);
  ctx.quadraticCurveTo(x0 - 0.1 * g.d, y0 - 1.5 * g.d, x0, y0 - 1.95 * g.d);
  ctx.quadraticCurveTo(x0 + 0.3 * g.d, y0 - 1.2 * g.d, x0 + 0.6 * g.d, y0 + 0.05 * g.d);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4d79ff';
  ctx.beginPath(); ctx.ellipse(x0, y0 + 0.08 * g.d, 0.75 * g.d, 0.14 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd02d';
  star(ctx, x0 - 0.25 * g.d, y0 - 0.6 * g.d, 0.13 * g.d, t * 0.5);
  star(ctx, x0 + 0.2 * g.d, y0 - 1.1 * g.d, 0.1 * g.d, -t * 0.4);
  // γένια
  ctx.fillStyle = '#f5f5f7';
  for (const [dx, dy, r] of [[0, 0.28, 0.32], [-0.3, 0.12, 0.26], [0.3, 0.12, 0.26], [-0.45, -0.05, 0.22], [0.45, -0.05, 0.22]]) {
    ctx.beginPath(); ctx.arc(g.chin.x + dx * g.d, g.chin.y + dy * g.d, r * g.d, 0, Math.PI * 2); ctx.fill();
  }
});
addEffect('party', 'Πάρτι', '🎉', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY;
  const { c, x } = tmpCanvas(400, 400);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = '#ff9fc4';
  x.beginPath();
  x.moveTo(x0 - 0.5 * g.d, y0);
  x.lineTo(x0, y0 - 1.3 * g.d);
  x.lineTo(x0 + 0.5 * g.d, y0);
  x.closePath(); x.fill();
  x.save(); x.clip();
  const cols = ['#ffd02d', '#7bdff2', '#b388ff', '#7bff9f', '#ff6b9d'];
  for (let i = 0; i < 5; i++) {
    x.fillStyle = cols[i];
    x.beginPath();
    x.moveTo(x0 - 0.6 * g.d, y0 - 0.26 * g.d * i);
    x.lineTo(x0 + 0.6 * g.d, y0 - 0.26 * g.d * i - 0.13 * g.d);
    x.lineTo(x0 + 0.6 * g.d, y0 - 0.26 * g.d * i);
    x.lineTo(x0 - 0.6 * g.d, y0 - 0.26 * g.d * i + 0.13 * g.d);
    x.closePath(); x.fill();
  }
  x.restore();
  ctx.drawImage(c, 0, 0, 400, 400, 0, 0, 400, 400);
  ctx.fillStyle = '#ffd02d';
  ctx.beginPath(); ctx.arc(x0, y0 - 1.3 * g.d, 0.14 * g.d, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.roundRect(x0 - 0.5 * g.d, y0, 1.0 * g.d, 0.14 * g.d, 0.07 * g.d); ctx.fill();
});
addEffect('sombrero', 'Σομπρέρο', '🎩', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY;
  ctx.fillStyle = '#e8c45a';
  ctx.beginPath(); ctx.ellipse(x0, y0 + 0.1 * g.d, 1.5 * g.d, 0.22 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f0d078';
  ctx.beginPath(); ctx.ellipse(x0, y0 + 0.02 * g.d, 0.78 * g.d, 0.5 * g.d, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#e03131';
  ctx.fillRect(x0 - 0.78 * g.d, y0 - 0.05 * g.d, 1.56 * g.d, 0.09 * g.d);
  ctx.fillStyle = '#3fae5a';
  ctx.fillRect(x0 - 0.78 * g.d, y0 + 0.04 * g.d, 1.56 * g.d, 0.07 * g.d);
});
addEffect('pirate', 'Πειρατής', '🏴‍☠️', (lm, ctx) => {
  const g = G(lm);
  ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 0.06 * g.d;
  ctx.beginPath();
  ctx.moveTo(g.eL.x - 1.0 * g.d, g.browY - 0.4 * g.d);
  ctx.lineTo(g.eR.x + 1.0 * g.d, g.browY - 0.4 * g.d);
  ctx.stroke();
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath(); ctx.arc(g.eR.x, g.eR.y, 0.23 * g.d, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.03 * g.d;
  ctx.beginPath(); ctx.arc(g.eR.x, g.eR.y, 0.1 * g.d, 0, Math.PI * 2); ctx.stroke();
  // μαντήλι
  ctx.fillStyle = '#e03131';
  ctx.save(); ctx.translate(g.fc.x, g.browY - 0.55 * g.d); ctx.rotate(0.06);
  ctx.fillRect(-1.05 * g.d, -0.1 * g.d, 2.1 * g.d, 0.22 * g.d);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(g.fc.x + 0.95 * g.d, g.browY - 0.58 * g.d);
  ctx.lineTo(g.fc.x + 1.35 * g.d, g.browY - 0.4 * g.d);
  ctx.lineTo(g.fc.x + 1.25 * g.d, g.browY - 0.68 * g.d);
  ctx.closePath(); ctx.fill();
});
addEffect('ninja', 'Νίντζα', '🥷', (lm, ctx) => {
  const g = G(lm);
  const { c, x } = tmpCanvas(600, 600);
  x.fillStyle = '#1f2430';
  x.beginPath();
  x.moveTo(g.eL.x - 0.75 * g.d, g.eyeY + 0.35 * g.d);
  x.quadraticCurveTo(g.eL.x - 0.2 * g.d, g.chin.y + 0.2 * g.d, g.fc.x, g.chin.y + 0.15 * g.d);
  x.quadraticCurveTo(g.eR.x + 0.2 * g.d, g.chin.y + 0.2 * g.d, g.eR.x + 0.75 * g.d, g.eyeY + 0.35 * g.d);
  x.closePath(); x.fill();
  x.globalCompositeOperation = 'destination-out';
  x.beginPath(); x.ellipse(g.eL.x, g.eL.y, 0.24 * g.d, 0.17 * g.d, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.ellipse(g.eR.x, g.eR.y, 0.24 * g.d, 0.17 * g.d, 0, 0, Math.PI * 2); x.fill();
  ctx.drawImage(c, 0, 0, 600, 600, 0, 0, 600, 600);
  ctx.fillStyle = '#e03131';
  ctx.save(); ctx.translate(g.fc.x, g.browY - 0.5 * g.d); ctx.rotate(0.04);
  ctx.fillRect(-1.0 * g.d, -0.09 * g.d, 2.0 * g.d, 0.18 * g.d);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(g.fc.x + 0.95 * g.d, g.browY - 0.52 * g.d);
  ctx.lineTo(g.fc.x + 1.4 * g.d, g.browY - 0.35 * g.d);
  ctx.lineTo(g.fc.x + 1.3 * g.d, g.browY - 0.65 * g.d);
  ctx.closePath(); ctx.fill();
});
addEffect('superhero', 'Σούπερ ήρωας', '🦸', (lm, ctx) => {
  const g = G(lm);
  const { c, x } = tmpCanvas(600, 600);
  x.fillStyle = '#233044';
  x.beginPath();
  x.moveTo(g.eL.x - 0.9 * g.d, g.eyeY - 0.32 * g.d);
  x.quadraticCurveTo(g.fc.x, g.eyeY + 0.45 * g.d, g.eR.x + 0.9 * g.d, g.eyeY - 0.32 * g.d);
  x.lineTo(g.eR.x + 0.9 * g.d, g.browY - 0.45 * g.d);
  x.lineTo(g.eL.x - 0.9 * g.d, g.browY - 0.45 * g.d);
  x.closePath(); x.fill();
  x.globalCompositeOperation = 'destination-out';
  x.beginPath(); x.ellipse(g.eL.x, g.eL.y, 0.24 * g.d, 0.16 * g.d, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.ellipse(g.eR.x, g.eR.y, 0.24 * g.d, 0.16 * g.d, 0, 0, Math.PI * 2); x.fill();
  ctx.drawImage(c, 0, 0, 600, 600, 0, 0, 600, 600);
});
addEffect('glasses', 'Γυαλιά', '🤓', (lm, ctx) => {
  const g = G(lm);
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  ctx.strokeStyle = '#26262e'; ctx.lineWidth = 0.08 * g.d;
  for (const e of [g.eL, g.eR]) {
    ctx.beginPath(); ctx.arc(e.x, e.y, 0.42 * g.d, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(g.fc.x, g.eyeY, 0.28 * g.d, 0, Math.PI); ctx.stroke();
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(g.eL.x + (s < 0 ? -0.42 : 1.35) * g.d, g.eyeY);
    ctx.lineTo(g.eL.x + (s < 0 ? -0.9 : 1.8) * g.d, g.eyeY + 0.25 * g.d);
    ctx.stroke();
  }
});
addEffect('shades', 'Γυαλιά ηλίου', '😎', (lm, ctx) => {
  const g = G(lm);
  const { c, x } = tmpCanvas(600, 600);
  x.fillStyle = '#14141c';
  x.beginPath(); x.roundRect(g.eL.x - 0.5 * g.d, g.eyeY - 0.24 * g.d, 0.95 * g.d, 0.48 * g.d, 0.2 * g.d); x.fill();
  x.beginPath(); x.roundRect(g.eR.x - 0.45 * g.d, g.eyeY - 0.24 * g.d, 0.95 * g.d, 0.48 * g.d, 0.2 * g.d); x.fill();
  x.beginPath(); x.roundRect(g.fc.x - 0.28 * g.d, g.eyeY - 0.08 * g.d, 0.56 * g.d, 0.16 * g.d, 0.08 * g.d); x.fill();
  x.strokeStyle = '#14141c'; x.lineWidth = 0.07 * g.d;
  x.beginPath(); x.moveTo(g.eL.x - 0.5 * g.d, g.eyeY - 0.1 * g.d); x.lineTo(g.eL.x - 0.95 * g.d, g.eyeY + 0.2 * g.d); x.stroke();
  x.beginPath(); x.moveTo(g.eR.x + 0.5 * g.d, g.eyeY - 0.1 * g.d); x.lineTo(g.eR.x + 0.95 * g.d, g.eyeY + 0.2 * g.d); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = 0.06 * g.d; x.lineCap = 'round';
  x.beginPath(); x.moveTo(g.eL.x - 0.35 * g.d, g.eyeY - 0.14 * g.d); x.lineTo(g.eL.x - 0.1 * g.d, g.eyeY + 0.14 * g.d); x.stroke();
  x.beginPath(); x.moveTo(g.eR.x - 0.35 * g.d, g.eyeY - 0.14 * g.d); x.lineTo(g.eR.x - 0.1 * g.d, g.eyeY + 0.14 * g.d); x.stroke();
  ctx.drawImage(c, 0, 0, 600, 600, 0, 0, 600, 600);
});
addEffect('mustache', 'Μουστάκι', '🧔', (lm, ctx) => mustacheShape(ctx, G(lm), '#5a3a1e'));
addEffect('milk', 'Γάλα μουστάκι', '🥛', (lm, ctx) => mustacheShape(ctx, G(lm), 'rgba(255,255,255,.95)'));
addEffect('beard', 'Γένια', '🧔‍♂️', (lm, ctx) => {
  const g = G(lm);
  ctx.fillStyle = '#f5f5f7';
  for (const [dx, dy, r] of [[0, 0.3, 0.36], [-0.35, 0.15, 0.28], [0.35, 0.15, 0.28], [-0.5, -0.02, 0.24], [0.5, -0.02, 0.24], [-0.55, -0.2, 0.2], [0.55, -0.2, 0.2]]) {
    ctx.beginPath(); ctx.arc(g.chin.x + dx * g.d, g.chin.y + dy * g.d, r * g.d, 0, Math.PI * 2); ctx.fill();
  }
  mustacheShape(ctx, g, '#f5f5f7');
});
addEffect('blush', 'Ροζ μάγουλα', '😊', (lm, ctx) => {
  const g = G(lm);
  for (const s of [-1, 1]) {
    const cx = g.fc.x + s * 0.85 * g.d, cy = g.eyeY + 0.6 * g.d;
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 0.5 * g.d);
    gr.addColorStop(0, 'rgba(255,105,150,.55)'); gr.addColorStop(1, 'rgba(255,105,150,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(cx, cy, 0.5 * g.d, 0, Math.PI * 2); ctx.fill();
  }
});
addEffect('heartEyes', 'Καρδιές', '😍', (lm, ctx, t) => {
  const g = G(lm);
  const p = 1 + Math.sin(t * 4) * 0.06;
  for (const e of [g.eL, g.eR]) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(p, p);
    ctx.fillStyle = '#ff2d78';
    ctx.shadowColor = '#ff2d78'; ctx.shadowBlur = 8;
    heart(ctx, 0, 0, 0.34 * g.d);
    ctx.restore();
  }
});
addEffect('stars', 'Αστεράκια', '✨', (lm, ctx, t) => {
  const g = G(lm);
  const pos = [
    [-1.2, -0.35, 0.24], [1.15, -0.5, 0.2], [0.45, -1.05, 0.26], [-0.5, -0.95, 0.18], [1.2, -0.1, 0.16]
  ];
  for (let i = 0; i < pos.length; i++) {
    const [dx, dy, r] = pos[i];
    ctx.fillStyle = `rgba(255,208,45,${0.55 + 0.45 * Math.sin(t * 3 + i * 1.7)})`;
    ctx.shadowColor = '#ffd02d'; ctx.shadowBlur = 6;
    star(ctx, g.fc.x + dx * g.d, g.hatY + dy * g.d + Math.sin(t * 2 + i) * 0.05 * g.d, r * g.d, t * 0.7 + i);
  }
  ctx.shadowBlur = 0;
});
addEffect('rainbow', 'Ουράνιο τόξο', '🌈', (lm, ctx, t) => {
  const g = G(lm);
  const cols = ['#ff4d4d', '#ff9f1c', '#ffd02d', '#7bdff2', '#4d79ff', '#b388ff'];
  const bob = Math.sin(t * 1.6) * 0.05 * g.d;
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = cols[i]; ctx.lineWidth = 0.1 * g.d; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(g.fc.x, g.hatY + 0.55 * g.d + bob, (0.8 + i * 0.12) * g.d, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
});
addEffect('fire', 'Φωτιά', '🔥', (lm, ctx, t) => {
  const g = G(lm);
  for (const dx of [-0.35, 0, 0.35]) {
    const x = g.fc.x + dx * g.d, y = g.hatY;
    const h = (0.75 + Math.sin(t * 9 + dx * 20) * 0.15) * g.d;
    const w = 0.28 * g.d;
    ctx.fillStyle = 'rgba(255,107,28,.95)';
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.bezierCurveTo(x - w * 1.3, y - h * 0.35, x - w * 0.5, y - h * 0.85, x, y - h);
    ctx.bezierCurveTo(x + w * 0.5, y - h * 0.85, x + w * 1.3, y - h * 0.35, x + w, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,208,45,.95)';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, y);
    ctx.bezierCurveTo(x - w * 0.7, y - h * 0.3, x - w * 0.25, y - h * 0.6, x, y - h * 0.75);
    ctx.bezierCurveTo(x + w * 0.25, y - h * 0.6, x + w * 0.7, y - h * 0.3, x + w * 0.5, y);
    ctx.closePath(); ctx.fill();
  }
});
addEffect('tears', 'Δάκρυα', '😢', (lm, ctx, t) => {
  const g = G(lm);
  const drip = ((t * 0.5) % 1) * 0.5 * g.d;
  for (const e of [g.eL, g.eR]) {
    const x = e.x, y = e.y + 0.6 * g.d + drip;
    ctx.fillStyle = 'rgba(120,180,255,.85)';
    ctx.beginPath();
    ctx.moveTo(x, y - 0.3 * g.d);
    ctx.quadraticCurveTo(x - 0.18 * g.d, y + 0.02 * g.d, x, y + 0.16 * g.d);
    ctx.quadraticCurveTo(x + 0.18 * g.d, y + 0.02 * g.d, x, y - 0.3 * g.d);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.arc(x - 0.05 * g.d, y - 0.08 * g.d, 0.035 * g.d, 0, Math.PI * 2); ctx.fill();
  }
});
addEffect('bigLips', 'Χείλια', '💋', (lm, ctx) => {
  const g = G(lm);
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  for (let i = 48; i <= 59; i++) {
    const p = lm[i];
    const px = g.mouthC.x + (p.x - g.mouthC.x) * 1.7;
    const py = g.mouthC.y + (p.y - g.mouthC.y) * 1.55;
    if (i === 48) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  ctx.beginPath(); ctx.ellipse(g.mouthC.x, g.mouthC.y + 0.22 * g.d, 0.42 * g.d, 0.12 * g.d, 0, 0, Math.PI); ctx.fill();
});
addEffect('animeEyes', 'Anime μάτια', '👀', (lm, ctx, t) => {
  const g = G(lm);
  const hue = (t * 40) % 360;
  for (const e of [g.eL, g.eR]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(e.x, e.y, 0.34 * g.d, 0.27 * g.d, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 0.025 * g.d; ctx.stroke();
    ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
    ctx.beginPath(); ctx.arc(e.x, e.y, 0.21 * g.d, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(e.x, e.y, 0.1 * g.d, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(e.x - 0.07 * g.d, e.y - 0.08 * g.d, 0.06 * g.d, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.x + 0.07 * g.d, e.y + 0.07 * g.d, 0.03 * g.d, 0, Math.PI * 2); ctx.fill();
  }
});
addEffect('bigBrows', 'Φρύδια', '😠', (lm, ctx) => {
  const g = G(lm);
  ctx.fillStyle = '#1a1a22';
  rotCtx(ctx, g.eL.x, g.browY, 0.12, () => {
    ctx.beginPath(); ctx.roundRect(-0.48 * g.d, -0.13 * g.d, 0.95 * g.d, 0.22 * g.d, 0.11 * g.d); ctx.fill();
  });
  rotCtx(ctx, g.eR.x, g.browY, -0.12, () => {
    ctx.beginPath(); ctx.roundRect(-0.48 * g.d, -0.13 * g.d, 0.95 * g.d, 0.22 * g.d, 0.11 * g.d); ctx.fill();
  });
});
addEffect('donut', 'Ντόνατ', '🍩', (lm, ctx) => {
  const g = G(lm);
  const { c, x } = tmpCanvas(400, 400);
  const cx = g.fc.x, cy = g.hatY - 0.3 * g.d;
  x.fillStyle = '#ff9fc4';
  x.beginPath(); x.arc(cx, cy, 0.52 * g.d, 0, Math.PI * 2); x.fill();
  x.globalCompositeOperation = 'destination-out';
  x.beginPath(); x.arc(cx, cy, 0.22 * g.d, 0, Math.PI * 2); x.fill();
  x.globalCompositeOperation = 'source-over';
  const cols = ['#ff6b9d', '#7bdff2', '#ffd02d', '#b388ff', '#7bff9f', '#fff'];
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    x.strokeStyle = cols[i % cols.length]; x.lineWidth = 0.06 * g.d; x.lineCap = 'round';
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * 0.38 * g.d, cy + Math.sin(a) * 0.38 * g.d);
    x.lineTo(cx + Math.cos(a + 0.5) * 0.45 * g.d, cy + Math.sin(a + 0.5) * 0.45 * g.d);
    x.stroke();
  }
  ctx.drawImage(c, 0, 0, 400, 400, 0, 0, 400, 400);
});
addEffect('icecream', 'Παγωτό', '🍦', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY - 0.1 * g.d;
  ctx.fillStyle = '#d9a86c';
  ctx.beginPath();
  ctx.moveTo(x0 - 0.26 * g.d, y0 + 0.35 * g.d);
  ctx.lineTo(x0, y0 + 0.9 * g.d);
  ctx.lineTo(x0 + 0.26 * g.d, y0 + 0.35 * g.d);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 0.03 * g.d;
  ctx.beginPath(); ctx.moveTo(x0 - 0.15 * g.d, y0 + 0.5 * g.d); ctx.lineTo(x0 + 0.13 * g.d, y0 + 0.55 * g.d); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0 - 0.1 * g.d, y0 + 0.7 * g.d); ctx.lineTo(x0 + 0.16 * g.d, y0 + 0.74 * g.d); ctx.stroke();
  ctx.fillStyle = '#ffb3d9';
  ctx.beginPath(); ctx.arc(x0, y0 + 0.02 * g.d, 0.36 * g.d, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x0 - 0.2 * g.d, y0 + 0.25 * g.d, 0.12 * g.d, 0.2 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e03131';
  ctx.beginPath(); ctx.arc(x0, y0 - 0.3 * g.d, 0.1 * g.d, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 0.03 * g.d;
  ctx.beginPath(); ctx.moveTo(x0, y0 - 0.38 * g.d); ctx.quadraticCurveTo(x0 + 0.05 * g.d, y0 - 0.5 * g.d, x0 + 0.12 * g.d, y0 - 0.55 * g.d); ctx.stroke();
});
addEffect('cherry', 'Κεράσι', '🍒', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY - 0.05 * g.d;
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 0.035 * g.d; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0 + 0.12 * g.d, y0 - 0.05 * g.d);
  ctx.quadraticCurveTo(x0 + 0.3 * g.d, y0 - 0.5 * g.d, x0 + 0.45 * g.d, y0 - 0.6 * g.d);
  ctx.stroke();
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#e03131';
    ctx.beginPath(); ctx.arc(x0 + s * 0.13 * g.d, y0 + 0.08 * g.d, 0.22 * g.d, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.beginPath(); ctx.arc(x0 + s * 0.13 * g.d - 0.07 * g.d, y0 + 0.02 * g.d, 0.06 * g.d, 0, Math.PI * 2); ctx.fill();
  }
});
addEffect('balloon', 'Μπαλόνι', '🎈', (lm, ctx, t) => {
  const g = G(lm);
  const bx = g.fc.x + 0.3 * g.d + Math.sin(t * 2) * 0.1 * g.d;
  const by = g.hatY - 1.2 * g.d + Math.sin(t * 2.6) * 0.06 * g.d;
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 0.025 * g.d;
  ctx.beginPath();
  ctx.moveTo(g.fc.x + 0.1 * g.d, g.hatY + 0.1 * g.d);
  ctx.quadraticCurveTo(g.fc.x + 0.35 * g.d, g.hatY - 0.6 * g.d, bx, by + 0.3 * g.d);
  ctx.stroke();
  ctx.fillStyle = '#ff4d6d';
  ctx.beginPath(); ctx.ellipse(bx, by, 0.32 * g.d, 0.4 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx - 0.12 * g.d, by + 0.38 * g.d);
  ctx.lineTo(bx, by + 0.55 * g.d);
  ctx.lineTo(bx + 0.12 * g.d, by + 0.38 * g.d);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.beginPath(); ctx.ellipse(bx - 0.1 * g.d, by - 0.12 * g.d, 0.07 * g.d, 0.11 * g.d, -0.5, 0, Math.PI * 2); ctx.fill();
});
addEffect('bow', 'Φιογκάκι', '🎀', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY - 0.1 * g.d;
  ctx.fillStyle = '#ff2d78';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(x0 - 0.5 * g.d, y0 - 0.22 * g.d, x0 - 0.38 * g.d, y0 + 0.12 * g.d);
  ctx.quadraticCurveTo(x0 - 0.12 * g.d, y0 + 0.08 * g.d, x0, y0);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(x0 + 0.5 * g.d, y0 - 0.22 * g.d, x0 + 0.38 * g.d, y0 + 0.12 * g.d);
  ctx.quadraticCurveTo(x0 + 0.12 * g.d, y0 + 0.08 * g.d, x0, y0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e0226e';
  ctx.beginPath(); ctx.arc(x0, y0, 0.11 * g.d, 0, Math.PI * 2); ctx.fill();
});
addEffect('tiara', 'Τιάρα', '👸', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY;
  ctx.fillStyle = '#ffd02d';
  ctx.fillRect(x0 - 0.7 * g.d, y0 - 0.05 * g.d, 1.4 * g.d, 0.14 * g.d);
  for (const [dx, h] of [[-0.42, 0.28], [0, 0.38], [0.42, 0.28]]) {
    ctx.beginPath();
    ctx.moveTo(x0 + dx * g.d - 0.13 * g.d, y0 - 0.02 * g.d);
    ctx.lineTo(x0 + dx * g.d, y0 - h * g.d);
    ctx.lineTo(x0 + dx * g.d + 0.13 * g.d, y0 - 0.02 * g.d);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#ff4d6d';
  ctx.beginPath(); ctx.arc(x0, y0 - 0.38 * g.d, 0.07 * g.d, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7bdff2';
  ctx.beginPath(); ctx.arc(x0 - 0.42 * g.d, y0 - 0.28 * g.d, 0.06 * g.d, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x0 + 0.42 * g.d, y0 - 0.28 * g.d, 0.06 * g.d, 0, Math.PI * 2); ctx.fill();
});
addEffect('gradCap', 'Καπέλο αποφ.', '🎓', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY + 0.05 * g.d;
  ctx.fillStyle = '#111118';
  ctx.beginPath(); ctx.arc(x0, y0 + 0.05 * g.d, 0.6 * g.d, Math.PI, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(x0, y0 - 0.12 * g.d); ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#14141c';
  ctx.fillRect(-0.5 * g.d, -0.5 * g.d, 1.0 * g.d, 1.0 * g.d);
  ctx.restore();
  ctx.strokeStyle = '#ffd02d'; ctx.lineWidth = 0.04 * g.d;
  ctx.beginPath(); ctx.moveTo(x0, y0 - 0.12 * g.d); ctx.quadraticCurveTo(x0 + 0.5 * g.d, y0 + 0.1 * g.d, x0 + 0.62 * g.d, y0 + 0.45 * g.d); ctx.stroke();
  ctx.fillStyle = '#ffd02d';
  ctx.beginPath(); ctx.arc(x0 + 0.62 * g.d, y0 + 0.45 * g.d, 0.07 * g.d, 0, Math.PI * 2); ctx.fill();
});
addEffect('topHat', 'Ψηλό καπέλο', '🎩', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY + 0.05 * g.d;
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath(); ctx.ellipse(x0, y0 + 0.1 * g.d, 0.95 * g.d, 0.16 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x0 - 0.6 * g.d, y0 - 1.05 * g.d, 1.2 * g.d, 1.15 * g.d);
  ctx.fillStyle = '#e03131';
  ctx.fillRect(x0 - 0.6 * g.d, y0 - 0.35 * g.d, 1.2 * g.d, 0.16 * g.d);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.fillRect(x0 - 0.55 * g.d, y0 - 1.0 * g.d, 0.1 * g.d, 0.95 * g.d);
});
addEffect('clown', 'Κλόουν', '🤡', (lm, ctx) => {
  const g = G(lm);
  const cols = ['#ff4d6d', '#ffd02d', '#7bdff2', '#b388ff', '#7bff9f'];
  let i = 0;
  for (const [dx, dy] of [[-0.55, -0.15], [0.55, -0.15], [-0.3, -0.4], [0.3, -0.4], [0, -0.5]]) {
    ctx.fillStyle = cols[i++ % cols.length];
    ctx.beginPath(); ctx.arc(g.fc.x + dx * g.d, g.hatY + dy * g.d, 0.17 * g.d, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#ff3b3b';
  ctx.beginPath(); ctx.arc(g.nose.x, g.nose.y + 0.12 * g.d, 0.28 * g.d, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.beginPath(); ctx.arc(g.nose.x - 0.08 * g.d, g.nose.y + 0.06 * g.d, 0.07 * g.d, 0, Math.PI * 2); ctx.fill();
});
addEffect('butterfly', 'Πεταλούδα', '🦋', (lm, ctx, t) => {
  const g = G(lm);
  const flap = Math.sin(t * 8) * 0.2;
  const bx = g.nose.x, by = g.nose.y - 0.1 * g.d;
  for (const s of [-1, 1]) {
    rotCtx(ctx, bx, by, s * flap, () => {
      ctx.fillStyle = 'rgba(155,89,208,.95)';
      ctx.beginPath(); ctx.ellipse(-0.28 * g.d, -0.28 * g.d, 0.3 * g.d, 0.22 * g.d, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(230,126,34,.95)';
      ctx.beginPath(); ctx.ellipse(-0.2 * g.d, 0.02 * g.d, 0.2 * g.d, 0.15 * g.d, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.beginPath(); ctx.arc(-0.34 * g.d, -0.32 * g.d, 0.05 * g.d, 0, Math.PI * 2); ctx.fill();
    });
  }
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath(); ctx.ellipse(bx, by, 0.07 * g.d, 0.22 * g.d, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 0.025 * g.d;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(bx + s * 0.05 * g.d, by - 0.2 * g.d);
    ctx.quadraticCurveTo(bx + s * 0.18 * g.d, by - 0.42 * g.d, bx + s * 0.22 * g.d, by - 0.5 * g.d);
    ctx.stroke();
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath(); ctx.arc(bx + s * 0.22 * g.d, by - 0.5 * g.d, 0.045 * g.d, 0, Math.PI * 2); ctx.fill();
  }
});
addEffect('bee', 'Μελισσάκι', '🐝', (lm, ctx, t) => {
  const g = G(lm);
  for (const s of [-1, 1]) {
    ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 0.04 * g.d;
    ctx.beginPath();
    ctx.moveTo(g.fc.x + s * 0.2 * g.d, g.hatY + 0.1 * g.d);
    ctx.quadraticCurveTo(g.fc.x + s * 0.32 * g.d, g.hatY - 0.4 * g.d, g.fc.x + s * 0.28 * g.d, g.hatY - 0.5 * g.d);
    ctx.stroke();
    ctx.fillStyle = '#ffd02d';
    ctx.beginPath(); ctx.arc(g.fc.x + s * 0.28 * g.d, g.hatY - 0.52 * g.d, 0.09 * g.d, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 0.025 * g.d; ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.3 * Math.sin(t * 10 + s)})`;
    rotCtx(ctx, g.fc.x + s * 0.75 * g.d, g.eyeY - 0.1 * g.d, s * 0.7, () => {
      ctx.beginPath(); ctx.ellipse(0, 0, 0.3 * g.d, 0.18 * g.d, 0, 0, Math.PI * 2); ctx.fill();
    });
  }
});
addEffect('vampire', 'Βαμπιράκι', '🧛', (lm, ctx) => {
  const g = G(lm);
  ctx.strokeStyle = '#e63946'; ctx.lineWidth = 0.05 * g.d; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 48; i <= 59; i++) {
    const p = lm[i];
    if (i === 48) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#fff';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(g.mouthC.x + s * 0.17 * g.d, g.mouthC.y - 0.05 * g.d);
    ctx.lineTo(g.mouthC.x + s * 0.1 * g.d, g.mouthC.y + 0.2 * g.d);
    ctx.lineTo(g.mouthC.x + s * 0.24 * g.d, g.mouthC.y + 0.12 * g.d);
    ctx.closePath(); ctx.fill();
  }
});
addEffect('watermelon', 'Καρπούζι', '🍉', (lm, ctx) => {
  const g = G(lm);
  const x0 = g.fc.x, y0 = g.hatY + 0.1 * g.d;
  ctx.fillStyle = '#3fae5a';
  ctx.beginPath(); ctx.arc(x0, y0, 0.8 * g.d, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath(); ctx.arc(x0, y0, 0.68 * g.d, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#2a2a32';
  for (const [dx, dy] of [[-0.3, -0.35], [0.05, -0.25], [0.35, -0.4], [-0.1, -0.55], [0.25, -0.6]]) {
    ctx.beginPath(); ctx.ellipse(x0 + dx * g.d, y0 + dy * g.d, 0.05 * g.d, 0.08 * g.d, 0.4, 0, Math.PI * 2); ctx.fill();
  }
});
addEffect('sparkle', 'Λάμψη', '💫', (lm, ctx, t) => {
  const g = G(lm);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + t * 0.15;
    const sx = g.fc.x + Math.cos(a) * 1.55 * g.d;
    const sy = g.fc.y + Math.sin(a) * 1.5 * g.d;
    ctx.fillStyle = `hsla(${(i * 55 + 20) % 360}, 95%, 72%, ${0.5 + 0.5 * Math.sin(t * 4 + i * 1.3)})`;
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
    star(ctx, sx, sy, (0.1 + (i % 3) * 0.05) * g.d, t * 1.5 + i);
  }
  ctx.shadowBlur = 0;
});
addEffect('heartFloat', 'Καρδιά', '💕', (lm, ctx, t) => {
  const g = G(lm);
  const bob = Math.sin(t * 2) * 0.15 * g.d;
  const p = 1 + Math.sin(t * 5) * 0.08;
  ctx.save();
  ctx.translate(g.fc.x, g.hatY - 1.15 * g.d + bob);
  ctx.scale(p, p);
  ctx.fillStyle = '#ff2d78';
  ctx.shadowColor = '#ff2d78'; ctx.shadowBlur = 14;
  heart(ctx, 0, 0, 0.38 * g.d);
  ctx.restore();
  for (let i = 0; i < 2; i++) {
    const r = (t * 0.3 + i * 0.5) % 1;
    ctx.fillStyle = `rgba(255,45,120,${0.7 * (1 - r)})`;
    heart(ctx, g.fc.x - 0.55 * g.d + i * 1.1 * g.d + Math.sin(t * 3 + i) * 0.1 * g.d,
      g.hatY - 1.15 * g.d - r * 0.9 * g.d, (0.12 + r * 0.12) * g.d);
  }
});
