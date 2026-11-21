// Pages informatives, légales et conseils.
// Données de l'entreprise : data/site.json (reprises des mentions légales et CGV publiées sur ehshop.net).
// Une donnée absente s'affiche « à compléter » et est listée par le build : rien n'est inventé.
import { html, raw, esc, REG_CLASSES, spec, frDate } from './lib/util.mjs';
import { icon, todo, telHref } from './layout.mjs';
import { breadcrumbs, compareTable } from './components.mjs';

function infoPage(ctx, { path, title, description, eyebrow, lead, sections, aside, noToc = false, updated = null, crumbsExtra = [], after = '' }) {
  const crumbs = breadcrumbs([{ name: 'Accueil', href: '/' }, ...crumbsExtra, { name: title }], ctx);
  const toc = !noToc && sections.length > 2;
  const body = html`
<section class="phead">
  <div class="container">
    ${crumbs.markup}
    ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}
    <h1 class="phead__title">${title}</h1>
    ${lead ? html`<p class="phead__text">${raw(lead)}</p>` : ''}
  </div>
</section>
<section class="section section--flush-top">
  <div class="container doc${toc ? '' : ' doc--single'}">
    ${toc ? html`<nav class="doc__toc" aria-label="Sommaire"><p>Sommaire</p><ol>${sections.map((s) => html`<li><a href="#${s.id}">${s.title}</a></li>`)}</ol></nav>` : ''}
    <div class="doc__body prose">
      ${sections.map((s) => html`<section id="${s.id}" aria-labelledby="${s.id}-t"><h2 id="${s.id}-t">${s.title}</h2>${raw(s.html)}</section>`)}
      ${after}
      ${updated ? html`<p class="doc__updated">Dernière mise à jour&nbsp;: ${updated}</p>` : ''}
    </div>
    ${aside ? raw(aside) : ''}
  </div>
</section>`;
  return { path, title, description, body, jsonld: [crumbs.ld] };
}

const helpAside = (ctx) => `<aside class="doc__aside card card--dark">${icon.phone}<p><strong>Une question&nbsp;?</strong><br>Le service client vous répond.</p><a class="btn btn--accent btn--block" href="${telHref(ctx.site.contact.phone)}">${esc(ctx.site.contact.phone)}</a><a class="btn btn--ghost-light btn--block" href="mailto:${esc(ctx.site.contact.email)}">Écrire un e-mail</a></aside>`;

