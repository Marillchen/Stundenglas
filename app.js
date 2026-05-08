'use strict';

// ── Constants ──────────────────────────────────────────────────────────────
const TOTAL_GOATS   = 7;
const MS_PER_HOUR   = 60 * 60 * 1000;   // 3 600 000 ms

// Pre-generate straw positions so they stay stable across redraws
const STRAW_STROKES = Array.from({ length: 60 }, () => ({
  fx:  Math.random() * 800,
  fy:  480 * 0.72 + Math.random() * 480 * 0.28,
  dx: (Math.random() - 0.5) * 24,
  dy:  Math.random() * 6,
}));

// ── State ──────────────────────────────────────────────────────────────────
let timerInterval  = null;
let elapsedMs      = 0;
let lastTickTime   = null;
let running        = false;
let goatsInBarn    = TOTAL_GOATS;

// ── DOM refs ───────────────────────────────────────────────────────────────
const canvas     = document.getElementById('barnCanvas');
const ctx        = canvas.getContext('2d');
const hoursEl    = document.getElementById('hours');
const minutesEl  = document.getElementById('minutes');
const secondsEl  = document.getElementById('seconds');
const goatCount  = document.getElementById('goatCount');
const startBtn   = document.getElementById('startBtn');
const pauseBtn   = document.getElementById('pauseBtn');
const resetBtn   = document.getElementById('resetBtn');

// ── Timer ──────────────────────────────────────────────────────────────────
function startTimer() {
  if (running) return;
  running       = true;
  lastTickTime  = performance.now();
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  timerInterval = setInterval(tick, 250);
}

function pauseTimer() {
  if (!running) return;
  running = false;
  clearInterval(timerInterval);
  timerInterval = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

function resetTimer() {
  pauseTimer();
  elapsedMs      = 0;
  goatsInBarn    = TOTAL_GOATS;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  updateDisplay(0);
  draw(goatsInBarn);
}

function tick() {
  const now    = performance.now();
  elapsedMs   += now - lastTickTime;
  lastTickTime = now;

  const newGoatCount = Math.max(0, TOTAL_GOATS - Math.floor(elapsedMs / MS_PER_HOUR));
  if (newGoatCount !== goatsInBarn) {
    goatsInBarn = newGoatCount;
    draw(goatsInBarn);
  }

  updateDisplay(elapsedMs);

  if (goatsInBarn === 0) {
    pauseTimer();
  }
}

function updateDisplay(ms) {
  const totalSec  = Math.floor(ms / 1000);
  const h         = Math.floor(totalSec / 3600);
  const m         = Math.floor((totalSec % 3600) / 60);
  const s         = totalSec % 60;

  hoursEl.textContent   = String(h).padStart(2, '0');
  minutesEl.textContent = String(m).padStart(2, '0');
  secondsEl.textContent = String(s).padStart(2, '0');
  goatCount.textContent = goatsInBarn;
}

// ── Button listeners ───────────────────────────────────────────────────────
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// ── Drawing helpers ────────────────────────────────────────────────────────
const W = canvas.width;   // 800
const H = canvas.height;  // 480

/** Draw a rounded rectangle path */
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Linear gradient helper */
function linGrad(x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

// ── Scene drawing ──────────────────────────────────────────────────────────

function drawBarn() {
  // ---- Sky / distant background (open barn wall) ----
  const skyGrad = linGrad(0, 0, 0, H * 0.55,
    [[0, '#a8c8e8'], [1, '#dce8f0']]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H * 0.55);

  // ---- Back barn wall ----
  ctx.fillStyle = '#8b5e3c';
  ctx.fillRect(0, H * 0.18, W, H * 0.37);

  // Back wall planks
  ctx.strokeStyle = '#6b4020';
  ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, H * 0.18);
    ctx.lineTo(x, H * 0.55);
    ctx.stroke();
  }

  // ---- Hay loft (upper area) ----
  // Ceiling triangular frame
  ctx.fillStyle = '#5c3a1e';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.18);
  ctx.lineTo(W / 2, 0);
  ctx.lineTo(W, H * 0.18);
  ctx.closePath();
  ctx.fill();

  // Loft planks inside triangle
  ctx.strokeStyle = '#4a2e12';
  ctx.lineWidth = 2.5;
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    const lx0 = W * 0.5 * t;
    const lx1 = W - W * 0.5 * t;
    const ly  = H * 0.18 * t;
    ctx.beginPath();
    ctx.moveTo(lx0, ly);
    ctx.lineTo(lx1, ly);
    ctx.stroke();
  }

  // Hay bundles in loft
  drawHayBundles();

  // ---- Side walls (perspective) ----
  // Left wall
  const lwGrad = linGrad(0, 0, W * 0.18, 0,
    [[0, '#4a2e0e'], [1, '#7a4e28']]);
  ctx.fillStyle = lwGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W * 0.16, H * 0.18);
  ctx.lineTo(W * 0.16, H * 0.72);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Left wall planks
  ctx.strokeStyle = '#3a2008';
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= 5; i++) {
    const t = i / 5;
    const ly = H * 0.18 + (H * 0.72 - H * 0.18) * t;
    const ly2 = H * t;
    ctx.beginPath();
    ctx.moveTo(0, ly2 * 0.9);
    ctx.lineTo(W * 0.16, ly);
    ctx.stroke();
  }

  // Right wall
  const rwGrad = linGrad(W, 0, W * 0.84, 0,
    [[0, '#4a2e0e'], [1, '#7a4e28']]);
  ctx.fillStyle = rwGrad;
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W * 0.84, H * 0.18);
  ctx.lineTo(W * 0.84, H * 0.72);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#3a2008';
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= 5; i++) {
    const t = i / 5;
    const ly = H * 0.18 + (H * 0.72 - H * 0.18) * t;
    const ly2 = H * t;
    ctx.beginPath();
    ctx.moveTo(W, ly2 * 0.9);
    ctx.lineTo(W * 0.84, ly);
    ctx.stroke();
  }

  // ---- Floor (straw-covered) ----
  const floorGrad = linGrad(0, H * 0.55, 0, H,
    [[0, '#c8922e'], [0.5, '#b87c20'], [1, '#8a5c10']]);
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(W * 0.16, H * 0.72);
  ctx.lineTo(W * 0.84, H * 0.72);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Straw strokes on floor (stable pre-generated positions)
  ctx.strokeStyle = 'rgba(220,170,40,0.5)';
  ctx.lineWidth = 1;
  STRAW_STROKES.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.fx, s.fy);
    ctx.lineTo(s.fx + s.dx, s.fy + s.dy);
    ctx.stroke();
  });

  // ---- Back stall partition fence ----
  drawStallFence();

  // ---- Feeding trough / barrier (foreground) ----
  drawFeedingTrough();
}

