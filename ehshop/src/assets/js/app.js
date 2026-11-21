/* EHSHOP — interactions. Sans dépendance, chargé en defer.
   Le site reste consultable sans JavaScript (navigation, fiches, contenus) ;
   panier, recherche et commande nécessitent JavaScript. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AVAIL = { in_stock: ['En stock', 'ok'], low_stock: ['Stock limité', 'warn'], out_of_stock: ['Indisponible', 'off'], preorder: ['Sur commande', 'info'] };
  const MAX_QTY = 20;

  /* ------------------------------------------------------------ Catalogue */
  let catalogPromise;
  const getCatalog = () => (catalogPromise ||= fetch('/assets/catalog.json', { credentials: 'same-origin' })
    .then((r) => { if (!r.ok) throw new Error('catalog'); return r.json(); })
    .then((c) => { c.bySlug = Object.fromEntries(c.products.map((p) => [p.slug, p])); c.catBySlug = Object.fromEntries(c.categories.map((x) => [x.slug, x])); return c; })
    .catch((e) => { catalogPromise = null; throw e; }));

  /* ---------------------------------------------------------------- Panier */
  const KEY = 'ehshop-cart';
  let memory = null; // repli si le stockage local est indisponible
  const Cart = {
    read() {
      try {
        const v = JSON.parse(localStorage.getItem(KEY) || '{}');
        return Array.isArray(v.items) ? v.items.filter((i) => i && typeof i.slug === 'string' && Number.isInteger(i.qty) && i.qty > 0).map((i) => ({ slug: i.slug, qty: Math.min(i.qty, MAX_QTY) })) : [];
      } catch { return []; }
    },
    write(items) {
      try { localStorage.setItem(KEY, JSON.stringify({ items, updated: Date.now() })); } catch { /* stockage indisponible : panier de session uniquement */ memory = items; }
      updateCount();
      document.dispatchEvent(new CustomEvent('cart:change'));
    },
    items() { return memory ?? this.read(); },
    add(slug, qty = 1) {
      const items = this.items();
      const line = items.find((i) => i.slug === slug);
      if (line) line.qty = Math.min(MAX_QTY, line.qty + qty); else items.push({ slug, qty: Math.min(MAX_QTY, qty) });
      this.write(items);
    },
    set(slug, qty) { this.write(this.items().map((i) => (i.slug === slug ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : i))); },
    remove(slug) { this.write(this.items().filter((i) => i.slug !== slug)); },
    clear() { this.write([]); },
    count() { return this.items().reduce((n, i) => n + i.qty, 0); },
  };
  function updateCount(bump) {
    const n = Cart.count();
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = n > 99 ? '99+' : String(n);
      el.hidden = n === 0;
      if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    });
    $$('[data-cart-link]').forEach((a) => a.setAttribute('aria-label', n ? `Panier, ${n} article${n > 1 ? 's' : ''}` : 'Panier, vide'));
  }
  window.addEventListener('storage', (e) => { if (e.key === KEY) { updateCount(); document.dispatchEvent(new CustomEvent('cart:change')); } });

  /** Vérifie la disponibilité avant d'ajouter : le catalogue fait foi, pas le DOM. */
  async function addToCart(slug, qty, btn) {
    try {
      const cat = await getCatalog();
      const p = cat.bySlug[slug];
      if (!p || !p.orderable) { toast('Ce produit n’est pas disponible.', true); return; }
      Cart.add(slug, qty);
      updateCount(true);
      toast(`${p.name} ajouté au panier`, false, { href: '/panier/', label: 'Voir le panier' });
      if (btn) { btn.classList.add('is-added'); setTimeout(() => btn.classList.remove('is-added'), 1400); }
    } catch { toast('Impossible d’ajouter le produit. Vérifiez votre connexion.', true); }
  }

  let toastTimer;
  function toast(msg, isErr, action) {
    const t = $('[data-toast]');
    if (!t) return;
    t.innerHTML = `<span>${escapeHtml(msg)}</span>${action ? `<a href="${action.href}">${escapeHtml(action.label)}</a>` : ''}`;
    t.classList.toggle('toast--err', !!isErr);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 4200);
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add-to-cart]');
    if (!b) return;
    e.preventDefault();
    const qtyInput = $('[data-qty-input]');
    const qty = b.closest('.buybar') && qtyInput ? clampQty(qtyInput.value) : 1;
    addToCart(b.dataset.addToCart, qty, b);
  });

  const clampQty = (v) => Math.max(1, Math.min(MAX_QTY, parseInt(v, 10) || 1));

  /* -------------------------------------------------------- Fiche produit */
  const buyForm = $('[data-buy-form]');
  if (buyForm) {
    const input = $('[data-qty-input]', buyForm);
    $('[data-qty-dec]', buyForm).addEventListener('click', () => { input.value = clampQty(input.value) - 1 || 1; });
    $('[data-qty-inc]', buyForm).addEventListener('click', () => { input.value = Math.min(MAX_QTY, clampQty(input.value) + 1); });
    input.addEventListener('change', () => { input.value = clampQty(input.value); });
    buyForm.addEventListener('submit', (e) => { e.preventDefault(); addToCart(buyForm.dataset.slug, clampQty(input.value), $('button[type="submit"]', buyForm)); });
    const bar = $('[data-buybar]');
    if (bar && 'IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { bar.hidden = en.isIntersecting || en.boundingClientRect.top > 0; }).observe(buyForm);
    }
  }
  $$('[data-gallery]').forEach((g) => {
    const main = $('[data-gallery-main]', g);
    $$('[data-gallery-thumb]', g).forEach((t) => t.addEventListener('click', () => {
      main.src = t.dataset.galleryThumb;
      $$('[data-gallery-thumb]', g).forEach((x) => x.removeAttribute('aria-current'));
      t.setAttribute('aria-current', 'true');
    }));
  });

  /* ------------------------------------------------------------- Header */
  const header = $('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Méga-menu
  const megaBtn = $('[data-mega-toggle]');
  const mega = $('[data-mega]');
  if (megaBtn && mega) {
    let hoverTimer;
    const set = (open) => { megaBtn.setAttribute('aria-expanded', String(open)); mega.hidden = !open; };
    megaBtn.addEventListener('click', () => set(mega.hidden));
    const li = megaBtn.parentElement;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    li.addEventListener('mouseenter', () => { if (fine.matches) { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => set(true), 120); } });
    li.addEventListener('mouseleave', () => { if (fine.matches) { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => set(false), 220); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mega.hidden) { set(false); megaBtn.focus(); } });
    document.addEventListener('click', (e) => { if (!mega.hidden && !li.contains(e.target)) set(false); });
    li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) set(false); });
  }

  // Tiroir mobile (dialogue modal accessible)
  const drawer = $('[data-drawer]');
  const opener = $('[data-drawer-open]');
  if (drawer && opener) {
    const panel = $('.drawer__panel', drawer);
    const focusables = () => $$('a[href], button:not([disabled]), input, select, textarea', panel);
    const open = () => {
      drawer.hidden = false; opener.setAttribute('aria-expanded', 'true'); document.body.classList.add('no-scroll');
      $$('body > :not(.drawer)').forEach((el) => el.setAttribute('inert', ''));
      setTimeout(() => focusables()[1]?.focus(), 30);
    };
    const close = () => {
      drawer.hidden = true; opener.setAttribute('aria-expanded', 'false'); document.body.classList.remove('no-scroll');
      $$('[inert]').forEach((el) => el.removeAttribute('inert'));
      opener.focus();
    };
    opener.addEventListener('click', open);
    $$('[data-drawer-close]', drawer).forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) close(); });
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const f = focusables(); const first = f[0]; const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', (m) => { if (m.matches && !drawer.hidden) close(); });
  }

  /* ---------------------------------------------------------- Recherche */
  function searchProducts(cat, q) {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return cat.products
      .map((p) => {
        const hay = norm(`${p.name} ${cat.catBySlug[p.category]?.name || ''} ${p.class || ''} ${p.summary}`);
        const name = norm(p.name);
        if (!terms.every((t) => hay.includes(t))) return null;
        const score = terms.reduce((s, t) => s + (name.startsWith(t) ? 3 : name.includes(t) ? 2 : 1), 0) + (p.orderable ? 0.5 : 0);
        return { p, score };
      })
      .filter(Boolean).sort((a, b) => b.score - a.score).map((x) => x.p);
  }

  const hs = $('[data-search]');
  if (hs) {
    const input = $('[data-search-input]', hs);
    const box = $('[data-search-results]', hs);
    let timer; let active = -1;
    const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; };
    const render = async () => {
      const q = input.value.trim();
      if (q.length < 2) { close(); return; }
      let cat;
      try { cat = await getCatalog(); } catch { box.innerHTML = '<p class="none">Recherche momentanément indisponible.</p>'; box.hidden = false; return; }
      const res = searchProducts(cat, q).slice(0, 5);
      box.innerHTML = res.length
        ? res.map((p, i) => `<a href="/produit/${encodeURIComponent(p.slug)}/" role="option" id="sr-${i}"><img src="${escapeHtml(p.image)}" alt="" width="48" height="48"><span>${escapeHtml(p.name)}<small>${escapeHtml(cat.catBySlug[p.category]?.short || '')}${p.class ? ` · ${escapeHtml(p.class)}` : ''}</small></span><span class="price">${euro.format(p.price)}</span></a>`).join('') + `<a class="all" href="/recherche/?q=${encodeURIComponent(q)}">Tous les résultats</a>`
        : `<p class="none">Aucun produit pour « ${escapeHtml(q)} ».</p>`;
      box.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(render, 140); });
    input.addEventListener('focus', () => { getCatalog().catch(() => {}); if (input.value.trim().length >= 2) render(); });
    input.addEventListener('keydown', (e) => {
      const opts = $$('a[role="option"]', box);
      if (e.key === 'Escape') { close(); return; }
      if (!opts.length || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === active)));
      input.setAttribute('aria-activedescendant', opts[active].id);
    });
    hs.addEventListener('submit', (e) => {
      const opts = $$('a[role="option"]', box);
      if (active >= 0 && opts[active]) { e.preventDefault(); location.href = opts[active].href; }
    });
    document.addEventListener('click', (e) => { if (!hs.contains(e.target)) close(); });
  }

  const sp = $('[data-search-page]');
  if (sp) {
    const q = new URLSearchParams(location.search).get('q') || '';
    const input = $('input', sp);
    input.value = q;
    const grid = $('[data-search-grid]');
    const sum = $('[data-search-summary]');
    if (!q.trim()) { sum.textContent = 'Saisissez un nom de produit, une famille ou une catégorie réglementaire.'; input.focus(); } else {
      sum.textContent = 'Recherche en cours…';
      getCatalog().then((cat) => {
        const res = searchProducts(cat, q);
        sum.textContent = res.length ? `${res.length} résultat${res.length > 1 ? 's' : ''} pour « ${q} »` : `Aucun résultat pour « ${q} ». Essayez un autre terme ou parcourez le catalogue.`;
        grid.innerHTML = res.map((p) => cardHtml(p, cat)).join('');
      }).catch(() => { sum.textContent = 'La recherche est momentanément indisponible. Réessayez dans un instant.'; });
    }
  }

  function cardHtml(p, cat) {
    const [label, tone] = AVAIL[p.availability] || AVAIL.in_stock;
    const s = escapeHtml(p.slug);
    return `<article class="pcard${p.orderable ? '' : ' pcard--off'}">
      <a class="pcard__media" href="/produit/${s}/" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(p.image)}" alt="" width="800" height="800" loading="lazy">${p.isNew ? '<span class="pcard__flag">Nouveauté</span>' : ''}</a>
      <div class="pcard__body"><p class="pcard__cat">${escapeHtml(cat.catBySlug[p.category]?.short || '')}</p>
      <h2 class="pcard__title"><a href="/produit/${s}/">${escapeHtml(p.name)}</a></h2>
      <div class="pcard__meta">${p.class ? `<span class="regtag"><strong>${escapeHtml(p.class)}</strong>${p.minAge ? `<span>${p.minAge}+</span>` : ''}</span>` : ''}<span class="stock stock--${tone}"><span class="stock__dot" aria-hidden="true"></span>${label}</span></div>
      <div class="pcard__foot"><p class="pcard__price">${euro.format(p.price)}</p>${p.orderable ? `<button class="pcard__add" type="button" data-add-to-cart="${s}" aria-label="Ajouter ${escapeHtml(p.name)} au panier"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg><span>Ajouter</span></button>` : '<span class="pcard__na">Indisponible</span>'}</div></div></article>`;
  }

  /* ------------------------------------------------------ Filtres & tri */
  $$('[data-listing]').forEach((root) => {
    const form = $('[data-filter-form]', root);
    const grid = $('[data-listing-grid]', root);
    const cards = $$('[data-product-card]', grid);
    const original = cards.slice();
    const sort = $('[data-sort]', root);
    const count = $('[data-listing-count]', root);
    const empty = $('[data-listing-empty]', root);
    const panel = $('[data-filters]', root);
    const toggle = $('[data-filters-toggle]', root);

    const apply = () => {
      const fd = new FormData(form);
      const cats = fd.getAll('cat'); const classes = fd.getAll('class'); const inStock = fd.get('instock');
      let n = 0;
      cards.forEach((c) => {
        const ok = (!cats.length || cats.includes(c.dataset.cat)) && (!classes.length || classes.includes(c.dataset.class)) && (!inStock || c.dataset.stock !== 'out_of_stock');
        c.hidden = !ok; if (ok) n++;
      });
      const v = sort.value;
      const sorted = v === 'default' ? original : cards.slice().sort((a, b) => (v === 'name' ? a.dataset.name.localeCompare(b.dataset.name, 'fr') : (v === 'price-asc' ? 1 : -1) * (a.dataset.price - b.dataset.price)));
      sorted.forEach((c) => grid.appendChild(c));
      count.textContent = n;
      count.parentElement.lastChild.textContent = n > 1 ? ' produits' : ' produit';
      empty.hidden = n > 0;
      const params = new URLSearchParams();
      cats.forEach((x) => params.append('cat', x)); classes.forEach((x) => params.append('class', x)); if (inStock) params.set('instock', '1'); if (v !== 'default') params.set('tri', v);
      history.replaceState(null, '', params.toString() ? `?${params}` : location.pathname);
    };
    // Restaure l'état depuis l'URL (liens partageables)
    const init = new URLSearchParams(location.search);
    $$('input', form).forEach((i) => { if (init.getAll(i.name).includes(i.value)) i.checked = true; });
    if (init.get('tri') && [...sort.options].some((o) => o.value === init.get('tri'))) sort.value = init.get('tri');
    form.addEventListener('change', apply);
    form.addEventListener('reset', () => setTimeout(apply));
    sort.addEventListener('change', apply);
    $('[data-filters-reset]', root)?.addEventListener('click', () => form.reset());
    toggle?.addEventListener('click', () => { const o = panel.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', String(o)); });
    if ([...init.keys()].length) apply();
  });

  /* ---------------------------------------------------------- Page panier */
  const cartPage = $('[data-cart-page]');
  if (cartPage) {
    const render = async () => {
      let cat;
      try { cat = await getCatalog(); } catch { cartPage.innerHTML = '<div class="form-error" role="alert">Le panier ne peut pas être chargé. Vérifiez votre connexion puis rechargez la page.</div>'; cartPage.removeAttribute('aria-busy'); return; }
      const items = Cart.items();
      const lines = items.map((i) => ({ ...i, p: cat.bySlug[i.slug] }));
      const unknown = lines.filter((l) => !l.p);
      if (unknown.length) { unknown.forEach((l) => Cart.remove(l.slug)); return; }
      cartPage.removeAttribute('aria-busy');
      if (!lines.length) {
        cartPage.innerHTML = '<div class="cart-empty"><h2>Votre panier est vide</h2><p>Parcourez le catalogue pour ajouter des articles.</p><a class="btn btn--dark btn--lg" href="/catalogue/">Voir le catalogue</a></div>';
        return;
      }
      const total = lines.reduce((s, l) => s + (l.p.orderable ? l.p.price * l.qty : 0), 0);
      const blocked = lines.some((l) => !l.p.orderable);
      const age = Math.max(cat.minimumBuyerAge, ...lines.map((l) => l.p.minAge || 0));
      cartPage.innerHTML = `
        <div>
          <ul class="cart__lines">${lines.map((l) => `
            <li class="cline">
              <a href="/produit/${escapeHtml(l.slug)}/" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(l.p.image)}" alt="" width="110" height="110"></a>
              <div>
                <a class="cline__name" href="/produit/${escapeHtml(l.slug)}/">${escapeHtml(l.p.name)}</a>
                <div class="cline__meta">${l.p.class ? `<span class="regtag"><strong>${escapeHtml(l.p.class)}</strong>${l.p.minAge ? `<span>${l.p.minAge}+</span>` : ''}</span>` : ''}<span>${euro.format(l.p.price)} l’unité</span></div>
                ${l.p.orderable ? '' : '<p class="cline__warn">Ce produit n’est plus disponible : retirez-le pour poursuivre.</p>'}
                <div class="cline__ctrl">
                  <div class="qty qty--s"><button type="button" data-dec="${escapeHtml(l.slug)}" aria-label="Diminuer la quantité de ${escapeHtml(l.p.name)}">−</button><input type="number" min="1" max="${MAX_QTY}" value="${l.qty}" data-set="${escapeHtml(l.slug)}" aria-label="Quantité de ${escapeHtml(l.p.name)}" inputmode="numeric"><button type="button" data-inc="${escapeHtml(l.slug)}" aria-label="Augmenter la quantité de ${escapeHtml(l.p.name)}">+</button></div>
                  <button class="cline__rm" type="button" data-rm="${escapeHtml(l.slug)}">Retirer</button>
                </div>
              </div>
              <p class="cline__price">${euro.format(l.p.price * l.qty)}</p>
            </li>`).join('')}
          </ul>
          <p class="mt-1"><button class="btn btn--text" type="button" data-clear>Vider le panier</button></p>
        </div>
        <aside class="cart__aside">
          <div class="card">
            <h2>Récapitulatif</h2>
            <div class="summary">
              <div class="summary__row"><span>Sous-total TTC</span><strong>${euro.format(total)}</strong></div>
              <div class="summary__row"><span>Remise / livraison</span><span>Selon le mode choisi</span></div>
              <div class="summary__row summary__row--total"><span>Total TTC</span><span>${euro.format(total)}</span></div>
              <p class="summary__note">Hors frais de remise éventuels, confirmés avant paiement. <a href="/livraison/">Modalités</a></p>
            </div>
            <a class="btn btn--accent btn--lg btn--block" href="/commande/"${blocked ? ' aria-disabled="true" tabindex="-1"' : ''}>Passer commande</a>
          </div>
          <div class="card"><p><strong>Âge minimum pour ce panier : ${age} ans.</strong> Votre date de naissance vous sera demandée.</p></div>
        </aside>`;
    };
    cartPage.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      const items = Cart.items();
      const find = (s) => items.find((i) => i.slug === s);
      if (t.dataset.inc) Cart.set(t.dataset.inc, (find(t.dataset.inc)?.qty || 0) + 1);
      else if (t.dataset.dec) { const l = find(t.dataset.dec); if (l && l.qty > 1) Cart.set(l.slug, l.qty - 1); }
      else if (t.dataset.rm) Cart.remove(t.dataset.rm);
      else if (t.hasAttribute('data-clear')) { if (confirm('Vider le panier ?')) Cart.clear(); }
    });
    cartPage.addEventListener('change', (e) => { if (e.target.dataset.set) Cart.set(e.target.dataset.set, clampQty(e.target.value)); });
    document.addEventListener('cart:change', render);
    render();
  }

  /* ------------------------------------------------------------ Commande */
  const co = $('[data-checkout]');
  if (co) {
    const summary = $('[data-checkout-summary]');
    const submit = $('[data-checkout-submit]');
    const errBox = $('[data-form-error]', co);
    let state = null;

    const renderSummary = async () => {
      let cat;
      try { cat = await getCatalog(); } catch { summary.innerHTML = '<div class="form-error" role="alert">Impossible de charger le récapitulatif. Rechargez la page.</div>'; submit.disabled = true; return; }
      const lines = Cart.items().map((i) => ({ ...i, p: cat.bySlug[i.slug] })).filter((l) => l.p);
      summary.removeAttribute('aria-busy');
      if (!lines.length) { summary.innerHTML = '<p>Votre panier est vide.</p><p class="mt-1"><a href="/catalogue/">Retour au catalogue</a></p>'; submit.disabled = true; return; }
      const off = lines.filter((l) => !l.p.orderable);
      const total = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
      state = { cat, lines, total, age: Math.max(cat.minimumBuyerAge, ...lines.map((l) => l.p.minAge || 0)) };
      summary.innerHTML = `<ul class="summary__items">${lines.map((l) => `<li><span>${l.qty} × ${escapeHtml(l.p.name)}</span><span>${euro.format(l.p.price * l.qty)}</span></li>`).join('')}</ul>
        <div class="summary mt-1"><div class="summary__row summary__row--total"><span>Total TTC</span><span>${euro.format(total)}</span></div><p class="summary__note">Hors frais de remise éventuels. Âge minimum&nbsp;: ${state.age}&nbsp;ans.</p></div>
        ${off.length ? '<div class="form-error mt-1" role="alert">Un article n’est plus disponible. <a href="/panier/">Modifier le panier</a></div>' : ''}`;
      submit.disabled = off.length > 0;
    };
    renderSummary();

    const ageFrom = (iso) => {
      const d = new Date(iso + 'T00:00:00'); if (Number.isNaN(d.getTime())) return NaN;
      const n = new Date(); let a = n.getFullYear() - d.getFullYear();
      if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
      return a;
    };

    const validate = () => {
      const errs = [];
      $$('[aria-invalid]', co).forEach((el) => el.removeAttribute('aria-invalid'));
      $$('.field__err', co).forEach((el) => el.remove());
      const mark = (el, msg) => {
        el.setAttribute('aria-invalid', 'true');
        errs.push({ el, msg });
        const field = el.closest('.field');
        if (field) { const p = document.createElement('p'); p.className = 'field__err'; p.id = `${el.id}-err`; p.textContent = msg; field.appendChild(p); el.setAttribute('aria-describedby', [el.getAttribute('aria-describedby'), p.id].filter(Boolean).join(' ')); }
      };
      $$('input[required], textarea[required], select[required]', co).forEach((el) => {
        if (el.type === 'checkbox') { if (!el.checked) mark(el, 'Cette case doit être cochée.'); return; }
        if (el.type === 'radio') return;
        if (!el.value.trim()) mark(el, 'Ce champ est obligatoire.');
        else if (!el.checkValidity()) mark(el, el.type === 'email' ? 'Adresse e-mail invalide.' : 'Format invalide.');
      });
      const b = $('#f-birth');
      if (b.value) {
        const a = ageFrom(b.value);
        if (Number.isNaN(a) || a > 120 || a < 0) mark(b, 'Date de naissance invalide.');
        else if (state && a < state.age) mark(b, `Vous devez avoir au moins ${state.age} ans pour cette commande.`);
      }
      const ph = $('#f-phone');
      if (ph.value && ph.value.replace(/[^\d]/g, '').length < 9) mark(ph, 'Numéro de téléphone invalide.');
      return errs;
    };

    const showErrors = (errs) => {
      errBox.innerHTML = `Merci de corriger ${errs.length > 1 ? `les ${errs.length} points suivants` : 'le point suivant'}&nbsp;:<ul>${errs.map((e) => `<li>${escapeHtml(e.msg)}${e.el.labels?.[0] ? ` (${escapeHtml(e.el.labels[0].textContent.trim().slice(0, 60))})` : ''}</li>`).join('')}</ul>`;
      errBox.hidden = false;
      errBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
      errs[0].el.focus({ preventScroll: true });
    };

    co.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state) return;
      const errs = validate();
      if (errs.length) { showErrors(errs); return; }
      errBox.hidden = true;
      const fd = new FormData(co);
      if (fd.get('website')) return; // pot de miel anti-robots
      const ref = `EH-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const order = {
        reference: ref, createdAt: new Date().toISOString(),
        customer: { firstName: fd.get('firstName'), lastName: fd.get('lastName'), email: fd.get('email'), phone: fd.get('phone'), birthDate: fd.get('birthDate') },
        delivery: { mode: fd.get('deliveryMode'), address: fd.get('address'), postalCode: fd.get('postalCode'), city: fd.get('city') },
        note: fd.get('note') || '',
        items: state.lines.map((l) => ({ slug: l.slug, name: l.p.name, qty: l.qty, unitPrice: l.p.price })),
        totalTTC: Math.round(state.total * 100) / 100,
        consents: { age: true, regulation: true, cgv: true },
      };
      submit.disabled = true; const label = submit.textContent; submit.textContent = 'Envoi en cours…';
      try {
        if (state.cat.orderEndpoint) {
          const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 15000);
          const r = await fetch(state.cat.orderEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(order), signal: ctl.signal });
          clearTimeout(to);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
        } else if (state.cat.orderEmail) {
          const lines = order.items.map((i) => `- ${i.qty} x ${i.name} (${euro.format(i.unitPrice)})`).join('\n');
          const body = `Demande de commande ${ref}\n\n${lines}\n\nTotal TTC : ${euro.format(order.totalTTC)}\n\n${order.customer.firstName} ${order.customer.lastName}\nNé(e) le ${order.customer.birthDate}\n${order.customer.email} · ${order.customer.phone}\n\nRemise : ${order.delivery.mode}\n${order.delivery.address}, ${order.delivery.postalCode} ${order.delivery.city}\n\n${order.note}\n\nJ'ai accepté les CGV et certifie avoir l'âge requis.`;
          location.href = `mailto:${encodeURIComponent(state.cat.orderEmail)}?subject=${encodeURIComponent(`Commande ${ref}`)}&body=${encodeURIComponent(body)}`;
        } else {
          throw new Error('no-channel');
        }
        try { sessionStorage.setItem('ehshop-last-order', JSON.stringify({ ref, mail: !state.cat.orderEndpoint })); } catch { /* facultatif */ }
        Cart.clear();
        setTimeout(() => { location.href = '/commande/confirmation/'; }, state.cat.orderEndpoint ? 0 : 600);
      } catch (err) {
        submit.disabled = false; submit.textContent = label;
        errBox.textContent = err.message === 'no-channel'
          ? 'La prise de commande en ligne n’est pas encore ouverte. Contactez le service client pour commander.'
          : 'L’envoi a échoué (connexion ou serveur indisponible). Votre panier est conservé : réessayez dans un instant.';
        errBox.hidden = false; errBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  }

  const confirmRef = $('[data-confirm-ref]');
  if (confirmRef) {
    try {
      const o = JSON.parse(sessionStorage.getItem('ehshop-last-order') || 'null');
      if (o?.ref) {
        confirmRef.textContent = `Référence : ${o.ref}`; confirmRef.hidden = false;
        if (o.mail) $('[data-confirm-text]').textContent = 'Votre messagerie s’est ouverte avec le détail de la commande : pensez à envoyer l’e-mail. Le service client vous confirmera la disponibilité, le mode de remise et le paiement.';
      }
    } catch { /* rien */ }
  }

  /* ------------------------------------------------------------- Contact */
  const cf = $('[data-contact-form]');
  if (cf) {
    const err = $('[data-form-error]', cf);
    cf.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(cf);
      if (fd.get('website')) return;
      const missing = $$('[required]', cf).filter((el) => !el.value.trim() || !el.checkValidity());
      $$('[aria-invalid]', cf).forEach((el) => el.removeAttribute('aria-invalid'));
      missing.forEach((el) => el.setAttribute('aria-invalid', 'true'));
      if (missing.length) { err.textContent = 'Merci de renseigner tous les champs (e-mail valide).'; err.hidden = false; missing[0].focus(); return; }
      if (!cf.dataset.email) { err.textContent = 'Le formulaire n’est pas encore relié à une adresse e-mail. Merci de réessayer plus tard.'; err.hidden = false; return; }
      err.hidden = true;
      const body = `${fd.get('message')}\n\n— ${fd.get('name')} (${fd.get('email')})`;
      location.href = `mailto:${encodeURIComponent(cf.dataset.email)}?subject=${encodeURIComponent(`[EHSHOP] ${fd.get('subject')}`)}&body=${encodeURIComponent(body)}`;
    });
  }

  /* ----------------------------------------------- Sommaire & apparitions */
  const tocLinks = $$('.doc__toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((ens) => ens.forEach((en) => {
      if (en.isIntersecting) { tocLinks.forEach((a) => a.classList.remove('is-active')); map.get(en.target.id)?.classList.add('is-active'); }
    }), { rootMargin: '-30% 0px -60% 0px' });
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const targets = $$('.shead, .grid--cats > li, .grid--products > .pcard, .guide__steps > li, .trust__item');
    const io = new IntersectionObserver((ens) => ens.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el, i) => {
      if (el.getBoundingClientRect().top < innerHeight) return; // déjà visible : pas d'animation
      el.classList.add('reveal'); el.style.transitionDelay = `${(i % 4) * 60}ms`; io.observe(el);
    });
  }

  updateCount();
})();
