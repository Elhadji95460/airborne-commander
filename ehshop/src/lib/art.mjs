// Illustrations SVG générées (déterministes) utilisées tant qu'aucune photo réelle n'est fournie.
// Elles restent volontairement abstraites : elles évoquent un effet, sans prétendre montrer le produit.
import { rng, esc } from './util.mjs';

const f = (n) => Math.round(n * 10) / 10;
const hsl = (h, s, l, a = 1) => `hsla(${Math.round(((h % 360) + 360) % 360)},${s}%,${l}%,${a})`;

let gid = 0;
function burst({ cx, cy, r, hue, hue2 = hue, rays, rand, droop = 0.18, width = 1.6, id }) {
  const g = `${id}b${gid++}`;
  let out = `<radialGradient id="${g}" cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 1.05)}" gradientUnits="userSpaceOnUse">`
    + `<stop offset="0" stop-color="${hsl(hue, 100, 96)}"/>`
    + `<stop offset=".35" stop-color="${hsl(hue, 95, 70)}"/>`
    + `<stop offset=".75" stop-color="${hsl(hue2, 90, 55, 0.85)}"/>`
    + `<stop offset="1" stop-color="${hsl(hue2, 90, 45, 0)}"/></radialGradient>`;
  const halo = `${g}h`;
  out += `<radialGradient id="${halo}"><stop offset="0" stop-color="${hsl(hue, 100, 70, 0.32)}"/><stop offset="1" stop-color="${hsl(hue, 100, 50, 0)}"/></radialGradient>`;
  out += `<radialGradient id="${g}c"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".4" stop-color="${hsl(hue, 100, 80)}" stop-opacity=".55"/><stop offset="1" stop-color="${hsl(hue, 100, 60)}" stop-opacity="0"/></radialGradient>`;
  let paths = '';
  let dots = '';
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + rand() * 0.12;
    const len = r * (0.72 + rand() * 0.28);
    const x0 = cx + Math.cos(a) * r * 0.05, y0 = cy + Math.sin(a) * r * 0.05;
    const x1 = cx + Math.cos(a) * len, y1 = cy + Math.sin(a) * len + len * droop;
    const qx = cx + Math.cos(a) * len * 0.6, qy = cy + Math.sin(a) * len * 0.6;
    paths += `M${f(x0)} ${f(y0)}Q${f(qx)} ${f(qy)} ${f(x1)} ${f(y1)}`;
    if (rand() > 0.35) dots += `<circle cx="${f(x1)}" cy="${f(y1)}" r="${f(width * (0.9 + rand()))}" fill="${hsl(rand() > 0.5 ? hue : hue2, 100, 80)}"/>`;
  }
  return {
    defs: out,
    body: `<g class="burst"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 1.25)}" fill="url(#${halo})"/>`
      + `<path d="${paths}" fill="none" stroke="url(#${g})" stroke-width="${width}" stroke-linecap="round"/>${dots}`
      + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.09)}" fill="url(#${g}c)"/></g>`,
  };
}

function sky(w, h, id, hue) {
  return {
    defs: `<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0b0f"/><stop offset=".7" stop-color="#121117"/><stop offset="1" stop-color="${hsl(hue, 35, 12)}"/></linearGradient>`
      + `<radialGradient id="${id}glow" cx=".5" cy="1" r=".8"><stop offset="0" stop-color="${hsl(hue, 80, 45, 0.28)}"/><stop offset="1" stop-color="${hsl(hue, 80, 40, 0)}"/></radialGradient>`,
    body: `<rect width="${w}" height="${h}" fill="url(#${id}sky)"/><rect width="${w}" height="${h}" fill="url(#${id}glow)"/>`,
  };
}

function stars(w, h, n, rand) {
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${f(rand() * w)}" cy="${f(rand() * h * 0.8)}" r="${f(0.4 + rand() * 0.9)}" fill="#fff" opacity="${f(0.15 + rand() * 0.45)}"/>`;
  return s;
}

function wrap(w, h, label, defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}"><defs>${defs}</defs>${body}</svg>`;
}

