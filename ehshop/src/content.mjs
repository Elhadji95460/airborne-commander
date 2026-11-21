// Pages informatives et légales.
// Les données propres à l'entreprise proviennent de data/site.json ; si elles manquent,
// un marqueur visible « à compléter » est affiché (et listé par le build), jamais une valeur inventée.
import { html, raw, esc, REG_CLASSES } from './lib/util.mjs';
import { icon, todo } from './layout.mjs';
import { breadcrumbs } from './components.mjs';

function infoPage(ctx, { path, title, description, eyebrow, lead, sections, aside, noToc = false, updated = true }) {
  const crumbs = breadcrumbs([{ name: 'Accueil', href: '/' }, { name: title }], ctx);
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
      ${updated ? html`<p class="doc__updated">Dernière mise à jour&nbsp;: ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
    </div>
    ${aside ? raw(aside) : ''}
  </div>
</section>`;
  return { path, title, description, body, jsonld: [crumbs.ld] };
}

const companyLine = (co) => [co.legalName, co.legalForm, co.shareCapital && `au capital de ${co.shareCapital}`].filter(Boolean).join(', ');

/* ------------------------------------------------------------ Réglementation */
export function reglementation(ctx) {
  const { site } = ctx;
  const rows = Object.entries(REG_CLASSES).map(([k, v]) => `<tr><th scope="row"><span class="regtag"><strong>${k}</strong></span></th><td>${esc(v.label)}</td><td>${v.age ? `${v.age} ans` : 'Connaissances particulières requises'}</td><td>${v.distance ? `au moins ${v.distance}` : '—'}</td></tr>`).join('');
  return infoPage(ctx, {
    path: '/reglementation/', title: 'Réglementation & sécurité', eyebrow: 'Informations réglementaires',
    description: 'Catégories F1 à F4, âges minimums, distances de sécurité et règles d’utilisation des articles pyrotechniques.',
    lead: 'Les articles pyrotechniques de divertissement sont classés selon leur niveau de danger. Cette page résume les règles de référence&nbsp;; l’étiquette du produit et les arrêtés locaux restent prioritaires.',
    sections: [
      { id: 'categories', title: 'Les catégories d’artifices', html: `
<p>La directive européenne 2013/29/UE, transposée en droit français, classe les articles pyrotechniques en catégories. Les catégories F concernent les artifices de divertissement, T les articles de théâtre et P les autres articles pyrotechniques.</p>
<div class="table-wrap"><table class="regtable"><caption class="sr-only">Catégories, âges minimums et distances de sécurité de référence</caption>
<thead><tr><th scope="col">Catégorie</th><th scope="col">Niveau de danger</th><th scope="col">Âge minimum</th><th scope="col">Distance de sécurité</th></tr></thead>
<tbody>${rows}</tbody></table></div>
<p class="note">Âges minimums&nbsp;: article 7 de la directive 2013/29/UE. Distances&nbsp;: exigences essentielles de sécurité (annexe I). Les catégories F4, T2 et P2 sont réservées aux personnes ayant des connaissances particulières&nbsp;: en France, cela suppose un certificat de qualification ou une habilitation. Elles ne sont pas vendues aux particuliers.</p>` },
      { id: 'age', title: 'Âge et vérification', html: `
<p>Indépendamment de la catégorie, <strong>EHSHOP vend uniquement aux personnes âgées d’au moins ${site.policy.minimumBuyerAge}&nbsp;ans</strong>.</p>
<ul class="ticks"><li>La date de naissance est obligatoire pour toute commande. Une commande passée par une personne n’ayant pas l’âge requis est refusée.</li><li>Une pièce d’identité peut être demandée à la remise de la commande.</li><li>L’acheteur s’engage à ne pas remettre les produits à une personne n’ayant pas l’âge minimum de la catégorie concernée.</li></ul>` },
      { id: 'etiquette', title: 'Lire l’étiquette', html: `
<p>Chaque article conforme comporte un étiquetage en français indiquant notamment&nbsp;:</p>
<ul class="ticks"><li>la catégorie et l’âge minimum&nbsp;;</li><li>le nom du fabricant ou de l’importateur et le numéro d’enregistrement (marquage CE)&nbsp;;</li><li>la masse active (contenu explosif net, NEC)&nbsp;;</li><li>le mode d’emploi et la distance de sécurité à respecter.</li></ul>
<p>Les informations de l’étiquette font foi. Les fiches de la boutique les reprennent lorsqu’elles sont disponibles.</p>` },
      { id: 'utilisation', title: 'Règles d’utilisation', html: `
<ul class="ticks">
<li>Usage en extérieur, dans un espace dégagé, sur un sol plat et stable&nbsp;; fixer ou caler les articles si la notice le demande.</li>
<li>Respecter la distance de sécurité indiquée, vis-à-vis du public comme des habitations, véhicules, arbres et matériaux inflammables.</li>
<li>Allumer à bout de bras, avec un allumeur adapté, sans jamais se placer au-dessus de l’artifice. Porter des lunettes de protection.</li>
<li>Ne jamais rallumer un artifice défaillant&nbsp;: attendre au moins 15&nbsp;minutes, puis le noyer dans l’eau.</li>
<li>Ne pas consommer d’alcool avant ou pendant la manipulation. Tenir les enfants et les animaux éloignés.</li>
<li>Prévoir un seau d’eau ou un extincteur à proximité.</li>
<li>Ne jamais modifier, démonter ou combiner des artifices.</li></ul>` },
      { id: 'local', title: 'Restrictions locales', html: `
<p>Des arrêtés préfectoraux ou municipaux peuvent interdire ou encadrer la vente, le port, le transport ou l’usage d’artifices, en particulier autour du 14&nbsp;juillet et du 31&nbsp;décembre, ou en période de risque d’incendie. <strong>Avant tout usage, renseignez-vous auprès de votre mairie ou de votre préfecture.</strong></p>` },
      { id: 'stockage', title: 'Transport et stockage', html: `
<p>Les articles pyrotechniques sont des marchandises dangereuses (classe&nbsp;1). Conservez-les dans leur emballage d’origine, au sec, à l’abri de la chaleur et hors de portée des enfants. Transportez-les dans le coffre, jamais dans l’habitacle à portée de main, et sans fumer.</p>` },
    ],
    aside: `<aside class="doc__aside card card--dark">${icon.alert}<p><strong>En cas d’accident</strong>, appelez le 15 (SAMU), le 18 (pompiers) ou le 112.</p></aside>`,
  });
}

/* ------------------------------------------------------------------ Livraison */
export function livraison(ctx) {
  const { site } = ctx;
  const p = site.policy;
  const modes = p.deliveryModes?.length
    ? `<ul class="ticks">${p.deliveryModes.map((m) => `<li><strong>${esc(m.label)}</strong>${m.details ? ` — ${esc(m.details)}` : ''}</li>`).join('')}</ul>`
    : `<p>${todo(null, 'Modes de remise proposés (retrait, livraison par transporteur agréé…)')}</p>`;
  return infoPage(ctx, {
    path: '/livraison/', title: 'Livraison & retrait', eyebrow: 'Commandes',
    description: 'Modes de remise, zones desservies, délais et frais des commandes EHSHOP.',
    lead: 'Le transport d’articles pyrotechniques obéit à des règles spécifiques. Voici comment votre commande vous est remise.',
    sections: [
      { id: 'modes', title: 'Modes de remise', html: modes + (site.contact.pickupAddress ? `<p>Adresse de retrait&nbsp;: ${esc(site.contact.pickupAddress)}</p>` : '') },
      { id: 'zones', title: 'Zones desservies', html: `<p>${todo(p.deliveryZones, 'Zones de livraison')}</p>` },
      { id: 'delais', title: 'Délais', html: `<p>${todo(p.deliveryDelay, 'Délais de préparation et de remise')}</p><p>La disponibilité de chaque produit est indiquée sur sa fiche. En cas d’indisponibilité après commande, vous êtes informé sans délai et remboursé des sommes versées pour l’article concerné.</p>` },
      { id: 'frais', title: 'Frais', html: `<p>${todo(p.shippingCostInfo, 'Frais de livraison / de retrait')}</p><p>Le montant total, frais inclus, vous est communiqué avant tout paiement.</p>` },
      { id: 'remise', title: 'À la remise', html: `<ul class="ticks"><li>Une pièce d’identité peut être demandée pour vérifier l’âge de la personne qui réceptionne.</li><li>Vérifiez l’état des colis en présence du livreur et notez toute réserve.</li><li>Les colis ne sont pas remis à une personne mineure.</li></ul>` },
    ],
  });
}

/* ------------------------------------------------------------------------ FAQ */
export function faq(ctx) {
  const { site } = ctx;
  const qa = [
    ['Quel âge faut-il avoir pour commander&nbsp;?', `${site.policy.minimumBuyerAge}&nbsp;ans minimum, quelle que soit la catégorie du produit. La date de naissance est demandée lors de la commande et une pièce d’identité peut être exigée à la remise.`],
    ['Que signifient F1, F2 et F3&nbsp;?', 'Ce sont des catégories réglementaires qui reflètent le niveau de danger&nbsp;: elles déterminent l’âge minimum d’utilisation et la distance de sécurité. <a href="/reglementation/#categories">Voir le détail</a>.'],
    ['Puis-je tirer mes artifices n’importe où&nbsp;?', 'Non. L’usage se fait en extérieur, dans un espace adapté à la distance de sécurité du produit, et dans le respect des arrêtés locaux qui peuvent l’interdire à certaines dates. <a href="/reglementation/#local">Restrictions locales</a>.'],
    ['Comment ma commande m’est-elle remise&nbsp;?', 'Les modes de remise, zones et frais sont décrits sur la page <a href="/livraison/">Livraison & retrait</a>.'],
    ['Les prix sont-ils TTC&nbsp;?', 'Oui, les prix affichés sont toutes taxes comprises, hors frais de remise éventuels, communiqués avant paiement.'],
    ['Puis-je me rétracter&nbsp;?', 'Oui, dans les conditions prévues par le Code de la consommation, détaillées dans les <a href="/cgv/#retractation">conditions générales de vente</a>.'],
    ['Mon panier est-il conservé&nbsp;?', 'Oui, il est enregistré sur votre appareil (stockage local du navigateur), sans cookie ni compte. Il disparaît si vous videz les données de votre navigateur.'],
    ['Que faire si un artifice ne fonctionne pas&nbsp;?', 'Ne vous en approchez pas et ne le rallumez jamais. Attendez au moins 15&nbsp;minutes, puis noyez-le dans l’eau. Contactez ensuite le service client.'],
  ];
  const body = `<div class="faq">${qa.map(([q, a]) => `<details><summary>${q}</summary><div class="acc__body"><p>${a}</p></div></details>`).join('')}</div>`;
  const page = infoPage(ctx, {
    path: '/faq/', title: 'Questions fréquentes', eyebrow: 'Aide', updated: false, noToc: true,
    description: 'Réponses aux questions fréquentes : âge, catégories, livraison, rétractation, sécurité.',
    sections: [{ id: 'questions', title: 'Avant et après la commande', html: body }],
    aside: `<aside class="doc__aside card"><p><strong>Vous ne trouvez pas votre réponse&nbsp;?</strong></p><a class="btn btn--dark btn--block" href="/contact/">Contacter le service client</a></aside>`,
  });
  page.jsonld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q.replace(/&nbsp;/g, ' '), acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ') } })) });
  return page;
}

/* ------------------------------------------------------------------- À propos */
export function aPropos(ctx) {
  return infoPage(ctx, {
    path: '/a-propos/', title: 'À propos', eyebrow: 'La boutique', noToc: true,
    description: 'Qui est EHSHOP et comment la boutique sélectionne et vend ses articles pyrotechniques.',
    lead: 'EHSHOP propose des articles pyrotechniques de loisir avec une exigence simple&nbsp;: une information claire et une vente encadrée.',
    sections: [
      { id: 'histoire', title: 'Notre histoire', html: `<p>${todo(null, 'Présentation de l’entreprise : origine, équipe, implantation')}</p>` },
      { id: 'engagements', title: 'Nos engagements', html: `<ul class="ticks"><li><strong>Informer</strong>&nbsp;: catégorie réglementaire, âge minimum et consignes de sécurité figurent sur chaque fiche.</li><li><strong>Encadrer</strong>&nbsp;: vente réservée aux personnes de ${ctx.site.policy.minimumBuyerAge}&nbsp;ans et plus, avec vérification de la date de naissance.</li><li><strong>Respecter vos données</strong>&nbsp;: pas de cookie publicitaire, pas de revente de données.</li><li><strong>Répondre</strong>&nbsp;: un service client joignable pour toute question avant et après l’achat.</li></ul>` },
      { id: 'entreprise', title: 'L’entreprise', html: `<p>Les informations légales complètes figurent dans les <a href="/mentions-legales/">mentions légales</a>.</p>` },
    ],
  });
}

/* -------------------------------------------------------------------- Contact */
export function contact(ctx) {
  const c = ctx.site.contact;
  const co = ctx.site.company;
  const crumbs = breadcrumbs([{ name: 'Accueil', href: '/' }, { name: 'Contact' }], ctx);
  const body = html`
<section class="phead"><div class="container">${crumbs.markup}<p class="eyebrow">Service client</p><h1 class="phead__title">Contact</h1><p class="phead__text">Une question sur un produit, une commande ou la réglementation&nbsp;? Écrivez-nous.</p></div></section>
<section class="section section--flush-top"><div class="container contact">
  <form class="card contact__form" data-contact-form data-email="${c.email || ''}" novalidate>
    <div class="form-error" role="alert" data-form-error hidden></div>
    <div class="fgrid">
      <div class="field"><label for="c-name">Nom</label><input id="c-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="c-email">E-mail</label><input id="c-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field field--full"><label for="c-subject">Objet</label>
        <select id="c-subject" name="subject" required><option value="">Choisir…</option><option>Question sur un produit</option><option>Suivi d’une commande</option><option>Réglementation et sécurité</option><option>Autre demande</option></select></div>
      <div class="field field--full"><label for="c-msg">Message</label><textarea id="c-msg" name="message" rows="6" required maxlength="3000"></textarea></div>
    </div>
    <div class="hp" aria-hidden="true"><label for="c-web">Ne pas remplir</label><input id="c-web" name="website" tabindex="-1" autocomplete="off"></div>
    <p class="field__help">Vos données servent uniquement à répondre à votre demande. <a href="/confidentialite/">Confidentialité</a></p>
    <button class="btn btn--dark btn--lg" type="submit">Envoyer le message</button>
  </form>
  <aside class="contact__aside">
    <div class="card card--dark">
      <h2>Coordonnées</h2>
      <ul class="contact__list">
        <li>${icon.mail}<span>${raw(c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : todo(null, 'E-mail'))}</span></li>
        <li>${icon.id}<span>${raw(c.phone ? `<a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a>` : todo(null, 'Téléphone'))}</span></li>
        <li>${icon.doc}<span>${raw(todo(c.hours, 'Horaires'))}</span></li>
        <li>${icon.truck}<span>${raw(todo(co.address, 'Adresse'))}</span></li>
      </ul>
    </div>
    <div class="card"><h2>Avant d’écrire</h2><p>Les réponses aux questions les plus courantes sont dans la <a href="/faq/">FAQ</a>.</p></div>
  </aside>
</div></section>`;
  return { path: '/contact/', title: 'Contact', description: 'Contacter le service client EHSHOP.', body, jsonld: [crumbs.ld] };
}

/* ----------------------------------------------------------- Mentions légales */
export function mentions(ctx) {
  const co = ctx.site.company;
  const c = ctx.site.contact;
  return infoPage(ctx, {
    path: '/mentions-legales/', title: 'Mentions légales', eyebrow: 'Informations légales', noToc: true,
    description: 'Mentions légales du site EHSHOP : éditeur, hébergeur, propriété intellectuelle.',
    lead: 'Informations publiées en application de l’article 6 de la loi n°&nbsp;2004-575 du 21&nbsp;juin 2004 pour la confiance dans l’économie numérique.',
    sections: [
      { id: 'editeur', title: 'Éditeur du site', html: `<dl class="dl">
<dt>Raison sociale</dt><dd>${co.legalName ? esc(companyLine(co)) : todo(null, 'Raison sociale, forme juridique, capital')}</dd>
<dt>Siège social</dt><dd>${todo(co.address, 'Adresse du siège')}</dd>
<dt>SIRET</dt><dd>${todo(co.siret, 'SIRET')}</dd>
<dt>RCS</dt><dd>${todo(co.rcs, 'Immatriculation RCS')}</dd>
<dt>TVA intracommunautaire</dt><dd>${todo(co.vatNumber, 'N° de TVA')}</dd>
<dt>Contact</dt><dd>${todo(c.email, 'E-mail')} · ${todo(c.phone, 'Téléphone')}</dd>
<dt>Directeur de la publication</dt><dd>${todo(co.publicationDirector, 'Nom du directeur de la publication')}</dd></dl>` },
      { id: 'hebergeur', title: 'Hébergeur', html: `<dl class="dl"><dt>Nom</dt><dd>${todo(co.host.name, 'Hébergeur')}</dd><dt>Adresse</dt><dd>${todo(co.host.address, 'Adresse de l’hébergeur')}</dd><dt>Téléphone</dt><dd>${todo(co.host.phone, 'Téléphone de l’hébergeur')}</dd></dl>` },
      { id: 'pi', title: 'Propriété intellectuelle', html: `<p>Les contenus du site (textes, logo, illustrations, mise en page) sont protégés. Toute reproduction sans autorisation préalable est interdite. Les marques et visuels des fabricants restent la propriété de leurs titulaires. Polices Manrope et Instrument Serif&nbsp;: licence SIL Open Font License&nbsp;1.1.</p>` },
      { id: 'donnees', title: 'Données personnelles', html: `<p>Voir la <a href="/confidentialite/">politique de confidentialité</a> et la <a href="/cookies/">politique cookies</a>.</p>` },
    ],
  });
}

/* ------------------------------------------------------------------------ CGV */
export function cgv(ctx) {
  const { site } = ctx;
  const co = site.company;
  const p = site.policy;
  const seller = co.legalName ? esc(companyLine(co)) : todo(null, 'Raison sociale');
  return infoPage(ctx, {
    path: '/cgv/', title: 'Conditions générales de vente', eyebrow: 'Informations légales',
    description: 'Conditions générales de vente EHSHOP : commande, prix, paiement, remise, rétractation, garanties.',
    lead: 'Les présentes conditions s’appliquent à toute commande passée sur le site par un consommateur.',
    sections: [
      { id: 'objet', title: 'Article 1 — Objet et vendeur', html: `<p>Les présentes conditions générales de vente (CGV) régissent les ventes conclues sur le site ${esc(site.brand.baseUrl.replace(/^https?:\/\//, ''))} entre ${seller} (SIRET ${todo(co.siret, 'SIRET')}, siège&nbsp;: ${todo(co.address, 'adresse')}), ci-après «&nbsp;le vendeur&nbsp;», et toute personne physique majeure agissant en qualité de consommateur, ci-après «&nbsp;le client&nbsp;».</p>` },
      { id: 'conditions', title: 'Article 2 — Conditions d’achat', html: `<p>La commande est réservée aux personnes âgées d’au moins ${p.minimumBuyerAge}&nbsp;ans, et ayant l’âge minimum requis pour la catégorie de chaque article commandé. Le client renseigne sa date de naissance lors de la commande et certifie l’exactitude de cette information. Le vendeur peut demander un justificatif d’identité et refuse toute commande ou remise ne respectant pas ces conditions. Les articles des catégories F4, T2 et P2 ne sont pas vendus aux particuliers.</p><p>Le client s’engage à respecter la réglementation applicable à la détention, au transport et à l’utilisation des articles, y compris les arrêtés préfectoraux et municipaux.</p>` },
      { id: 'produits', title: 'Article 3 — Produits', html: `<p>Les caractéristiques essentielles des produits (catégorie, âge minimum, contenu, informations figurant sur l’étiquette) sont présentées sur chaque fiche. Les illustrations sont non contractuelles lorsqu’elles sont signalées comme telles. Les offres sont valables dans la limite des stocks disponibles.</p>` },
      { id: 'prix', title: 'Article 4 — Prix', html: `<p>Les prix sont indiqués en euros, toutes taxes comprises, hors frais de remise. Le montant total de la commande, frais compris, est communiqué au client avant tout paiement. Le vendeur peut modifier ses prix à tout moment&nbsp;; le prix applicable est celui en vigueur au moment de la validation de la commande.</p>` },
      { id: 'commande', title: 'Article 5 — Commande', html: `<p>Le client sélectionne les produits, renseigne ses coordonnées, accepte les présentes CGV puis valide sa commande. Le vendeur confirme la commande par e-mail après vérification de la disponibilité et des conditions d’âge. Le contrat est conclu à réception de cette confirmation. Le vendeur se réserve le droit d’annuler toute commande d’un client avec lequel existe un litige, ou ne respectant pas l’article&nbsp;2.</p>` },
      { id: 'paiement', title: 'Article 6 — Paiement', html: `<p>Moyens de paiement acceptés&nbsp;: ${p.paymentMethods?.length ? esc(p.paymentMethods.join(', ')) : todo(null, 'moyens de paiement')}. Les paiements en ligne sont traités par un prestataire spécialisé&nbsp;; le vendeur n’a jamais accès aux données bancaires complètes du client.</p>` },
      { id: 'remise', title: 'Article 7 — Remise des produits', html: `<p>Les modes, zones, délais et frais de remise sont précisés sur la page <a href="/livraison/">Livraison & retrait</a> et rappelés lors de la commande. Conformément à l’article L.&nbsp;216-1 du Code de la consommation, à défaut de date convenue, le vendeur remet les produits au plus tard trente jours après la conclusion du contrat. Le transfert des risques intervient lors de la prise de possession physique des produits par le client.</p>` },
      { id: 'retractation', title: 'Article 8 — Droit de rétractation', html: `<p>Conformément aux articles L.&nbsp;221-18 et suivants du Code de la consommation, le client dispose d’un délai de quatorze jours à compter de la réception des produits pour exercer son droit de rétractation, sans avoir à motiver sa décision. Il notifie sa décision par une déclaration dénuée d’ambiguïté adressée au vendeur (coordonnées en page <a href="/contact/">Contact</a>).</p><p>Les produits doivent être restitués complets, dans leur emballage d’origine, non utilisés, dans les quatorze jours suivant la notification. Les articles pyrotechniques étant des marchandises dangereuses, leur retour doit respecter les règles de transport applicables&nbsp;: ${todo(p.returnsInfo, 'modalités de retour (retour en point de retrait, transporteur agréé…) et prise en charge des frais')}.</p><p>Le vendeur rembourse la totalité des sommes versées, y compris les frais de remise initiaux (hors surcoût d’un mode de remise plus coûteux choisi par le client), dans un délai de quatorze jours à compter de la notification, ce remboursement pouvant être différé jusqu’à récupération des produits.</p>` },
      { id: 'garanties', title: 'Article 9 — Garanties légales', html: `<p>Le client bénéficie de la garantie légale de conformité (articles L.&nbsp;217-3 et suivants du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil). En cas de défaut, le client contacte le service client. Un artifice qui n’a pas fonctionné ne doit jamais être rallumé ni démonté.</p>` },
      { id: 'responsabilite', title: 'Article 10 — Responsabilité', html: `<p>Le vendeur ne saurait être tenu responsable des dommages résultant d’une utilisation non conforme à l’étiquetage, à la notice, aux consignes de sécurité ou à la réglementation.</p>` },
      { id: 'donnees', title: 'Article 11 — Données personnelles', html: `<p>Les données collectées lors de la commande sont traitées conformément à la <a href="/confidentialite/">politique de confidentialité</a>.</p>` },
      { id: 'litiges', title: 'Article 12 — Réclamations, médiation et droit applicable', html: `<p>Toute réclamation est adressée au service client. En l’absence de solution amiable, le client peut recourir gratuitement au médiateur de la consommation dont relève le vendeur (articles L.&nbsp;612-1 et suivants du Code de la consommation)&nbsp;: ${todo(null, 'nom et coordonnées du médiateur de la consommation')}. Les présentes CGV sont soumises au droit français.</p>` },
    ],
  });
}

/* ----------------------------------------------------------- Confidentialité */
export function confidentialite(ctx) {
  const { site } = ctx;
  const co = site.company;
  return infoPage(ctx, {
    path: '/confidentialite/', title: 'Politique de confidentialité', eyebrow: 'Données personnelles',
    description: 'Comment EHSHOP collecte, utilise et protège vos données personnelles (RGPD).',
    lead: 'Cette politique décrit les traitements de données personnelles réalisés via le site, conformément au règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés.',
    sections: [
      { id: 'responsable', title: 'Responsable du traitement', html: `<p>${co.legalName ? esc(companyLine(co)) : todo(null, 'Raison sociale')}, ${todo(co.address, 'adresse')}. Contact&nbsp;: ${todo(site.contact.email, 'e-mail')}.</p>` },
      { id: 'donnees', title: 'Données collectées et finalités', html: `<div class="table-wrap"><table class="regtable"><thead><tr><th scope="col">Traitement</th><th scope="col">Données</th><th scope="col">Base légale</th></tr></thead><tbody>
<tr><td>Gestion des commandes</td><td>Nom, prénom, e-mail, téléphone, adresse, contenu de la commande</td><td>Exécution du contrat</td></tr>
<tr><td>Vérification de l’âge</td><td>Date de naissance</td><td>Obligation légale (interdiction de vente aux mineurs selon la catégorie)</td></tr>
<tr><td>Réponse aux demandes</td><td>Nom, e-mail, message</td><td>Intérêt légitime</td></tr>
<tr><td>Obligations comptables</td><td>Factures</td><td>Obligation légale</td></tr></tbody></table></div>
<p>Aucune donnée n’est utilisée à des fins publicitaires ni cédée à des tiers.</p>` },
      { id: 'duree', title: 'Durées de conservation', html: `<ul class="ticks"><li>Données de commande&nbsp;: pendant la relation commerciale, puis archivées pendant la durée de prescription applicable.</li><li>Pièces comptables&nbsp;: 10&nbsp;ans (article L.&nbsp;123-22 du Code de commerce).</li><li>Demandes de contact&nbsp;: le temps nécessaire au traitement de la demande.</li></ul>` },
      { id: 'destinataires', title: 'Destinataires', html: `<p>Les données sont destinées au seul personnel habilité du vendeur et, le cas échéant, à ses sous-traitants techniques (hébergement&nbsp;: ${todo(co.host.name, 'hébergeur')}&nbsp;; transport et paiement, pour la stricte exécution de la commande).</p>` },
      { id: 'local', title: 'Stockage sur votre appareil', html: `<p>Le contenu du panier est enregistré dans le stockage local de votre navigateur (clé <code>ehshop-cart</code>). Il ne quitte pas votre appareil avant l’envoi de la commande. Voir la <a href="/cookies/">politique cookies</a>.</p>` },
      { id: 'droits', title: 'Vos droits', html: `<p>Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité, ainsi que du droit de définir des directives relatives au sort de vos données après votre décès. Pour les exercer, écrivez à ${todo(site.contact.email, 'e-mail')}. Vous pouvez introduire une réclamation auprès de la CNIL (cnil.fr).</p>` },
      { id: 'securite', title: 'Sécurité', html: `<p>Le site est servi exclusivement en HTTPS. Il ne charge aucun script ni police depuis un service tiers. L’accès aux données de commande est limité aux personnes habilitées.</p>` },
    ],
  });
}

/* -------------------------------------------------------------------- Cookies */
export function cookies(ctx) {
  return infoPage(ctx, {
    path: '/cookies/', title: 'Politique cookies', eyebrow: 'Données personnelles', noToc: true,
    description: 'EHSHOP n’utilise aucun cookie publicitaire ni de mesure d’audience.',
    lead: 'Le site n’utilise <strong>aucun cookie</strong> publicitaire, de mesure d’audience ou de réseau social. C’est pourquoi aucun bandeau de consentement ne vous est présenté.',
    sections: [
      { id: 'stockage', title: 'Ce que le site enregistre', html: `<div class="table-wrap"><table class="regtable"><thead><tr><th scope="col">Nom</th><th scope="col">Type</th><th scope="col">Finalité</th><th scope="col">Durée</th></tr></thead><tbody><tr><td><code>ehshop-cart</code></td><td>Stockage local du navigateur</td><td>Conserver le contenu du panier (strictement nécessaire au service demandé)</td><td>Jusqu’à la validation de la commande ou la suppression par l’utilisateur</td></tr></tbody></table></div>
<p>Ce stockage, strictement nécessaire au fonctionnement du panier, est exempté de consentement (article 82 de la loi Informatique et Libertés).</p>` },
      { id: 'gerer', title: 'Supprimer ces données', html: `<p>Vous pouvez vider votre panier depuis la page <a href="/panier/">Panier</a>, ou effacer les données du site dans les réglages de votre navigateur.</p>` },
      { id: 'evolution', title: 'Évolution', html: `<p>Si des outils de mesure d’audience ou des services tiers venaient à être ajoutés, votre consentement serait recueilli au préalable lorsqu’il est requis, et cette page serait mise à jour.</p>` },
    ],
  });
}

export const infoPages = [reglementation, livraison, faq, aPropos, contact, mentions, cgv, confidentialite, cookies];
