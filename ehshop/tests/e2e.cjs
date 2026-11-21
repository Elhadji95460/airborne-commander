// Test de bout en bout du parcours d'achat (Playwright).
// Prérequis : `npm run build` puis `npm run serve` (port 4321). Lancement : node tests/e2e.cjs
const { chromium, devices } = require('playwright');

const B = process.env.BASE_URL || 'http://localhost:4321';
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} ${m}`); if (!c) process.exitCode = 1; };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errs.push(m.text()));

  // Filtres et tri
  await p.goto(`${B}/catalogue/`);
  await p.click('[data-filters-toggle]');
  await p.check('input[name="class"][value="F1"]');
  ok((await p.textContent('[data-listing-count]')) === '2', 'filtre F1 → 2 produits');
  ok(p.url().includes('class=F1'), 'filtre reflété dans l’URL');
  await p.uncheck('input[name="class"][value="F1"]');
  await p.selectOption('[data-sort]', 'price-asc');
  const first = await p.$eval('[data-listing-grid] .pcard:not([hidden])', (el) => el.dataset.slug);
  ok(first === 'allumeurs-lot-5', `tri prix croissant (premier = ${first})`);

  // Ajout depuis une carte
  await p.click('[data-add-to-cart="compact-aurore-25"]');
  await p.waitForSelector('[data-toast]:not([hidden])');
  ok((await p.textContent('[data-cart-count]')) === '1', 'compteur panier = 1');

  // Fiche produit + quantité
  await p.goto(`${B}/produit/compact-meridien-49/`);
  await p.click('[data-qty-inc]');
  await p.click('[data-qty-inc]');
  await p.click('[data-buy-form] button[type=submit]');
  await p.waitForTimeout(300);
  ok((await p.textContent('[data-cart-count]')) === '4', 'compteur panier = 4 après ajout ×3');
  await p.evaluate(() => window.scrollTo(0, 2000));
  await p.waitForTimeout(400);
  ok(await p.isVisible('[data-buybar]'), 'barre d’achat mobile visible au défilement');

  await p.goto(`${B}/produit/fusees-altair-lot-3/`);
  ok(!(await p.$('[data-buy-form]')), 'pas de bouton d’achat sur un produit indisponible');

  // Panier
  await p.goto(`${B}/panier/`);
  await p.waitForSelector('.cline');
  ok((await p.$$('.cline')).length === 2, '2 lignes au panier');
  ok((await p.textContent('.summary__row--total')).includes('276,90'), 'total = 39,90 + 3×79 = 276,90 €');
  await p.click('[data-dec="compact-meridien-49"]');
  await p.waitForTimeout(200);
  ok((await p.textContent('.summary__row--total')).includes('197,90'), 'diminuer la quantité recalcule le total');
  ok((await p.textContent('.cart__aside')).includes('18 ans'), 'âge minimum du panier affiché');

  // Stockage local falsifié : les prix viennent toujours du catalogue
  await p.evaluate(() => localStorage.setItem('ehshop-cart', JSON.stringify({ items: [{ slug: 'compact-aurore-25', qty: 1, price: 0.01 }, { slug: 'inconnu', qty: 2 }, { slug: 'x', qty: -3 }] })));
  await p.reload();
  await p.waitForSelector('.cline');
  ok((await p.$$('.cline')).length === 1 && (await p.textContent('.summary__row--total')).includes('39,90'), 'stockage falsifié : prix relu du catalogue, entrées invalides ignorées');

  // Commande : validation et contrôle d'âge
  await p.goto(`${B}/commande/`);
  await p.waitForSelector('.summary__items');
  await p.click('[data-checkout-submit]');
  ok(await p.isVisible('[data-form-error]'), 'formulaire vide → récapitulatif des erreurs');
  const invalid = (await p.$$('[aria-invalid="true"]')).length;
  ok(invalid >= 10, `champs invalides signalés (${invalid})`);
  const fill = async (birth) => {
    await p.fill('#f-first', 'Test'); await p.fill('#f-last', 'Client');
    await p.fill('#f-email', 'test@example.com'); await p.fill('#f-phone', '0600000000');
    await p.fill('#f-birth', birth); await p.fill('#f-addr', '1 rue X');
    await p.fill('#f-zip', '75001'); await p.fill('#f-city', 'Paris');
    for (const n of ['ageOk', 'regOk', 'cgvOk']) await p.check(`input[name=${n}]`);
  };
  const y = new Date().getFullYear();
  await fill(`${y - 17}-01-01`);
  await p.click('[data-checkout-submit]');
  ok((await p.textContent('[data-form-error]')).includes('au moins 18 ans'), 'acheteur de 17 ans refusé');
  await fill(`${y - 30}-01-01`);
  await p.click('[data-checkout-submit]');
  await p.waitForTimeout(300);
  const msg = await p.textContent('[data-form-error]');
  ok(/pas encore ouverte|envoi a échoué/.test(msg), 'sans canal joignable : message d’erreur clair');
  ok((await p.evaluate(() => JSON.parse(localStorage.getItem('ehshop-cart')).items.length)) === 1, 'panier conservé après échec');

  // Recherche
  await p.goto(`${B}/recherche/?q=FONTAINE`);
  await p.waitForSelector('[data-search-grid] .pcard');
  ok((await p.$$('[data-search-grid] .pcard')).length === 2, 'recherche « FONTAINE » → 2 résultats (casse/accents ignorés)');

  // Menu mobile
  await p.goto(`${B}/`);
  await p.click('[data-drawer-open]');
  ok(await p.isVisible('.drawer__panel'), 'tiroir mobile ouvert');
  await p.keyboard.press('Escape');
  ok(await p.isHidden('[data-drawer]'), 'tiroir fermé par Échap');

  const r = await p.goto(`${B}/nexiste-pas/`);
  ok(r.status() === 404 && (await p.textContent('h1')).includes('introuvable'), 'page 404 personnalisée');
  ok(errs.length === 0, `aucune erreur JavaScript ${errs.length ? JSON.stringify(errs) : ''}`);
  await b.close();
})();
