import { html, raw, esc } from './lib/util.mjs';

export const logoMark = raw(`<svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 3v6M16 23v6M3 16h6M23 16h6M6.8 6.8l4.2 4.2M21 21l4.2 4.2M6.8 25.2l4.2-4.2M21 11l4.2-4.2"/></g><circle cx="16" cy="16" r="2.6" fill="currentColor"/></svg>`);

export const icon = {
  search: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>'),
  bag: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>'),
  menu: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h10"/></svg>'),
  close: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg>'),
  arrow: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'),
  chevron: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>'),
  shield: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>'),
  doc: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg>'),
  truck: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></svg>'),
  mail: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>'),
  id: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M14.5 10h4M14.5 13.5h3"/></svg>'),
  lock: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/></svg>'),
  alert: raw('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/></svg>'),
};

/** Valeur réelle ou marqueur visible « à compléter » (jamais de donnée inventée). */
export const todo = (v, what) => (v ? esc(v) : `<mark class="todo" title="Information à compléter dans data/site.json">${esc(what)} — à compléter</mark>`);

function infoBar(ctx) {
  const { site } = ctx;
  const items = [];
  items.push(html`<li>${icon.id}<span>Vente réservée aux personnes de ${site.policy.minimumBuyerAge}&nbsp;ans et plus</span></li>`);
  items.push(html`<li>${icon.truck}<a href="/livraison/">Modalités de livraison et de retrait</a></li>`);
  if (site.contact.phone || site.contact.email) {
    const c = site.contact.phone
      ? html`<a href="tel:${site.contact.phone.replace(/\s/g, '')}">${site.contact.phone}</a>`
      : html`<a href="mailto:${site.contact.email}">${site.contact.email}</a>`;
    items.push(html`<li class="infobar__contact">${icon.mail}<span>Service client&nbsp;: ${c}</span></li>`);
  } else {
    items.push(html`<li class="infobar__contact">${icon.mail}<a href="/contact/">Contacter le service client</a></li>`);
  }
  return html`<div class="infobar" role="region" aria-label="Informations boutique"><ul class="container infobar__list">${items}</ul></div>`;
}

function header(ctx) {
  const { categories, path } = ctx;
  const cur = (p) => (path.startsWith(p) ? raw(' aria-current="page"') : '');
  const megaItems = categories.map((c) => html`
    <li><a class="mega__item" href="/categorie/${c.slug}/">
      <img src="/assets/img/cat-${c.slug}.svg" alt="" width="80" height="100" loading="lazy" decoding="async">
      <span><strong>${c.name}</strong><small>${c.description}</small></span>
    </a></li>`);
  return html`
<header class="site-header" data-header>
  <div class="container site-header__bar">
    <button class="icon-btn site-header__burger" type="button" aria-controls="drawer" aria-expanded="false" data-drawer-open aria-label="Ouvrir le menu">${icon.menu}</button>
    <a class="logo" href="/" aria-label="EHSHOP — accueil">${logoMark}<span class="logo__word">EHSHOP</span></a>
    <nav class="mainnav" aria-label="Navigation principale">
      <ul class="mainnav__list">
        <li class="mainnav__mega">
          <button class="mainnav__link" type="button" aria-expanded="false" aria-controls="mega" data-mega-toggle>Catalogue ${icon.chevron}</button>
          <div class="mega" id="mega" hidden data-mega>
            <div class="container mega__inner">
              <ul class="mega__grid">${megaItems}</ul>
              <div class="mega__aside">
                <p class="eyebrow">Tout le catalogue</p>
                <p>Filtrez par famille, catégorie réglementaire et disponibilité.</p>
                <a class="btn btn--ghost-light" href="/catalogue/">Voir tous les produits ${icon.arrow}</a>
              </div>
            </div>
          </div>
        </li>
        <li><a class="mainnav__link" href="/reglementation/"${cur('/reglementation/')}>Réglementation</a></li>
        <li><a class="mainnav__link" href="/livraison/"${cur('/livraison/')}>Livraison</a></li>
        <li><a class="mainnav__link" href="/contact/"${cur('/contact/')}>Contact</a></li>
      </ul>
    </nav>
    <div class="site-header__actions">
      <form class="hsearch" action="/recherche/" method="get" role="search" data-search>
        <label class="sr-only" for="hsearch-q">Rechercher un produit</label>
        <input id="hsearch-q" class="hsearch__input" type="search" name="q" placeholder="Rechercher un produit" autocomplete="off" enterkeyhint="search" data-search-input aria-autocomplete="list" aria-controls="hsearch-results" aria-expanded="false">
        <button class="icon-btn hsearch__btn" type="submit" aria-label="Lancer la recherche">${icon.search}</button>
        <div class="hsearch__results" id="hsearch-results" role="listbox" hidden data-search-results></div>
      </form>
      <a class="icon-btn site-header__search-m" href="/recherche/" aria-label="Rechercher">${icon.search}</a>
      <a class="icon-btn cartbtn" href="/panier/" aria-label="Panier" data-cart-link>${icon.bag}<span class="cartbtn__count" data-cart-count hidden>0</span></a>
    </div>
  </div>
</header>

<div class="drawer" id="drawer" hidden data-drawer>
  <div class="drawer__backdrop" data-drawer-close></div>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="drawer__head">
      <a class="logo" href="/">${logoMark}<span class="logo__word">EHSHOP</span></a>
      <button class="icon-btn" type="button" data-drawer-close aria-label="Fermer le menu">${icon.close}</button>
    </div>
    <form class="drawer__search" action="/recherche/" method="get" role="search">
      <label class="sr-only" for="dsearch-q">Rechercher un produit</label>
      <input id="dsearch-q" type="search" name="q" placeholder="Rechercher un produit" enterkeyhint="search">
      <button type="submit" class="icon-btn" aria-label="Lancer la recherche">${icon.search}</button>
    </form>
    <nav aria-label="Catégories">
      <p class="drawer__label">Catalogue</p>
      <ul class="drawer__cats">
        ${categories.map((c) => html`<li><a href="/categorie/${c.slug}/"><img src="/assets/img/cat-${c.slug}.svg" alt="" width="44" height="55" loading="lazy">${c.name}${icon.arrow}</a></li>`)}
        <li><a href="/catalogue/" class="drawer__all">Tout le catalogue${icon.arrow}</a></li>
      </ul>
      <p class="drawer__label">Informations</p>
      <ul class="drawer__links">
        <li><a href="/reglementation/">Réglementation & sécurité</a></li>
        <li><a href="/livraison/">Livraison & retrait</a></li>
        <li><a href="/faq/">Questions fréquentes</a></li>
        <li><a href="/a-propos/">À propos</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul>
    </nav>
  </div>
</div>`;
}