/* ------------------------------------------------------------ Réglementation */
export function reglementation(ctx) {
  const { site } = ctx;
  const n = site.regulatoryNotice;
  const rows = Object.entries(REG_CLASSES).map(([k, v]) => `<tr><th scope="row"><span class="regtag"><strong>${k}</strong></span></th><td>${esc(v.label)}</td><td>${v.age ? `${v.age} ans` : 'Connaissances particulières requises'}</td><td>${v.distance ? `au moins ${v.distance}` : '—'}</td></tr>`).join('');
  return infoPage(ctx, {
    path: '/reglementation/', title: 'Réglementation & sécurité', eyebrow: 'Informations réglementaires',
    description: 'Catégories F1 à F4, âge, distances de sécurité, restrictions et règles d’utilisation des feux d’artifice.',
    lead: 'Les artifices de divertissement sont classés selon leur niveau de danger. Cette page résume les règles de référence ; l’étiquette du produit et les arrêtés locaux restent prioritaires.',
    sections: [
      ...(n?.active ? [{ id: 'actualite', title: 'Restriction en cours', html: `<div class="callout" data-notice-block data-until="${n.until}"><p><strong>${esc(n.reference)}</strong> — ${esc(n.summary)}</p><p>Sur EHSHOP, les articles concernés ne peuvent pas être commandés pendant cette période ; ils seront de nouveau disponibles à partir du ${frDate(n.resume)}, sauf prolongation. <a href="/conseils/decret-14-novembre-2026/">Tout savoir</a></p></div>` }] : []),
      { id: 'categories', title: 'Les catégories d’artifices', html: `
<p>Les catégories F concernent les artifices de divertissement, T les articles de théâtre et P les autres articles pyrotechniques. Le cadre est fixé par la directive 2013/29/UE et, en France, par le décret n°&nbsp;2010-580 du 31&nbsp;mai 2010 et son arrêté d’application.</p>
<div class="table-wrap"><table class="regtable"><caption class="sr-only">Catégories, âges minimums et distances de sécurité de référence</caption>
<thead><tr><th scope="col">Catégorie</th><th scope="col">Niveau de danger</th><th scope="col">Âge minimum</th><th scope="col">Distance de sécurité</th></tr></thead>
<tbody>${rows}</tbody></table></div>
<p class="note">Âges minimums de référence (directive 2013/29/UE, art.&nbsp;7) ; distances minimales de l’annexe&nbsp;I. Les catégories F4, T2 et P2 ne sont pas vendues aux particuliers : elles exigent un certificat de qualification (voir <a href="/professionnels/">Professionnels</a>).</p>` },
      { id: 'age', title: 'Vente réservée aux majeurs', html: `
<p><strong>EHSHOP vend uniquement aux personnes âgées d’au moins ${site.policy.minimumBuyerAge}&nbsp;ans</strong>, quelle que soit la catégorie (CGV, article&nbsp;11). La vente d’artifices F2 et F3 à un mineur est interdite.</p>
<ul class="ticks"><li>La date de naissance est demandée à chaque commande.</li><li>Une copie de pièce d’identité peut être demandée avant expédition, notamment pour les articles F2 et F3 ; le livreur peut vérifier l’âge du destinataire.</li><li>Les produits sont vendus pour l’usage personnel : revente et remise à un mineur interdites.</li></ul>` },
      { id: 'utilisation', title: 'Règles d’utilisation', html: `
<ul class="ticks">
<li>Lire intégralement la notice et l’étiquette avant toute utilisation, et les respecter.</li>
<li>Respecter la distance de sécurité indiquée sur chaque produit, vis-à-vis du public, des bâtiments, des véhicules, des lignes électriques et de la végétation.</li>
<li>Tirer en extérieur, sur un sol plat et stable, sans jamais tenir l’artifice à la main (sauf mention contraire) ni se pencher au-dessus.</li>
<li>Renoncer au tir par vent fort, sécheresse, orage, et tenir compte des alertes incendie.</li>
<li>Ne pas consommer d’alcool avant le tir ; tenir enfants et animaux à distance.</li>
<li>Ne jamais rallumer un artifice qui n’est pas parti : le neutraliser selon la notice (immersion prolongée dans l’eau).</li>
<li>Ne jamais modifier, démonter ou associer des artifices d’une manière non prévue par le fabricant.</li></ul>` },
      { id: 'local', title: 'Restrictions locales', html: `<p>Des arrêtés préfectoraux ou municipaux peuvent restreindre, voire interdire temporairement, la vente, le transport, la détention ou l’usage d’artifices, notamment autour du 14&nbsp;juillet et du 31&nbsp;décembre ou en période de risque d’incendie. <strong>Renseignez-vous auprès de votre mairie ou de votre préfecture avant tout tir.</strong></p>` },
      { id: 'stockage', title: 'Transport et stockage', html: `<p>Les artifices sont des marchandises dangereuses de classe&nbsp;1. Conservez-les dans leur emballage, dans un endroit sec et frais, hors de portée des enfants, loin de toute source de chaleur ou de flamme. N’utilisez jamais un artifice dont l’emballage est endommagé ou humide.</p>` },
    ],
    aside: `<aside class="doc__aside card card--dark">${icon.alert}<p><strong>En cas d’accident</strong>, appelez le 15 (SAMU), le 18 (pompiers) ou le 112.</p></aside>`,
  });
}

/* ------------------------------------------------------------------ Livraison */
export function livraison(ctx) {
  const p = ctx.site.policy;
  return infoPage(ctx, {
    path: '/livraison/', title: 'Livraison & frais de port', eyebrow: 'Commandes',
    description: 'Frais de port EHSHOP : France 10 €, UE 25 €. Livraison à domicile par transporteur agréé ADR, délais et retours.',
    lead: 'Les artifices sont des marchandises dangereuses : ils voyagent par transporteur habilité et sont livrés à domicile, à une personne majeure.',
    sections: [
      { id: 'tarifs', title: 'Frais de port', html: `<div class="ship-grid">${p.shippingZones.map((z) => `<div class="ship"><span>${esc(z.label)}</span><strong>${z.price != null ? `${z.price}&nbsp;€` : esc(z.priceText.split(' (')[0])}</strong><small>TTC, par commande</small></div>`).join('')}</div><p class="note">Hors Union européenne, les droits de douane et taxes d’importation éventuels restent à la charge du client. Vérifiez avant de commander que la détention et l’usage des produits sont autorisés dans le pays de destination.</p>` },
      { id: 'transport', title: 'Transport réglementé', html: `<ul class="ticks"><li>${esc(p.carrierInfo)}</li><li>Certaines zones (îles, outre-mer, certains pays) peuvent ne pas être desservies.</li><li>Les produits non pyrotechniques commandés en même temps voyagent dans le même colis.</li></ul>` },
      { id: 'delais', title: 'Délais', html: `<p>Les produits sont commandés auprès du fournisseur après paiement. Préparation et remise au transporteur&nbsp;: ${esc(p.preparationDelay)} Ce délai peut s’allonger en période de forte demande (fêtes de fin d’année, 14&nbsp;juillet). À défaut de date convenue, la livraison intervient au plus tard 30&nbsp;jours après la conclusion du contrat.</p>` },
      { id: 'reception', title: 'À la réception', html: `<ul class="ticks"><li>Le colis est remis à une personne majeure, qui peut devoir justifier de son identité.</li><li>Vérifiez le colis devant le livreur. Carton abîmé, ouvert ou humide&nbsp;: notez des réserves précises sur le bon de livraison, puis prévenez-nous sous 3&nbsp;jours avec photos à <a href="mailto:${esc(ctx.site.contact.email)}">${esc(ctx.site.contact.email)}</a>.</li><li>N’utilisez jamais un artifice dont l’emballage est endommagé ou humide.</li></ul>` },
      { id: 'retours', title: 'Rétractation et retours', html: `<p>Vous disposez de 14&nbsp;jours après réception pour vous rétracter, sans justification. Les artifices doivent être retournés non ouverts, dans leur emballage d’origine. ${esc(p.returnCostInfo)} <a href="/cgv/#art-9">Conditions complètes</a></p>` },
    ],
    aside: helpAside(ctx),
  });
}

