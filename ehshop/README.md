# EHSHOP — boutique en ligne

Site e-commerce statique pré-rendu pour EHSHOP (articles pyrotechniques de loisir).
Il ne dépend d'aucun framework ni paquet npm et s'héberge chez n'importe quel hébergeur
(OVH, o2switch, Netlify, Vercel, Cloudflare Pages…).

```bash
npm run build     # génère dist/
```

```bash
npm run serve     # prévisualisation sur http://localhost:4321
```

Node.js 18 ou plus est requis.

## Avant la mise en ligne

Le build affiche la liste exacte de ce qui manque. Rien n'est inventé : chaque information absente
apparaît sur le site sous la forme d'un marqueur jaune « … — à compléter ».

1. **`data/site.json`** : raison sociale, SIRET, RCS, TVA, adresse, directeur de publication, hébergeur,
   e-mail et téléphone du service client, modes, zones, délais et frais de livraison, moyens de paiement,
   modalités de retour, médiateur de la consommation (dans `src/content.mjs`, article 12 des CGV).
2. **`data/products.json`** : remplacer le catalogue de démonstration par les produits réels, avec les
   données de l'étiquette ou de la fiche fabricant (catégorie, âge, NEC, n° CE, fabricant).
   Passer ensuite `"demo"` à `false` pour retirer le bandeau.
3. **`data/categories.json`** : ajuster les familles au catalogue réel.
4. **Photos** : ajouter `"image": "/assets/img/produits/xxx.webp"` (ou `"images": [...]`) sur un produit,
   et placer le fichier dans `src/assets/img/produits/`. Sans photo, une illustration abstraite est
   générée et signalée « Illustration non contractuelle ».
5. **Anciennes URL** : lister les redirections dans `data/redirects.json`
   (`[{ "from": "/ancienne-page", "to": "/nouvelle/" }]`). Le build génère `_redirects` (Netlify,
   Cloudflare) et `.htaccess` (Apache).
6. Lire et faire valider les CGV, la politique de confidentialité et les mentions légales par un
   professionnel. Ce sont des bases rédigées selon le droit français, pas un avis juridique.

## Prise de commande et paiement

- **`order.endpoint` vide, avec un e-mail de contact** : la commande est préparée dans la messagerie
  du client, avec une référence, pour être envoyée au service client. Aucune donnée bancaire ne
  transite par le site.
- **`order.endpoint` renseigné** : la commande est envoyée en `POST` JSON vers cette URL (back-office,
  Make/Zapier, fonction serverless, etc.). Pour un paiement en ligne, ce point d'entrée crée une session
  chez un prestataire (Stripe Checkout, PayPal…) : le site lui-même ne traite jamais de carte.
- Sans e-mail ni endpoint, la commande affiche un message clair et le panier est conservé.

Côté serveur, toujours revérifier les prix, la disponibilité et l'âge. Le navigateur n'est pas une
source de confiance.

## Structure

```
data/            contenus éditables (site, catégories, produits, redirections)
src/layout.mjs   gabarit : barre d'info, header, méga-menu, tiroir mobile, footer, SEO
src/pages.mjs    accueil, catalogue, catégories, fiche produit, recherche, panier, commande
src/content.mjs  réglementation, livraison, FAQ, à propos, contact, pages légales
src/lib/         utilitaires, illustrations SVG générées
src/assets/      CSS, JS, polices auto-hébergées (licence OFL)
build.mjs        validation des données + génération de dist/
tests/e2e.cjs    test du parcours d'achat (Playwright)
```

## Choix techniques

- **SEO** : HTML pré-rendu, URL propres, balises canonical et Open Graph, JSON-LD (Organization,
  WebSite, BreadcrumbList, Product, FAQPage), `sitemap.xml`, `robots.txt`, page 404 dédiée.
- **Performance** : aucune ressource tierce, polices préchargées, images à dimensions fixes
  (pas de décalage de mise en page), chargement différé, JavaScript en `defer`.
- **Accessibilité** : lien d'évitement, navigation au clavier (méga-menu, tiroir avec piège de focus,
  Échap), erreurs de formulaire annoncées, `aria-live`, respect de `prefers-reduced-motion`.
- **RGPD** : aucun cookie ni traceur, donc pas de bandeau. Seul le panier est stocké localement.
  Si vous ajoutez un outil de mesure d'audience, il faudra recueillir le consentement.
- **Sécurité** : données échappées, en-têtes de sécurité (CSP, nosniff, frame-ancestors) dans
  `.htaccess` et `_headers`, pot de miel anti-robots, prix du panier toujours relus depuis le
  catalogue.
- **Conformité** : âge vérifié à la commande (date de naissance), catégorie et âge minimum affichés
  partout. Le build refuse un produit F4/T2/P2 ou un âge inférieur au minimum légal.

## Tests

```bash
npm run build && npm run serve
```

Dans un second terminal :

```bash
node tests/e2e.cjs
```
