import { html, raw, formatPrice, AVAILABILITY, REG_CLASSES, spec, calibreMm, pricePerShot, isRestricted, frDate } from './lib/util.mjs';
import { heroArt } from './lib/art.mjs';
import { icon, telHref } from './layout.mjs';
import { productCard, productImage, breadcrumbs, sectionHead, productListing, availabilityTag, regTag, productTabs, productRow, compareTable } from './components.mjs';

/* Sélections calculées à partir des données réelles (aucun classement inventé). */
export const SELECTIONS = [
  { slug: 'petits-prix', name: 'Petits prix', title: 'Feux d’artifice petits prix', text: 'Compacts jusqu’à 13 €, pour composer un feu à petit budget.', pick: (ps) => ps.filter((p) => p.category === 'feux-d-artifice' && p.price <= 13) },
  { slug: 'gros-calibres', name: 'Gros calibres', title: 'Gros calibres — 25 mm et plus', text: 'Compacts et monocoups de 25 à 37 mm : des tirs plus hauts et plus larges, pour un final.', pick: (ps) => ps.filter((p) => (calibreMm(p) || 0) >= 25) },
  { slug: 'packs', name: 'Packs & ensembles', title: 'Packs et ensembles prêts pour la fête', text: 'Fusées, pétards, chandelles et cierges réunis dans un même lot.', pick: (ps) => ps.filter((p) => p.category === 'fusees-packs') },
];

