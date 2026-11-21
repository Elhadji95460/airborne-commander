// Petites fonctions partagées par le build.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Échappe une valeur pour l'insérer dans du HTML (texte ou attribut). */
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

const priceFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
export const formatPrice = (n) => priceFmt.format(n);

/** Gabarit HTML : html`...` échappe automatiquement les valeurs, sauf celles marquées raw(). */
export class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(s);
export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < vals.length) out += render(vals[i]);
  });
  return raw(out);
}
function render(v) {
  if (v == null || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  return esc(v);
}

/** PRNG déterministe (mulberry32), graine dérivée d'une chaîne. */
export function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const AVAILABILITY = {
  in_stock: { label: 'En stock', tone: 'ok', schema: 'https://schema.org/InStock', orderable: true },
  low_stock: { label: 'Stock limité', tone: 'warn', schema: 'https://schema.org/LimitedAvailability', orderable: true },
  out_of_stock: { label: 'Indisponible', tone: 'off', schema: 'https://schema.org/OutOfStock', orderable: false },
  preorder: { label: 'Sur commande', tone: 'info', schema: 'https://schema.org/PreOrder', orderable: true },
};

/** Minimums d'âge et distances de sécurité de référence par catégorie (directive 2013/29/UE). */
export const REG_CLASSES = {
  F1: { age: 12, distance: '1 m', label: 'Danger très faible, niveau sonore négligeable' },
  F2: { age: 16, distance: '8 m', label: 'Danger faible, niveau sonore faible, usage en espace confiné exclu' },
  F3: { age: 18, distance: '15 m', label: 'Danger moyen, usage en grands espaces ouverts' },
  F4: { age: null, distance: null, label: 'Réservé aux personnes ayant des connaissances particulières' },
  T1: { age: 18, distance: null, label: 'Articles pyrotechniques destinés au théâtre, danger faible' },
  P1: { age: 18, distance: null, label: 'Autres articles pyrotechniques, danger faible' },
};