function footer(ctx) {
  const { site, categories } = ctx;
  const c = site.contact;
  const socials = Object.entries(site.social).filter(([k, v]) => v && !k.startsWith('_'));
  return html`
<footer class="site-footer">
  <div class="container site-footer__top">
    <div class="site-footer__brand">
      <a class="logo logo--light" href="/">${logoMark}<span class="logo__word">EHSHOP</span></a>
      <p>${site.brand.tagline}. Vente d'articles pyrotechniques dans le respect de la réglementation en vigueur.</p>
      <p class="site-footer__age">${icon.id}<span>Vente interdite aux moins de ${site.policy.minimumBuyerAge}&nbsp;ans. Une vérification de l'âge est réalisée à la commande.</span></p>
    </div>
    <nav class="site-footer__col" aria-label="Catalogue">
      <h2>Catalogue</h2>
      <ul>${categories.map((x) => html`<li><a href="/categorie/${x.slug}/">${x.name}</a></li>`)}<li><a href="/catalogue/">Tous les produits</a></li></ul>
    </nav>
    <nav class="site-footer__col" aria-label="Aide">
      <h2>Aide</h2>
      <ul>
        <li><a href="/livraison/">Livraison & retrait</a></li>
        <li><a href="/reglementation/">Réglementation & sécurité</a></li>
        <li><a href="/faq/">Questions fréquentes</a></li>
        <li><a href="/panier/">Mon panier</a></li>
        <li><a href="/a-propos/">À propos</a></li>
      </ul>
    </nav>
    <div class="site-footer__col">
      <h2>Contact</h2>
      <ul class="site-footer__contact">
        <li>${raw(c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : todo(null, 'E-mail'))}</li>
        <li>${raw(c.phone ? `<a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a>` : todo(null, 'Téléphone'))}</li>
        ${c.hours ? html`<li>${c.hours}</li>` : ''}
        <li><a href="/contact/">Formulaire de contact</a></li>
      </ul>
      ${socials.length ? html`<ul class="site-footer__social">${socials.map(([k, v]) => html`<li><a href="${v}" rel="noopener" target="_blank">${k[0].toUpperCase() + k.slice(1)}</a></li>`)}</ul>` : ''}
    </div>
  </div>
  <div class="site-footer__legal">
    <div class="container site-footer__legal-inner">
      <p>© <span data-year>${new Date().getFullYear()}</span> ${site.company.legalName || site.brand.name}. Tous droits réservés.</p>
      <ul>
        <li><a href="/mentions-legales/">Mentions légales</a></li>
        <li><a href="/cgv/">Conditions générales de vente</a></li>
        <li><a href="/confidentialite/">Confidentialité</a></li>
        <li><a href="/cookies/">Cookies</a></li>
      </ul>
    </div>
  </div>
</footer>`;
}

function demoBanner(ctx) {
  if (!ctx.demo) return '';
  return html`<div class="demo-banner" role="note"><div class="container"><strong>Catalogue de démonstration</strong> — produits et prix fictifs, pour la mise en page uniquement.</div></div>`;
}

export function page(ctx, { title, description, path, body, jsonld = [], bodyClass = '', noindex = false, ogType = 'website', image }) {
  const { site } = ctx;
  const url = site.brand.baseUrl + path;
  const fullTitle = path === '/' ? `${site.brand.name} — ${site.brand.tagline}` : `${title} | ${site.brand.name}`;
  const ogImage = site.brand.baseUrl + (image || '/assets/img/og.jpg');
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Organization', name: site.company.legalName || site.brand.name,
      url: site.brand.baseUrl, logo: `${site.brand.baseUrl}/assets/img/logo.svg`,
      ...(site.contact.email || site.contact.phone ? { contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', ...(site.contact.email && { email: site.contact.email }), ...(site.contact.phone && { telephone: site.contact.phone }) } } : {}),
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
${demoBanner(ctx)}
${infoBar(ctx)}
${header({ ...ctx, path })}
<main id="contenu" tabindex="-1">
${body}
</main>
${footer(ctx)}
<div class="toast" role="status" aria-live="polite" data-toast hidden></div>
</body>
</html>
`;
}