function drawHayBundles() {
  // Several hay piles peeking over the loft edge
  const piles = [
    { x: W * 0.25, y: H * 0.12 },
    { x: W * 0.5,  y: H * 0.06 },
    { x: W * 0.72, y: H * 0.11 },
  ];
  piles.forEach(p => {
    ctx.fillStyle = '#d4a020';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 20, 46, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b830';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 12, 34, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Straw wisps
    ctx.strokeStyle = '#f0c840';
    ctx.lineWidth = 1.5;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(p.x + i * 9, p.y + 4);
      ctx.quadraticCurveTo(p.x + i * 9 + 4, p.y - 8, p.x + i * 9 + 2, p.y - 16);
      ctx.stroke();
    }
  });
}

function drawStallFence() {
  // Horizontal fence rails at the back, at floor level
  const y1 = H * 0.62;
  const y2 = H * 0.68;
  const x0 = W * 0.16;
  const x1 = W * 0.84;

  ctx.strokeStyle = '#6b4020';
  ctx.lineWidth = 5;
  [y1, y2].forEach(y => {
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  });

  // Vertical posts
  ctx.lineWidth = 4;
  for (let i = 0; i <= TOTAL_GOATS; i++) {
    const px = x0 + (x1 - x0) * (i / TOTAL_GOATS);
    ctx.beginPath();
    ctx.moveTo(px, H * 0.55);
    ctx.lineTo(px, H * 0.72);
    ctx.stroke();
  }
}