/* ------------------------------------------------------------------------ FAQ */
export function faq(ctx) {
  const { site } = ctx;
  const z = site.policy.shippingZones;
  const qa = [
    ['Quel âge faut-il avoir pour commander&nbsp;?', `${site.policy.minimumBuyerAge}&nbsp;ans minimum, pour tous les produits. La date de naissance est demandée à la commande ; une pièce d’identité peut être demandée avant l’expédition et par le livreur.`],
    ['Combien coûte la livraison&nbsp;?', `${z[0].price}&nbsp;€ TTC par commande en France métropolitaine, ${z[1].price}&nbsp;€ dans le reste de l’Union européenne, ${esc(z[2].priceText)} pour le Canada et les États-Unis. <a href="/livraison/">Détails</a>.`],
    ['Puis-je être livré en point relais&nbsp;?', 'Non. Les artifices sont des marchandises dangereuses : ils voyagent uniquement par transporteur habilité ADR, livrés à domicile. La Poste et les points relais ne sont pas autorisés.'],
    ['Comment se passe le paiement&nbsp;?', 'Après l’envoi de votre commande, nous vérifions le stock et votre âge, puis vous recevez un lien de paiement sécurisé SumUp par carte bancaire, ou nos coordonnées pour un virement. La commande est traitée à réception du paiement.'],
    ['Quel est le délai&nbsp;?', `${esc(site.policy.preparationDelay)}`],
    ['Que signifient F2 et F3&nbsp;?', 'Ce sont des catégories réglementaires liées au niveau de danger : elles déterminent la distance de sécurité et les conditions d’usage. <a href="/reglementation/#categories">Voir le tableau</a>.'],
    ['Qu’est-ce qu’un compact&nbsp;?', 'Un bloc de tubes reliés entre eux : une seule mèche à allumer, et tous les coups partent à la suite. <a href="/conseils/choisir-son-compact/">Notre guide</a>.'],
    ['Puis-je me rétracter&nbsp;?', `Oui, 14&nbsp;jours après réception, produits non ouverts. Le retour d’artifices doit passer par un transporteur ADR et reste à votre charge. <a href="/cgv/#art-9">Conditions</a>.`],
    ['Un artifice n’est pas parti, que faire&nbsp;?', 'Ne vous en approchez pas et ne le rallumez jamais. Neutralisez-le selon la notice (immersion prolongée dans l’eau), puis contactez-nous avec votre numéro de commande.'],
    ['Vendez-vous aux professionnels et aux collectivités&nbsp;?', 'Oui, sur devis. Les articles F4 et T2 exigent un certificat de qualification. <a href="/professionnels/">Demander un devis</a>.'],
  ];
  const body = `<div class="faq">${qa.map(([q, a]) => `<details><summary>${q}</summary><div class="acc__body"><p>${a}</p></div></details>`).join('')}</div>`;
  const pg = infoPage(ctx, {
    path: '/faq/', title: 'Questions fréquentes', eyebrow: 'Aide', noToc: true,
    description: 'Âge, frais de port, livraison, paiement SumUp, délais, rétractation : les réponses à vos questions.',
    sections: [{ id: 'questions', title: 'Commander sur EHSHOP', html: body }],
    aside: helpAside(ctx),
  });
  pg.jsonld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q.replace(/&nbsp;/g, ' '), acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ') } })) });
  return pg;
}

