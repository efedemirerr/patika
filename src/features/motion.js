// Hareket katmanı: canlı topoğrafya, sayan rakamlar, görünürken kendini çizen rotalar.
// Hepsi "azaltılmış hareket" tercihine uyar.

export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Sayının 0'dan hedefe akması. el.dataset.count = hedef, el.dataset.fmt = 'km' | 'int' | 'dec1' */
export function countUp(root) {
  const els = root.querySelectorAll('[data-count]');
  els.forEach((el) => {
    const target = Number(el.dataset.count);
    const fmt = el.dataset.fmt || 'int';
    const suffix = el.dataset.suffix || '';
    const out = (v) => (fmt === 'km' ? (v / 1000).toFixed(2).replace('.', ',') : fmt === 'dec1' ? v.toFixed(1).replace('.', ',') : Math.round(v).toLocaleString('tr-TR')) + suffix;
    if (reducedMotion() || !isFinite(target)) { el.textContent = out(target); return; }
    const dur = 900, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = out(target * e);
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = out(0);
    requestAnimationFrame(step);
  });
}

/** .draw-on-view öğeleri ekrana girince "drawn" sınıfı alır (CSS çizim animasyonunu tetikler). */
let io = null;
export function observeDraw(root) {
  if (!('IntersectionObserver' in window) || reducedMotion()) {
    root.querySelectorAll('.draw-on-view').forEach((e) => e.classList.add('drawn'));
    return;
  }
  io = io || new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('drawn'); io.unobserve(en.target); }
  }, { threshold: 0.35 });
  root.querySelectorAll('.draw-on-view:not(.drawn)').forEach((e) => io.observe(e));
}

// ---- Canlı topoğrafya: yavaşça akan eş yükselti çizgileri (canvas) ----
function noise(seed) {
  // küçük, deterministik değer gürültüsü
  const p = new Uint8Array(512);
  let s = seed;
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const fade = (t) => t * t * (3 - 2 * t);
  const g = (h, x, y) => ((h & 1) ? x : -x) + ((h & 2) ? y : -y);
  return (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const a = p[p[X] + Y], b = p[p[X + 1] + Y], c = p[p[X] + Y + 1], d = p[p[X + 1] + Y + 1];
    const l1 = g(a, xf, yf) + u * (g(b, xf - 1, yf) - g(a, xf, yf));
    const l2 = g(c, xf, yf - 1) + u * (g(d, xf - 1, yf - 1) - g(c, xf, yf - 1));
    return (l1 + v * (l2 - l1)) * 0.7;
  };
}

/**
 * Bir canvas'a canlı kontur çizer. Döndürdüğü fonksiyon animasyonu durdurur.
 * opts: { color, levels, speed, cell }
 */
export function liveTopo(canvas, { color = '#c6f432', alpha = 0.22, levels = 9, speed = 0.04, cell = 14, seed = 7 } = {}) {
  const ctx = canvas.getContext('2d');
  const n = noise(seed);
  let raf = 0, t = 0, last = performance.now(), w = 0, h = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
  };
  resize();
  const field = (x, y) => n(x * 0.012 + t * 0.6, y * 0.012 - t * 0.3) + 0.5 * n(x * 0.025 - t, y * 0.025 + 10);
  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
    const vals = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) vals[j * cols + i] = field(i * cell, j * cell);
    ctx.lineWidth = 1;
    for (let L = 0; L < levels; L++) {
      const iso = -0.6 + (L / (levels - 1)) * 1.2;
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha * (L % 3 === 0 ? 1.6 : 0.8);
      ctx.beginPath();
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = vals[j * cols + i], b = vals[j * cols + i + 1], c = vals[(j + 1) * cols + i + 1], d = vals[(j + 1) * cols + i];
          const idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          const x = i * cell, y = j * cell;
          const lerp = (p, q) => (iso - p) / (q - p || 1e-6);
          const top = [x + cell * lerp(a, b), y], right = [x + cell, y + cell * lerp(b, c)];
          const bottom = [x + cell * lerp(d, c), y + cell], left = [x, y + cell * lerp(a, d)];
          const seg = (p1, p2) => { ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); };
          switch (idx) {
            case 1: case 14: seg(left, bottom); break;
            case 2: case 13: seg(bottom, right); break;
            case 3: case 12: seg(left, right); break;
            case 4: case 11: seg(top, right); break;
            case 5: seg(left, top); seg(bottom, right); break;
            case 6: case 9: seg(top, bottom); break;
            case 7: case 8: seg(left, top); break;
            case 10: seg(top, right); seg(left, bottom); break;
          }
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  const loop = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    t += dt * speed;
    draw();
    raf = requestAnimationFrame(loop);
  };
  draw();
  if (!reducedMotion()) raf = requestAnimationFrame(loop);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { resize(); draw(); }) : null;
  ro?.observe(canvas);
  return () => { cancelAnimationFrame(raf); ro?.disconnect(); };
}

/** Pafta çerçevesi: köşe işaretleri + koordinat etiketleri (dekoratif). */
export function frameMarks(label = '', coord = '') {
  return `<span class="fm fm-tl"></span><span class="fm fm-tr"></span><span class="fm fm-bl"></span><span class="fm fm-br"></span>${label ? `<span class="fm-label">${label}</span>` : ''}${coord ? `<span class="fm-coord">${coord}</span>` : ''}`;
}

/** Bugünün selamı */
export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 5 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : h < 22 ? 'İyi akşamlar' : 'İyi geceler';
}
