import { html, raw, esc, frDate, frDateShort } from './lib/util.mjs';

export const logoMark = raw(`<svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 3v6M16 23v6M3 16h6M23 16h6M6.8 6.8l4.2 4.2M21 21l4.2 4.2M6.8 25.2l4.2-4.2M21 11l4.2-4.2"/></g><circle cx="16" cy="16" r="2.6" fill="currentColor"/></svg>`);

const svg = (d) => raw(`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`);
export const icon = {
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  bag: svg('<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
  heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h10"/>'),
  close: svg('<path d="m6 6 12 12M18 6 6 18"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  chevron: svg('<path d="m6 9 6 6 6-6"/>'),
  phone: svg('<path d="M6.5 3.5h3l1.5 4-2 1.2a11 11 0 0 0 6.3 6.3l1.2-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>'),
  shield: svg('<path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6z"/><path d="m9 12 2 2 4-4"/>'),
  doc: svg('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  truck: svg('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  id: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M14.5 10h4M14.5 13.5h3"/>'),
  lock: svg('<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>'),
  alert: svg('<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>'),
  spark: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>'),
  target: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  burst: svg('<circle cx="12" cy="12" r="2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M5.3 18.7l2.8-2.8M15.9 8.1l2.8-2.8"/>'),
  scale: svg('<path d="M12 4v16M6 20h12M5 8h14M7 8l-3 6a3 3 0 0 0 6 0zM17 8l-3 6a3 3 0 0 0 6 0z"/>'),
  euro: svg('<path d="M17.5 6.5A7 7 0 1 0 17.5 17.5M4 10.5h9M4 13.5h9"/>'),
  users: svg('<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.8-3.2 3.2-5 6-5s5.2 1.8 6 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16.5 14.6c2.3.3 4 1.9 4.5 4.4"/>'),
  book: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>'),
};

/** Valeur réelle ou marqueur visible « à compléter » (jamais de donnée inventée). */
export const todo = (v, what) => (v ? esc(v) : `<mark class="todo" title="Information à compléter dans data/site.json">${esc(what)} — à compléter</mark>`);

export const telHref = (phone) => `tel:+33${phone.replace(/\s/g, '').replace(/^0/, '')}`;

function noticeBar(ctx) {
  const n = ctx.site.regulatoryNotice;
  if (!n?.active) return '';
  return html`<div class="notice" role="region" aria-label="Information réglementaire" data-notice data-from="${n.from}" data-until="${n.until}">
  <div class="container notice__inner">${icon.alert}<p class="notice__long"><strong>${n.reference}</strong> — vente de certains artifices F2/F3 suspendue jusqu’au ${frDate(n.until)} inclus. Expédition des articles concernés à partir du ${frDate(n.resume)}.</p><p class="notice__short"><strong>Décret du 14/11</strong> : vente de certains artifices suspendue jusqu’au ${frDateShort(n.until)} inclus.</p><a href="/conseils/decret-14-novembre-2026/">En savoir plus</a></div>
</div>`;
}

function infoBar(ctx) {
  const { site } = ctx;
  const fr = site.policy.shippingZones.find((z) => z.id === 'fr');
  return html`<div class="infobar" role="region" aria-label="Informations boutique"><ul class="container infobar__list">
  <li>${icon.truck}<a href="/livraison/">Livraison à domicile${fr ? ` · France métropolitaine ${fr.price} €` : ''}</a></li>
  <li>${icon.lock}<span>Paiement sécurisé SumUp ou virement</span></li>
  <li>${icon.id}<span>Vente réservée aux ${site.policy.minimumBuyerAge}&nbsp;ans et plus</span></li>
  <li>${icon.phone}<a href="${telHref(site.contact.phone)}">Service client ${site.contact.phone}</a></li>
</ul></div>`;
}

function header(ctx) {
  const { categories, products, site, path } = ctx;
  const cur = (p) => (path.startsWith(p) ? raw(' aria-current="page"') : '');
  const fireworks = categories[0];
  const tops = products.filter((p) => p.category === fireworks.slug && p.featured).concat(products.filter((p) => p.category === fireworks.slug && !p.featured)).slice(0, 4);
  return html`
<header class="site-header" data-header>
  <div class="container site-header__bar">
    <button class="icon-btn site-header__burger" type="button" aria-controls="drawer" aria-expanded="false" data-drawer-open aria-label="Ouvrir le menu">${icon.menu}</button>
    <a class="logo" href="/" aria-label="EHSHOP — accueil">${logoMark}<span class="logo__word">EHSHOP</span></a>
    <form class="hsearch" action="/recherche/" method="get" role="search" data-search>
      <label class="sr-only" for="hsearch-q">Rechercher un produit</label>
      <input id="hsearch-q" class="hsearch__input" type="search" name="q" placeholder="Rechercher : compact, pétard, fumigène…" autocomplete="off" enterkeyhint="search" data-search-input aria-autocomplete="list" aria-controls="hsearch-results" aria-expanded="false">
      <button class="hsearch__btn" type="submit" aria-label="Lancer la recherche">${icon.search}</button>
      <div class="hsearch__results" id="hsearch-results" role="listbox" hidden data-search-results></div>
    </form>
    <div class="site-header__actions">
      <a class="hphone" href="${telHref(site.contact.phone)}">${icon.phone}<span><small>Service client</small>${site.contact.phone}</span></a>
      <a class="icon-btn site-header__search-m" href="/recherche/" aria-label="Rechercher">${icon.search}</a>
      <a class="icon-btn favbtn" href="/favoris/" aria-label="Favoris">${icon.heart}<span class="badge-count" data-fav-count hidden>0</span></a>
      <a class="cartbtn" href="/panier/" aria-label="Panier" data-cart-link>
        <span class="cartbtn__icon">${icon.bag}<span class="badge-count" data-cart-count hidden>0</span></span>
        <span class="cartbtn__txt"><small>Panier</small><strong data-cart-total>0,00 €</strong></span>
      </a>
    </div>
  </div>
  <nav class="catnav" aria-label="Rayons">
    <div class="container catnav__inner">
      <ul class="catnav__list">
        <li class="catnav__mega">
          <button class="catnav__link" type="button" aria-expanded="false" aria-controls="mega" data-mega-toggle${cur(`/categorie/${fireworks.slug}/`)}>${fireworks.name} ${icon.chevron}</button>
          <div class="mega" id="mega" hidden data-mega>
            <div class="container mega__inner">
              <div class="mega__col">
                <p class="mega__title">Par budget</p>
                <ul>
                  <li><a href="/categorie/${fireworks.slug}/?budget=0-13">Petits prix — jusqu’à 13 €</a></li>
                  <li><a href="/categorie/${fireworks.slug}/?budget=13-25">De 13 à 25 €</a></li>
                  <li><a href="/categorie/${fireworks.slug}/?budget=25-">Plus de 25 €</a></li>
                </ul>
              </div>
              <div class="mega__col">
                <p class="mega__title">Pour choisir</p>
                <ul>
                  <li><a href="/comparateur-compacts/">Comparateur de compacts</a></li>
                  <li><a href="/selection/gros-calibres/">Gros calibres (25 mm et plus)</a></li>
                  <li><a href="/conseils/choisir-son-compact/">Comment choisir son compact</a></li>
                  <li><a href="/categorie/${fireworks.slug}/">Tous les feux d’artifice</a></li>
                </ul>
              </div>
              <ul class="mega__products">${tops.map((p) => html`<li><a href="/produit/${p.slug}/"><span class="mega__img"><img src="${p.thumb}" alt="" width="120" height="120" loading="lazy"></span><span>${p.name}<small>${p.price.toFixed(2).replace('.', ',')} €</small></span></a></li>`)}</ul>
            </div>
          </div>
        </li>
        ${categories.slice(1).map((c) => html`<li><a class="catnav__link" href="/categorie/${c.slug}/"${cur(`/categorie/${c.slug}/`)}>${c.short}</a></li>`)}
      </ul>
      <ul class="catnav__aside">
        <li><a class="catnav__link" href="/conseils/"${cur('/conseils/')}>Conseils</a></li>
        <li><a class="catnav__link catnav__link--pro" href="/professionnels/"${cur('/professionnels/')}>Professionnels</a></li>
      </ul>
    </div>
  </nav>
</header>

<div class="drawer" id="drawer" hidden data-drawer>
  <div class="drawer__backdrop" data-drawer-close></div>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="drawer__head">
      <a class="logo" href="/">${logoMark}<span class="logo__word">EHSHOP</span></a>
      <button class="icon-btn" type="button" data-drawer-close aria-label="Fermer le menu">${icon.close}</button>
    </div>
    <nav aria-label="Rayons">
      <p class="drawer__label">Rayons</p>
      <ul class="drawer__cats">
        ${categories.map((c) => html`<li><a href="/categorie/${c.slug}/"><span class="drawer__img"><img src="${c.image}" alt="" width="48" height="48" loading="lazy"></span>${c.name}${icon.arrow}</a></li>`)}
      </ul>
      <p class="drawer__label">Feux d’artifice par budget</p>
      <ul class="drawer__chips">
        <li><a href="/categorie/${fireworks.slug}/?budget=0-13">Jusqu’à 13 €</a></li>
        <li><a href="/categorie/${fireworks.slug}/?budget=13-25">13 à 25 €</a></li>
        <li><a href="/categorie/${fireworks.slug}/?budget=25-">Plus de 25 €</a></li>
      </ul>
      <p class="drawer__label">Aide & infos</p>
      <ul class="drawer__links">
        <li><a href="/comparateur-compacts/">Comparateur de compacts</a></li>
        <li><a href="/conseils/">Conseils & guides</a></li>
        <li><a href="/livraison/">Livraison & frais de port</a></li>
        <li><a href="/reglementation/">Réglementation & sécurité</a></li>
        <li><a href="/professionnels/">Professionnels & collectivités</a></li>
        <li><a href="/faq/">Questions fréquentes</a></li>
        <li><a href="/favoris/">Mes favoris</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul>
    </nav>
    <a class="btn btn--accent btn--block drawer__call" href="${telHref(site.contact.phone)}">${icon.phone} ${site.contact.phone}</a>
  </div>
</div>`;
}

function footer(ctx) {
  const { site, categories } = ctx;
  const c = site.contact;
  const co = site.company;
  const socials = Object.entries(site.social).filter(([k, v]) => v && !k.startsWith('_'));
  return html`
<section class="reassure" aria-label="Nos engagements">
  <ul class="container reassure__list">
    <li>${icon.truck}<div><strong>Livraison à domicile</strong><span>Transporteur agréé ADR · France ${site.policy.shippingZones[0].price} €, UE ${site.policy.shippingZones[1].price} €</span></div></li>
    <li>${icon.lock}<div><strong>Paiement sécurisé</strong><span>Carte bancaire via SumUp ou virement</span></div></li>
    <li>${icon.phone}<div><strong>Un conseil ?</strong><span><a href="${telHref(c.phone)}">${c.phone}</a> · <a href="mailto:${c.email}">e-mail</a></span></div></li>
    <li>${icon.id}<div><strong>Vente encadrée</strong><span>Réservée aux ${site.policy.minimumBuyerAge}&nbsp;ans et plus, âge vérifié</span></div></li>
  </ul>
</section>
<footer class="site-footer">
  <div class="container site-footer__top">
    <div class="site-footer__brand">
      <a class="logo logo--light" href="/">${logoMark}<span class="logo__word">EHSHOP</span></a>
      <p>${site.brand.tagline} livrés à domicile. Artifices de la marque ${site.brand.productBrand}, vendus dans le respect de la réglementation.</p>
      <a class="site-footer__phone" href="${telHref(c.phone)}">${icon.phone}<span><small>Service client</small>${c.phone}</span></a>
      <a class="site-footer__mail" href="mailto:${c.email}">${c.email}</a>
    </div>
    <nav class="site-footer__col" aria-label="Rayons">
      <h2>Rayons</h2>
      <ul>${categories.map((x) => html`<li><a href="/categorie/${x.slug}/">${x.name}</a></li>`)}<li><a href="/boutique/">Toute la boutique</a></li></ul>
    </nav>
    <nav class="site-footer__col" aria-label="Aide">
      <h2>Aide</h2>
      <ul>
        <li><a href="/livraison/">Livraison & frais de port</a></li>
        <li><a href="/cgv/#art-9">Rétractation & retours</a></li>
        <li><a href="/reglementation/">Réglementation & sécurité</a></li>
        <li><a href="/faq/">Questions fréquentes</a></li>
        <li><a href="/conseils/">Conseils & guides</a></li>
        <li><a href="/comparateur-compacts/">Comparateur de compacts</a></li>
      </ul>
    </nav>
    <nav class="site-footer__col" aria-label="EHSHOP">
      <h2>EHSHOP</h2>
      <ul>
        <li><a href="/a-propos/">À propos</a></li>
        <li><a href="/professionnels/">Professionnels & collectivités</a></li>
        <li><a href="/contact/">Contact</a></li>
        <li><a href="/favoris/">Mes favoris</a></li>
      </ul>
      ${socials.length ? html`<ul class="site-footer__social">${socials.map(([k, v]) => html`<li><a href="${v}" rel="noopener" target="_blank">${k === 'twitter' ? 'X (Twitter)' : k[0].toUpperCase() + k.slice(1)}</a></li>`)}</ul>` : ''}
    </nav>
  </div>
  <div class="container site-footer__company">
    <p>${site.brand.name} est édité par ${co.legalName} ${co.legalForm} au capital de ${co.shareCapital} · ${co.address} · ${co.rcs} ${co.siren} · TVA ${co.vatNumber}</p>
  </div>
  <div class="site-footer__legal">
    <div class="container site-footer__legal-inner">
      <p>© ${new Date().getFullYear()} ${site.brand.name}. Tous droits réservés.</p>
      <ul>
        <li><a href="/mentions-legales/">Mentions légales</a></li>
        <li><a href="/cgv/">CGV</a></li>
        <li><a href="/confidentialite/">Confidentialité</a></li>
        <li><a href="/cookies/">Cookies</a></li>
      </ul>
    </div>
  </div>
</footer>`;
}

function ageGate(ctx) {
  const age = ctx.site.policy.minimumBuyerAge;
  return html`<div class="agegate" hidden data-agegate>
  <div class="agegate__panel" role="dialog" aria-modal="true" aria-labelledby="agegate-title" aria-describedby="agegate-text">
    <span class="agegate__mark">${logoMark}</span>
    <h2 id="agegate-title">Site réservé aux personnes majeures</h2>
    <p id="agegate-text">EHSHOP vend des articles pyrotechniques dont la vente est interdite aux mineurs. Avez-vous ${age}&nbsp;ans ou plus&nbsp;?</p>
    <div class="agegate__actions">
      <button class="btn btn--accent btn--lg" type="button" data-agegate-yes>Oui, j’ai ${age} ans ou plus</button>
      <button class="btn btn--outline-light btn--lg" type="button" data-agegate-no>Non</button>
    </div>
    <p class="agegate__no" data-agegate-msg hidden>L’accès à la boutique est réservé aux personnes de ${age}&nbsp;ans et plus. Vous pouvez consulter nos <a href="/reglementation/">informations de sécurité</a>.</p>
    <p class="agegate__fine">Votre date de naissance sera également vérifiée lors de la commande.</p>
  </div>
</div>`;
}

export function page(ctx, { title, description, path, body, jsonld = [], bodyClass = '', noindex = false, ogType = 'website', image }) {
  const { site } = ctx;
  const url = site.brand.baseUrl + path;
  const fullTitle = path === '/' ? `Feux d'artifice F2/F3, pétards et fumigènes en ligne | ${site.brand.name}` : `${title} | ${site.brand.name}`;
  const ogImage = image ? (image.startsWith('http') ? image : site.brand.baseUrl + image) : `${site.brand.baseUrl}/assets/img/og.jpg`;
  const co = site.company;
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Organization', '@id': `${site.brand.baseUrl}/#organization`, name: site.brand.name,
      legalName: `${co.legalName} ${co.legalForm}`, url: site.brand.baseUrl, logo: `${site.brand.baseUrl}/assets/img/logo.svg`,
      email: site.contact.email, telephone: site.contact.phone, vatID: co.vatNumber,
      address: { '@type': 'PostalAddress', streetAddress: '59 rue de Ponthieu', postalCode: '75008', addressLocality: 'Paris', addressCountry: 'FR' },
      sameAs: Object.values(site.social).filter((v) => typeof v === 'string' && v.startsWith('http')),
    },
    ...jsonld,
  ];
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : ''}
<meta name="theme-color" content="#111014">
<meta name="color-scheme" content="light">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(site.brand.name)}">
<meta property="og:locale" content="${esc(site.brand.locale)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/manrope-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/instrument-serif.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/main.css?v=${ctx.version}">
<script type="application/ld+json">${JSON.stringify(ld.length === 1 ? ld[0] : ld).replace(/</g, '\\u003c')}</script>
<script src="/assets/js/app.js?v=${ctx.version}" defer></script>
</head>
<body class="${esc(bodyClass)}">
<a class="skip" href="#contenu">Aller au contenu</a>
${noticeBar(ctx)}
${infoBar(ctx)}
${header({ ...ctx, path })}
<main id="contenu" tabindex="-1">
${body}
</main>
${footer(ctx)}
${ageGate(ctx)}
<div class="toast" role="status" aria-live="polite" data-toast hidden></div>
</body>
</html>
`;
}