/* ------------------------------------------------------------------- À propos */
export function aPropos(ctx) {
  const { site } = ctx;
  const co = site.company;
  return infoPage(ctx, {
    path: '/a-propos/', title: 'À propos d’EHSHOP', eyebrow: 'La boutique', noToc: true,
    description: 'EHSHOP, boutique en ligne de feux d’artifice et pétards éditée par EK SAS (Paris).',
    lead: `EHSHOP est la boutique en ligne de la société ${esc(co.legalName)} ${esc(co.legalForm)}, à Paris : des artifices de divertissement de la marque ${esc(site.brand.productBrand)} et des articles pour vos fêtes, livrés à domicile.`,
    sections: [
      { id: 'histoire', title: 'Notre histoire', html: `<p>${todo(null, 'Quelques lignes sur l’origine d’EHSHOP et de la marque Kimplex, l’équipe')}</p>` },
      { id: 'engagements', title: 'Nos engagements', html: `<ul class="ticks"><li><strong>Des fiches claires</strong> : nombre de coups, calibre, durée, catégorie et consignes d’utilisation.</li><li><strong>Une vente encadrée</strong> : réservée aux ${site.policy.minimumBuyerAge}&nbsp;ans et plus, avec vérification de l’âge.</li><li><strong>Un transport conforme</strong> : expédition par transporteur habilité ADR uniquement.</li><li><strong>Un interlocuteur joignable</strong> : <a href="${telHref(site.contact.phone)}">${esc(site.contact.phone)}</a> et <a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>.</li></ul>` },
      { id: 'entreprise', title: 'L’entreprise', html: `<p>${esc(co.legalName)} ${esc(co.legalForm)} au capital de ${esc(co.shareCapital)} — ${esc(co.address)} — ${esc(co.rcs)} ${esc(co.siren)} — code APE ${esc(co.ape)}. <a href="/mentions-legales/">Mentions légales</a></p>` },
    ],
  });
}

/* -------------------------------------------------------------------- Contact */
export function contact(ctx) {
  const { site } = ctx;
  const c = site.contact;
  const co = site.company;
  const crumbs = breadcrumbs([{ name: 'Accueil', href: '/' }, { name: 'Contact' }], ctx);
  const body = html`
<section class="phead"><div class="container">${crumbs.markup}<p class="eyebrow">Service client</p><h1 class="phead__title">Contactez-nous</h1><p class="phead__text">Un conseil avant d’acheter, une question sur une commande ou un devis&nbsp;? Appelez-nous ou écrivez-nous.</p></div></section>
<section class="section section--flush-top"><div class="container contact">
  <form class="card contact__form" data-contact-form data-email="${c.email}" novalidate>
    <div class="form-error" role="alert" data-form-error hidden></div>
    <div class="fgrid">
      <div class="field"><label for="c-name">Nom</label><input id="c-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="c-email">E-mail</label><input id="c-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field field--full"><label for="c-subject">Objet</label>
        <select id="c-subject" name="subject" required><option value="">Choisir…</option><option>Conseil sur un produit</option><option>Suivi d’une commande</option><option>Disponibilité / réassort</option><option>Devis professionnel ou collectivité</option><option>Rétractation ou réclamation</option><option>Autre demande</option></select></div>
      <div class="field field--full"><label for="c-msg">Message</label><textarea id="c-msg" name="message" rows="6" required maxlength="3000"></textarea></div>
    </div>
    <div class="hp" aria-hidden="true"><label for="c-web">Ne pas remplir</label><input id="c-web" name="website" tabindex="-1" autocomplete="off"></div>
    <p class="field__help">Le formulaire prépare un e-mail dans votre messagerie. Vos données servent uniquement à vous répondre. <a href="/confidentialite/">Confidentialité</a></p>
    <button class="btn btn--dark btn--lg" type="submit">Préparer mon e-mail</button>
  </form>
  <aside class="contact__aside">
    <div class="card card--dark">
      <h2>Service client</h2>
      <ul class="contact__list">
        <li>${icon.phone}<span><a href="${telHref(c.phone)}">${c.phone}</a>${c.hours ? html`<small>${c.hours}</small>` : ''}</span></li>
        <li>${icon.mail}<span><a href="mailto:${c.email}">${c.email}</a></span></li>
        <li>${icon.doc}<span>${co.legalName} ${co.legalForm}<br>${co.address}</span></li>
      </ul>
    </div>
    <div class="card"><h2>Réponses rapides</h2><p>Frais de port, paiement, délais&nbsp;: consultez la <a href="/faq/">FAQ</a> et la page <a href="/livraison/">Livraison</a>.</p></div>
  </aside>
</div></section>`;
  return { path: '/contact/', title: 'Contact', description: `Contacter EHSHOP : ${c.phone} · ${c.email}.`, body, jsonld: [crumbs.ld] };
}

