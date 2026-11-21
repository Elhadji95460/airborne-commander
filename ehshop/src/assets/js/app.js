/* EHSHOP — interactions. Sans dépendance, chargé en defer.
   Le site reste consultable sans JavaScript (navigation, fiches, contenus) ;
   panier, favoris, recherche et commande nécessitent JavaScript. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AVAIL = { in_stock: ['En stock', 'ok'], low_stock: ['Stock limité', 'warn'], out_of_stock: ['Épuisé', 'off'], preorder: ['Sur commande', 'info'] };
  const MAX_QTY = 20;
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  };
  const ICON_BAG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>';
  const ICON_HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';

  /* ---------------------------------------------- Restriction réglementaire datée */
  // Date du jour à Paris (AAAA-MM-JJ), indépendante du fuseau de l'appareil.
  const todayParis = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
  const noticeEl = $('[data-notice]');
  const noticeUntil = noticeEl?.dataset.until || $('[data-restrict-note]')?.dataset.until || null;
  const restrictionOn = !!noticeUntil && todayParis <= noticeUntil;
  const resumeLabel = (() => {
    if (!noticeUntil) return '';
    const d = new Date(`${noticeUntil}T12:00:00`); d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  })();
  if (!restrictionOn) $$('[data-notice], [data-restrict-note], [data-notice-block]').forEach((el) => el.remove());

  function lockRestricted(root = document) {
    if (!restrictionOn) return;
    $$('[data-add-to-cart][data-restricted], [data-product-card][data-restricted] [data-add-to-cart]', root).forEach((b) => {
      b.disabled = true; b.classList.add('is-locked');
      const label = `Dès le ${resumeLabel}`;
      const span = $('span', b); if (span) span.textContent = label; else b.textContent = label;
      b.setAttribute('aria-label', `Commande possible à partir du ${resumeLabel}`);
    });
    $$('[data-buy-form][data-restricted]', root).forEach((f) => {
      const b = $('button[type="submit"]', f); b.disabled = true;
      $('span', b).textContent = `Commande possible dès le ${resumeLabel}`;
      $$('input, button', f).forEach((el) => { el.disabled = true; });
    });
  }
  lockRestricted();

  /* ------------------------------------------------------------ Catalogue */
  let catalogPromise;
  const getCatalog = () => (catalogPromise ||= fetch('/assets/catalog.json', { credentials: 'same-origin' })
    .then((r) => { if (!r.ok) throw new Error('catalog'); return r.json(); })
    .then((c) => {
      c.bySlug = Object.fromEntries(c.products.map((p) => [p.slug, p]));
      c.catBySlug = Object.fromEntries(c.categories.map((x) => [x.slug, x]));
      c.locked = (p) => restrictionOn && p.restricted;
      return c;
    })
    .catch((e) => { catalogPromise = null; throw e; }));

  /* ---------------------------------------------------------------- Panier */
  const KEY = 'ehshop-cart';
  let memory = null; // repli si le stockage local est indisponible
  const Cart = {
    items() {
      if (memory) return memory.map((i) => ({ ...i }));
      const v = store.get(KEY, {});
      return Array.isArray(v.items) ? v.items.filter((i) => i && typeof i.slug === 'string' && Number.isInteger(i.qty) && i.qty > 0).map((i) => ({ slug: i.slug, qty: Math.min(i.qty, MAX_QTY) })) : [];
    },
    write(items) {
      if (!store.set(KEY, { items, updated: Date.now() })) memory = items;
      updateCount();
      document.dispatchEvent(new CustomEvent('cart:change'));
    },
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

  function bumpEl(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function updateCount(bump) {
    const n = Cart.count();
    $$('[data-cart-count]').forEach((el) => { el.textContent = n > 99 ? '99+' : String(n); el.hidden = n === 0; if (bump) bumpEl(el); });
    $$('[data-cart-link]').forEach((a) => a.setAttribute('aria-label', n ? `Panier, ${n} article${n > 1 ? 's' : ''}` : 'Panier, vide'));
    const totals = $$('[data-cart-total]');
    if (!totals.length) return;
    if (!n) { totals.forEach((t) => { t.textContent = euro.format(0); }); return; }
    getCatalog().then((cat) => {
      const sum = Cart.items().reduce((s, i) => s + (cat.bySlug[i.slug]?.price || 0) * i.qty, 0);
      totals.forEach((t) => { t.textContent = euro.format(sum); });
    }).catch(() => {});
  }
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { updateCount(); document.dispatchEvent(new CustomEvent('cart:change')); }
    if (e.key === FAV_KEY) { syncFavs(); }
  });

  /** Vérifie disponibilité et restriction avant d'ajouter : le catalogue fait foi, pas le DOM. */
  async function addToCart(slug, qty, btn) {
    try {
      const cat = await getCatalog();
      const p = cat.bySlug[slug];
      if (!p || !p.orderable) { toast('Ce produit n’est pas disponible.', true); return; }
      if (cat.locked(p)) { toast(`Commande de ce produit possible à partir du ${resumeLabel}.`, true); return; }
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

  const clampQty = (v) => Math.max(1, Math.min(MAX_QTY, parseInt(v, 10) || 1));

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add-to-cart]');
    if (b) {
      e.preventDefault();
      if (b.disabled) return;
      const qtyInput = $('[data-qty-input]');
      const qty = b.closest('.buybar') && qtyInput ? clampQty(qtyInput.value) : 1;
      addToCart(b.dataset.addToCart, qty, b);
      return;
    }
    const f = e.target.closest('[data-fav]');
    if (f) { e.preventDefault(); toggleFav(f.dataset.fav); }
  });

  /* --------------------------------------------------------------- Favoris */
  const FAV_KEY = 'ehshop-favs';
  const favs = () => { const v = store.get(FAV_KEY, []); return Array.isArray(v) ? v.filter((s) => typeof s === 'string') : []; };
  function syncFavs(bump) {
    const list = favs();
    $$('[data-fav]').forEach((b) => {
      const on = list.includes(b.dataset.fav);
      b.setAttribute('aria-pressed', String(on));
      const name = b.closest('[data-product-card]')?.dataset.name || '';
      b.setAttribute('aria-label', on ? `Retirer ${name} des favoris`.replace('  ', ' ') : `Ajouter ${name} aux favoris`.replace('  ', ' '));
    });
    $$('[data-fav-count]').forEach((el) => { el.textContent = String(list.length); el.hidden = !list.length; if (bump) bumpEl(el); });
  }
  function toggleFav(slug) {
    const list = favs();
    const on = list.includes(slug);
    store.set(FAV_KEY, on ? list.filter((s) => s !== slug) : [...list, slug]);
    syncFavs(!on);
    toast(on ? 'Retiré des favoris' : 'Ajouté aux favoris', false, on ? null : { href: '/favoris/', label: 'Mes favoris' });
    document.dispatchEvent(new CustomEvent('fav:change'));
  }
  syncFavs();

  const favGrid = $('[data-fav-grid]');
  if (favGrid) {
    const render = async () => {
      const list = favs();
      favGrid.removeAttribute('aria-busy');
      $('[data-fav-empty]').hidden = list.length > 0;
      if (!list.length) { favGrid.innerHTML = ''; return; }
      try {
        const cat = await getCatalog();
        favGrid.innerHTML = list.map((s) => cat.bySlug[s]).filter(Boolean).map((p) => cardHtml(p, cat)).join('');
        syncFavs(); lockRestricted(favGrid);
      } catch { favGrid.innerHTML = '<p class="form-error">Impossible de charger vos favoris. Rechargez la page.</p>'; }
    };
    document.addEventListener('fav:change', render);
    render();
  }

  /* -------------------------------------------------------- Fiche produit */
  const buyForm = $('[data-buy-form]');
  if (buyForm) {
    const input = $('[data-qty-input]', buyForm);
    $('[data-qty-dec]', buyForm).addEventListener('click', () => { input.value = Math.max(1, clampQty(input.value) - 1); });
    $('[data-qty-inc]', buyForm).addEventListener('click', () => { input.value = Math.min(MAX_QTY, clampQty(input.value) + 1); });
    input.addEventListener('change', () => { input.value = clampQty(input.value); });
    buyForm.addEventListener('submit', (e) => { e.preventDefault(); addToCart(buyForm.dataset.slug, clampQty(input.value), $('button[type="submit"]', buyForm)); });
    const bar = $('[data-buybar]');
    if (bar && 'IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { bar.hidden = en.isIntersecting || en.boundingClientRect.top > 0; }).observe(buyForm);
    }
  }

  /* ------------------------------------------------------------- Header */
  const header = $('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

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

  /* -------------------------------------------- Modales : tiroir et contrôle d'âge */
  function trapFocus(container, e) {
    if (e.key !== 'Tab') return;
    const f = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea', container).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0]; const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  const setInert = (except, on) => $$('body > *').forEach((el) => { if (el !== except && !el.contains(except)) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); } });

  const drawer = $('[data-drawer]');
  const opener = $('[data-drawer-open]');
  if (drawer && opener) {
    const panel = $('.drawer__panel', drawer);
    const open = () => {
      drawer.hidden = false; opener.setAttribute('aria-expanded', 'true'); document.body.classList.add('no-scroll');
      setInert(drawer, true);
      setTimeout(() => $('button', panel)?.focus(), 30);
    };
    const close = () => {
      drawer.hidden = true; opener.setAttribute('aria-expanded', 'false'); document.body.classList.remove('no-scroll');
      setInert(drawer, false);
      opener.focus();
    };
    opener.addEventListener('click', open);
    $$('[data-drawer-close]', drawer).forEach((b) => b.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) close(); });
    drawer.addEventListener('keydown', (e) => trapFocus(panel, e));
    window.matchMedia('(min-width: 1100px)').addEventListener('change', (m) => { if (m.matches && !drawer.hidden) close(); });
  }

  // Contrôle d'âge à l'entrée : mémorisé 30 jours sur l'appareil. La date de naissance reste vérifiée à la commande.
  const gate = $('[data-agegate]');
  const AGE_KEY = 'ehshop-age-ok';
  const ageOk = (() => { const t = store.get(AGE_KEY, 0); return typeof t === 'number' && Date.now() - t < 30 * 864e5; })();
  const isBot = /bot|crawl|spider|lighthouse|headlesschrome-seo/i.test(navigator.userAgent);
  if (gate && !ageOk && !isBot && !/^\/(mentions-legales|cgv|confidentialite|cookies)\//.test(location.pathname)) {
    gate.hidden = false;
    document.body.classList.add('no-scroll');
    setInert(gate, true);
    const panel = $('.agegate__panel', gate);
    setTimeout(() => $('[data-agegate-yes]', gate).focus(), 30);
    gate.addEventListener('keydown', (e) => trapFocus(panel, e));
    $('[data-agegate-yes]', gate).addEventListener('click', () => {
      store.set(AGE_KEY, Date.now());
      gate.hidden = true; document.body.classList.remove('no-scroll'); setInert(gate, false);
    });
    $('[data-agegate-no]', gate).addEventListener('click', () => { $('[data-agegate-msg]', gate).hidden = false; $('.agegate__actions', gate).hidden = true; });
  }

  /* ---------------------------------------------------------------- Onglets */
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$('[role="tab"]', root);
    const select = (t, focus) => {
      tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; $(`#${x.getAttribute('aria-controls')}`).hidden = !on; });
      if (focus) t.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
  });

  /* ------------------------------------------------------ Comparateur (tri) */
  $$('[data-compare]').forEach((table) => {
    const tbody = $('tbody', table);
    const btns = $$('[data-sort-col]', table);
    btns.forEach((b) => b.addEventListener('click', () => {
      const key = b.dataset.sortCol;
      const dir = b.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      btns.forEach((x) => x.removeAttribute('aria-sort'));
      b.setAttribute('aria-sort', dir);
      const val = (tr) => { const v = parseFloat(tr.dataset[key]); return Number.isNaN(v) || v === 0 ? null : v; };
      $$('tr', tbody).sort((a, c) => {
        const x = val(a); const y = val(c);
        if (x == null) return 1; if (y == null) return -1;
        return dir === 'ascending' ? x - y : y - x;
      }).forEach((tr) => tbody.appendChild(tr));
    }));
  });

  /* ---------------------------------------------------------- Recherche */
  function searchProducts(cat, q) {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return cat.products
      .map((p) => {
        const hay = norm(`${p.name} ${cat.catBySlug[p.category]?.name || ''} ${p.class || ''} ${p.keys.join(' ')} ${p.summary}`);
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
      const res = searchProducts(cat, q).slice(0, 6);
      box.innerHTML = res.length
        ? res.map((p, i) => `<a href="/produit/${encodeURIComponent(p.slug)}/" role="option" id="sr-${i}"><img src="${escapeHtml(p.image)}" alt="" width="48" height="48"><span>${escapeHtml(p.name)}<small>${escapeHtml([cat.catBySlug[p.category]?.short, ...p.keys.slice(0, 2)].filter(Boolean).join(' · '))}</small></span><span class="price">${euro.format(p.price)}</span></a>`).join('') + `<a class="all" href="/recherche/?q=${encodeURIComponent(q)}">Voir tous les résultats</a>`
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
    if (!q.trim()) { sum.textContent = 'Saisissez un nom de produit, un rayon, une catégorie (F2, F3) ou un calibre.'; input.focus(); } else {
      sum.textContent = 'Recherche en cours…';
      getCatalog().then((cat) => {
        const res = searchProducts(cat, q);
        sum.textContent = res.length ? `${res.length} résultat${res.length > 1 ? 's' : ''} pour « ${q} »` : `Aucun résultat pour « ${q} ». Essayez un autre terme ou parcourez la boutique.`;
        grid.innerHTML = res.map((p) => cardHtml(p, cat)).join('');
        syncFavs(); lockRestricted(grid);
      }).catch(() => { sum.textContent = 'La recherche est momentanément indisponible. Réessayez dans un instant.'; });
    }
  }

  function cardHtml(p, cat) {
    const s = escapeHtml(p.slug);
    return `<article class="pcard${p.orderable ? '' : ' pcard--off'}" data-product-card data-name="${escapeHtml(p.name)}"${p.restricted ? ' data-restricted' : ''}>
      <a class="pcard__media${p.tint ? ' media--tint' : ''}" href="/produit/${s}/" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(p.image)}" alt="" width="480" height="480" loading="lazy">${p.orderable ? '' : '<span class="pcard__flag pcard__flag--off">Épuisé</span>'}</a>
      <button class="pcard__fav" type="button" data-fav="${s}" aria-pressed="false" aria-label="Ajouter ${escapeHtml(p.name)} aux favoris">${ICON_HEART}</button>
      <div class="pcard__body"><p class="pcard__cat">${escapeHtml(cat.catBySlug[p.category]?.short || '')}</p>
      <h2 class="pcard__title"><a href="/produit/${s}/">${escapeHtml(p.name)}</a></h2>
      ${p.keys.length ? `<p class="pcard__specs">${escapeHtml(p.keys.join(' · '))}</p>` : ''}
      <div class="pcard__meta">${p.minAge ? `<span class="regtag">${p.class ? `<strong>${escapeHtml(p.class)}</strong>` : ''}<span>${p.minAge}+</span></span>` : ''}</div>
      <div class="pcard__foot"><p class="pcard__price">${euro.format(p.price)}</p>${p.orderable ? `<button class="pcard__add" type="button" data-add-to-cart="${s}"${p.restricted ? ' data-restricted' : ''} aria-label="Ajouter ${escapeHtml(p.name)} au panier">${ICON_BAG}<span>Ajouter</span></button>` : '<a class="pcard__na" href="/contact/">Me prévenir</a>'}</div></div></article>`;
  }

  /* ------------------------------------------------------ Filtres & tri */
  const inBudget = (price, b) => { if (!b) return true; const [lo, hi] = b.split('-').map((x) => (x === '' ? null : Number(x))); return (lo == null || price > lo || (lo === 0 && price >= 0)) && (hi == null || price <= hi); };
  $$('[data-listing]').forEach((root) => {
    const form = $('[data-filter-form]', root);
    const grid = $('[data-listing-grid]', root);
    const cards = $$('[data-product-card]', grid);
    const original = cards.slice();
    const sort = $('[data-sort]', root);
    const count = $('[data-listing-count]', root);
    const word = $('[data-listing-word]', root);
    const empty = $('[data-listing-empty]', root);
    const panel = $('[data-filters]', root);
    const toggle = $('[data-filters-toggle]', root);
    const chips = $$('[data-budget-chip]', root);

    const apply = () => {
      const fd = new FormData(form);
      const cats = fd.getAll('cat'); const classes = fd.getAll('class'); const inStock = fd.get('instock'); const budget = fd.get('budget') || '';
      let n = 0;
      cards.forEach((c) => {
        const ok = (!cats.length || cats.includes(c.dataset.cat)) && (!classes.length || classes.includes(c.dataset.class)) && (!inStock || c.dataset.stock !== 'out_of_stock') && inBudget(Number(c.dataset.price), budget);
        c.hidden = !ok; if (ok) n++;
      });
      chips.forEach((ch) => ch.setAttribute('aria-pressed', String(ch.dataset.budgetChip === budget)));
      const v = sort.value;
      const by = { 'price-asc': (a, b) => a.dataset.price - b.dataset.price, 'price-desc': (a, b) => b.dataset.price - a.dataset.price, 'shots-desc': (a, b) => (Number(b.dataset.shots) || 0) - (Number(a.dataset.shots) || 0), name: (a, b) => a.dataset.name.localeCompare(b.dataset.name, 'fr') }[v];
      (by ? cards.slice().sort(by) : original).forEach((c) => grid.appendChild(c));
      count.textContent = n;
      word.textContent = n > 1 ? 'produits' : 'produit';
      empty.hidden = n > 0;
      const params = new URLSearchParams();
      cats.forEach((x) => params.append('cat', x)); classes.forEach((x) => params.append('class', x));
      if (inStock) params.set('instock', '1'); if (budget) params.set('budget', budget); if (v !== 'default') params.set('tri', v);
      history.replaceState(null, '', params.toString() ? `?${params}` : location.pathname);
    };
    const init = new URLSearchParams(location.search);
    $$('input[type="checkbox"]', form).forEach((i) => { if (init.getAll(i.name).includes(i.value)) i.checked = true; });
    const b0 = init.get('budget');
    if (b0) { const r = $$('input[name="budget"]', form).find((i) => i.value === b0); if (r) r.checked = true; }
    if (init.get('tri') && [...sort.options].some((o) => o.value === init.get('tri'))) sort.value = init.get('tri');
    chips.forEach((ch) => ch.addEventListener('click', () => {
      const v = ch.getAttribute('aria-pressed') === 'true' ? '' : ch.dataset.budgetChip;
      $$('input[name="budget"]', form).forEach((i) => { i.checked = i.value === v; });
      apply();
    }));
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
        cartPage.innerHTML = '<div class="cart-empty"><h2>Votre panier est vide</h2><p>Parcourez nos rayons pour ajouter des articles.</p><a class="btn btn--dark btn--lg" href="/boutique/">Voir la boutique</a></div>';
        return;
      }
      const sub = lines.reduce((s, l) => s + (l.p.orderable ? l.p.price * l.qty : 0), 0);
      const ship = cat.shippingZones[0];
      const blockedOut = lines.some((l) => !l.p.orderable);
      const blockedReg = lines.some((l) => cat.locked(l.p));
      const age = Math.max(cat.minimumBuyerAge, ...lines.map((l) => l.p.minAge || 0));
      cartPage.innerHTML = `
        <div>
          <ul class="cart__lines">${lines.map((l) => `
            <li class="cline">
              <a href="/produit/${escapeHtml(l.slug)}/" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(l.p.image)}" alt="" width="110" height="110"></a>
              <div>
                <a class="cline__name" href="/produit/${escapeHtml(l.slug)}/">${escapeHtml(l.p.name)}</a>
                <div class="cline__meta">${l.p.minAge ? `<span class="regtag">${l.p.class ? `<strong>${escapeHtml(l.p.class)}</strong>` : ''}<span>${l.p.minAge}+</span></span>` : ''}<span>${euro.format(l.p.price)} l’unité</span>${l.p.keys.length ? `<span>${escapeHtml(l.p.keys.join(' · '))}</span>` : ''}</div>
                ${l.p.orderable ? '' : '<p class="cline__warn">Ce produit est épuisé : retirez-le pour poursuivre.</p>'}
                ${cat.locked(l.p) ? `<p class="cline__lock">Vente suspendue jusqu’au ${escapeHtml(cat.notice ? new Date(`${cat.notice.until}T12:00:00`).toLocaleDateString('fr-FR') : '')} : commande possible dès le ${resumeLabel}. Retirez-le ou revenez à cette date.</p>` : ''}
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
              <div class="summary__row"><span>Sous-total TTC</span><strong>${euro.format(sub)}</strong></div>
              <div class="summary__row"><span>Livraison (${escapeHtml(ship.label)})</span><span>${euro.format(ship.price)}</span></div>
              <div class="summary__row summary__row--total"><span>Total TTC</span><span>${euro.format(sub + ship.price)}</span></div>
              <p class="summary__note">Frais de port par commande : ${cat.shippingZones.map((z) => `${escapeHtml(z.label)} ${z.price != null ? euro.format(z.price) : escapeHtml(z.priceText.split(' (')[0])}`).join(' · ')}. <a href="/livraison/">Détails</a></p>
            </div>
            <a class="btn btn--accent btn--lg btn--block" href="/commande/"${blockedOut || blockedReg ? ' aria-disabled="true" tabindex="-1"' : ''}>Passer commande</a>
          </div>
          <div class="card"><p><strong>Vente réservée aux ${age} ans et plus.</strong> Votre date de naissance vous sera demandée.</p></div>
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
    const zone = () => { const r = $('input[name="zone"]:checked', co); return state?.cat.shippingZones.find((z) => z.id === r?.value) || state?.cat.shippingZones[0]; };

    const renderSummary = async () => {
      let cat;
      try { cat = await getCatalog(); } catch { summary.innerHTML = '<div class="form-error" role="alert">Impossible de charger le récapitulatif. Rechargez la page.</div>'; submit.disabled = true; return; }
      const lines = Cart.items().map((i) => ({ ...i, p: cat.bySlug[i.slug] })).filter((l) => l.p);
      summary.removeAttribute('aria-busy');
      if (!lines.length) { summary.innerHTML = '<p>Votre panier est vide.</p><p class="mt-1"><a href="/boutique/">Retour à la boutique</a></p>'; submit.disabled = true; return; }
      const off = lines.filter((l) => !l.p.orderable || cat.locked(l.p));
      const sub = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
      state = { cat, lines, sub, age: Math.max(cat.minimumBuyerAge, ...lines.map((l) => l.p.minAge || 0)) };
      const z = zone();
      const total = z.price != null ? sub + z.price : sub;
      summary.innerHTML = `<ul class="summary__items">${lines.map((l) => `<li><span>${l.qty} × ${escapeHtml(l.p.name)}</span><span>${euro.format(l.p.price * l.qty)}</span></li>`).join('')}</ul>
        <div class="summary mt-1">
          <div class="summary__row"><span>Sous-total TTC</span><span>${euro.format(sub)}</span></div>
          <div class="summary__row"><span>Livraison — ${escapeHtml(z.label)}</span><span>${z.price != null ? euro.format(z.price) : escapeHtml(z.priceText)}</span></div>
          <div class="summary__row summary__row--total"><span>Total TTC</span><span>${euro.format(total)}${z.price == null ? ' + port' : ''}</span></div>
          <p class="summary__note">Vente réservée aux ${state.age}&nbsp;ans et plus.</p>
        </div>
        ${off.length ? '<div class="form-error mt-1" role="alert">Un article ne peut pas être commandé actuellement. <a href="/panier/">Modifier le panier</a></div>' : ''}`;
      state.total = total; state.zone = z;
      submit.disabled = off.length > 0;
    };
    renderSummary();
    co.addEventListener('change', (e) => { if (e.target.name === 'zone') renderSummary(); });

    const ageFrom = (iso) => {
      const d = new Date(`${iso}T00:00:00`); if (Number.isNaN(d.getTime())) return NaN;
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
        else if (state && a < state.age) mark(b, `Vous devez avoir au moins ${state.age} ans pour commander.`);
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
      const z = zone();
      const order = {
        reference: ref, createdAt: new Date().toISOString(),
        customer: { firstName: fd.get('firstName'), lastName: fd.get('lastName'), email: fd.get('email'), phone: fd.get('phone'), birthDate: fd.get('birthDate') },
        delivery: { zone: z.label, address: fd.get('address'), postalCode: fd.get('postalCode'), city: fd.get('city'), country: fd.get('country') },
        payment: fd.get('payment'), note: fd.get('note') || '',
        items: state.lines.map((l) => ({ slug: l.slug, name: l.p.name, qty: l.qty, unitPrice: l.p.price })),
        subtotalTTC: Math.round(state.sub * 100) / 100, shipping: z.price ?? z.priceText, totalTTC: Math.round(state.total * 100) / 100,
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
          const body = `Bonjour,\n\nJe souhaite passer la commande ${ref} :\n\n${lines}\n\nSous-total TTC : ${euro.format(order.subtotalTTC)}\nLivraison (${z.label}) : ${z.price != null ? euro.format(z.price) : z.priceText}\nTotal TTC : ${z.price != null ? euro.format(order.totalTTC) : `${euro.format(order.subtotalTTC)} + port`}\n\nPaiement souhaité : ${order.payment === 'virement' ? 'virement bancaire' : 'carte bancaire (lien de paiement SumUp)'}\n\n${order.customer.firstName} ${order.customer.lastName}\nNé(e) le ${order.customer.birthDate}\n${order.customer.email} · ${order.customer.phone}\n\nAdresse de livraison :\n${order.delivery.address}\n${order.delivery.postalCode} ${order.delivery.city}\n${order.delivery.country}\n\n${order.note ? `Message : ${order.note}\n\n` : ''}J'ai lu et accepté les CGV, je certifie avoir l'âge requis et acheter pour mon usage personnel.`;
          location.href = `mailto:${encodeURIComponent(state.cat.orderEmail)}?subject=${encodeURIComponent(`Commande ${ref}`)}&body=${encodeURIComponent(body)}`;
        } else {
          throw new Error('no-channel');
        }
        try { sessionStorage.setItem('ehshop-last-order', JSON.stringify({ ref, mail: !state.cat.orderEndpoint })); } catch { /* facultatif */ }
        Cart.clear();
        setTimeout(() => { location.href = '/commande/confirmation/'; }, state.cat.orderEndpoint ? 0 : 800);
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
        if (o.mail) $('[data-confirm-text]').textContent = 'Votre messagerie s’est ouverte avec le détail de la commande : pensez à envoyer l’e-mail. Nous vérifions ensuite le stock et votre âge, puis vous envoyons votre lien de paiement sécurisé SumUp.';
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
    const targets = $$('.shead, .rayons > li, .grid--products > .pcard, .ideas > li, .guides > li, .trust__item');
    const io = new IntersectionObserver((ens) => ens.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el, i) => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('reveal'); el.style.transitionDelay = `${(i % 4) * 60}ms`; io.observe(el);
    });
  }

  updateCount();
})();