/* ------------------------------------------------------------------ Accueil */
export function home(ctx) {
  const { products, categories, site } = ctx;
  const avail = (ps) => ps.filter((p) => AVAILABILITY[p.availability].orderable);
  const featured = products.filter((p) => p.featured);
  const fireworks = products.filter((p) => p.category === 'feux-d-artifice');
  const cheapest = Math.min(...fireworks.map((p) => p.price));
  const sel = Object.fromEntries(SELECTIONS.map((s) => [s.slug, s.pick(products)]));
  const count = (slug) => products.filter((p) => p.category === slug).length;
  const heroProducts = featured.filter((p) => p.category === 'feux-d-artifice').concat(fireworks.filter((p) => !p.featured).sort((a, b) => b.price - a.price)).slice(0, 3);
  const fr = site.policy.shippingZones[0];

  const body = html`
<section class="hero" aria-labelledby="hero-title">
  ${raw(heroArt())}
  <div class="hero__veil" aria-hidden="true"></div>
  <div class="container hero__inner">
    <div class="hero__copy">
      <p class="eyebrow eyebrow--light">Compacts F2 &amp; F3 · pétards · fumigènes</p>
      <h1 class="hero__title" id="hero-title">Feux d’artifice et pétards,<br><em>livrés chez vous.</em></h1>
      <p class="hero__text">Compacts dès ${formatPrice(cheapest)}, livraison à domicile par transporteur agréé — ${fr.price}&nbsp;€ en France métropolitaine.</p>
      <div class="hero__ctas">
        <a class="btn btn--accent btn--lg" href="/categorie/feux-d-artifice/">Voir les feux d’artifice ${icon.arrow}</a>
        <a class="btn btn--ghost-light btn--lg" href="/comparateur-compacts/">Comparer les compacts</a>
      </div>
    </div>
    <ul class="hero__picks" aria-label="À la une">
      ${heroProducts.map((p) => html`<li><a href="/produit/${p.slug}/"><img src="${p.thumb}" alt="" width="480" height="480"><span><strong>${p.name}</strong><small>${[spec(p, 'Nombre de coups') && `${spec(p, 'Nombre de coups')} coups`, spec(p, 'Calibre')].filter(Boolean).join(' · ')}</small><em>${formatPrice(p.price)}</em></span></a></li>`)}
    </ul>
  </div>
</section>

<section class="section section--rayons" aria-labelledby="cats-title">
  <div class="container">
    ${sectionHead({ eyebrow: 'Nos rayons', title: 'Que voulez-vous tirer ?', id: 'cats-title', link: { href: '/boutique/', label: 'Toute la boutique' } })}
    <ul class="rayons">
      ${categories.map((c) => html`<li><a class="rayon" href="/categorie/${c.slug}/">
        <span class="rayon__img"><img src="${c.image}" alt="" width="480" height="480" loading="lazy"></span>
        <span class="rayon__name">${c.name}</span>
        <span class="rayon__count">${count(c.slug)} produit${count(c.slug) > 1 ? 's' : ''}</span>
      </a></li>`)}
    </ul>
  </div>
</section>

<section class="section section--tint" aria-labelledby="sel-title">
  <div class="container">
    ${sectionHead({ eyebrow: 'La boutique', title: 'Nos sélections', id: 'sel-title' })}
    ${productTabs([
      { label: 'En tendance', items: featured, link: { href: '/boutique/', label: 'Voir toute la boutique' } },
      { label: 'Petits prix', items: avail(sel['petits-prix']).slice(0, 8), link: { href: '/selection/petits-prix/', label: 'Tous les petits prix' } },
      { label: 'Gros calibres', items: avail(sel['gros-calibres']), link: { href: '/selection/gros-calibres/', label: 'Tous les gros calibres' } },
      { label: 'Pétards', items: avail(products.filter((p) => p.category === 'petards')), link: { href: '/categorie/petards/', label: 'Tous les pétards' } },
    ], ctx, 'home-tabs')}
  </div>
</section>

<section class="section" aria-labelledby="cmp-title">
  <div class="container cmp-teaser">
    <div class="cmp-teaser__intro">
      <p class="eyebrow">Comparateur</p>
      <h2 class="shead__title" id="cmp-title">Le bon compact, en un coup d’œil</h2>
      <p>Nombre de coups, calibre, durée et prix au coup&nbsp;: comparez nos ${fireworks.filter((p) => spec(p, 'Nombre de coups')).length} compacts côte à côte, puis triez selon ce qui compte pour vous.</p>
      <a class="btn btn--dark btn--lg" href="/comparateur-compacts/">Ouvrir le comparateur ${icon.arrow}</a>
    </div>
    <div class="cmp-teaser__table">${compareTable(fireworks, { limit: 6 })}</div>
  </div>
</section>

<section class="section section--tint" aria-labelledby="ideas-title">
  <div class="container">
    ${sectionHead({ eyebrow: 'Idées', title: 'Pour chaque envie', id: 'ideas-title' })}
    <ul class="ideas">
      ${SELECTIONS.map((s) => {
        const items = s.pick(products);
        return html`<li><a class="idea" href="/selection/${s.slug}/">
          <span class="idea__imgs">${items.slice(0, 3).map((p) => html`<img src="${p.thumb}" alt="" width="160" height="160" loading="lazy">`)}</span>
          <span class="idea__body"><strong>${s.name}</strong><span>${s.text}</span><em>${items.length} produits ${icon.arrow}</em></span>
        </a></li>`;
      })}
      <li><a class="idea" href="/categorie/fumigenes-torches/">
        <span class="idea__imgs">${products.filter((p) => p.category === 'fumigenes-torches').map((p) => html`<img src="${p.thumb}" alt="" width="160" height="160" loading="lazy">`)}</span>
        <span class="idea__body"><strong>Photos & supporters</strong><span>Fumées colorées et torches pour les photos, les stades et les fêtes.</span><em>${count('fumigenes-torches')} produits ${icon.arrow}</em></span>
      </a></li>
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="guides-title">
  <div class="container">
    ${sectionHead({ eyebrow: 'Conseils', title: 'Bien choisir, bien tirer', id: 'guides-title', link: { href: '/conseils/', label: 'Tous les conseils' } })}
    <ul class="guides">${ctx.guides.slice(0, 3).map((g) => html`<li><a class="guide-card" href="/conseils/${g.slug}/"><span class="guide-card__icon">${icon[g.icon] || icon.book}</span><strong>${g.title}</strong><span>${g.lead}</span><em>Lire ${icon.arrow}</em></a></li>`)}</ul>
  </div>
</section>

<section class="section section--dark pro-band" aria-labelledby="pro-title">
  <div class="container pro-band__inner">
    <div>
      <p class="eyebrow eyebrow--light">Professionnels & collectivités</p>
      <h2 class="shead__title" id="pro-title">Comité des fêtes, commune, association ?</h2>
      <p>Les commandes des professionnels et des collectivités font l’objet d’un devis. Dites-nous ce que vous préparez.</p>
    </div>
    <div class="pro-band__actions">
      <a class="btn btn--accent btn--lg" href="/professionnels/">Demander un devis</a>
      <a class="btn btn--ghost-light btn--lg" href="${telHref(site.contact.phone)}">${icon.phone} ${site.contact.phone}</a>
    </div>
  </div>
</section>

${trustBlock(ctx)}`;

  const ld = [{
    '@context': 'https://schema.org', '@type': 'WebSite', name: site.brand.name, url: site.brand.baseUrl,
    potentialAction: { '@type': 'SearchAction', target: `${site.brand.baseUrl}/recherche/?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  }];
  return { path: '/', title: 'Accueil', description: `Feux d'artifice F2 et F3, compacts dès ${cheapest} €, pétards, chandelles, fumigènes : livraison à domicile par transporteur agréé. Vente réservée aux ${site.policy.minimumBuyerAge} ans et plus.`, body, jsonld: ld, bodyClass: 'is-home' };
}

export function trustBlock(ctx) {
  const { site } = ctx;
  const c = site.contact;
  const co = site.company;
  const items = [
    { ic: icon.doc, t: 'Une société identifiée', d: `${co.legalName} ${co.legalForm}, ${co.address.replace(', France', '')} — ${co.rcs} ${co.siren}.`, href: '/mentions-legales/', l: 'Mentions légales' },
    { ic: icon.phone, t: 'Un service client joignable', d: `Par téléphone au ${c.phone} ou par e-mail à ${c.email}.`, href: '/contact/', l: 'Nous contacter' },
    { ic: icon.truck, t: 'Un transport réglementé', d: 'Les artifices voyagent par transporteur habilité ADR, livrés à une personne majeure.', href: '/livraison/', l: 'Livraison & frais' },
    { ic: icon.id, t: 'Vérification de l’âge', d: `Vente réservée aux ${site.policy.minimumBuyerAge} ans et plus : date de naissance demandée, pièce d’identité possible.`, href: '/reglementation/#age', l: 'Règles de vente' },
    { ic: icon.scale, t: 'Vos droits préservés', d: `Rétractation 14 jours, garanties légales, médiateur de la consommation (${site.policy.mediator.name.match(/\(([^)]+)\)/)?.[1] || 'CM2C'}).`, href: '/cgv/', l: 'Conditions de vente' },
    { ic: icon.lock, t: 'Paiement sécurisé', d: 'Carte bancaire via SumUp : vos données bancaires ne nous sont jamais transmises. Ou virement.', href: '/cgv/#art-6', l: 'Moyens de paiement' },
  ];
  return html`
<section class="section trust" aria-labelledby="trust-title">
  <div class="container">
    ${sectionHead({ eyebrow: 'Transparence', title: 'Acheter en toute confiance', id: 'trust-title' })}
    <ul class="trust__grid">
      ${items.map((it) => html`<li class="trust__item"><span class="trust__icon">${it.ic}</span><h3>${it.t}</h3><p>${it.d}</p><a class="link-arrow" href="${it.href}">${it.l}${icon.arrow}</a></li>`)}
    </ul>
  </div>
</section>`;
}

/* ---------------------------------------------------------------- Boutique */
function listingPage(ctx, { path, title, text, crumbs, items, showCategoryFilter = true, extra = '', chips = true, jsonld = [] }) {
  const cr = breadcrumbs(crumbs, ctx);
  const body = html`
<section class="phead">
  <div class="container">
    ${cr.markup}
    <h1 class="phead__title">${title}</h1>
    ${text ? html`<p class="phead__text">${text}</p>` : ''}
    ${chips ? html`<ul class="phead__chips" aria-label="Rayons">${ctx.categories.map((x) => html`<li><a href="/categorie/${x.slug}/"${path === `/categorie/${x.slug}/` ? raw(' aria-current="page"') : ''}>${x.short}</a></li>`)}</ul>` : ''}
  </div>
</section>
<section class="section section--flush-top"><div class="container">
  ${items.length ? productListing(items, ctx, { showCategoryFilter }) : html`<p class="empty">Aucun produit pour le moment. <a href="/boutique/">Voir toute la boutique</a></p>`}
</div></section>
${extra}`;
  return { path, title, description: `${title} — ${text || ''}`.slice(0, 158), body, jsonld: [cr.ld, ...jsonld] };
}

export function boutique(ctx) {
  return listingPage(ctx, { path: '/boutique/', title: 'La boutique', text: 'Tous nos feux d’artifice, pétards, chandelles, fumigènes et accessoires.', crumbs: [{ name: 'Accueil', href: '/' }, { name: 'Boutique' }], items: ctx.products });
}

export function category(ctx, c) {
  const items = ctx.products.filter((p) => p.category === c.slug);
  const extra = c.slug === 'feux-d-artifice' ? html`
<section class="section section--tint" aria-labelledby="cmp-title"><div class="container">
  ${sectionHead({ eyebrow: 'Comparateur', title: 'Comparer nos compacts', id: 'cmp-title', text: 'Cliquez sur un en-tête pour trier.', link: { href: '/conseils/choisir-son-compact/', label: 'Comment choisir' } })}
  ${compareTable(items)}
</div></section>` : '';
  return listingPage(ctx, {
    path: `/categorie/${c.slug}/`, title: c.name, text: c.description, items, showCategoryFilter: false, extra,
    crumbs: [{ name: 'Accueil', href: '/' }, { name: 'Boutique', href: '/boutique/' }, { name: c.name }],
    jsonld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: c.name, description: c.description, url: `${ctx.site.brand.baseUrl}/categorie/${c.slug}/` }],
  });
}

export function selection(ctx, s) {
  return listingPage(ctx, { path: `/selection/${s.slug}/`, title: s.title, text: s.text, items: s.pick(ctx.products), crumbs: [{ name: 'Accueil', href: '/' }, { name: 'Boutique', href: '/boutique/' }, { name: s.name }] });
}

export function comparateur(ctx) {
  const items = ctx.products.filter((p) => p.category === 'feux-d-artifice');
  const cr = breadcrumbs([{ name: 'Accueil', href: '/' }, { name: 'Feux d’artifice', href: '/categorie/feux-d-artifice/' }, { name: 'Comparateur' }], ctx);
  const body = html`
<section class="phead"><div class="container">${cr.markup}<p class="eyebrow">Comparateur</p><h1 class="phead__title">Comparateur de compacts</h1>
<p class="phead__text">Toutes les données proviennent des fiches produits. «&nbsp;—&nbsp;» signifie que l’information n’est pas communiquée par le fabricant. Cliquez sur un en-tête pour trier.</p></div></section>
<section class="section section--flush-top"><div class="container">
  ${compareTable(items)}
  <div class="cmp-help">
    <div>${icon.burst}<p><strong>Coups</strong> — nombre de tirs envoyés après un seul allumage.</p></div>
    <div>${icon.target}<p><strong>Calibre</strong> — diamètre des tubes : plus il est grand, plus les effets montent haut et s’ouvrent large.</p></div>
    <div>${icon.clock}<p><strong>Durée</strong> — durée approximative du tir indiquée par le fabricant.</p></div>
    <div>${icon.euro}<p><strong>Prix au coup</strong> — prix TTC divisé par le nombre de coups, pour comparer à budget égal.</p></div>
  </div>
</div></section>`;
  return { path: '/comparateur-compacts/', title: 'Comparateur de compacts', description: 'Comparez nos compacts de feux d’artifice : nombre de coups, calibre, durée, prix et prix au coup.', body, jsonld: [cr.ld] };
}

/* ------------------------------------------------------------ Fiche produit */
export function product(ctx, p) {
  const { site } = ctx;
  const c = ctx.categoryBySlug[p.category];
  const a = AVAILABILITY[p.availability] ?? AVAILABILITY.in_stock;
  const r = p.regulatory;
  const ref = r?.class ? REG_CLASSES[r.class] : null;
  const related = ctx.products.filter((x) => x.category === p.category && x.slug !== p.slug && AVAILABILITY[x.availability].orderable).slice(0, 4);
  const crumbs = breadcrumbs([{ name: 'Accueil', href: '/' }, { name: c.name, href: `/categorie/${c.slug}/` }, { name: p.name }], ctx);
  const restricted = isRestricted(p, site);
  const notice = site.regulatoryNotice;
  const pps = pricePerShot(p);
  const zones = site.policy.shippingZones;
  const keys = [
    ['Nombre de coups', icon.burst, (v) => v],
    ['Calibre', icon.target, (v) => v],
    ['Durée approximative', icon.clock, (v) => `≈ ${v}`],
  ].map(([l, ic, f]) => (spec(p, l) ? { l: l === 'Durée approximative' ? 'Durée' : l === 'Nombre de coups' ? 'Coups' : l, ic, v: f(spec(p, l)) } : null)).filter(Boolean);
  if (r?.class) keys.push({ l: 'Catégorie', ic: icon.shield, v: r.class });

  const regRows = r ? [
    ['Catégorie réglementaire', r.class ? `${r.class}${ref ? ` — ${ref.label}` : ''}` : 'Indiquée sur l’étiquette'],
    ['Vente réservée aux', `${r.minAge} ans et plus`],
    ['Masse active (NEC)', r.nec ? `${r.nec} g` : null],
  ].filter(([, v]) => v) : [];

  const body = html`
<div class="container">${crumbs.markup}</div>
<section class="pdp" aria-labelledby="pdp-title">
  <div class="container pdp__grid">
    <div class="pdp__gallery">
      <div class="pdp__main${p.imageBg && p.imageBg.toLowerCase() !== '#ffffff' && !/^#f[a-f0-9]f/i.test(p.imageBg) ? ' media--tint' : ''}">
        <img src="${productImage(p)}" alt="${p.name}" width="1000" height="1000" fetchpriority="high">
        <button class="pdp__fav" type="button" data-fav="${p.slug}" aria-pressed="false" aria-label="Ajouter aux favoris">${icon.heart}</button>
      </div>
      <p class="pdp__imgnote">Photo non contractuelle : l’emballage peut varier selon le lot.</p>
    </div>

    <div class="pdp__info">
      <a class="pdp__cat" href="/categorie/${c.slug}/">${c.name}</a>
      <h1 class="pdp__title" id="pdp-title">${p.name}</h1>
      <div class="pdp__tags">${regTag(p, { long: true })}${availabilityTag(p)}</div>
      ${keys.length ? html`<ul class="pdp__keys">${keys.map((k) => html`<li>${k.ic}<span><small>${k.l}</small><strong>${k.v}</strong></span></li>`)}</ul>` : ''}

      <div class="pdp__buybox">
        <p class="pdp__price">${formatPrice(p.price)} <span>TTC</span></p>
        <p class="pdp__price-note">${pps ? html`Soit ${pps.toFixed(2).replace('.', ',')} € le coup · ` : ''}Hors frais de port (${zones[0].price} € en France métropolitaine, par commande)</p>
        ${restricted ? html`<div class="pdp__restrict" data-restrict-note data-until="${notice.until}">${icon.alert}<p><strong>Vente suspendue jusqu’au ${frDate(notice.until)} inclus</strong> (${notice.reference}). Ce produit pourra être commandé à nouveau à partir du ${frDate(notice.resume)}. <a href="/conseils/decret-14-novembre-2026/">En savoir plus</a></p></div>` : ''}
        ${a.orderable ? html`
        <form class="pdp__buy" data-buy-form data-slug="${p.slug}"${restricted ? raw(' data-restricted') : ''}>
          <div class="qty" data-qty>
            <button type="button" data-qty-dec aria-label="Diminuer la quantité">−</button>
            <label class="sr-only" for="qty">Quantité</label>
            <input id="qty" name="qty" type="number" inputmode="numeric" min="1" max="20" value="1" data-qty-input>
            <button type="button" data-qty-inc aria-label="Augmenter la quantité">+</button>
          </div>
          <button class="btn btn--accent btn--lg btn--block" type="submit">${icon.bag} <span>Ajouter au panier</span></button>
        </form>` : html`<p class="pdp__oos">${icon.alert}<span>Produit épuisé pour le moment. <a href="/contact/">Contactez-nous</a> pour connaître la date de réassort.</span></p>`}
        <ul class="pdp__assure">
          <li>${icon.truck}<span><strong>Livraison à domicile</strong> par transporteur agréé ADR · préparation 5 à 10 jours ouvrés après paiement</span></li>
          <li>${icon.lock}<span><strong>Paiement sécurisé</strong> par carte (SumUp) ou virement</span></li>
          <li>${icon.phone}<span><strong>Une question&nbsp;?</strong> <a href="${telHref(site.contact.phone)}">${site.contact.phone}</a></span></li>
        </ul>
      </div>

      <div class="acc">
        <details open>
          <summary>Description</summary>
          <div class="acc__body"><p>${p.description}</p>${p.features?.length ? html`<ul class="ticks">${p.features.map((f) => html`<li>${f}</li>`)}</ul>` : ''}</div>
        </details>
        ${p.specs?.length || regRows.length ? html`
        <details open>
          <summary>Caractéristiques</summary>
          <div class="acc__body"><table class="spec"><tbody>
            ${(p.specs || []).map((s) => html`<tr><th scope="row">${s.label}</th><td>${s.value}</td></tr>`)}
            ${regRows.map(([k, v]) => html`<tr><th scope="row">${k}</th><td>${v}</td></tr>`)}
            <tr><th scope="row">Référence</th><td>${p.slug}</td></tr>
          </tbody></table></div>
        </details>` : ''}
        ${r ? html`<details id="securite">
          <summary>Sécurité & utilisation</summary>
          <div class="acc__body">
            <p>Lisez l’étiquette et la notice avant utilisation&nbsp;: elles font foi pour la distance de sécurité et la mise en œuvre.</p>
            <ul class="ticks">
              ${ref?.distance ? html`<li>Distance de sécurité de référence pour la catégorie ${r.class}&nbsp;: au moins ${ref.distance}. Respectez celle de l’étiquette.</li>` : ''}
              <li>En extérieur uniquement, sur un sol plat et stable, loin des habitations, véhicules, arbres et lignes électriques.</li>
              <li>Allumez à bout de bras, ne vous penchez jamais au-dessus, ne rallumez jamais un artifice qui n’est pas parti.</li>
              <li>Renoncez au tir par vent fort, sécheresse ou orage. Gardez enfants et animaux à distance.</li>
              <li>Vérifiez les arrêtés préfectoraux et municipaux applicables avant tout usage.</li>
            </ul>
            <a class="link-arrow" href="/reglementation/">Réglementation complète${icon.arrow}</a>
          </div>
        </details>` : ''}
        <details>
          <summary>Livraison, retours & paiement</summary>
          <div class="acc__body">
            <ul class="ticks">${zones.map((z) => html`<li>${z.label}&nbsp;: <strong>${z.price != null ? `${z.price} € TTC` : z.priceText}</strong> par commande</li>`)}</ul>
            <p>${site.policy.carrierInfo} ${site.policy.preparationDelay}</p>
            <p>Rétractation sous 14 jours dans les conditions des CGV. ${site.policy.returnCostInfo}</p>
            <a class="link-arrow" href="/livraison/">Tout sur la livraison${icon.arrow}</a>
          </div>
        </details>
      </div>
    </div>
  </div>
</section>

${a.orderable ? html`
<div class="buybar" data-buybar hidden>
  <div class="buybar__info"><strong>${p.name}</strong><span>${formatPrice(p.price)}</span></div>
  <button class="btn btn--accent" type="button" data-add-to-cart="${p.slug}"${restricted ? raw(' data-restricted') : ''}>${icon.bag} <span>Ajouter</span></button>
</div>` : ''}

${related.length ? html`
<section class="section section--tint" aria-labelledby="rel-title">
  <div class="container">
    ${sectionHead({ eyebrow: c.name, title: 'Vous aimerez aussi', id: 'rel-title', link: { href: `/categorie/${c.slug}/`, label: 'Tout le rayon' } })}
    ${productRow(related, ctx)}
  </div>
</section>` : ''}`;

  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.summary || p.description,
    image: [site.brand.baseUrl + productImage(p)], sku: p.slug, category: c.name, brand: { '@type': 'Brand', name: site.brand.productBrand },
    offers: {
      '@type': 'Offer', url: `${site.brand.baseUrl}/produit/${p.slug}/`, priceCurrency: 'EUR', price: p.price.toFixed(2), availability: a.schema, itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${site.brand.baseUrl}/#organization` },
      shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: zones[0].price, currency: 'EUR' }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'FR' } },
    },
  };
  return { path: `/produit/${p.slug}/`, title: `${p.name}${r?.class ? ` — ${c.short} ${r.class}` : ''}`, description: (p.summary || p.description).slice(0, 158), body, jsonld: [crumbs.ld, ld], ogType: 'product', bodyClass: 'is-pdp', image: productImage(p) };
}