/* ----------------------------------------------------------- Professionnels */
export function professionnels(ctx) {
  const { site } = ctx;
  const subject = encodeURIComponent('[EHSHOP] Demande de devis');
  const bodyTxt = encodeURIComponent('Structure (commune, comité des fêtes, association, entreprise) :\nDate et lieu de l’événement :\nBudget indicatif :\nProduits souhaités :\nCertificat de qualification F4/T2 (si concerné) :\nTéléphone :\n');
  return infoPage(ctx, {
    path: '/professionnels/', title: 'Professionnels & collectivités', eyebrow: 'Sur devis', noToc: true,
    description: 'Artificiers, revendeurs, organisateurs, communes, comités des fêtes, associations : commandes sur devis.',
    lead: 'Artificiers, revendeurs, organisateurs d’événements, communes, comités des fêtes et associations : vos commandes font l’objet d’un devis préalable.',
    sections: [
      { id: 'devis', title: 'Comment ça marche', html: `<ol class="steps-list"><li><strong>Décrivez votre projet</strong> : date, lieu, budget, produits souhaités.</li><li><strong>Recevez votre devis</strong> : il précise les conditions particulières (prix, paiement, livraison), qui prévalent sur les CGV.</li><li><strong>Validez</strong> : la commande est lancée selon les modalités du devis.</li></ol><p><a class="btn btn--accent btn--lg" href="mailto:${esc(site.contact.email)}?subject=${subject}&amp;body=${bodyTxt}">Demander un devis par e-mail</a> <a class="btn btn--outline btn--lg" href="${telHref(site.contact.phone)}">${esc(site.contact.phone)}</a></p>` },
      { id: 'reserves', title: 'Produits réservés (F4, T2)', html: `<p>La vente d’artifices de catégorie F4 et d’articles de théâtre T2 est subordonnée à la présentation, avant toute commande, d’un certificat de qualification en cours de validité (ou de l’agrément requis) correspondant à la catégorie achetée. Des justificatifs relatifs au lieu de stockage ou à l’identité de la personne qui procédera au tir peuvent être demandés.</p>` },
      { id: 'conditions', title: 'Conditions', html: `<p>Paiement selon le devis, dans la limite des délais légaux. Les risques sont transférés à la remise au transporteur ; les réserves sont à confirmer par lettre recommandée sous 3&nbsp;jours. Le droit de rétractation et la médiation de la consommation ne s’appliquent pas aux professionnels. <a href="/cgv/#art-18">Article 18 des CGV</a></p>` },
    ],
    aside: helpAside(ctx),
  });
}

/* ----------------------------------------------------------- Mentions légales */
export function mentions(ctx) {
  const { site } = ctx;
  const co = site.company;
  const c = site.contact;
  return infoPage(ctx, {
    path: '/mentions-legales/', title: 'Mentions légales', eyebrow: 'Informations légales', noToc: true,
    description: 'Mentions légales d’EHSHOP : éditeur EK SAS, hébergeur, propriété intellectuelle, données personnelles.',
    sections: [
      { id: 'editeur', title: 'Éditeur du site', html: `<dl class="dl">
<dt>Raison sociale</dt><dd>${esc(co.legalName)}, société par actions simplifiée (${esc(co.legalForm)}) au capital de ${esc(co.shareCapital)}</dd>
<dt>Siège social</dt><dd>${esc(co.address)}</dd>
<dt>SIREN / SIRET</dt><dd>${esc(co.siren)} / ${esc(co.siret)}</dd>
<dt>Immatriculation</dt><dd>${esc(co.rcs)}</dd>
<dt>Code APE</dt><dd>${esc(co.ape)}</dd>
<dt>TVA intracommunautaire</dt><dd>${esc(co.vatNumber)}</dd>
<dt>Contact</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a> · <a href="${telHref(c.phone)}">${esc(c.phone)}</a></dd>
<dt>Directeur de la publication</dt><dd>${esc(co.publicationDirector)}</dd></dl>` },
      { id: 'hebergeur', title: 'Hébergeur', html: `<dl class="dl"><dt>Nom</dt><dd>${todo(co.host.name, 'Nouvel hébergeur')}</dd><dt>Adresse</dt><dd>${todo(co.host.address, 'Adresse de l’hébergeur')}</dd><dt>Téléphone</dt><dd>${todo(co.host.phone, 'Téléphone de l’hébergeur')}</dd></dl>` },
      { id: 'pi', title: 'Propriété intellectuelle', html: `<p>La marque ${esc(site.brand.productBrand)}, les textes, photographies, logos et éléments du site sont protégés. Toute reproduction ou utilisation sans autorisation écrite préalable d’${esc(co.legalName)} est interdite. Polices Manrope et Instrument Serif&nbsp;: licence SIL Open Font License&nbsp;1.1.</p>` },
      { id: 'donnees', title: 'Données personnelles', html: `<p>Le responsable du traitement est ${esc(co.legalName)} ${esc(co.legalForm)}, ${esc(co.address)}. Voir la <a href="/confidentialite/">politique de confidentialité</a> et la <a href="/cookies/">politique cookies</a>.</p>` },
    ],
  });
}

/* ------------------------------------------------------------------------ CGV */
export function cgv(ctx) {
  const d = ctx.cgv;
  return infoPage(ctx, {
    path: '/cgv/', title: 'Conditions générales de vente', eyebrow: 'Informations légales', updated: d.updated,
    description: 'Conditions générales de vente d’EHSHOP (EK SAS) : prix, frais de port, paiement, livraison, rétractation, garanties.',
    lead: esc(d.intro),
    sections: d.sections.map((s) => ({ id: s.id, title: s.title, html: s.html })),
  });
}

