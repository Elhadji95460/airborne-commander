import { html, raw, formatPrice, AVAILABILITY } from './lib/util.mjs';
import { icon } from './layout.mjs';

export const productImage = (p) => p.image || `/assets/img/p-${p.slug}.svg`;
export const categoryImage = (c) => c.image || `/assets/img/cat-${c.slug}.svg`;

export function availabilityTag(p) {
  const a = AVAILABILITY[p.availability] ?? AVAILABILITY.in_stock;
  return html`<span class="stock stock--${a.tone}"><span class="stock__dot" aria-hidden="true"></span>${a.label}</span>`;
}

export function regTag(p, { long = false } = {}) {
  const r = p.regulatory;
  if (!r?.class) return '';
  return html`<span class="regtag" title="Catégorie réglementaire ${r.class}${r.minAge ? ` — à partir de ${r.minAge} ans` : ''}"><strong>${r.class}</strong>${r.minAge ? html`<span>${long ? `À partir de ${r.minAge} ans` : `${r.minAge}+`}</span>` : ''}</span>`;
}

export function productCard(p, ctx, { headingLevel = 3, eager = false } = {}) {
  const cat = ctx.categoryBySlug[p.category];
  const a = AVAILABILITY[p.availability] ?? AVAILABILITY.in_stock;
  const H = `h${headingLevel}`;
  return html`
<article class="pcard${a.orderable ? '' : ' pcard--off'}" data-product-card data-slug="${p.slug}" data-cat="${p.category}" data-class="${p.regulatory?.class || ''}" data-price="${p.price}" data-stock="${p.availability}" data-name="${p.name}">
  <a class="pcard__media" href="/produit/${p.slug}/" tabindex="-1" aria-hidden="true">
    <img src="${productImage(p)}" alt="" width="800" height="800" loading="${eager ? 'eager' : 'lazy'}" decoding="async">
    ${p.isNew ? html`<span class="pcard__flag">Nouveauté</span>` : ''}
  </a>
  <div class="pcard__body">
    <p class="pcard__cat">${cat?.short ?? ''}</p>
    ${raw(`<${H} class="pcard__title">`)}<a href="/produit/${p.slug}/">${p.name}</a>${raw(`</${H}>`)}
    <div class="pcard__meta">${regTag(p)}${availabilityTag(p)}</div>
    <div class="pcard__foot">
      <p class="pcard__price">${formatPrice(p.price)}<span class="sr-only"> TTC</span></p>
      ${a.orderable
        ? html`<button class="pcard__add" type="button" data-add-to-cart="${p.slug}" aria-label="Ajouter ${p.name} au panier">${icon.bag}<span>Ajouter</span></button>`
        : html`<span class="pcard__na">Indisponible</span>`}
    </div>
  </div>
</article>`;
}


export function breadcrumbs(items, ctx) {
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, ...(it.href && { item: ctx.site.brand.baseUrl + it.href }) })),
  };
  const markup = html`<nav class="crumbs" aria-label="Fil d'Ariane"><ol>${items.map((it, i) => (i < items.length - 1
    ? html`<li><a href="${it.href}">${it.name}</a></li>`
    : html`<li><span aria-current="page">${it.name}</span></li>`))}</ol></nav>`;
  return { markup, ld };
}

export function sectionHead({ eyebrow, title, text, link, id }) {
  return html`<div class="shead">
    <div>
      ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}
      <h2 class="shead__title"${id ? raw(` id="${id}"`) : ''}>${title}</h2>
      ${text ? html`<p class="shead__text">${text}</p>` : ''}
    </div>
    ${link ? html`<a class="link-arrow" href="${link.href}">${link.label}${icon.arrow}</a>` : ''}
  </div>`;
}

/** Liste filtrable (catalogue et catégories). Les filtres fonctionnent côté client ; sans JS, tout reste affiché. */
export function productListing(products, ctx, { showCategoryFilter = true } = {}) {
  const classes = [...new Set(products.map((p) => p.regulatory?.class).filter(Boolean))].sort();
  const cats = ctx.categories.filter((c) => products.some((p) => p.category === c.slug));
  return html`
<div class="listing" data-listing>
  <div class="listing__bar">
    <p class="listing__count" aria-live="polite"><span data-listing-count>${products.length}</span> produit${products.length > 1 ? 's' : ''}</p>
    <button class="btn btn--outline listing__filter-btn" type="button" data-filters-toggle aria-expanded="false" aria-controls="filters">Filtrer</button>
    <label class="listing__sort"><span>Trier</span>
      <select data-sort>
        <option value="default">Pertinence</option>
        <option value="price-asc">Prix croissant</option>
        <option value="price-desc">Prix décroissant</option>
        <option value="name">Nom (A → Z)</option>
      </select>
    </label>
  </div>
  <div class="listing__layout">
    <aside class="filters" id="filters" aria-label="Filtres" data-filters>
      <form data-filter-form>
        ${showCategoryFilter && cats.length > 1 ? html`<fieldset><legend>Famille</legend>${cats.map((c) => html`<label class="check"><input type="checkbox" name="cat" value="${c.slug}"><span>${c.name}</span></label>`)}</fieldset>` : ''}
        ${classes.length ? html`<fieldset><legend>Catégorie réglementaire</legend>${classes.map((k) => html`<label class="check"><input type="checkbox" name="class" value="${k}"><span>${k}</span></label>`)}<a class="filters__help" href="/reglementation/#categories">Que signifient ces catégories&nbsp;?</a></fieldset>` : ''}
        <fieldset><legend>Disponibilité</legend><label class="check"><input type="checkbox" name="instock" value="1"><span>Produits disponibles uniquement</span></label></fieldset>
        <button class="btn btn--text" type="reset">Réinitialiser les filtres</button>
      </form>
    </aside>
    <div>
      <div class="grid grid--products" data-listing-grid>${products.map((p) => productCard(p, ctx))}</div>
      <p class="listing__empty" data-listing-empty hidden>Aucun produit ne correspond à ces filtres. <button class="btn btn--text" type="button" data-filters-reset>Réinitialiser</button></p>
    </div>
  </div>
</div>`;
}
