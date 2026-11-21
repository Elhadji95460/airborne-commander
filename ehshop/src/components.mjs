import { html, raw, formatPrice, AVAILABILITY, keySpecs, spec, pricePerShot, isRestricted } from './lib/util.mjs';
import { icon } from './layout.mjs';

export const productImage = (p) => p.image;
export const productThumb = (p) => p.thumb || p.image;
/** Fond de vignette : gris clair si la photo d'origine a un fond gris (évite un carré visible). */
const tint = (p) => (p.imageBg && !/^#f[a-f0-9]f/i.test(p.imageBg) && p.imageBg.toLowerCase() !== '#ffffff' ? ' media--tint' : '');

export function availabilityTag(p) {
  const a = AVAILABILITY[p.availability] ?? AVAILABILITY.in_stock;
  return html`<span class="stock stock--${a.tone}"><span class="stock__dot" aria-hidden="true"></span>${a.label}</span>`;
}

export function regTag(p, { long = false } = {}) {
  const r = p.regulatory;
  if (!r) return '';
  return html`<span class="regtag" title="${r.class ? `Catégorie ${r.class} — ` : ''}vente réservée aux ${r.minAge} ans et plus">${r.class ? html`<strong>${r.class}</strong>` : ''}<span>${long ? `Réservé aux ${r.minAge} ans et plus` : `${r.minAge}+`}</span></span>`;
}

export function productCard(p, ctx, { headingLevel = 3, eager = false } = {}) {
  const cat = ctx.categoryBySlug[p.category];
  const a = AVAILABILITY[p.availability] ?? AVAILABILITY.in_stock;
  const H = `h${headingLevel}`;
  const ks = keySpecs(p);
  const restricted = isRestricted(p, ctx.site);
  return html`
<article class="pcard${a.orderable ? '' : ' pcard--off'}" data-product-card data-slug="${p.slug}" data-cat="${p.category}" data-class="${p.regulatory?.class || ''}" data-price="${p.price}" data-stock="${p.availability}" data-name="${p.name}" data-shots="${spec(p, 'Nombre de coups') || ''}"${restricted ? raw(' data-restricted') : ''}>
  <a class="pcard__media${tint(p)}" href="/produit/${p.slug}/" tabindex="-1" aria-hidden="true">
    <img src="${productThumb(p)}" alt="" width="480" height="480" loading="${eager ? 'eager' : 'lazy'}" decoding="async">
    ${a.orderable ? '' : html`<span class="pcard__flag pcard__flag--off">Épuisé</span>`}
  </a>
  <button class="pcard__fav" type="button" data-fav="${p.slug}" aria-pressed="false" aria-label="Ajouter ${p.name} aux favoris">${icon.heart}</button>
  <div class="pcard__body">
    <p class="pcard__cat">${cat?.short ?? ''}</p>
    ${raw(`<${H} class="pcard__title">`)}<a href="/produit/${p.slug}/">${p.name}</a>${raw(`</${H}>`)}
    ${ks.length ? html`<p class="pcard__specs">${ks.join(' · ')}</p>` : ''}
    <div class="pcard__meta">${regTag(p)}</div>
    <div class="pcard__foot">
      <p class="pcard__price">${formatPrice(p.price)}<span class="sr-only"> TTC</span></p>
      ${a.orderable
        ? html`<button class="pcard__add" type="button" data-add-to-cart="${p.slug}" aria-label="Ajouter ${p.name} au panier">${icon.bag}<span>Ajouter</span></button>`
        : html`<a class="pcard__na" href="/contact/">Me prévenir</a>`}
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

/** Rangée défilante de cartes (mobile : défilement horizontal ; desktop : grille). */
export const productRow = (items, ctx) => html`<div class="prow" data-prow><div class="prow__track">${items.map((p) => productCard(p, ctx))}</div></div>`;

/** Onglets de sélections produits. */
export function productTabs(tabs, ctx, id) {
  return html`<div class="ptabs" data-tabs>
  <div class="ptabs__list" role="tablist" aria-label="Sélections">
    ${tabs.map((t, i) => html`<button class="ptabs__tab" type="button" role="tab" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === 0 ? 'true' : 'false'}"${i ? raw(' tabindex="-1"') : ''}>${t.label}</button>`)}
  </div>
  ${tabs.map((t, i) => html`<div class="ptabs__panel" role="tabpanel" id="${id}-p${i}" aria-labelledby="${id}-t${i}"${i ? raw(' hidden') : ''}>
    ${productRow(t.items, ctx)}
    ${t.link ? html`<p class="ptabs__more"><a class="link-arrow" href="${t.link.href}">${t.link.label}${icon.arrow}</a></p>` : ''}
  </div>`)}
</div>`;
}

const BUDGETS = [['0-13', 'Jusqu’à 13 €'], ['13-25', '13 à 25 €'], ['25-', 'Plus de 25 €']];

/** Liste filtrable (boutique, rayons, sélections). Les filtres fonctionnent côté client ; sans JS, tout reste affiché. */
export function productListing(products, ctx, { showCategoryFilter = true } = {}) {
  const classes = [...new Set(products.map((p) => p.regulatory?.class).filter(Boolean))].sort();
  const cats = ctx.categories.filter((c) => products.some((p) => p.category === c.slug));
  const shots = products.some((p) => spec(p, 'Nombre de coups'));
  return html`
<div class="listing" data-listing>
  <div class="listing__bar">
    <p class="listing__count" aria-live="polite"><span data-listing-count>${products.length}</span> <span data-listing-word>produit${products.length > 1 ? 's' : ''}</span></p>
    <div class="listing__quick" role="group" aria-label="Budget">
      ${BUDGETS.map(([v, l]) => html`<button type="button" class="qchip" data-budget-chip="${v}" aria-pressed="false">${l}</button>`)}
    </div>
    <button class="btn btn--outline listing__filter-btn" type="button" data-filters-toggle aria-expanded="false" aria-controls="filters">Filtres</button>
    <label class="listing__sort"><span>Trier</span>
      <select data-sort>
        <option value="default">Pertinence</option>
        <option value="price-asc">Prix croissant</option>
        <option value="price-desc">Prix décroissant</option>
        ${shots ? html`<option value="shots-desc">Nombre de coups</option>` : ''}
        <option value="name">Nom (A → Z)</option>
      </select>
    </label>
  </div>
  <div class="listing__layout">
    <aside class="filters" id="filters" aria-label="Filtres" data-filters>
      <form data-filter-form>
        ${showCategoryFilter && cats.length > 1 ? html`<fieldset><legend>Rayon</legend>${cats.map((c) => html`<label class="check"><input type="checkbox" name="cat" value="${c.slug}"><span>${c.name}</span></label>`)}</fieldset>` : ''}
        <fieldset><legend>Budget</legend>${BUDGETS.map(([v, l]) => html`<label class="check"><input type="radio" name="budget" value="${v}"><span>${l}</span></label>`)}<label class="check"><input type="radio" name="budget" value="" checked><span>Tous les prix</span></label></fieldset>
        ${classes.length ? html`<fieldset><legend>Catégorie</legend>${classes.map((k) => html`<label class="check"><input type="checkbox" name="class" value="${k}"><span>${k}</span></label>`)}<a class="filters__help" href="/reglementation/#categories">F2, F3 : que signifient ces catégories&nbsp;?</a></fieldset>` : ''}
        <fieldset><legend>Disponibilité</legend><label class="check"><input type="checkbox" name="instock" value="1"><span>En stock uniquement</span></label></fieldset>
        <button class="btn btn--text" type="reset">Réinitialiser</button>
      </form>
    </aside>
    <div>
      <div class="grid grid--products" data-listing-grid>${products.map((p) => productCard(p, ctx))}</div>
      <p class="listing__empty" data-listing-empty hidden>Aucun produit ne correspond à ces critères. <button class="btn btn--text" type="button" data-filters-reset>Réinitialiser les filtres</button></p>
    </div>
  </div>
</div>`;
}

/** Tableau comparatif des compacts (données réelles uniquement ; « — » si non communiqué). */
export function compareTable(items, { limit } = {}) {
  const rows = items.filter((p) => spec(p, 'Nombre de coups')).sort((a, b) => a.price - b.price).slice(0, limit || 999);
  const fmt = (n) => n.toFixed(2).replace('.', ',');
  return html`<div class="table-wrap"><table class="compare" data-compare>
  <caption class="sr-only">Comparatif des compacts : coups, calibre, durée, prix et prix au coup</caption>
  <thead><tr>
    <th scope="col">Produit</th>
    <th scope="col"><button type="button" data-sort-col="shots">Coups</button></th>
    <th scope="col"><button type="button" data-sort-col="cal">Calibre</button></th>
    <th scope="col"><button type="button" data-sort-col="dur">Durée</button></th>
    <th scope="col"><button type="button" data-sort-col="price" aria-sort="ascending">Prix</button></th>
    <th scope="col"><button type="button" data-sort-col="pps">Prix / coup</button></th>
  </tr></thead>
  <tbody>${rows.map((p) => {
    const pps = pricePerShot(p);
    return html`<tr data-shots="${parseInt(spec(p, 'Nombre de coups'), 10)}" data-cal="${parseFloat((spec(p, 'Calibre') || '0').replace(',', '.'))}" data-dur="${parseInt(spec(p, 'Durée approximative') || '0', 10)}" data-price="${p.price}" data-pps="${pps ?? ''}">
      <th scope="row"><a href="/produit/${p.slug}/"><img src="${p.thumb}" alt="" width="48" height="48" loading="lazy"><span>${p.name}${p.regulatory?.class ? html` <small>${p.regulatory.class}</small>` : ''}</span></a></th>
      <td>${spec(p, 'Nombre de coups')}</td><td>${spec(p, 'Calibre') || '—'}</td><td>${spec(p, 'Durée approximative') || '—'}</td>
      <td><strong>${formatPrice(p.price)}</strong></td><td>${pps ? `${fmt(pps)} €` : '—'}</td></tr>`;
  })}</tbody></table></div>`;
}