function drawFeedingTrough() {
  // The feeding trough / barrier in the foreground
  // This is the horizontal partition the viewer stands behind
  const y0 = H * 0.72;
  const y1 = H;

  // Trough back board
  const tGrad = linGrad(0, y0, 0, y1,
    [[0, '#7a4e28'], [0.25, '#9b6b3a'], [0.5, '#7a4e28'], [1, '#5c3a1e']]);
  ctx.fillStyle = tGrad;
  ctx.fillRect(0, y0, W, y1 - y0);

  // Horizontal plank lines
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  const plankCount = 5;
  for (let i = 0; i <= plankCount; i++) {
    const py = y0 + (y1 - y0) * (i / plankCount);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(W, py);
    ctx.stroke();
  }

  // Knot holes in planks
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  [[120, y0 + 22], [350, y0 + 45], [600, y0 + 18], [740, y0 + 50]].forEach(([kx, ky]) => {
    ctx.beginPath();
    ctx.ellipse(kx, ky, 7, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top edge highlight (rounded)
  ctx.fillStyle = '#c49060';
  ctx.fillRect(0, y0, W, 6);

  // Trough opening (the groove the goats eat from)
  ctx.fillStyle = '#4a2e12';
  ctx.fillRect(0, y0 + 6, W, 14);
  ctx.fillStyle = '#2a1800';
  ctx.fillRect(0, y0 + 10, W, 6);
}

// ── Goat drawing ───────────────────────────────────────────────────────────

/**
 * Draw a single goat.
 * @param {number} cx   - centre x of goat
 * @param {number} groundY - y coordinate of the floor the goat stands on
 * @param {number} seed - pseudo-random seed for colour variation
 */
function drawGoat(cx, groundY, seed) {
  // Deterministic variation from seed
  const rng = (n) => (Math.sin(seed * 127.1 + n * 311.7) * 0.5 + 0.5);

  // Colour palette: white / cream / light grey / pinto
  const bodyHue = Math.floor(rng(0) * 30);    // 0-30  (warm cream range)
  const bodyL   = 78 + Math.floor(rng(1) * 16); // 78-94 % lightness
  const bodyColor   = `hsl(${bodyHue},18%,${bodyL}%)`;
  const shadowColor = `hsl(${bodyHue},14%,${bodyL - 16}%)`;
  const darkPatch   = `hsl(${20 + bodyHue},22%,${bodyL - 30}%)`;

  const scale = 0.86 + rng(2) * 0.28;   // slight size variation

  // Sizes (all relative to a base unit)
  const bu = 26 * scale;   // base unit

  // ---- Legs ----
  const legW = bu * 0.28;
  const legH = bu * 1.1;
  const legY = groundY - legH;
  const legPositions = [
    cx - bu * 0.78,
    cx - bu * 0.28,
    cx + bu * 0.18,
    cx + bu * 0.68,
  ];
  legPositions.forEach(lx => {
    // Leg
    roundRect(lx - legW / 2, legY, legW, legH, legW * 0.3);
    ctx.fillStyle = shadowColor;
    ctx.fill();
    // Hoof
    roundRect(lx - legW / 2 - 1, legY + legH - legW * 0.8, legW + 2, legW * 0.9, legW * 0.2);
    ctx.fillStyle = '#2e1a0a';
    ctx.fill();
  });

  // ---- Body ----
  const bodyW = bu * 2.2;
  const bodyH = bu * 1.2;
  const bodyY = groundY - legH - bodyH * 0.7;

  ctx.fillStyle = bodyColor;
  roundRect(cx - bodyW / 2, bodyY, bodyW, bodyH, bu * 0.4);
  ctx.fill();

  // Body shading
  const bodyShade = ctx.createLinearGradient(cx - bodyW / 2, bodyY, cx + bodyW / 2, bodyY + bodyH);
  bodyShade.addColorStop(0, 'rgba(255,255,255,0.18)');
  bodyShade.addColorStop(0.5, 'rgba(0,0,0,0)');
  bodyShade.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = bodyShade;
  roundRect(cx - bodyW / 2, bodyY, bodyW, bodyH, bu * 0.4);
  ctx.fill();

  // Optional pinto patch
  if (rng(3) > 0.55) {
    ctx.fillStyle = darkPatch;
    ctx.beginPath();
    ctx.ellipse(
      cx + (rng(4) - 0.5) * bodyW * 0.5,
      bodyY + bodyH * 0.45,
      bu * (0.4 + rng(5) * 0.3),
      bu * (0.3 + rng(6) * 0.2),
      (rng(7) - 0.5) * 0.8,
      0, Math.PI * 2
    );
    ctx.fill();
  }

  // ---- Neck ----
  const neckW = bu * 0.52;
  const neckH = bu * 0.9;
  const neckX = cx + bodyW / 2 - neckW * 1.1;
  const neckY = bodyY - neckH * 0.6;

  ctx.fillStyle = bodyColor;
  roundRect(neckX, neckY, neckW, neckH + bodyH * 0.3, bu * 0.22);
  ctx.fill();

  // ---- Head ----
  const headW = bu * 1.05;
  const headH = bu * 0.78;
  const headX = neckX + neckW - headW * 0.2;
  const headY = neckY - headH * 0.75;

  ctx.fillStyle = bodyColor;
  roundRect(headX, headY, headW, headH, bu * 0.3);
  ctx.fill();

  // Muzzle
  ctx.fillStyle = `hsl(${bodyHue},20%,${bodyL - 8}%)`;
  ctx.beginPath();
  ctx.ellipse(headX + headW * 0.82, headY + headH * 0.68, headW * 0.28, headH * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nostril
  ctx.fillStyle = '#5c3020';
  ctx.beginPath();
  ctx.ellipse(headX + headW * 0.92, headY + headH * 0.66, 2.5, 2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headX + headW * 0.76, headY + headH * 0.70, 2.5, 2, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#1a0d00';
  ctx.beginPath();
  ctx.ellipse(headX + headW * 0.55, headY + headH * 0.35, bu * 0.1, bu * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye highlight
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(headX + headW * 0.57, headY + headH * 0.31, bu * 0.035, bu * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- Ears ----
  // Left ear
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(headX + headW * 0.12, headY + headH * 0.15);
  ctx.quadraticCurveTo(headX - bu * 0.28, headY - bu * 0.35, headX + headW * 0.05, headY + headH * 0.45);
  ctx.quadraticCurveTo(headX + headW * 0.2, headY + headH * 0.3, headX + headW * 0.12, headY + headH * 0.15);
  ctx.fill();
  // Ear inner
  ctx.fillStyle = `hsl(${bodyHue + 10},40%,${bodyL - 20}%)`;
  ctx.beginPath();
  ctx.moveTo(headX + headW * 0.11, headY + headH * 0.2);
  ctx.quadraticCurveTo(headX - bu * 0.16, headY - bu * 0.2, headX + headW * 0.08, headY + headH * 0.4);
  ctx.quadraticCurveTo(headX + headW * 0.16, headY + headH * 0.28, headX + headW * 0.11, headY + headH * 0.2);
  ctx.fill();

  // Right ear (near side)
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(headX + headW * 0.62, headY + headH * 0.1);
  ctx.quadraticCurveTo(headX + headW * 0.82, headY - bu * 0.32, headX + headW * 0.72, headY + headH * 0.4);
  ctx.quadraticCurveTo(headX + headW * 0.55, headY + headH * 0.26, headX + headW * 0.62, headY + headH * 0.1);
  ctx.fill();

  // ---- Horns ----
  if (rng(8) > 0.3) {
    ctx.strokeStyle = '#a0784a';
    ctx.lineWidth = bu * 0.14;
    ctx.lineCap = 'round';
    // Left horn
    ctx.beginPath();
    ctx.moveTo(headX + headW * 0.22, headY + headH * 0.05);
    ctx.quadraticCurveTo(headX + headW * 0.08, headY - bu * 0.48, headX + headW * 0.16, headY - bu * 0.68);
    ctx.stroke();
    // Right horn
    ctx.beginPath();
    ctx.moveTo(headX + headW * 0.58, headY);
    ctx.quadraticCurveTo(headX + headW * 0.72, headY - bu * 0.45, headX + headW * 0.64, headY - bu * 0.65);
    ctx.stroke();
  }

  // ---- Beard ----
  if (rng(9) > 0.4) {
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(headX + headW * 0.68, headY + headH * 0.9);
    ctx.quadraticCurveTo(headX + headW * 0.8, headY + headH * 1.25, headX + headW * 0.72, headY + headH * 1.38);
    ctx.quadraticCurveTo(headX + headW * 0.62, headY + headH * 1.2, headX + headW * 0.58, headY + headH * 0.95);
    ctx.closePath();
    ctx.fill();
  }

  // ---- Tail ----
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(cx - bodyW / 2 + bu * 0.1, bodyY + bodyH * 0.25);
  ctx.quadraticCurveTo(cx - bodyW / 2 - bu * 0.45, bodyY - bu * 0.2, cx - bodyW / 2 - bu * 0.2, bodyY + bu * 0.05);
  ctx.quadraticCurveTo(cx - bodyW / 2 + bu * 0.05, bodyY + bodyH * 0.1, cx - bodyW / 2 + bu * 0.1, bodyY + bodyH * 0.25);
  ctx.closePath();
  ctx.fill();
}

// ── Main draw function ─────────────────────────────────────────────────────

function draw(goatsVisible) {
  ctx.clearRect(0, 0, W, H);

  drawBarn();

  // Positions for 7 goats spread across the barn width
  // Goats stand on the straw floor, heads near/above the trough
  const barnLeft  = W * 0.17;
  const barnRight = W * 0.83;
  const barnWidth = barnRight - barnLeft;

  // Ground y: the top of the feeding trough (where hooves touch the floor in front)
  const goatGroundY = H * 0.715;

  for (let i = 0; i < TOTAL_GOATS; i++) {
    if (i < goatsVisible) {
      const cx = barnLeft + barnWidth * ((i + 0.5) / TOTAL_GOATS);
      drawGoat(cx, goatGroundY, i + 1);
    }
  }
}

// ── Initial render ─────────────────────────────────────────────────────────
draw(goatsInBarn);
