# EHSHOP — nouvelle boutique en ligne

Refonte complète d'[ehshop.net](https://ehshop.net) (actuellement sur SumUp Online Store) en site
e-commerce statique pré-rendu. Il ne dépend d'aucun framework ni paquet npm et s'héberge chez
n'importe quel hébergeur (OVH, o2switch, Netlify, Cloudflare Pages…).

```bash
npm run build     # génère dist/
```

```bash
npm run serve     # prévisualisation sur http://localhost:4321
```

Node.js 18 ou plus est requis.

## Contenu repris du site actuel

Toutes les données viennent des pages publiées sur ehshop.net. Rien n'est inventé.

- **39 produits** (`data/products.json`) : nom, prix, stock, description, photo et caractéristiques
  (coups, calibre, durée, NEC, catégorie F2/F3) extraites des fiches SumUp.
- **Photos** (`src/assets/img/produits/`) : photos d'origine centrées sur fond carré, en WebP
  (1000 px pour la fiche, 480 px pour les vignettes).
- **Société, contact, frais de port, paiement, médiateur** (`data/site.json`) : repris des mentions
  légales et des CGV.
- **CGV** (`data/cgv.json`) : texte officiel du 31/10/2026, découpé par article.
- **Redirections 301** (`data/redirects.json`) : toutes les anciennes URL SumUp (`/product/…`,
  `/article/…`, `/catégorie/…`, `/page/…`) pointent vers les nouvelles, pour conserver le référencement.

## Ce qui a changé par rapport au site actuel

- **Une boutique organisée par rayons**, inspirée des sites concurrents : Feux d'artifice (avec
  méga-menu par budget), Pétards, Fusées & packs, Chandelles & monocoups, Fumigènes & torches,
  Systèmes de tir, Accessoires. Le téléphone est affiché dans le header et la recherche est instantanée.
- **Accueil commerçant** : produits à la une, rayons illustrés, onglets (En tendance, Petits prix,
  Gros calibres, Pétards), comparateur, idées par envie, conseils, encart pros, bloc confiance.
- **Comparateur de compacts** : coups, calibre, durée, prix et prix au coup, triables.
- **Fiches produits** : caractéristiques clés, prix au coup, frais de port, sécurité, retours ADR.
- **Favoris**, filtres par budget et par catégorie, tri par nombre de coups.
- **Conseils** (`/conseils/`) : choisir son compact, différences entre artifices, sécurité, décret.
- **Page Professionnels** : devis, règles F4/T2 (article 18 des CGV).
- **Contrôle d'âge** à l'entrée (mémorisé 30 jours), plus la date de naissance vérifiée à la commande.

## Restriction réglementaire temporaire

`data/site.json → regulatoryNotice` décrit le **décret n° 2026-1047 du 14 novembre 2026**
(vente de certains artifices F2/F3 suspendue jusqu'au 27/11/2026 inclus). Pendant cette période :

- un bandeau s'affiche sur toutes les pages ;
- les produits des rayons listés dans `affectedCategories` ne peuvent pas être commandés
  (bouton « Dès le 28/11 », panier et commande bloqués) ;
- tout s'arrête automatiquement après la date `until` (heure de Paris), sans nouveau déploiement.

Les informations proviennent d'une source secondaire : **vérifiez le texte sur Légifrance**.
Les fumigènes et torches sont bloqués par prudence, car leur catégorie n'est pas indiquée sur les
fiches. Retirez `fumigenes-torches` de la liste s'ils sont de catégorie F1. Pour une prochaine
restriction, modifiez ce bloc ou passez `active` à `false`.

## Commande et paiement

Le fonctionnement suit l'article 5.2 des CGV : la commande est envoyée au service client, qui vérifie
le stock et l'âge, puis renvoie un **lien de paiement SumUp** (ou les coordonnées pour un virement).

- `order.endpoint` vide : le récapitulatif de commande (référence, articles, frais de port, adresse,
  mode de paiement) s'ouvre dans la messagerie du client, adressé à kimplex.pyro@ehshop.net.
- `order.endpoint` renseigné : la commande est envoyée en `POST` JSON vers cette URL (back-office,
  Make/Zapier, fonction serverless). C'est là qu'on peut générer automatiquement le lien SumUp.

Côté serveur, revérifiez toujours prix, disponibilité, restriction et âge : le navigateur n'est
pas une source de confiance.

## Avant la mise en ligne

Le build liste ce qui manque (4 éléments aujourd'hui) :

1. **Hébergeur** (`company.host`) : nom, adresse et téléphone du nouvel hébergeur. Pensez aussi à
   mettre à jour l'hébergeur cité dans l'article 1 et l'article 14 des CGV (`data/cgv.json`).
2. **À propos** : quelques lignes sur l'histoire d'EHSHOP et de la marque Kimplex.
3. Faire relire les textes juridiques par un professionnel.
4. Après la bascule DNS, vérifiez les redirections (`_redirects` pour Netlify et Cloudflare,
   `.htaccess` pour Apache).

## Modifier le catalogue

Éditez `data/products.json`, puis lancez `npm run build`. Le build refuse un produit incohérent :
slug en double, prix invalide, image manquante, catégorie F4/T2/P2, âge inférieur au minimum légal.
Pour une nouvelle photo, déposez `slug.webp` et `slug-480.webp` dans `src/assets/img/produits/`.

## Structure

```
data/            site, rayons, produits, CGV, redirections
src/layout.mjs   bandeaux, header, méga-menu, tiroir mobile, contrôle d'âge, footer, SEO
src/pages.mjs    accueil, boutique, rayons, sélections, comparateur, fiche, favoris, panier, commande
src/content.mjs  réglementation, livraison, FAQ, contact, pros, légal, conseils
src/components.mjs  carte produit, listing filtrable, onglets, comparateur
src/assets/      CSS, JS, polices auto-hébergées (licence OFL), photos produits
build.mjs        validation + génération de dist/
tests/e2e.cjs    test de bout en bout (Playwright)
```

## Choix techniques

- **SEO** : HTML pré-rendu, URL propres, canonical, Open Graph avec photo produit, JSON-LD
  (Organization, WebSite, BreadcrumbList, Product avec frais de port, FAQPage, Article),
  `sitemap.xml`, `robots.txt`, redirections 301.
- **Performance** : aucune ressource tierce, polices préchargées, images WebP à dimensions fixes,
  chargement différé, accueil ≈ 21 Ko compressé.
- **Accessibilité** : navigation au clavier (méga-menu, tiroir et contrôle d'âge avec piège de focus,
  onglets aux flèches), erreurs de formulaire annoncées, `prefers-reduced-motion` respecté.
- **RGPD** : aucun cookie ni traceur, donc pas de bandeau de consentement. Panier, favoris et réponse
  au contrôle d'âge sont stockés localement.
- **Sécurité** : données échappées, CSP stricte (aucun style ni script inline) et en-têtes de
  sécurité dans `.htaccess` et `_headers`, pot de miel anti-robots, prix toujours relus depuis le
  catalogue.

## Tests

```bash
npm run build && npm run serve
```

Dans un second terminal :

```bash
node tests/e2e.cjs
```

Le test vérifie 35 points : contrôle d'âge, blocage puis déblocage automatique au 28/11 (avec une
horloge simulée), budgets, comparateur, favoris, frais de port par zone, refus des mineurs,
commande, recherche, menu mobile et 404.