/* ---------------------------------------------- Recherche, favoris, panier, commande */
export function search() {
  const body = html`
<section class="phead"><div class="container">
  <h1 class="phead__title">Recherche</h1>
  <form class="bigsearch" action="/recherche/" method="get" role="search" data-search-page>
    <label class="sr-only" for="bigq">Rechercher un produit</label>
    <input id="bigq" type="search" name="q" placeholder="Compact, pétard, fumigène, F3, 30 mm…" autocomplete="off" enterkeyhint="search">
    <button class="btn btn--dark" type="submit">${icon.search} Rechercher</button>
  </form>
</div></section>
<section class="section section--flush-top"><div class="container">
  <p class="listing__count" aria-live="polite" data-search-summary></p>
  <div class="grid grid--products" data-search-grid></div>
  <noscript><p>La recherche nécessite JavaScript. Parcourez la <a href="/boutique/">boutique</a>.</p></noscript>
</div></section>`;
  return { path: '/recherche/', title: 'Recherche', description: 'Rechercher un produit EHSHOP.', body, noindex: true };
}

export function favoris() {
  const body = html`
<section class="phead"><div class="container"><h1 class="phead__title">Mes favoris</h1><p class="phead__text">Les produits que vous avez mis de côté sur cet appareil.</p></div></section>
<section class="section section--flush-top"><div class="container">
  <div class="grid grid--products" data-fav-grid aria-busy="true"></div>
  <div class="cart-empty" data-fav-empty hidden><h2>Aucun favori pour l’instant</h2><p>Touchez le cœur d’un produit pour le retrouver ici.</p><a class="btn btn--dark btn--lg" href="/boutique/">Voir la boutique</a></div>
  <noscript><p>Les favoris nécessitent JavaScript.</p></noscript>
</div></section>`;
  return { path: '/favoris/', title: 'Mes favoris', description: 'Vos produits favoris.', body, noindex: true };
}