/* ----------------------------------------------------------- Confidentialité */
export function confidentialite(ctx) {
  const { site } = ctx;
  const co = site.company;
  return infoPage(ctx, {
    path: '/confidentialite/', title: 'Politique de confidentialité', eyebrow: 'Données personnelles',
    description: 'Comment EK SAS (EHSHOP) collecte, utilise et protège vos données personnelles (RGPD).',
    lead: 'Cette politique décrit les traitements de données réalisés via le site, conformément au règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés. Elle complète l’article 14 des CGV.',
    sections: [
      { id: 'responsable', title: 'Responsable du traitement', html: `<p>${esc(co.legalName)} ${esc(co.legalForm)}, ${esc(co.address)}. Contact&nbsp;: <a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>.</p>` },
      { id: 'donnees', title: 'Données et finalités', html: `<div class="table-wrap"><table class="regtable"><thead><tr><th scope="col">Traitement</th><th scope="col">Données</th><th scope="col">Base légale</th></tr></thead><tbody>
<tr><td>Commandes, livraisons, paiements, service client</td><td>Identité, coordonnées, adresse, contenu des commandes, échanges</td><td>Exécution du contrat</td></tr>
<tr><td>Vérification de l’âge</td><td>Date de naissance ; le cas échéant copie de pièce d’identité</td><td>Obligation légale</td></tr>
<tr><td>Comptabilité</td><td>Factures et pièces comptables</td><td>Obligation légale</td></tr>
<tr><td>Informations commerciales</td><td>E-mail</td><td>Consentement, lorsqu’il est requis</td></tr></tbody></table></div>` },
      { id: 'destinataires', title: 'Destinataires', html: `<p>${esc(co.legalName)} et, pour le strict nécessaire, ses prestataires&nbsp;: fournisseur des produits, transporteurs, prestataire de paiement SumUp, hébergeur du site. Les données bancaires sont saisies directement chez SumUp : ${esc(co.legalName)} n’y a pas accès.</p>` },
      { id: 'duree', title: 'Durées de conservation', html: `<ul class="ticks"><li>Copies de pièces d’identité&nbsp;: le temps de la vérification, puis suppression.</li><li>Données de commande&nbsp;: pendant la relation commerciale, puis archivage pendant les durées légales.</li><li>Pièces comptables&nbsp;: 10&nbsp;ans.</li></ul>` },
      { id: 'local', title: 'Stockage sur votre appareil', html: `<p>Le panier et les favoris sont enregistrés dans le stockage local de votre navigateur (clés <code>ehshop-cart</code> et <code>ehshop-favs</code>), ainsi que votre réponse à la question sur l’âge (<code>ehshop-age-ok</code>). Ces données restent sur votre appareil. Voir la <a href="/cookies/">politique cookies</a>.</p>` },
      { id: 'droits', title: 'Vos droits', html: `<p>Accès, rectification, effacement, limitation, opposition, portabilité, directives post-mortem&nbsp;: écrivez à <a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a>. Réclamation possible auprès de la CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — cnil.fr. Vous pouvez aussi vous inscrire sur Bloctel (bloctel.gouv.fr).</p>` },
    ],
  });
}

/* -------------------------------------------------------------------- Cookies */
export function cookies(ctx) {
  return infoPage(ctx, {
    path: '/cookies/', title: 'Politique cookies', eyebrow: 'Données personnelles', noToc: true,
    description: 'EHSHOP n’utilise aucun cookie publicitaire ni de mesure d’audience.',
    lead: 'Le site n’utilise <strong>aucun cookie</strong> publicitaire, de mesure d’audience ou de réseau social : c’est pourquoi aucun bandeau de consentement ne vous est présenté.',
    sections: [
      { id: 'stockage', title: 'Ce que le site enregistre', html: `<div class="table-wrap"><table class="regtable"><thead><tr><th scope="col">Nom</th><th scope="col">Finalité</th><th scope="col">Durée</th></tr></thead><tbody>
<tr><td><code>ehshop-cart</code></td><td>Contenu du panier</td><td>Jusqu’à la commande ou suppression</td></tr>
<tr><td><code>ehshop-favs</code></td><td>Produits mis en favoris</td><td>Jusqu’à suppression</td></tr>
<tr><td><code>ehshop-age-ok</code></td><td>Mémoriser votre confirmation d’âge pour ne pas la redemander</td><td>30 jours</td></tr></tbody></table></div>
<p>Ces éléments, stockés localement dans votre navigateur et strictement nécessaires aux services que vous demandez, sont exemptés de consentement (article&nbsp;82 de la loi Informatique et Libertés).</p>` },
      { id: 'gerer', title: 'Les supprimer', html: `<p>Videz votre panier depuis la page <a href="/panier/">Panier</a>, ou effacez les données du site dans les réglages de votre navigateur.</p>` },
      { id: 'evolution', title: 'Évolution', html: `<p>Si des outils de mesure d’audience ou des services tiers étaient ajoutés, votre consentement serait recueilli au préalable lorsqu’il est requis, et cette page mise à jour.</p>` },
    ],
  });
}

