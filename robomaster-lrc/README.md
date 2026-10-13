# RoboMaster Long Range Control System

Supervision et pilotage à distance d'un DJI RoboMaster via une liaison radio IP longue distance.

> **Statut : étape 1/6 terminée (audit). Aucune fonction n'est opérationnelle.**
> Aucun code de pilotage, de vidéo ou de supervision n'existe encore. Rien n'a été testé sur
> matériel réel.

## Documents

| Document | Contenu |
|---|---|
| [`AUDIT.md`](AUDIT.md) | Audit technique : interfaces DJI, Cisco C9120AXE-E, antenne, radios extérieures, réglementation française, obstacles, décision requise |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Diagramme réseau, description des liaisons, adressage, flux, architecture logicielle proposée |

## Conclusions principales

1. Le **RoboMaster S1 n'a pas de SDK officiel** (le SDK DJI vise l'EP). Le pilotage et la vidéo
   dans un logiciel tiers ne sont possibles officiellement qu'avec un **EP / EP Core**, ou de façon
   non officielle avec un S1 débloqué.
2. Le **C9120AXE-E** et son antenne omni conviennent comme **point d'accès local du robot**,
   pas comme liaison de plusieurs kilomètres.
3. La portée kilométrique nécessite **deux radios point à point extérieures** (5470–5725 MHz,
   PIRE ≤ 1 W avec TPC, DFS) avec antennes directives, en visibilité directe. Aucune distance
   n'est garantie avant essais.

## Feuille de route

| Étape | Contenu | État |
|---|---|---|
| 1 | Audit matériel et interfaces DJI | ✅ Rédigé (en attente de validation) |
| 2 | Architecture réseau réaliste + liste matériel | 🟡 Proposition dans `ARCHITECTURE.md` |
| 3 | Interface + simulateur | ⏳ |
| 4 | Supervision réseau + gestionnaire vidéo | ⏳ |
| 5 | Pilotage réel (si interface confirmée) | ⛔ bloqué par la décision AUDIT §10 |
| 6 | Tests et résultats | ⏳ |