export function cart() {
  const body = html`
<section class="phead"><div class="container"><ol class="steps" aria-label="Étapes de commande"><li aria-current="step">Panier</li><li>Coordonnées</li><li>Paiement SumUp</li></ol><h1 class="phead__title">Mon panier</h1></div></section>
<section class="section section--flush-top"><div class="container">
  <div class="cart" data-cart-page aria-busy="true"><p class="loading">Chargement du panier…</p></div>
  <noscript><p>Le panier nécessite JavaScript.</p></noscript>
</div></section>`;
  return { path: '/panier/', title: 'Panier', description: 'Votre panier EHSHOP.', body, noindex: true };
}

export function checkout(ctx) {
  const { site } = ctx;
  const zones = site.policy.shippingZones;
  const body = html`
<section class="phead"><div class="container">
  <ol class="steps" aria-label="Étapes de commande"><li><a href="/panier/">Panier</a></li><li aria-current="step">Coordonnées</li><li>Paiement SumUp</li></ol>
  <h1 class="phead__title">Finaliser ma commande</h1>
</div></section>
<section class="section section--flush-top"><div class="container checkout">
  <form class="checkout__form" id="checkout" data-checkout novalidate>
    <div class="form-error" role="alert" data-form-error hidden></div>

    <fieldset class="card">
      <legend>Vos coordonnées</legend>
      <div class="fgrid">
        <div class="field"><label for="f-first">Prénom</label><input id="f-first" name="firstName" autocomplete="given-name" required></div>
        <div class="field"><label for="f-last">Nom</label><input id="f-last" name="lastName" autocomplete="family-name" required></div>
        <div class="field"><label for="f-email">E-mail</label><input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required></div>
        <div class="field"><label for="f-phone">Téléphone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required></div>
        <div class="field field--full">
          <label for="f-birth">Date de naissance</label>
          <input id="f-birth" name="birthDate" type="date" autocomplete="bday" required aria-describedby="f-birth-help">
          <p class="field__help" id="f-birth-help">Obligatoire : vente réservée aux ${site.policy.minimumBuyerAge}&nbsp;ans et plus. Une pièce d’identité peut être demandée avant l’expédition et par le livreur.</p>
        </div>
      </div>
    </fieldset>

    <fieldset class="card">
      <legend>Livraison</legend>
      <div class="radios">${zones.map((z, i) => html`<label class="radio"><input type="radio" name="zone" value="${z.id}" data-price="${z.price ?? ''}" required${i === 0 ? raw(' checked') : ''}><span><strong>${z.label}</strong><small>${z.price != null ? `${z.price} € TTC par commande` : z.priceText}</small></span></label>`)}</div>
      <p class="field__help">${site.policy.carrierInfo}</p>
      <div class="fgrid">
        <div class="field field--full"><label for="f-addr">Adresse</label><input id="f-addr" name="address" autocomplete="street-address" required></div>
        <div class="field"><label for="f-zip">Code postal</label><input id="f-zip" name="postalCode" autocomplete="postal-code" required pattern="[0-9A-Za-z \\-]{3,10}"></div>
        <div class="field"><label for="f-city">Ville</label><input id="f-city" name="city" autocomplete="address-level2" required></div>
        <div class="field field--full"><label for="f-country">Pays</label><input id="f-country" name="country" autocomplete="country-name" value="France" required></div>
        <div class="field field--full"><label for="f-note">Message (facultatif)</label><textarea id="f-note" name="note" rows="3" maxlength="1000" placeholder="Digicode, disponibilités pour la livraison…"></textarea></div>
      </div>
    </fieldset>

    <fieldset class="card">
      <legend>Paiement</legend>
      <div class="radios">
        <label class="radio"><input type="radio" name="payment" value="carte-sumup" checked><span><strong>Carte bancaire — lien de paiement SumUp</strong><small>Vous recevez par e-mail un lien de paiement sécurisé après vérification de votre commande.</small></span></label>
        <label class="radio"><input type="radio" name="payment" value="virement"><span><strong>Virement bancaire</strong><small>Les coordonnées bancaires vous sont communiquées avec la confirmation. Commande annulée sans virement sous 7 jours.</small></span></label>
      </div>
    </fieldset>

    <fieldset class="card">
      <legend>Engagements</legend>
      <label class="check"><input type="checkbox" name="ageOk" required><span>Je certifie avoir au moins ${site.policy.minimumBuyerAge}&nbsp;ans et acheter pour mon usage personnel.</span></label>
      <label class="check"><input type="checkbox" name="regOk" required><span>J’ai pris connaissance des <a href="/reglementation/" target="_blank">règles de sécurité</a> et je vérifierai les arrêtés locaux applicables.</span></label>
      <label class="check"><input type="checkbox" name="cgvOk" required><span>J’ai lu et j’accepte les <a href="/cgv/" target="_blank">conditions générales de vente</a> et la <a href="/confidentialite/" target="_blank">politique de confidentialité</a>.</span></label>
      <div class="hp" aria-hidden="true"><label for="f-web">Ne pas remplir</label><input id="f-web" name="website" tabindex="-1" autocomplete="off"></div>
    </fieldset>
  </form>

  <aside class="checkout__summary card" aria-label="Récapitulatif">
    <h2>Récapitulatif</h2>
    <div data-checkout-summary aria-busy="true"><p class="loading">Chargement…</p></div>
    <button class="btn btn--accent btn--lg btn--block" type="submit" form="checkout" data-checkout-submit>Envoyer ma commande</button>
    <ol class="howto">
      <li><strong>Vous envoyez votre commande.</strong> ${site.order.endpoint ? 'Elle nous est transmise de façon sécurisée.' : 'Votre messagerie s’ouvre avec le récapitulatif : il suffit d’envoyer l’e-mail.'}</li>
      <li><strong>Nous vérifions</strong> le stock et votre âge, puis vous envoyons un lien de paiement SumUp (ou nos coordonnées bancaires).</li>
      <li><strong>Expédition</strong> par transporteur agréé après paiement.</li>
    </ol>
  </aside>
</div></section>`;
  return { path: '/commande/', title: 'Commande', description: 'Finaliser votre commande EHSHOP.', body, noindex: true };
}