/** Scène d'une famille d'artifices, selon un style. */
function scene({ w, h, hue, hue2, style, seed, label }) {
  const rand = rng(seed);
  const id = seed.replace(/[^a-z0-9]/gi, '').slice(0, 10);
  gid = 0;
  const bg = sky(w, h, id, hue);
  let defs = bg.defs, body = bg.body + stars(w, h, 40, rand);
  const add = (b) => { defs += b.defs; body += b.body; };
  const ground = h * 0.92;

  switch (style) {
    case 'rocket': {
      const x = w * (0.45 + rand() * 0.1), top = h * 0.3;
      body += `<path d="M${f(x - 30)} ${f(ground)}Q${f(x - 10)} ${f(h * 0.6)} ${f(x)} ${f(top + 40)}" stroke="${hsl(hue, 90, 70, 0.55)}" stroke-width="2" fill="none" stroke-dasharray="2 7" stroke-linecap="round"/>`;
      add(burst({ cx: x, cy: top, r: w * 0.3, hue, hue2, rays: 64, rand, id }));
      add(burst({ cx: w * 0.2, cy: h * 0.22, r: w * 0.12, hue: hue2, hue2: hue, rays: 32, rand, id, width: 1.2 }));
      break;
    }
    case 'candle': {
      const x = w * 0.5;
      body += `<rect x="${f(x - 9)}" y="${f(ground - 70)}" width="18" height="70" rx="3" fill="#1f1d24" stroke="${hsl(hue, 30, 35)}"/>`;
      for (let i = 0; i < 6; i++) {
        const y = ground - 110 - i * (h * 0.12);
        const rr = 10 + i * 2.4;
        body += `<circle cx="${f(x + (rand() - 0.5) * 30)}" cy="${f(y)}" r="${f(rr)}" fill="${hsl(i % 2 ? hue : hue2, 95, 62, 0.9)}"/>`
          + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr * 3)}" fill="${hsl(i % 2 ? hue : hue2, 95, 60, 0.08)}"/>`;
      }
      break;
    }
    case 'fountain': {
      const x = w * 0.5;
      let p = '';
      for (let i = 0; i < 90; i++) {
        const a = -Math.PI / 2 + (rand() - 0.5) * 1.1;
        const len = h * (0.3 + rand() * 0.38);
        const x1 = x + Math.cos(a) * len, y1 = ground + Math.sin(a) * len;
        const fall = x1 + (x1 - x) * 0.5, fy = y1 + len * 0.35;
        p += `M${f(x)} ${f(ground - 30)}Q${f(x1)} ${f(y1)} ${f(fall)} ${f(fy)}`;
      }
      defs += `<linearGradient id="${id}fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${hsl(hue, 100, 92)}"/><stop offset=".5" stop-color="${hsl(hue, 95, 62, 0.8)}"/><stop offset="1" stop-color="${hsl(hue2, 90, 50, 0)}"/></linearGradient>`;
      body += `<path d="${p}" stroke="url(#${id}fg)" stroke-width="1.1" fill="none" opacity=".9"/>`
        + `<path d="M${f(x - 28)} ${f(ground)}L${f(x - 18)} ${f(ground - 32)}H${f(x + 18)}L${f(x + 28)} ${f(ground)}Z" fill="#1f1d24" stroke="${hsl(hue, 30, 35)}"/>`;
      break;
    }
    case 'sparkler': {
      const x0 = w * 0.32, y0 = h * 0.85, x1 = w * 0.6, y1 = h * 0.38;
      body += `<line x1="${x0}" y1="${y0}" x2="${f(x1)}" y2="${f(y1)}" stroke="#55505e" stroke-width="5" stroke-linecap="round"/>`;
      add(burst({ cx: x1, cy: y1, r: w * 0.22, hue, hue2, rays: 90, rand, id, droop: 0.04, width: 0.9 }));
      break;
    }
    case 'gear': {
      const cx = w / 2, cy = h * 0.48;
      for (let i = 0; i < 5; i++) {
        body += `<circle cx="${cx}" cy="${f(cy)}" r="${f(w * (0.08 + i * 0.07))}" fill="none" stroke="${hsl(i % 2 ? hue : hue2, 40, 60, 0.5 - i * 0.07)}" stroke-width="${i === 0 ? 3 : 1}"/>`;
      }
      body += `<circle cx="${cx}" cy="${f(cy)}" r="6" fill="${hsl(hue2, 90, 65)}"/>`;
      add(burst({ cx, cy, r: w * 0.1, hue: hue2, hue2: hue, rays: 24, rand, id, droop: 0, width: 1 }));
      break;
    }
    default: { // burst / compacts
      add(burst({ cx: w * 0.5, cy: h * 0.36, r: w * 0.3, hue, hue2, rays: 72, rand, id }));
      add(burst({ cx: w * 0.2, cy: h * 0.5, r: w * 0.14, hue: hue2, hue2: hue, rays: 36, rand, id, width: 1.2 }));
      add(burst({ cx: w * 0.82, cy: h * 0.25, r: w * 0.12, hue: hue + 20, hue2, rays: 30, rand, id, width: 1.1 }));
      for (let i = 0; i < 7; i++) {
        const x = w * (0.2 + i * 0.1);
        body += `<line x1="${f(x)}" y1="${f(ground)}" x2="${f(w * 0.5 + (x - w * 0.5) * 0.3)}" y2="${f(h * 0.45)}" stroke="${hsl(hue, 90, 70, 0.18)}" stroke-width="1.2" stroke-dasharray="1 9"/>`;
      }
    }
  }
  body += `<rect y="${f(ground)}" width="${w}" height="${f(h - ground)}" fill="#09090c"/>`;
  return wrap(w, h, label, defs, body);
}

