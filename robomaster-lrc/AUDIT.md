# AUDIT TECHNIQUE — RoboMaster Long Range Control System

> **Étape 1 / 6 — Audit préalable.** Aucun code de pilotage réel n'a été écrit.
> Date de l'audit : 2026-10-13. Aucune mesure terrain n'a été réalisée : toutes les
> valeurs numériques de ce document sont soit **issues de sources**, soit des
> **calculs théoriques** explicitement signalés comme tels.

## Légende de fiabilité

| Marqueur | Signification |
|---|---|
| ✅ **CONFIRMÉ** | Vérifié dans une source officielle (DJI, Cisco, ARCEP/ANFR) ou dans le code source officiel. |
| 🟡 **PROBABLE** | Source secondaire concordante (forums, revendeurs, projets tiers) ; à confirmer. |
| ❓ **HYPOTHÈSE** | Non vérifié ; doit être testé sur le matériel réel avant usage. |
| ⛔ **BLOQUANT** | Empêche une partie de l'objectif tant qu'une décision n'est pas prise. |

---

## 0. Synthèse (à lire en premier)

1. ⛔ **Le DJI RoboMaster S1 n'a pas d'interface de contrôle externe officiellement prise en charge.**
   Le SDK officiel DJI (Python et « Plaintext SDK ») vise le **RoboMaster EP** et le Tello EDU.
   Le dépôt officiel `dji-sdk/RoboMaster-SDK` se décrit comme « Python SDK and Sample Code for
   RoboMaster EP » et ne mentionne pas le S1. Sur le S1, l'accès SDK n'est obtenu que par un
   **contournement communautaire non officiel** (activation d'ADB via le Lab Python de l'app).
   → Conséquence : conformément au cahier des charges (« ne pas inventer de commandes DJI »),
   **le pilotage réel du S1 ne peut pas être implémenté sur une base officielle.** Une décision est
   nécessaire (voir §10).
2. ⛔ **Le flux vidéo 720p du robot n'est accessible à un logiciel tiers que via ce même SDK**
   (port TCP 40921, H.264). Sans SDK, le seul retour vidéo officiel est celui de l'application
   DJI RoboMaster, qui est fermée et ne peut pas être intégrée à notre logiciel.
3. ✅ **Le mode « Connection via Router » existe** sur le S1 (FAQ DJI) et place le robot sur un
   réseau IP local. C'est ce mode qui rend un pont radio IP envisageable.
4. ⛔ **Le Cisco C9120AXE-E + antenne AIR-ANT2544V4M-RS ne constitue pas une liaison de plusieurs
   kilomètres.** C'est un point d'accès **intérieur** avec une antenne **omnidirectionnelle 4 dBi**.
   Le mode pont/mesh n'est pas confirmé pour ce modèle (indications contradictoires, voir §5).
   Son rôle réaliste : **point d'accès Wi-Fi local du robot** (côté robot) ou banc de test en
   laboratoire.
5. 🟡 **Une liaison de plusieurs km en visibilité directe est théoriquement réaliste** avec une
   paire de radios point à point extérieures 5 GHz (bande 5470–5725 MHz, 1 W PIRE max avec TPC
   et DFS obligatoire en France) et des antennes directives. **Aucune distance n'est garantie
   avant essais.**
6. Le robot reste un objet **Wi-Fi à courte portée** : « plusieurs km » désigne la distance
   **opérateur ↔ site du robot**, pas le rayon d'évolution du robot autour de son point d'accès.

---

## 1. Modes de connexion du RoboMaster S1

