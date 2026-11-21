// Test de bout en bout du parcours d'achat (Playwright).
// Prérequis : `npm run build` puis `npm run serve` (port 4321). Lancement : node tests/e2e.cjs
// Les dates sont simulées pour tester la restriction réglementaire (data/site.json → regulatoryNotice).
const { chromium, devices } = require('playwright');
const site = require('../data/site.json');

const B = process.env.BASE_URL || 'http://localhost:4321';
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} ${m}`); if (!c) process.exitCode = 1; };
const N = site.regulatoryNotice;
const DURING = new Date(`${N.until}T10:00:00+01:00`);
const AFTER = new Date(`${N.resume}T10:00:00+01:00`);

async function context(b, when, { gate = true } = {}) {
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  if (gate) await ctx.addInitScript(() => { try { localStorage.setItem('ehshop-age-ok', String(Date.now())); } catch {} });
  const p = await ctx.newPage();
  await p.clock.setFixedTime(when);
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errs.push(m.text()));
  return { ctx, p, errs };
}

(async () => {
  const b = await chromium.launch();

  /* ---- Contrôle d'âge à l'entrée */
  {
    const { ctx, p } = await context(b, DURING, { gate: false });
    await p.goto(`${B}/`);
    ok(await p.isVisible('[data-agegate]'), 'contrôle d’âge affiché à la première visite');
    await p.click('[data-agegate-no]');
    ok(await p.isVisible('[data-agegate-msg]'), '« Non » → message de refus, accès bloqué');
    await p.reload();
    await p.click('[data-agegate-yes]');
    ok(await p.isHidden('[data-agegate]'), '« Oui » → accès à la boutique');
    await p.goto(`${B}/boutique/`);
    ok(await p.isHidden('[data-agegate]'), 'réponse mémorisée sur les pages suivantes');
    await ctx.close();
  }

  /* ---- Pendant la restriction */
  {
    const { ctx, p, errs } = await context(b, DURING);
    await p.goto(`${B}/`);
    ok(await p.isVisible('[data-notice]'), 'bandeau du décret visible pendant la période');
    await p.goto(`${B}/produit/inferno/`);
    ok(await p.isDisabled('[data-buy-form] button[type=submit]'), 'produit concerné : ajout au panier bloqué');
    ok((await p.textContent('[data-buy-form] button[type=submit]')).includes('28/11'), 'date de reprise affichée sur le bouton');
    await p.goto(`${B}/produit/trousse-de-premier-secours/`);
    await p.click('[data-buy-form] button[type=submit]');
    await p.waitForSelector('[data-toast]:not([hidden])');
    ok((await p.textContent('[data-cart-count]')) === '1', 'produit non concerné (trousse) : ajout possible');
    // Contournement par stockage local : bloqué au panier et à la commande
    await p.evaluate(() => localStorage.setItem('ehshop-cart', JSON.stringify({ items: [{ slug: 'inferno', qty: 1 }] })));
    await p.goto(`${B}/panier/`);
    await p.waitForSelector('.cline');
    ok(await p.isVisible('.cline__lock'), 'article concerné signalé dans le panier');
    ok((await p.getAttribute('.cart__aside a.btn', 'aria-disabled')) === 'true', 'bouton « Passer commande » désactivé');
    await p.goto(`${B}/commande/`);
    await p.waitForSelector('.summary__items');
    ok(await p.isDisabled('[data-checkout-submit]'), 'envoi de commande bloqué');
    ok(errs.length === 0, `aucune erreur JavaScript ${errs.length ? JSON.stringify(errs) : ''}`);
    await ctx.close();
  }

  /* ---- Après la restriction : parcours complet */
  {
    const { ctx, p, errs } = await context(b, AFTER);
    await p.goto(`${B}/`);
    ok((await p.$('[data-notice]')) === null, 'bandeau retiré automatiquement après la date');

    // Onglets
    await p.click('[role=tab]:has-text("Petits prix")');
    ok(await p.isVisible('#home-tabs-p1'), 'onglets de sélection');

    // Rayon + budget
    await p.goto(`${B}/categorie/feux-d-artifice/?budget=0-13`);
    const visible = await p.$$eval('[data-listing-grid] .pcard:not([hidden])', (els) => els.map((e) => Number(e.dataset.price)));
    ok(visible.length > 0 && visible.every((x) => x <= 13), `filtre budget ≤ 13 € (${visible.length} produits)`);
    await p.click('[data-budget-chip="25-"]');
    const big = await p.$$eval('[data-listing-grid] .pcard:not([hidden])', (els) => els.map((e) => Number(e.dataset.price)));
    ok(big.length > 0 && big.every((x) => x > 25), 'puce budget « Plus de 25 € »');

    // Comparateur
    await p.click('[data-sort-col="shots"]');
    await p.click('[data-sort-col="shots"]');
    const first = await p.$eval('[data-compare] tbody tr', (tr) => Number(tr.dataset.shots));
    ok(first === 240, `comparateur trié par coups décroissants (premier = ${first})`);

    // Favoris
    await p.click('[data-listing-grid] .pcard:not([hidden]) .pcard__fav >> nth=0');
    ok((await p.textContent('[data-fav-count]')) === '1', 'favori ajouté (compteur)');
    await p.goto(`${B}/favoris/`);
    await p.waitForSelector('[data-fav-grid] .pcard');
    ok((await p.$$('[data-fav-grid] .pcard')).length === 1, 'page favoris');

    // Fiche produit + panier
    await p.goto(`${B}/produit/inferno/`);
    ok(await p.isEnabled('[data-buy-form] button[type=submit]'), 'produit de nouveau commandable après la date');
    await p.click('[data-qty-inc]');
    await p.click('[data-buy-form] button[type=submit]');
    await p.waitForSelector('[data-toast]:not([hidden])');
    ok((await p.textContent('[data-cart-count]')) === '2', 'ajout ×2 au panier');
    await p.goto(`${B}/produit/paquet-de-4-fumigenes-multi-couleurs/`);
    ok(!(await p.$('[data-buy-form]')), 'produit épuisé : pas d’achat');

    await p.goto(`${B}/panier/`);
    await p.waitForSelector('.cline');
    ok((await p.textContent('.summary__row--total')).includes('60,00'), 'total = 2 × 25 € + 10 € de port = 60 €');

    // Stockage falsifié : prix relu depuis le catalogue
    await p.evaluate(() => localStorage.setItem('ehshop-cart', JSON.stringify({ items: [{ slug: 'inferno', qty: 1, price: 0.01 }, { slug: 'inconnu', qty: 2 }] })));
    await p.reload();
    await p.waitForSelector('.cline');
    ok((await p.$$('.cline')).length === 1 && (await p.textContent('.summary__row--total')).includes('35,00'), 'stockage falsifié : prix du catalogue, entrée inconnue retirée');

    // Commande
    await p.goto(`${B}/commande/`);
    await p.waitForSelector('.summary__items');
    await p.click('[data-checkout-submit]');
    ok(await p.isVisible('[data-form-error]'), 'formulaire vide → récapitulatif des erreurs');
    await p.check('input[name=zone][value=ue]');
    await p.waitForTimeout(200);
    ok((await p.textContent('.summary__row--total')).includes('50,00'), 'zone UE : 25 € + 25 € de port = 50 €');
    const fill = async (birth) => {
      await p.fill('#f-first', 'Test'); await p.fill('#f-last', 'Client');
      await p.fill('#f-email', 'test@example.com'); await p.fill('#f-phone', '0600000000');
      await p.fill('#f-birth', birth); await p.fill('#f-addr', '1 rue X');
      await p.fill('#f-zip', '75001'); await p.fill('#f-city', 'Paris');
      for (const n of ['ageOk', 'regOk', 'cgvOk']) await p.check(`input[name=${n}]`);
    };
    await fill('2010-01-01');
    await p.click('[data-checkout-submit]');
    ok((await p.textContent('[data-form-error]')).includes('au moins 18 ans'), 'acheteur mineur refusé');
    await fill('1990-01-01');
    let mailto = null;
    p.on('request', (r) => { if (r.url().startsWith('mailto:')) mailto = r.url(); });
    await p.evaluate(() => { window.__nav = []; });
    const [nav] = await Promise.all([
      p.waitForEvent('framenavigated', { timeout: 3000 }).catch(() => null),
      p.click('[data-checkout-submit]'),
    ]);
    await p.waitForTimeout(1200);
    ok(p.url().includes('/commande/confirmation/'), 'commande préparée → page de confirmation');
    ok((await p.textContent('[data-confirm-ref]')).startsWith('Référence : EH-'), 'référence de commande affichée');
    ok((await p.evaluate(() => JSON.parse(localStorage.getItem('ehshop-cart')).items.length)) === 0, 'panier vidé après envoi');

    // Recherche
    await p.goto(`${B}/recherche/?q=30 MM`);
    await p.waitForSelector('[data-search-grid] .pcard');
    const names = await p.$$eval('[data-search-grid] .pcard__title', (els) => els.map((e) => e.textContent));
    ok(names.some((n) => n.includes('Jazz')) && names.some((n) => n.includes('Monocoup 30')), `recherche « 30 MM » → ${names.length} résultats pertinents`);

    // Menu mobile
    await p.goto(`${B}/`);
    await p.click('[data-drawer-open]');
    ok(await p.isVisible('.drawer__panel'), 'tiroir mobile ouvert');
    await p.keyboard.press('Escape');
    ok(await p.isHidden('[data-drawer]'), 'tiroir fermé par Échap');

    const r = await p.goto(`${B}/nexiste-pas/`);
    ok(r.status() === 404 && (await p.textContent('h1')).includes('introuvable'), 'page 404 personnalisée');
    ok(errs.length === 0, `aucune erreur JavaScript ${errs.length ? JSON.stringify(errs) : ''}`);
    await ctx.close();
  }
  await b.close();
})();