export function confirmation(ctx) {
  const body = html`
<section class="phead"><div class="container narrow">
  <ol class="steps" aria-label="Étapes de commande"><li>Panier</li><li>Coordonnées</li><li aria-current="step">Paiement SumUp</li></ol>
  <h1 class="phead__title">Merci, votre commande est prête</h1>
  <p class="phead__text" data-confirm-text>Nous vérifions le stock et votre âge, puis vous envoyons votre lien de paiement sécurisé SumUp par e-mail.</p>
  <p class="confirm__ref" data-confirm-ref hidden></p>
  <p class="phead__text">Une question&nbsp;? <a href="${telHref(ctx.site.contact.phone)}">${ctx.site.contact.phone}</a> · <a href="mailto:${ctx.site.contact.email}">${ctx.site.contact.email}</a></p>
  <div class="hero__ctas"><a class="btn btn--dark btn--lg" href="/boutique/">Continuer mes achats</a></div>
</div></section>`;
  return { path: '/commande/confirmation/', title: 'Commande envoyée', description: 'Confirmation de commande.', body, noindex: true };
}

export function notFound() {
  const body = html`
<section class="phead phead--center"><div class="container narrow">
  <p class="eyebrow">Erreur 404</p>
  <h1 class="phead__title">Cette page est introuvable</h1>
  <p class="phead__text">Le lien est peut-être ancien ou le produit n’est plus en vente.</p>
  <form class="bigsearch" action="/recherche/" method="get" role="search"><label class="sr-only" for="q404">Rechercher</label><input id="q404" type="search" name="q" placeholder="Rechercher un produit"><button class="btn btn--dark" type="submit">${icon.search} Rechercher</button></form>
  <div class="hero__ctas"><a class="btn btn--dark btn--lg" href="/">Accueil</a><a class="btn btn--outline btn--lg" href="/boutique/">Boutique</a></div>
</div></section>`;
  return { path: '/404.html', title: 'Page introuvable', description: 'Page introuvable.', body, noindex: true };
}