| Mode | Statut | Détails |
|---|---|---|
| Wi-Fi direct (robot = point d'accès) | ✅ CONFIRMÉ | Le robot émet son propre réseau. Adresse robot en direct : `192.168.2.1` (doc Plaintext SDK, code SDK `ROBOT_DEFAULT_WIFI_ADDR`). |
| Connection via Router (robot = client Wi-Fi) | ✅ CONFIRMÉ | FAQ DJI S1. Configuration par **QR code** généré dans l'app RoboMaster et présenté à la caméra du robot. |
| USB (RNDIS) | ✅ CONFIRMÉ pour l'EP | `192.168.42.2` dans le code SDK. Sur le S1, le port micro-USB du contrôleur central sert au contournement communautaire ; non pertinent pour la longue portée. |
| UART | ✅ CONFIRMÉ pour l'EP | Non disponible de façon documentée sur le S1. Non pertinent ici. |

### 1.1 Mode « Connection via Router » — exigences et limites

Exigences officielles (FAQ DJI S1) ✅ :
- chiffrement **WPA/WPA2-PSK** (pas de WPA2-Enterprise / 802.1X, pas de portail captif) ;
- nombre d'appareils inférieur à la limite du routeur ;
- **communication entre appareils autorisée** (pas d'isolation client / « AP isolation ») ;
- pas de double authentification / page de connexion.

Limites et points d'attention :
- ❓ **Bandes Wi-Fi utilisables en mode routeur** : à vérifier sur le robot réel (2,4 GHz
  supposé fonctionnel ; 5 GHz à tester). Le canal 5,8 GHz (5725–5850 MHz) n'est **pas** une bande
  Wi-Fi RLAN autorisée en France métropolitaine : ne pas l'utiliser.
- ❓ **WPA3 seul** : probablement non supporté (exigence officielle = WPA/WPA2-PSK). Prévoir un
  SSID dédié en WPA2-PSK (AES/CCMP), à clé longue et aléatoire, isolé dans un VLAN.
- ✅ **Découverte par diffusion** : en mode routeur, le robot diffuse son adresse IP en UDP
  broadcast (doc Plaintext SDK ; ports dans le code SDK : `40926` pour le Plaintext SDK,
  `40927` pour le SDK Python). Le broadcast **ne traverse pas un routeur IP**.
  → Soit le pont radio est **transparent en couche 2** (même domaine de broadcast), soit
  l'IP du robot est **fixée** (réservation DHCP) et renseignée manuellement : le SDK Python
  accepte `config.ROBOT_IP_STR` (✅ code source `conn.py` l.304) ce qui évite la découverte.
- ❓ L'application DJI officielle en mode routeur sur un réseau traversant un pont radio :
  comportement non documenté. À tester.

## 2. Interfaces de contrôle documentées

| Interface | Produits officiellement visés | S1 | Statut |
|---|---|---|---|
| App DJI RoboMaster (iOS/Android/Windows) | S1, EP | Oui | ✅ Officiel, **fermé**, non intégrable. |
| Lab Scratch / Python dans l'app | S1, EP | Oui | ✅ Officiel. Le code s'exécute **sur le robot**, lancé depuis l'app ; aucune API réseau entrante documentée. |
| RoboMaster SDK Python (`robomaster`) | EP, EP Core, Tello EDU | **Non** | ✅ Officiel pour EP. ⛔ S1 non pris en charge. |
| Plaintext SDK (TCP 40923) | EP | **Non** | ✅ Officiel pour EP. ⛔ S1 non pris en charge. |
| « SDK unlock » S1 via ADB | — | Oui (communauté) | 🟡 Non officiel. Dépend du firmware (des mises à jour peuvent le bloquer), risque de garantie et de dysfonctionnement. |

Le dépôt officiel `dji-sdk/RoboMaster-SDK` (licence Apache-2.0) n'a pas reçu de commit depuis
**novembre 2022** (✅ vérifié dans `git log`) : produit en fin de vie logicielle, compatibilité
Python récente à vérifier (le `setup.py` impose ≥ 3.6.5 ; les binaires de décodage fournis
ciblent Python 3.6–3.8).

### 2.1 Ports réseau du SDK (EP) — ✅ code source officiel

Source : `examples/plaintext_sample_code/RoboMasterEP/connection/network/robot_connection.py`
et `src/robomaster/config.py`.

| Port | Protocole | Usage |
|---|---|---|
| 40921 | TCP | Flux vidéo H.264 |
| 40922 | TCP | Flux audio (Opus) |
| 40923 | TCP | Commandes Plaintext SDK |
| 40924 | UDP | Données poussées (télémétrie) |
| 40925 | TCP | Événements |
| 40926 | UDP | Diffusion de l'IP du robot (Plaintext) |
| 40927 | UDP | Diffusion de l'IP du robot (SDK Python) |
| 20020 | — | Port « device » du protocole binaire SDK Python |
| 10100–10500 | — | Ports locaux SDK Python côté PC |

Ces ports ne sont valables **que** pour un robot exposant le SDK (EP, ou S1 débloqué).

## 3. Flux vidéo réel

- ✅ Le SDK EP fournit un flux **H.264 1280×720 à 30 i/s** (doc Plaintext SDK) sur TCP 40921.
- ✅ Le SDK Python fournit un module `camera` (décodage H.264 via `libmedia_codec`).
- ⛔ Sur un S1 non débloqué, aucune interface documentée ne permet de récupérer la vidéo dans un
  logiciel tiers.
- ❓ Débit du flux : non documenté. Ordre de grandeur supposé pour du 720p30 H.264 : quelques
  Mbit/s. **À mesurer.** Le dimensionnement de la liaison retient une hypothèse prudente de
  **≥ 10 Mbit/s utiles soutenus** pour vidéo + commandes + supervision.
- Règle appliquée au futur logiciel : en l'absence de flux, afficher « Vidéo indisponible » ;
  **jamais** de vidéo de substitution présentée comme réelle (le simulateur affichera une mire
  explicitement marquée SIMULATION).

## 4. Réseau à travers un pont radio

Contraintes issues des points précédents :

1. **Transport IP transparent** entre le PC opérateur et le robot (TCP et UDP, unicast et, si
   découverte automatique souhaitée, broadcast).
2. **Recommandation : pont en couche 2** (mode « bridge transparent » des radios PtP) avec un
   seul sous-réseau de contrôle, **IP fixe du robot** par réservation DHCP, découverte
   désactivée (`ROBOT_IP_STR`). Cela fonctionne même si le broadcast est filtré.
3. MTU : vérifier que la radio supporte au moins 1500 octets de charge utile (sinon
   fragmentation / pertes TCP). Test `ping -M do -s 1472`.
4. Pas d'isolation client sur le SSID robot (exigence DJI).
5. Qualité de service : prioriser les commandes (petits paquets) devant la vidéo si les radios
   le permettent (DSCP / WMM). Les commandes ne doivent jamais attendre derrière un tampon vidéo.
6. Aucune ouverture Internet entrante ; le réseau de contrôle est isolé (VLAN dédié, pas de
   route par défaut vers Internet côté robot).

Détails : `ARCHITECTURE.md`.

## 5. Cisco Catalyst C9120AXE-E et antenne AIR-ANT2544V4M-RS

### 5.1 Point d'accès C9120AXE-E

| Élément | Statut | Constat |
|---|---|---|
| Type | ✅ | Point d'accès Wi-Fi 6 **intérieur**, version à antennes externes (« E »). |
| Domaine réglementaire `-E` | ✅ | Europe ; les canaux/puissances sont bornés par le domaine. |
| Connecteurs | ✅ | 4 connecteurs **RP-TNC** double bande + connecteur Smart Antenna (DART). Antennes à brancher **avant** la mise sous tension (risque d'endommagement sinon). |
| Bandes | ✅ | 2400–2500 MHz et 5100–5900 MHz (limitées par le domaine `-E`). |
| Contrôleur | ✅ | Nécessite un contrôleur (Catalyst 9800) ou la variante logicielle **EWC** (contrôleur embarqué), à vérifier sur votre unité (`C9120AXE-E` vs `C9120AXE-EWC-E`). |
| Mode mesh / bridge (pont radio) | 🟡 **Non confirmé, plutôt non** | Indications contradictoires : des retours Cisco Community signalent `Bridge/Flex-Bridge mode not supported on this AP!` sur 9120 ; les notes de version 17.12 citent le mesh pour les **9130AX**, pas les 9120. Vérifier dans la **matrice de fonctionnalités AP Cisco** pour votre version IOS-XE. |
| Mode Workgroup Bridge (WGB) | ❓ | Indications contradictoires. À vérifier dans la matrice Cisco. |
| Usage extérieur | ⛔ | Boîtier intérieur, non étanche : **ne pas installer en extérieur** sans boîtier ventilé adapté (et même ainsi, hors des conditions prévues par Cisco). |
| Alimentation | ❓ | PoE (802.3at recommandé pour toutes les fonctions) — valeur exacte à relever sur la fiche technique de votre version. |

**Conclusion** : le C9120AXE-E est adapté comme **point d'accès local du robot** (SSID WPA2-PSK
dédié en 2,4 GHz), alimenté en PoE dans un abri, ou comme **banc de test intérieur**. Il n'est
**pas** le bon équipement pour la liaison de plusieurs km.

### 5.2 Antenne AIR-ANT2544V4M-RS

| Élément | Statut | Valeur |
|---|---|---|
| Type | 🟡 | Omnidirectionnelle, double bande, 4 ports RP-TNC (4×4 MIMO). |
| Gain | 🟡 | 4 dBi à 2,4 GHz, 4 dBi à 5 GHz (fiches revendeurs concordantes ; à confirmer sur la fiche Cisco). |
| Polarisation | 🟡 | Verticale. |
| Montage | 🟡 | Mur / mât, intérieur et extérieur. |
| Compatibilité | 🟡 | Catalyst 9115AXE / 9120AXE / 9130AXE, Aironet 2800/3800. |

**Conclusion** : bonne antenne pour **couvrir la zone d'évolution du robot** (quelques dizaines
de mètres, ordre de grandeur à mesurer). Inadaptée à une liaison point à point longue distance
(gain trop faible, rayonnement omnidirectionnel).

## 6. Équipements radio extérieurs nécessaires

Il faut **deux radios point à point extérieures** (une par site), fonctionnant en **pont
transparent couche 2**, avec antennes directives.

Critères de sélection :
- certifiées CE, **firmware européen** avec DFS/TPC actifs sur 5470–5725 MHz ;
- PIRE réglable et **plafonnée à 1 W (30 dBm)** gain d'antenne inclus ;
- mode bridge transparent (L2), support VLAN, MTU ≥ 1500 ;
- gestion sécurisée (HTTPS/SSH, SNMPv3), chiffrement de la liaison (AES / WPA2 minimum) ;
- indice IP ≥ IP65/IP67, alimentation PoE ;
- débit utile visé ≥ 30 Mbit/s agrégés (marge confortable sur l'hypothèse de 10 Mbit/s).

Pistes :
- **Cisco Catalyst IW9167E / IW9165E** (industriels) : la fiche Cisco indique des modes Wi-Fi 6,
  WGB et **URWB** (Ultra-Reliable Wireless Backhaul), ce dernier supportant point à point,
  point-multipoint, mesh et mobilité ✅. Nécessite antennes directives externes compatibles,
  licences URWB et vérification du jeu de canaux/puissances pour la France (Cisco publie un
  tableau « channels and maximum power » par version). Coût élevé.
- **Radios PtP 5 GHz grand public/pro** (marques courantes du marché WISP) : moins coûteuses,
  à condition d'utiliser un firmware CE et de respecter la PIRE. À choisir après validation.

Aucune référence n'est imposée ici : la liste chiffrée sera établie à l'étape 2 après votre
choix de budget.

## 7. Réglementation en France

Références : décision **Arcep n° 2022-1960** (transposition du cadre européen RLAN), fiches
**ANFR** RLAN 5 GHz, **TNRBF**. À relire dans leur version en vigueur avant installation
(une consultation Arcep de 2025 portait sur une modification de la décision 2022-1960, issue non
vérifiée).

| Bande | Usage | PIRE max | Conditions | Statut |
|---|---|---|---|---|
| 2400–2483,5 MHz | Intérieur et extérieur | 100 mW (20 dBm) | — | 🟡 valeur usuelle, confirmer pour la métropole dans la décision Arcep en vigueur |
| 5150–5250 MHz | **Intérieur** | 200 mW | — | 🟡 |
| 5250–5350 MHz | **Intérieur** | 200 mW (100 mW sans TPC) | DFS obligatoire | 🟡 |
| **5470–5725 MHz** | **Intérieur et extérieur** | **1 W avec TPC, 500 mW sans TPC** ; densité 50 mW/MHz (25 sans TPC) | **DFS obligatoire** | ✅ fiches ANFR / Arcep |
| 5725–5875 MHz | Pas une bande RLAN en France | — | Ne pas utiliser pour le Wi-Fi | 🟡 |
| 5945–6425 MHz | Intérieur (LPI), très basse puissance extérieure | — | Évolution réglementaire en cours | 🟡 |
| 57–71 GHz | Liaisons fixes extérieures possibles | Conditions spécifiques | Portée limitée par la pluie/oxygène | ❓ hors périmètre initial |

Points essentiels :
- La **PIRE inclut le gain d'antenne** : une antenne de 23 dBi n'autorise pas plus de puissance
  rayonnée ; elle améliore surtout la **réception** et la directivité. L'émetteur doit être
  réglé en conséquence (ex. 30 dBm − 23 dBi − pertes ≈ 7 dBm conduits).
- **DFS** : la radio peut changer de canal ou couper ~1 minute (CAC) en cas de détection radar.
  Le logiciel doit traiter ces coupures comme une perte de liaison (arrêt du robot).
- Installation sur toit / mât : respecter les règles de sécurité (travail en hauteur, protection
  foudre, mise à la terre) et, le cas échéant, l'autorisation du propriétaire.
- Le pilotage d'un robot dans un lieu ouvert au public relève de votre responsabilité ;
  prévoir un terrain privé ou autorisé pour les essais.

## 8. Faisabilité théorique de la portée (calcul, pas mesure)

Affaiblissement en espace libre : `FSPL(dB) = 20·log10(d_km) + 20·log10(f_MHz) + 32,44`.
Rayon de la 1ʳᵉ zone de Fresnel au milieu : `r(m) = 8,657·√(d_km / f_GHz)` ; dégager au moins
60 % de ce rayon.

| Distance | FSPL 2,44 GHz | FSPL 5,6 GHz | Fresnel 60 % (5,6 GHz) |
|---|---|---|---|
| 0,5 km | 94,2 dB | 101,4 dB | 1,6 m |
| 1 km | 100,2 dB | 107,4 dB | 2,2 m |
| 3 km | 109,7 dB | 116,9 dB | 3,8 m |
| 5 km | 114,2 dB | 121,4 dB | 4,9 m |

Bilans **théoriques** à 3 km, 5,6 GHz, PIRE plafonnée à 30 dBm, sans marge d'évanouissement :

| Configuration | Puissance reçue estimée | Lecture |
|---|---|---|
| C9120 + antennes omni 4 dBi des deux côtés (1–2 dB de pertes câble) | ≈ −85 dBm | Proche du seuil des modulations les plus robustes ; **pas de marge** (on vise 10–20 dB). Inexploitable pour de la vidéo fiable. |
| Radios PtP + antennes directives 23 dBi (1 dB de pertes) | ≈ −65 dBm | Marge confortable en théorie pour plusieurs dizaines de Mbit/s. |

Ces chiffres supposent une **visibilité directe dégagée** (dont la zone de Fresnel). Végétation,
bâtiments, relief, interférences et DFS peuvent les dégrader fortement. **Aucune distance n'est
garantie avant les essais du protocole progressif.**

## 9. Obstacles techniques identifiés

| # | Obstacle | Gravité | Piste |
|---|---|---|---|
| O1 | S1 sans SDK officiel → pas de commande ni de vidéo tierces officielles | ⛔ | Décision §10 |
| O2 | SDK DJI non maintenu depuis 2022, binaires anciens | Élevée | Isoler le SDK dans un module/processus dédié, Python version figée, tests de non-régression |
| O3 | C9120AXE-E non conçu pour le pont longue distance ni pour l'extérieur | ⛔ pour la portée | Radios PtP extérieures dédiées |
| O4 | Découverte du robot par broadcast | Moyenne | Pont L2 transparent + IP fixe (`ROBOT_IP_STR`) |
| O5 | WPA/WPA2-PSK uniquement côté robot | Moyenne | SSID dédié, VLAN isolé, clé forte, pas de route Internet |
| O6 | Portée Wi-Fi du robot autour du site distant limitée | Structurelle | Le robot évolue dans la cellule de l'AP local ; la portée km est celle du pont |
| O7 | DFS → coupures imprévisibles en 5 GHz | Moyenne | Safety Manager : arrêt sur perte, pas de reprise automatique |
| O8 | Latence cumulée (encodage vidéo + Wi-Fi + pont + décodage) | À mesurer | Mesures étape 4 ; commande à faible débit prioritaire |
| O9 | Alimentation du site robot (radio PoE + AP PoE + switch) | Moyenne | Batterie + injecteur PoE ; autonomie à calculer selon matériel retenu |
| O10 | Le S1 n'expose aucun arrêt d'urgence matériel distant | Sécurité | Arrêt logiciel ≠ arrêt d'urgence : opérateur sur site ou zone fermée pendant les essais |

## 10. Décision requise avant l'étape 5 (pilotage réel)

| Option | Description | Officiel | Remarques |
|---|---|---|---|
| **A** | Rester sur l'app DJI officielle en mode routeur à travers le pont ; notre logiciel ne fait que la **supervision réseau** (latence, pertes, débit, disponibilité). | ✅ | Pas de commande ni vidéo dans notre logiciel. Faisable et conforme. |
| **B** | Remplacer/compléter par un **RoboMaster EP / EP Core** (SDK officiel) | ✅ | Toutes les fonctions demandées deviennent implémentables sur base documentée. Coût matériel. |
| **C** | Débloquer le SDK du S1 par la méthode communautaire | ❌ | Non officiel, peut casser au moindre firmware, risque garantie. Le logiciel le signalerait comme « interface non officielle ». À votre seule initiative. |

**Recommandation** : architecture logicielle avec **adaptateur de robot abstrait** (simulateur +
adaptateur « RoboMaster SDK »), développée et testée sur le simulateur (étapes 3–4), puis
branchée sur un **EP** (option B) — ou sur un S1 débloqué si vous choisissez l'option C en
connaissance de cause. L'option A reste utilisable en parallèle pour valider la liaison radio.

### 10.1 Décision enregistrée — 2026-10-13 : **option A**

Le pilotage et la vidéo du robot restent assurés par l'**application officielle DJI
RoboMaster**, en mode « Connection via Router », à travers le pont radio. Notre logiciel
**n'envoie aucune commande au robot** et **n'affiche pas sa vidéo**.

Conséquences sur le périmètre :

| Module | Ce qui reste faisable avec l'option A |
|---|---|
| Dashboard | ✅ Entièrement : état de la liaison, des équipements, alertes, historique. L'« état du robot » se limite à sa **joignabilité réseau** (ping, présence ARP/DHCP) : aucune télémétrie interne. |
| Network Monitor | ✅ Entièrement (cœur du logiciel avec l'option A). |
| Video Manager | 🟡 Pas d'affichage. Possible : **mesure passive** du débit échangé entre le robot et l'appareil où tourne l'app (compteurs SNMP du switch/AP ou capture locale) → débit, interruptions, temps de reprise. Les images perdues et le délai d'affichage ne sont **pas** mesurables. |
| Robot Controller | ⛔ Pas d'adaptateur réel. Seul le **simulateur** existe, pour développer et tester l'interface sans matériel. L'interface `RobotAdapter` est conservée pour pouvoir passer plus tard aux options B ou C. |
| Safety Manager | 🟡 Ne peut **pas arrêter le robot réel**. Rôle : détecter la perte de liaison, alerter l'opérateur (son, bandeau), journaliser. Le comportement du robot sur perte de liaison est celui du firmware DJI (❓ à observer et documenter lors des essais). |

Étape 5 (pilotage réel) : **non applicable** tant que l'option A est retenue.

## 11. Sources

Officielles :
- DJI — FAQ RoboMaster S1 : <https://www.dji.com/robomaster-s1/faq>
- DJI — RoboMaster Developer Guide (intro, Plaintext SDK, connexion) :
  <https://robomaster-dev.readthedocs.io/en/latest/introduction.html>,
  <https://robomaster-dev.readthedocs.io/en/latest/text_sdk/connection.html>,
  <https://robomaster-dev.readthedocs.io/en/latest/python_sdk/connection.html>
- DJI — code source SDK : <https://github.com/dji-sdk/RoboMaster-SDK> (inspecté localement, dernier commit 2022-11-10)
- Cisco — fiche Catalyst 9120AX : <https://www.cisco.com/c/en/us/products/collateral/wireless/catalyst-9120ax-access-points/datasheet-c78-742115.html> (non accessible depuis l'environnement d'audit : **à relire**)
- Cisco — Catalyst IW9167E : <https://www.cisco.com/c/en/us/products/collateral/wireless/catalyst-iw9167-series/cat-iw9167e-heavy-duty-ap-ds.html>, <https://www.cisco.com/c/en/us/products/collateral/wireless/catalyst-iw9167-series/cat-iw9167e-heavy-duty-ap-aag.html>
- Cisco — Mesh APs on Catalyst 9800 : <https://www.cisco.com/c/en/us/support/docs/wireless-mobility/wireless-mesh/223112-configure-mesh-aps-for-local-data.html>
- ANFR — fiche RLAN 5 GHz : <https://www.anfr.fr/fileadmin/mediatheque/documents/controle/20171127ANFR_-_ficheRLAN_5GHz.pdf>
- Arcep — consultation 2025 sur la décision 2022-1960 : <https://www.arcep.fr/uploads/tx_gspublication/consultation-transposition-decision-UE-2022-2307-Wifi-5-GHz_sept2025.pdf>

Secondaires (non officielles, utilisées seulement pour les marqueurs 🟡) :
- Cisco Community — mesh sur 9120AX : <https://community.cisco.com/t5/wireless/can-cisco-catalyst-9120ax-ap-support-mesh-mode/td-p/4846621>, <https://community.cisco.com/t5/wireless/can-the-c9120axi-b-be-configured-as-a-rap/td-p/4860990>
- Fiches revendeurs AIR-ANT2544V4M-RS (ex. <https://virtu.net/?p=40301>)
- Activation SDK sur S1 (communauté) : <https://github-wiki-see.page/m/HU-ICT-LAB/RobotWars/wiki/Enabeling-the-API-on-S1>, <https://github.com/JacopoPan/a-minimalist-guide/blob/master/Part7-Heterogeneous-Multirobot-Teams-with-the-RoboMaster-SDK.md>

## 12. Vérifications à faire sur le matériel réel (checklist)

- [ ] Référence exacte de l'AP (`show version`) : C9120AXE-E ou C9120AXE-EWC-E, version IOS-XE.
- [ ] Matrice de fonctionnalités Cisco : modes Bridge/Mesh/WGB disponibles pour 9120 dans cette version.
- [ ] Fiche officielle AIR-ANT2544V4M-RS : gain, polarisation, montage.
- [ ] Firmware du S1 et version de l'app.
- [ ] S1 en mode routeur sur un SSID WPA2-PSK 2,4 GHz servi par le C9120 : connexion OK ? IP attribuée ?
- [ ] Même test en 5 GHz (canal UNII-1, intérieur).
- [ ] App DJI en mode routeur depuis un poste sur le même LAN : vidéo et commandes OK ?
- [ ] Capture réseau (Wireshark) côté PC : ports utilisés par l'app, débit vidéo réel.
