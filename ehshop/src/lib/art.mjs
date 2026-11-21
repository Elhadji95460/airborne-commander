// Illustrations SVG générées (déterministes) : décor du hero et image de partage.
// Volontairement abstraites : elles évoquent un feu d'artifice sans représenter un produit.
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