/* ------------------------------------------------------------------ Conseils */
export function buildGuides(ctx) {
  const { products, site } = ctx;
  const fw = products.filter((p) => p.category === 'feux-d-artifice' && spec(p, 'Nombre de coups'));
  const shots = fw.map((p) => parseInt(spec(p, 'Nombre de coups'), 10));
  const cals = fw.map((p) => parseFloat((spec(p, 'Calibre') || '0').replace(',', '.'))).filter(Boolean);
  const prices = fw.map((p) => p.price);
  const n = site.regulatoryNotice;
  const guides = [
    {
      slug: 'choisir-son-compact', icon: 'target', title: 'Comment choisir son compact',
      lead: 'Coups, calibre, durée, catégorie : les quatre repères pour bien choisir.',
      sections: [
        { id: 'compact', title: 'Un compact, c’est quoi ?', html: '<p>Un compact (ou batterie) réunit plusieurs tubes reliés entre eux. Vous n’allumez qu’une seule mèche, et tous les coups partent à la suite, selon une séquence prévue par le fabricant. C’est la façon la plus simple de tirer un vrai bouquet.</p>' },
        { id: 'coups', title: 'Le nombre de coups', html: `<p>C’est le nombre de tirs envoyés. Dans notre boutique, il va de ${Math.min(...shots)} à ${Math.max(...shots)} coups. Plus il y en a, plus le spectacle est fourni — mais le calibre compte autant que la quantité.</p>` },
        { id: 'calibre', title: 'Le calibre', html: `<p>Le diamètre des tubes, en millimètres. Un calibre plus grand envoie des effets plus haut et plus larges. Nos compacts vont de ${Math.min(...cals)} à ${Math.max(...cals)} mm ; la plupart sont en 20 mm. Pour un final, regardez du côté des <a href="/selection/gros-calibres/">gros calibres</a>.</p>` },
        { id: 'duree', title: 'La durée', html: '<p>La durée approximative du tir, indiquée par le fabricant quand elle est connue. Pour un feu plus long, enchaînez plusieurs compacts plutôt que de chercher un seul gros produit.</p>' },
        { id: 'categorie', title: 'La catégorie et l’espace', html: '<p>La catégorie (F2, F3) fixe la distance de sécurité de référence : au moins 8 m pour un F2, au moins 15 m pour un F3. Vérifiez que votre terrain le permet, et respectez la distance écrite sur l’étiquette.</p>' },
        { id: 'budget', title: 'Le budget', html: `<p>Nos compacts vont de ${prices.length ? Math.min(...prices).toFixed(2).replace('.', ',') : '—'} à ${prices.length ? Math.max(...prices).toFixed(2).replace('.', ',') : '—'} €. Le <strong>prix au coup</strong> du comparateur aide à comparer à budget égal.</p>` },
      ],
      after: () => html`<h2 class="guide-after">Comparer nos compacts</h2>${compareTable(products.filter((p) => p.category === 'feux-d-artifice'), { limit: 8 })}<p><a class="link-arrow" href="/comparateur-compacts/">Ouvrir le comparateur complet${icon.arrow}</a></p>`,
    },
    {
      slug: 'quel-artifice-choisir', icon: 'burst', title: 'Compact, chandelle, monocoup, fusée : les différences',
      lead: 'Chaque famille se tire différemment. Le point pour composer votre feu.',
      sections: [
        { id: 'compact', title: 'Le compact', html: '<p>Un bloc de tubes, une seule mèche : le bouquet s’enchaîne tout seul. Il se pose à plat sur un sol dur. <a href="/categorie/feux-d-artifice/">Voir les compacts</a></p>' },
        { id: 'chandelle', title: 'La chandelle romaine', html: '<p>Un tube unique qui envoie des effets successifs à la verticale. Elle se plante ou se cale bien droite dans le sol et ne se tient jamais à la main. <a href="/categorie/chandelles-monocoups/">Voir les chandelles</a></p>' },
        { id: 'monocoup', title: 'Le monocoup', html: '<p>Un tube, un seul tir, souvent de gros calibre : idéal pour ouvrir ou conclure un feu. Il se pose à la verticale sur un sol dur, calé si besoin.</p>' },
        { id: 'fusee', title: 'La fusée', html: '<p>Elle monte avant d’éclater. Elle part d’un support vertical stable (tube ou bouteille lestée), loin de tout obstacle au-dessus. <a href="/categorie/fusees-packs/">Voir les fusées</a></p>' },
        { id: 'fumigene', title: 'Le fumigène et la torche', html: '<p>Pas de détonation : de la fumée colorée ou une flamme lumineuse qui dure, pour les photos et les fêtes. <a href="/categorie/fumigenes-torches/">Voir les fumigènes</a></p>' },
      ],
    },
    {
      slug: 'tirer-en-securite', icon: 'shield', title: 'Tirer en sécurité : la check-list',
      lead: 'Avant, pendant, après le tir : les gestes qui évitent les accidents.',
      sections: [
        { id: 'avant', title: 'Avant', html: '<ul class="ticks"><li>Vérifiez les arrêtés locaux et la météo (pas de vent fort, ni sécheresse, ni orage).</li><li>Lisez la notice et l’étiquette de chaque produit.</li><li>Repérez un sol plat et dur, dégagé, loin des habitations, véhicules, arbres et lignes électriques.</li><li>Prévoyez un seau d’eau, une lampe, un allumeur et une trousse de secours.</li></ul>' },
        { id: 'pendant', title: 'Pendant', html: '<ul class="ticks"><li>Une seule personne allume, sobre, à bout de bras, sans jamais se pencher au-dessus.</li><li>Le public reste derrière la distance de sécurité indiquée.</li><li>Enfants et animaux à l’écart.</li></ul>' },
        { id: 'apres', title: 'Après', html: '<ul class="ticks"><li>Ne rallumez jamais un artifice qui n’est pas parti : attendez, puis neutralisez-le selon la notice (immersion prolongée dans l’eau).</li><li>Arrosez les résidus avant de les jeter.</li></ul><p>En cas d’accident&nbsp;: 15, 18 ou 112.</p>' },
      ],
    },
  ];
  if (n?.active) {
    guides.push({
      slug: 'decret-14-novembre-2026', icon: 'alert', title: `${n.reference} : ce qui change`,
      lead: `Vente et usage de certains artifices suspendus jusqu’au ${frDate(n.until)} inclus.`,
      sections: [
        { id: 'quoi', title: 'Ce que prévoit le texte', html: `<p>${esc(n.summary)} Selon les informations publiées, le texte a paru au Journal officiel du 15&nbsp;novembre 2026 et prévoit une dérogation pour les professionnels habilités et les collectivités publiques.</p><p class="note">Pour le détail des produits visés, référez-vous au texte officiel publié sur Légifrance.</p>` },
        { id: 'ehshop', title: 'Ce que cela change sur EHSHOP', html: `<ul class="ticks"><li>Les articles concernés restent visibles mais <strong>ne peuvent pas être commandés jusqu’au ${frDate(n.until)} inclus</strong>.</li><li>Les commandes de ces articles reprennent à partir du ${frDate(n.resume)}, sauf prolongation.</li><li>Les accessoires, trousses de secours et systèmes de tir restent disponibles.</li></ul>` },
        { id: 'local', title: 'Et ensuite ?', html: '<p>Même après cette date, des arrêtés préfectoraux ou municipaux peuvent encore restreindre la vente ou l’usage, notamment autour du 31 décembre. Renseignez-vous auprès de votre mairie.</p>' },
      ],
    });
  }
  return guides;
}

