import { html, raw, esc, formatPrice, AVAILABILITY, REG_CLASSES } from './lib/util.mjs';
import { heroArt } from './lib/art.mjs';
import { icon } from './layout.mjs';
import { productCard, productImage, categoryImage, breadcrumbs, sectionHead, productListing, availabilityTag, regTag } from './components.mjs';

/* ------------------------------------------------------------------ Accueil */
export function home(ctx) {
  const { products, categories, site } = ctx;
  const featuredAll = products.filter((p) => p.featured);
  // Rangées complètes sur desktop (4 colonnes) : on évite une dernière ligne incomplète.
  const featured = featuredAll.slice(0, featuredAll.length >= 8 ? 8 : Math.max(4, featuredAll.length - (featuredAll.length % 4)));
  const fresh = products.filter((p) => p.isNew).slice(0, 4);
  const count = (slug) => products.filter((p) => p.category === slug).length;

  const body = html`
<section class="hero" aria-labelledby="hero-title">
  ${raw(heroArt())}
  <div class="hero__veil" aria-hidden="true"></div>
  <div class="container hero__inner">
    <p class="eyebrow eyebrow--light">${site.brand.tagline}</p>
    <h1 class="hero__title" id="hero-title">Des artifices choisis,<br><em>une vente encadrée.</em></h1>
    <p class="hero__text">Compacts, fusées, fontaines et petits artifices, présentés avec leurs informations réglementaires pour choisir en toute clarté.</p>
    <div class="hero__ctas">
      <a class="btn btn--accent btn--lg" href="/catalogue/">Découvrir le catalogue ${icon.arrow}</a>
      <a class="btn btn--ghost-light btn--lg" href="/reglementation/">Réglementation & sécurité</a>
    </div>
    <ul class="hero__chips" aria-label="Accès rapide aux familles">
      ${categories.map((c) => html`<li><a href="/categorie/${c.slug}/">${c.short}</a></li>`)}
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="cats-title">
  <div class="container">
    ${sectionHead({ eyebrow: 'Familles', title: 'Parcourir par type d\u2019effet', id: 'cats-title', text: 'Chaque famille correspond à une façon de tirer et à un espace nécessaire différents.', link: { href: '/catalogue/', label: 'Tout le catalogue' } })}
    <ul class="grid grid--cats">
      ${categories.map((c) => html`
      <li class="ccard">
        <a href="/categorie/${c.slug}/">
          <img src="${categoryImage(c)}" alt="" width="800" height="1000" loading="lazy" decoding="async">
          <span class="ccard__body">
            <span class="ccard__count">${count(c.slug)} produit${count(c.slug) > 1 ? 's' : ''}</span>
            <span class="ccard__name">${c.name}</span>
            <span class="ccard__desc">${c.description}</span>
            <span class="ccard__go" aria-hidden="true">${icon.arrow}</span>
          </span>
        </a>
      </li>`)}
    </ul>
  </div>
</section>

${featured.length ? html`
<section class="section section--tint" aria-labelledby="sel-title">
  <div class="container">
    ${sectionHead({ eyebrow: 'Sélection', title: 'Les incontournables du moment', id: 'sel-title', link: { href: '/catalogue/', label: 'Voir tous les produits' } })}
    <div class="grid grid--products">${featured.map((p) => productCard(p, ctx))}</div>
  </div>
</section>` : ''}

<section class="section" aria-labelledby="guide-title">
  <div class="container guide">
    <div class="guide__intro">
      <p class="eyebrow">Bien choisir</p>
      <h2 class="shead__title" id="guide-title">Trois questions avant d\u2019acheter</h2>
      <p>La catégorie réglementaire d\u2019un artifice dépend de son niveau de danger et détermine l\u2019âge minimum, la distance de sécurité et le lieu d\u2019utilisation.</p>
      <a class="link-arrow" href="/reglementation/#categories">Comprendre les catégories F1 à F4${icon.arrow}</a>
    </div>
    <ol class="guide__steps">
      <li><span class="guide__num">01</span><h3>De quel espace disposez-vous&nbsp;?</h3><p>Les articles F2 exigent en général une distance de sécurité d\u2019au moins 8&nbsp;m, les F3 d\u2019au moins 15&nbsp;m. La distance applicable figure sur l\u2019étiquette de chaque produit.</p></li>
      <li><span class="guide__num">02</span><h3>Qui va allumer&nbsp;?</h3><p>L\u2019âge minimum dépend de la catégorie&nbsp;: 12&nbsp;ans pour F1, 16&nbsp;ans pour F2, 18&nbsp;ans pour F3. La boutique vend uniquement aux personnes de ${site.policy.minimumBuyerAge}&nbsp;ans et plus.</p></li>
      <li><span class="guide__num">03</span><h3>L\u2019usage est-il autorisé chez vous&nbsp;?</h3><p>Des arrêtés préfectoraux ou municipaux peuvent restreindre la vente, le transport ou l\u2019usage à certaines dates. Renseignez-vous auprès de votre mairie.</p></li>
    </ol>
  </div>
</section>

${fresh.length ? html`
<section class="section section--tint" aria-labelledby="new-title">
  <div class="container">
    ${sectionHead({ eyebrow: 'Nouveautés', title: 'Récemment ajoutés', id: 'new-title' })}
    <div class="grid grid--products">${fresh.map((p) => productCard(p, ctx))}</div>
  </div>
</section>` : ''}

${trustBlock(ctx)}

<section class="section cta-band" aria-labelledby="help-title">
  <div class="container cta-band__inner">
    <div>
      <h2 class="shead__title" id="help-title">Une question avant de commander&nbsp;?</h2>
      <p>Disponibilité, catégorie, conditions de retrait&nbsp;: le service client vous répond.</p>
    </div>
    <div class="cta-band__actions">
      <a class="btn btn--dark btn--lg" href="/contact/">Nous contacter</a>
      <a class="btn btn--outline btn--lg" href="/faq/">Questions fréquentes</a>
    </div>
  </div>
</section>`;

  const ld = [{
    '@context': 'https://schema.org', '@type': 'WebSite', name: site.brand.name, url: site.brand.baseUrl,
    potentialAction: { '@type': 'SearchAction', target: `${site.brand.baseUrl}/recherche/?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  }];
  return { path: '/', title: 'Accueil', description: `${site.brand.name} : compacts, fusées, chandelles, fontaines et petits artifices, avec informations réglementaires claires. Vente réservée aux ${site.policy.minimumBuyerAge} ans et plus.`, body, jsonld: ld, bodyClass: 'is-home' };
}

export function trustBlock(ctx) {
  const { site } = ctx;
  const c = site.contact;
  const items = [
    { ic: icon.doc, t: 'Une entreprise identifiée', d: 'Raison sociale, immatriculation et coordonnées sont publiées dans les mentions légales.', href: '/mentions-legales/', l: 'Mentions légales' },
    { ic: icon.mail, t: 'Un contact direct', d: c.email || c.phone ? `Écrivez-nous${c.email ? ` à ${c.email}` : ''}${c.phone ? `${c.email ? ' ou appelez le ' : ' au '}${c.phone}` : ''}.` : 'Le service client répond aux questions sur les produits et les commandes.', href: '/contact/', l: 'Contact' },
    { ic: icon.id, t: 'Vérification de l\u2019âge', d: `Chaque commande exige une date de naissance. Les commandes de personnes de moins de ${site.policy.minimumBuyerAge} ans sont refusées.`, href: '/reglementation/#age', l: 'Âges minimums' },
    { ic: icon.shield, t: 'Informations réglementaires', d: 'Catégorie et âge minimum sont affichés sur chaque fiche, avec les règles de sécurité de référence.', href: '/reglementation/', l: 'Réglementation' },
    { ic: icon.truck, t: 'Conditions de commande claires', d: 'Prix TTC, modes de remise, droit de rétractation et réclamations sont décrits dans les CGV.', href: '/cgv/', l: 'Conditions de vente' },
    { ic: icon.lock, t: 'Données personnelles protégées', d: 'Aucun cookie publicitaire ni outil de suivi. Le panier reste enregistré sur votre appareil.', href: '/confidentialite/', l: 'Confidentialité' },
  ];
  return html`
<section class="section section--dark trust" aria-labelledby="trust-title">
  <div class="container">
    ${sectionHead({ eyebrow: 'Transparence', title: 'Acheter en connaissance de cause', id: 'trust-title', text: 'Ce que vous devez savoir sur la boutique, accessible en un clic.' })}
    <ul class="trust__grid">
      ${items.map((it) => html`<li class="trust__item"><span class="trust__icon">${it.ic}</span><h3>${it.t}</h3><p>${it.d}</p><a class="link-arrow link-arrow--light" href="${it.href}">${it.l}${icon.arrow}</a></li>`)}
    </ul>
  </div>
</section>`;
}

/* ---------------------------------------------------------------- Catalogue */
export function catalogue(ctx) {
  const crumbs = breadcrumbs([{ name: 'Accueil', href: '/' }, { name: 'Catalogue' }], ctx);
  const body = html`
<section class="phead">
  <div class="container">
    ${crumbs.markup}
    <h1 class="phead__title">Catalogue</h1>
    <p class="phead__text">L\u2019ensemble des produits, filtrables par famille, catégorie réglementaire et disponibilité.</p>
    <ul class="phead__chips">${ctx.categories.map((c) => html`<li><a href="/categorie/${c.slug}/">${c.name}</a></li>`)}</ul>
  </div>
</section>
<section class="section section--flush-top"><div class="container">${productListing(ctx.products, ctx)}</div></section>`;
  return { path: '/catalogue/', title: 'Catalogue', description: 'Tous les produits EHSHOP : compacts, fusées, chandelles romaines, fontaines, petits artifices et accessoires.', body, jsonld: [crumbs.ld] };
}

export function category(ctx, c) {
  const items = ctx.products.filter((p) => p.category === c.slug);
  const crumbs = breadcrumbs([{ name: 'Accueil', href: '/' }, { name: 'Catalogue', href: '/catalogue/' }, { name: c.name }], ctx);
  const body = html`
<section class="phead phead--cat">
  <div class="container phead__split">
    <div>
      ${crumbs.markup}
      <h1 class="phead__title">${c.name}</h1>
      <p class="phead__text">${c.description}</p>
    </div>
    <img class="phead__img" src="${categoryImage(c)}" alt="" width="800" height="1000" fetchpriority="high">
  </div>
  <div class="container"><ul class="phead__chips" aria-label="Autres familles">${ctx.categories.map((x) => html`<li><a href="/categorie/${x.slug}/"${x.slug === c.slug ? raw(' aria-current="page"') : ''}>${x.short}</a></li>`)}</ul></div>
</section>
<section class="section section--flush-top"><div class="container">
  ${items.length ? productListing(items, ctx, { showCategoryFilter: false }) : html`<p class="empty">Aucun produit n\u2019est disponible dans cette famille pour le moment. <a href="/catalogue/">Voir le catalogue complet</a></p>`}
</div></section>`;
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: c.name, description: c.description, url: `${ctx.site.brand.baseUrl}/categorie/${c.slug}/` };
  return { path: `/categorie/${c.slug}/`, title: c.name, description: `${c.name} — ${c.description}`, body, jsonld: [crumbs.ld, ld] };
}

/* ------------------------------------------------------------ Fiche produit */
export function product(ctx, p) {
  const { site } = ctx;
  const c = ctx.categoryBySlug[p.category];
  const a = AVAILABILITY[p.availability] ?? AVAILABILITY.in_stock;
  const r = p.regulatory;
  const ref = r?.class ? REG_CLASSES[r.class] : null;
  const images = p.images?.length ? p.images : [productImage(p)];
  const related = ctx.products.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4);
  const crumbs = breadcrumbs([{ name: 'Accueil', href: '/' }, { name: c.name, href: `/categorie/${c.slug}/` }, { name: p.name }], ctx);
  const buyerAge = Math.max(site.policy.minimumBuyerAge, r?.minAge || 0);

  const regRows = r ? [
    ['Catégorie réglementaire', r.class ? `${r.class}${ref ? ` — ${ref.label}` : ''}` : null],
    ['Âge minimum d\u2019utilisation', r.minAge ? `${r.minAge} ans` : null],
    ['Masse active (NEC)', r.nec ? `${String(r.nec).replace('.', ',')} g` : null],
    ['N° d\u2019enregistrement / marquage CE', r.ceRef],
    ['Fabricant ou importateur', r.manufacturer],
  ].filter(([, v]) => v) : [];

  const body = html`
<div class="container">${crumbs.markup}</div>
<section class="pdp" aria-labelledby="pdp-title">
  <div class="container pdp__grid">
    <div class="pdp__gallery" data-gallery>
      <div class="pdp__main">
        <img src="${images[0]}" alt="${p.name}" width="800" height="800" fetchpriority="high" data-gallery-main>
        ${p.isNew ? html`<span class="pcard__flag">Nouveauté</span>` : ''}
      </div>
      ${images.length > 1 ? html`<ul class="pdp__thumbs">${images.map((src, i) => html`<li><button type="button" data-gallery-thumb="${src}" aria-label="Image ${i + 1}"${i === 0 ? raw(' aria-current="true"') : ''}><img src="${src}" alt="" width="120" height="120" loading="lazy"></button></li>`)}</ul>` : ''}
      ${ctx.demo || !p.image ? html`<p class="pdp__imgnote">Illustration non contractuelle.</p>` : ''}
    </div>

    <div class="pdp__info">
      <a class="pdp__cat" href="/categorie/${c.slug}/">${c.name}</a>
      <h1 class="pdp__title" id="pdp-title">${p.name}</h1>
      ${p.summary ? html`<p class="pdp__summary">${p.summary}</p>` : ''}
      <div class="pdp__tags">${regTag(p, { long: true })}${availabilityTag(p)}</div>
      <p class="pdp__price">${formatPrice(p.price)} <span>TTC</span></p>

      ${a.orderable ? html`
      <form class="pdp__buy" data-buy-form data-slug="${p.slug}">
        <div class="qty" data-qty>
          <button type="button" data-qty-dec aria-label="Diminuer la quantité">−</button>
          <label class="sr-only" for="qty">Quantité</label>
          <input id="qty" name="qty" type="number" inputmode="numeric" min="1" max="20" value="1" data-qty-input>
          <button type="button" data-qty-inc aria-label="Augmenter la quantité">+</button>
        </div>
        <button class="btn btn--dark btn--lg btn--block" type="submit">${icon.bag} Ajouter au panier</button>
      </form>` : html`<p class="pdp__oos">${icon.alert}<span>Ce produit n\u2019est pas disponible actuellement. <a href="/contact/">Contactez-nous</a> pour connaître sa date de retour.</span></p>`}

      <ul class="pdp__assure">
        <li>${icon.id}<span>Commande réservée aux personnes de <strong>${buyerAge}&nbsp;ans et plus</strong>, vérifiée à la validation.</span></li>
        <li>${icon.truck}<span><a href="/livraison/">Modalités de livraison et de retrait</a></span></li>
        <li>${icon.shield}<span><a href="#securite">Consignes de sécurité</a> à lire avant utilisation</span></li>
      </ul>

      <div class="acc">
        <details open>
          <summary>Description</summary>
          <div class="acc__body"><p>${p.description || p.summary || ''}</p></div>
        </details>
        ${p.specs?.length || regRows.length ? html`
        <details open>
          <summary>Caractéristiques</summary>
          <div class="acc__body">
            <table class="spec"><tbody>
              ${(p.specs || []).map((s) => html`<tr><th scope="row">${s.label}</th><td>${s.value}</td></tr>`)}
              ${regRows.map(([k, v]) => html`<tr><th scope="row">${k}</th><td>${v}</td></tr>`)}
            </tbody></table>
          </div>
        </details>` : ''}
        <details id="securite"${r ? raw(' open') : ''}>
          <summary>Sécurité & utilisation</summary>
          <div class="acc__body">
            ${r ? html`
            <p>Lisez intégralement l\u2019étiquette et la notice du produit avant utilisation&nbsp;: elles font foi pour la distance de sécurité et le mode de mise en œuvre.</p>
            <ul class="ticks">
              ${r.minAge ? html`<li>Utilisation interdite aux moins de ${r.minAge}&nbsp;ans.</li>` : ''}
              ${ref?.distance ? html`<li>Distance de sécurité de référence pour la catégorie ${r.class}&nbsp;: au moins ${ref.distance}. Respectez celle indiquée sur l\u2019étiquette.</li>` : ''}
              <li>Usage en extérieur uniquement, sur un sol plat et stable, loin des habitations, des arbres et des matériaux inflammables.</li>
              <li>Ne jamais se pencher au-dessus d\u2019un artifice. Ne jamais rallumer un artifice qui n\u2019a pas fonctionné&nbsp;: attendez, puis noyez-le dans l\u2019eau.</li>
              <li>Conserver hors de portée des enfants, au sec et à l\u2019abri de toute source de chaleur.</li>
              <li>Vérifier les arrêtés préfectoraux ou municipaux applicables avant tout usage.</li>
            </ul>
            <a class="link-arrow" href="/reglementation/">Réglementation complète${icon.arrow}</a>` : html`<p>Accessoire non pyrotechnique. Suivez les instructions du fabricant.</p>`}
          </div>
        </details>
        <details>
          <summary>Livraison & retrait</summary>
          <div class="acc__body"><p>Le transport des articles pyrotechniques est soumis à des règles spécifiques. Les modes de remise proposés, leurs zones et leurs conditions sont détaillés sur la page dédiée.</p><a class="link-arrow" href="/livraison/">Voir les modalités${icon.arrow}</a></div>
        </details>
      </div>
    </div>
  </div>
</section>

${a.orderable ? html`
<div class="buybar" data-buybar hidden>
  <div class="buybar__info"><strong>${p.name}</strong><span>${formatPrice(p.price)}</span></div>
  <button class="btn btn--dark" type="button" data-add-to-cart="${p.slug}">${icon.bag} Ajouter</button>
</div>` : ''}

${related.length ? html`
<section class="section section--tint" aria-labelledby="rel-title">
  <div class="container">
    ${sectionHead({ eyebrow: c.name, title: 'Dans la même famille', id: 'rel-title', link: { href: `/categorie/${c.slug}/`, label: 'Voir la famille' } })}
    <div class="grid grid--products">${related.map((x) => productCard(x, ctx))}</div>
  </div>
</section>` : ''}`;

  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.summary || p.description,
    image: images.map((src) => (src.startsWith('http') ? src : site.brand.baseUrl + src)), sku: p.sku || p.slug, category: c.name,
    ...(r?.manufacturer && { brand: { '@type': 'Brand', name: r.manufacturer } }),
    offers: { '@type': 'Offer', url: `${site.brand.baseUrl}/produit/${p.slug}/`, priceCurrency: 'EUR', price: p.price.toFixed(2), availability: a.schema },
  };
  return { path: `/produit/${p.slug}/`, title: p.name, description: `${p.name}${r?.class ? ` — catégorie ${r.class}` : ''}. ${p.summary || ''}`.trim(), body, jsonld: [crumbs.ld, ld], ogType: 'product', bodyClass: 'is-pdp' };
}

/* ------------------------------------------------- Recherche, panier, commande */
export function search(ctx) {
  const body = html`
<section class="phead"><div class="container">
  <h1 class="phead__title">Recherche</h1>
  <form class="bigsearch" action="/recherche/" method="get" role="search" data-search-page>
    <label class="sr-only" for="bigq">Rechercher un produit</label>
    <input id="bigq" type="search" name="q" placeholder="Nom, famille, catégorie (ex. F2)…" autocomplete="off" enterkeyhint="search">
    <button class="btn btn--dark" type="submit">${icon.search} Rechercher</button>
  </form>
</div></section>
<section class="section section--flush-top"><div class="container">
  <p class="listing__count" aria-live="polite" data-search-summary></p>
  <div class="grid grid--products" data-search-grid></div>
  <noscript><p>La recherche nécessite JavaScript. Parcourez le <a href="/catalogue/">catalogue complet</a>.</p></noscript>
</div></section>`;
  return { path: '/recherche/', title: 'Recherche', description: 'Rechercher un produit dans le catalogue EHSHOP.', body, noindex: true };
}

export function cart(ctx) {
  const body = html`
<section class="phead"><div class="container"><h1 class="phead__title">Panier</h1></div></section>
<section class="section section--flush-top"><div class="container">
  <div class="cart" data-cart-page aria-busy="true">
    <p class="loading">Chargement du panier…</p>
  </div>
  <noscript><p>Le panier nécessite JavaScript.</p></noscript>
</div></section>`;
  return { path: '/panier/', title: 'Panier', description: 'Votre panier EHSHOP.', body, noindex: true };
}

export function checkout(ctx) {
  const { site } = ctx;
  const modes = site.policy.deliveryModes || [];
  const body = html`
<section class="phead"><div class="container">
  <ol class="steps" aria-label="Étapes de commande"><li><a href="/panier/">Panier</a></li><li aria-current="step">Coordonnées</li><li>Confirmation</li></ol>
  <h1 class="phead__title">Finaliser la commande</h1>
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
          <p class="field__help" id="f-birth-help">Obligatoire&nbsp;: la vente est réservée aux personnes de ${site.policy.minimumBuyerAge}&nbsp;ans et plus. Une pièce d\u2019identité pourra être demandée à la remise.</p>
        </div>
      </div>
    </fieldset>

    <fieldset class="card">
      <legend>Mode de remise</legend>
      ${modes.length ? html`<div class="radios">${modes.map((m, i) => html`<label class="radio"><input type="radio" name="deliveryMode" value="${m.id || m.label}" required${i === 0 ? raw(' checked') : ''}><span><strong>${m.label}</strong>${m.details ? html`<small>${m.details}</small>` : ''}</span></label>`)}</div>`
        : html`<p class="field__help">Les modes de remise disponibles vous seront confirmés par le service client avec votre commande. <a href="/livraison/">En savoir plus</a></p><input type="hidden" name="deliveryMode" value="à confirmer">`}
      <div class="fgrid">
        <div class="field field--full"><label for="f-addr">Adresse</label><input id="f-addr" name="address" autocomplete="street-address" required></div>
        <div class="field"><label for="f-zip">Code postal</label><input id="f-zip" name="postalCode" autocomplete="postal-code" inputmode="numeric" required pattern="[0-9A-Za-z \\-]{3,10}"></div>
        <div class="field"><label for="f-city">Ville</label><input id="f-city" name="city" autocomplete="address-level2" required></div>
        <div class="field field--full"><label for="f-note">Message (facultatif)</label><textarea id="f-note" name="note" rows="3" maxlength="1000"></textarea></div>
      </div>
    </fieldset>

    <fieldset class="card">
      <legend>Engagements</legend>
      <label class="check"><input type="checkbox" name="ageOk" required><span>Je certifie avoir au moins ${site.policy.minimumBuyerAge}&nbsp;ans et l\u2019âge minimum requis pour chaque article commandé.</span></label>
      <label class="check"><input type="checkbox" name="regOk" required><span>J\u2019ai pris connaissance des <a href="/reglementation/" target="_blank">règles d\u2019utilisation et de sécurité</a> et je m\u2019engage à vérifier les arrêtés locaux applicables.</span></label>
      <label class="check"><input type="checkbox" name="cgvOk" required><span>J\u2019accepte les <a href="/cgv/" target="_blank">conditions générales de vente</a> et la <a href="/confidentialite/" target="_blank">politique de confidentialité</a>.</span></label>
      <div class="hp" aria-hidden="true"><label for="f-web">Ne pas remplir</label><input id="f-web" name="website" tabindex="-1" autocomplete="off"></div>
    </fieldset>
  </form>

  <aside class="checkout__summary card" aria-label="Récapitulatif">
    <h2>Récapitulatif</h2>
    <div data-checkout-summary aria-busy="true"><p class="loading">Chargement…</p></div>
    <button class="btn btn--accent btn--lg btn--block" type="submit" form="checkout" data-checkout-submit>Envoyer ma commande</button>
    <p class="field__help" data-checkout-mode>${site.order.endpoint ? 'Votre commande est transmise de façon sécurisée (HTTPS).' : 'Votre demande de commande est préparée dans votre messagerie, à envoyer au service client. Le paiement vous sera indiqué en retour.'}</p>
  </aside>
</div></section>`;
  return { path: '/commande/', title: 'Commande', description: 'Finaliser votre commande EHSHOP.', body, noindex: true };
}

export function confirmation(ctx) {
  const body = html`
<section class="phead"><div class="container narrow">
  <ol class="steps" aria-label="Étapes de commande"><li>Panier</li><li>Coordonnées</li><li aria-current="step">Confirmation</li></ol>
  <h1 class="phead__title">Merci, votre commande est enregistrée</h1>
  <p class="phead__text" data-confirm-text>Le service client vous recontacte pour confirmer la disponibilité, le mode de remise et le paiement.</p>
  <p class="confirm__ref" data-confirm-ref hidden></p>
  <div class="hero__ctas"><a class="btn btn--dark btn--lg" href="/catalogue/">Retour au catalogue</a><a class="btn btn--outline btn--lg" href="/contact/">Contact</a></div>
</div></section>`;
  return { path: '/commande/confirmation/', title: 'Commande envoyée', description: 'Confirmation de commande.', body, noindex: true };
}

export function notFound(ctx) {
  const body = html`
<section class="phead phead--center"><div class="container narrow">
  <p class="eyebrow">Erreur 404</p>
  <h1 class="phead__title">Cette page est introuvable</h1>
  <p class="phead__text">Le lien est peut-être ancien ou le produit n\u2019est plus référencé.</p>
  <form class="bigsearch" action="/recherche/" method="get" role="search"><label class="sr-only" for="q404">Rechercher</label><input id="q404" type="search" name="q" placeholder="Rechercher un produit"><button class="btn btn--dark" type="submit">${icon.search} Rechercher</button></form>
  <div class="hero__ctas"><a class="btn btn--dark btn--lg" href="/">Accueil</a><a class="btn btn--outline btn--lg" href="/catalogue/">Catalogue</a></div>
</div></section>`;
  return { path: '/404.html', title: 'Page introuvable', description: 'Page introuvable.', body, noindex: true };
}

