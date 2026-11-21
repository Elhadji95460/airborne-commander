#!/usr/bin/env node
// Génère le site statique dans dist/. Aucune dépendance : `node build.mjs`.
import { readFile, writeFile, mkdir, rm, cp, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { page } from './src/layout.mjs';
import * as P from './src/pages.mjs';
import { infoPages, buildGuides, guidePage } from './src/content.mjs';
import { ogArt } from './src/lib/art.mjs';
import { AVAILABILITY, REG_CLASSES, keySpecs, isRestricted } from './src/lib/util.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'dist');
const readJson = async (f) => JSON.parse(await readFile(join(root, 'data', f), 'utf8'));
const exists = (f) => access(f).then(() => true, () => false);

const site = await readJson('site.json');
const categories = await readJson('categories.json');
const catalog = await readJson('products.json');
const cgv = await readJson('cgv.json');
const redirects = await readJson('redirects.json').catch(() => []);
const products = catalog.products;

/* ---------- Validation : on échoue plutôt que publier une fiche incohérente. */
const errors = [];
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const seen = new Set();
const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
for (const c of categories) if (!slugRe.test(c.slug)) errors.push(`Rayon : slug invalide « ${c.slug} »`);
for (const p of products) {
  const where = `Produit « ${p.slug} »`;
  if (!slugRe.test(p.slug || '')) errors.push(`${where} : slug invalide`);
  if (seen.has(p.slug)) errors.push(`${where} : slug en double`);
  seen.add(p.slug);
  if (!p.name) errors.push(`${where} : nom manquant`);
  if (!categoryBySlug[p.category]) errors.push(`${where} : rayon inconnu « ${p.category} »`);
  if (typeof p.price !== 'number' || !(p.price > 0)) errors.push(`${where} : prix invalide`);
  if (!AVAILABILITY[p.availability]) errors.push(`${where} : disponibilité inconnue « ${p.availability} »`);
  if (!p.image || !(await exists(join(root, 'src', p.image)))) errors.push(`${where} : image introuvable (${p.image})`);
  const r = p.regulatory;
  if (r?.class) {
    if (!REG_CLASSES[r.class]) errors.push(`${where} : catégorie réglementaire inconnue « ${r.class} »`);
    if (['F4', 'T2', 'P2'].includes(r.class)) errors.push(`${where} : la catégorie ${r.class} n'est pas vendable aux particuliers`);
    const min = REG_CLASSES[r.class]?.age;
    if (min && r.minAge && r.minAge < min) errors.push(`${where} : âge ${r.minAge} inférieur au minimum légal ${min} pour ${r.class}`);
  }
}
if (errors.length) {
  console.error('✖ Données invalides :\n  - ' + errors.join('\n  - '));
  process.exit(1);
}

/* ---------- Génération */
const version = createHash('sha1').update(JSON.stringify([site, categories, catalog]) + Date.now()).digest('hex').slice(0, 8);
const ctx = { site, categories, products, categoryBySlug, cgv, demo: !!catalog.demo, version };
ctx.guides = buildGuides(ctx);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const pages = [
  P.home(ctx), P.boutique(ctx), P.comparateur(ctx),
  ...categories.map((c) => P.category(ctx, c)),
  ...P.SELECTIONS.map((s) => P.selection(ctx, s)),
  ...products.map((p) => P.product(ctx, p)),
  P.search(ctx), P.favoris(ctx), P.cart(ctx), P.checkout(ctx), P.confirmation(ctx),
  ...infoPages.map((fn) => fn(ctx)),
  ...ctx.guides.map((g) => guidePage(ctx, g)),
];

const todos = new Map();
for (const pg of pages) {
  const htmlStr = page(ctx, pg);
  for (const m of htmlStr.matchAll(/<mark class="todo"[^>]*>([^<]+) — à compléter<\/mark>/g)) {
    if (!todos.has(m[1])) todos.set(m[1], new Set());
    todos.get(m[1]).add(pg.path);
  }
  const file = pg.path.endsWith('.html') ? join(out, pg.path) : join(out, pg.path, 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, htmlStr);
}
await writeFile(join(out, '404.html'), page(ctx, P.notFound(ctx)));

/* ---------- Assets */
await cp(join(root, 'src/assets'), join(out, 'assets'), { recursive: true });
await writeFile(join(out, 'assets/img/og.svg'), ogArt(site.brand.name));
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#111014"/><g stroke="#E3692B" stroke-width="2" stroke-linecap="round"><path d="M16 5v5M16 22v5M5 16h5M22 16h5M8.2 8.2l3.5 3.5M20.3 20.3l3.5 3.5M8.2 23.8l3.5-3.5M20.3 11.7l3.5-3.5"/></g><circle cx="16" cy="16" r="2.4" fill="#F4F0E8"/></svg>`;
await writeFile(join(out, 'favicon.svg'), mark);
await writeFile(join(out, 'assets/img/logo.svg'), mark);

// Données publiques pour panier, favoris et recherche. Les prix du panier sont toujours relus ici.
const n = site.regulatoryNotice;
const publicCatalog = {
  minimumBuyerAge: site.policy.minimumBuyerAge,
  orderEndpoint: site.order.endpoint,
  orderEmail: site.contact.email,
  shippingZones: site.policy.shippingZones,
  notice: n?.active ? { until: n.until, resume: n.resume, reference: n.reference } : null,
  categories: categories.map(({ slug, name, short }) => ({ slug, name, short })),
  products: products.map((p) => ({
    slug: p.slug, name: p.name, category: p.category, price: p.price, availability: p.availability,
    orderable: AVAILABILITY[p.availability].orderable, image: p.thumb || p.image, tint: !!(p.imageBg && !/^#f[a-f0-9]f/i.test(p.imageBg) && p.imageBg.toLowerCase() !== '#ffffff'),
    class: p.regulatory?.class || null, minAge: p.regulatory?.minAge || null, keys: keySpecs(p), summary: p.summary || '',
    restricted: isRestricted(p, site),
  })),
};
await writeFile(join(out, 'assets/catalog.json'), JSON.stringify(publicCatalog));

/* ---------- SEO / hébergement */
const base = site.brand.baseUrl;
const indexable = pages.filter((pg) => !pg.noindex);
const today = new Date().toISOString().slice(0, 10);
await writeFile(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((pg) => `  <url><loc>${base}${pg.path}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
await writeFile(join(out, 'robots.txt'), `User-agent: *\nDisallow: /panier/\nDisallow: /commande/\nDisallow: /recherche/\nDisallow: /favoris/\n\nSitemap: ${base}/sitemap.xml\n`);

// Redirections 301 des anciennes URL (data/redirects.json). Les chemins non ASCII sont aussi émis encodés.
const encodePath = (s) => s.split('/').map((seg) => encodeURIComponent(seg)).join('/');
const redirLines = redirects.flatMap((r) => [...new Set([r.from, encodePath(r.from)])].map((from) => `${from} ${r.to} 301`));
await writeFile(join(out, '_redirects'), redirLines.join('\n') + '\n');
const reEsc = (s) => s.replace(/^\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[^\x00-\x7F]/g, '.{1,2}');
const ht = [
  'AddDefaultCharset UTF-8',
  'ErrorDocument 404 /404.html',
  'Options -Indexes',
  '<IfModule mod_mime.c>',
  '  AddType image/webp .webp',
  '</IfModule>',
  '<IfModule mod_headers.c>',
  '  Header always set X-Content-Type-Options "nosniff"',
  '  Header always set Referrer-Policy "strict-origin-when-cross-origin"',
  '  Header always set X-Frame-Options "DENY"',
  '  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"',
  `  Header always set Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'${site.order.endpoint ? ' ' + new URL(site.order.endpoint).origin : ''}; form-action 'self' mailto:; frame-ancestors 'none'; base-uri 'self'"`,
  '  <FilesMatch "\\.(woff2|svg|png|jpg|webp)$">',
  '    Header set Cache-Control "public, max-age=31536000, immutable"',
  '  </FilesMatch>',
  '</IfModule>',
  '<IfModule mod_rewrite.c>',
  '  RewriteEngine On',
  '  RewriteCond %{HTTPS} off',
  '  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
  ...redirects.map((r) => `  RewriteRule ^${reEsc(r.from)}/?$ ${r.to.replace(/\?.*/, '')}${r.to.includes('?') ? `?${r.to.split('?')[1]} [L,R=301,QSD]` : ' [L,R=301]'}`),
  '</IfModule>',
].join('\n');
await writeFile(join(out, '.htaccess'), ht + '\n');
await writeFile(join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; form-action 'self' mailto:; frame-ancestors 'none'; base-uri 'self'\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`);

/* ---------- Rapport */
console.log(`✔ ${pages.length + 1} pages générées dans dist/ (${products.length} produits, ${categories.length} rayons, ${ctx.guides.length} guides, ${redirLines.length} redirections)`);
if (ctx.demo) console.warn('⚠ Catalogue de démonstration actif (data/products.json → "demo": true).');
if (n?.active) console.warn(`ℹ Restriction réglementaire configurée du ${n.from} au ${n.until} (${n.reference}) — désactivée automatiquement ensuite côté navigateur.`);
if (todos.size) {
  console.warn(`⚠ ${todos.size} information(s) à compléter avant mise en ligne :`);
  for (const [k, v] of todos) console.warn(`   - ${k}  (${[...v].slice(0, 3).join(', ')}${v.size > 3 ? '…' : ''})`);
}