const STYLE_BY_CATEGORY = (cats) => Object.fromEntries(cats.map((c) => [c.slug, c.art]));

export function categoryArt(cat) {
  return scene({ w: 800, h: 1000, hue: cat.art.hue, hue2: cat.art.hue + 30, style: cat.art.style, seed: `cat-${cat.slug}`, label: `Illustration : ${cat.name}` });
}

export function productArt(p, cats) {
  const style = STYLE_BY_CATEGORY(cats)[p.category]?.style ?? 'burst';
  const a = p.art ?? { hue: 30, hue2: 10 };
  return scene({ w: 800, h: 800, hue: a.hue, hue2: a.hue2 ?? a.hue + 30, style, seed: `p-${p.slug}`, label: `Illustration : ${p.name}` });
}

/** Composition du hero : plusieurs éclatements animables en CSS (classe .burst). */
export function heroArt() {
  const w = 1600, h = 1000, rand = rng('ehshop-hero');
  gid = 0;
  let defs = `<linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08080b"/><stop offset=".75" stop-color="#110f15"/><stop offset="1" stop-color="#1c120c"/></linearGradient>`
    + `<radialGradient id="hglow" cx=".62" cy="1.05" r=".75"><stop offset="0" stop-color="hsla(22,90%,45%,.35)"/><stop offset="1" stop-color="hsla(22,90%,40%,0)"/></radialGradient>`;
  let body = `<rect width="${w}" height="${h}" fill="url(#hsky)"/><rect width="${w}" height="${h}" fill="url(#hglow)"/>` + stars(w, h, 90, rand);
  const specs = [
    { cx: 1130, cy: 330, r: 330, hue: 32, hue2: 12, rays: 110 },
    { cx: 760, cy: 230, r: 170, hue: 48, hue2: 28, rays: 60 },
    { cx: 1420, cy: 560, r: 150, hue: 8, hue2: 340, rays: 54 },
    { cx: 980, cy: 660, r: 110, hue: 40, hue2: 20, rays: 40 },
    { cx: 1480, cy: 170, r: 90, hue: 20, hue2: 45, rays: 36 },
  ];
  specs.forEach((s, i) => {
    const b = burst({ ...s, rand, id: 'h', width: i === 0 ? 2 : 1.4 });
    defs += b.defs;
    body += b.body.replace('<g class="burst">', `<g class="burst burst--${i}" transform-origin="${s.cx} ${s.cy}">`);
  });
  body += `<path d="M0 ${h - 70}L180 ${h - 95}L330 ${h - 80}L520 ${h - 110}L700 ${h - 85}L900 ${h - 120}L1120 ${h - 90}L1300 ${h - 105}L1600 ${h - 80}V${h}H0Z" fill="#060608"/>`;
  return `<svg class="hero__art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}</svg>`;
}

/** Image de partage (Open Graph) 1200×630. */
export function ogArt(brandName) {
  const w = 1200, h = 630, rand = rng('og');
  gid = 0;
  const bg = sky(w, h, 'og', 24);
  let defs = bg.defs, body = bg.body + stars(w, h, 60, rand);
  const b = burst({ cx: 860, cy: 260, r: 230, hue: 32, hue2: 12, rays: 90, rand, id: 'og', width: 2 });
  defs += b.defs; body += b.body;
  body += `<text x="80" y="360" font-family="Georgia, serif" font-size="120" fill="#f4f0e8" letter-spacing="4">${brandName}</text>`
    + `<rect x="84" y="392" width="90" height="4" fill="#e3692b"/>`;
  return wrap(w, h, brandName, defs, body);
}