export function conseilsHub(ctx) {
  const crumbs = breadcrumbs([{ name: 'Accueil', href: '/' }, { name: 'Conseils' }], ctx);
  const body = html`
<section class="phead"><div class="container">${crumbs.markup}<p class="eyebrow">Conseils & guides</p><h1 class="phead__title">Bien choisir, bien tirer</h1><p class="phead__text">Nos guides pour composer votre feu et le tirer en sécurité.</p></div></section>
<section class="section section--flush-top"><div class="container">
  <ul class="guides guides--all">${ctx.guides.map((g) => html`<li><a class="guide-card" href="/conseils/${g.slug}/"><span class="guide-card__icon">${icon[g.icon] || icon.book}</span><strong>${g.title}</strong><span>${g.lead}</span><em>Lire ${icon.arrow}</em></a></li>`)}</ul>
</div></section>`;
  return { path: '/conseils/', title: 'Conseils & guides', description: 'Guides EHSHOP : choisir son compact, différences entre artifices, sécurité.', body, jsonld: [crumbs.ld] };
}

export function guidePage(ctx, g) {
  const pg = infoPage(ctx, {
    path: `/conseils/${g.slug}/`, title: g.title, eyebrow: 'Conseils', lead: esc(g.lead), description: g.lead,
    sections: g.sections, crumbsExtra: [{ name: 'Conseils', href: '/conseils/' }], after: g.after ? g.after() : '',
    aside: `<aside class="doc__aside card"><p><strong>Prêt à choisir&nbsp;?</strong></p><a class="btn btn--dark btn--block" href="/categorie/feux-d-artifice/">Voir les feux d’artifice</a><a class="btn btn--outline btn--block" href="/comparateur-compacts/">Comparateur</a></aside>`,
  });
  pg.jsonld.push({ '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.lead, author: { '@id': `${ctx.site.brand.baseUrl}/#organization` }, publisher: { '@id': `${ctx.site.brand.baseUrl}/#organization` } });
  return pg;
}

export const infoPages = [reglementation, livraison, faq, aPropos, contact, professionnels, mentions, cgv, confidentialite, cookies, conseilsHub];
