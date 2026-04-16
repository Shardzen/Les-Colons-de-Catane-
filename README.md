<div align="center">

```
 ██████╗ █████╗ ████████╗ █████╗ ███╗   ██╗
██╔════╝██╔══██╗╚══██╔══╝██╔══██╗████╗  ██║
██║     ███████║   ██║   ███████║██╔██╗ ██║
██║     ██╔══██║   ██║   ██╔══██║██║╚██╗██║
╚██████╗██║  ██║   ██║   ██║  ██║██║ ╚████║
 ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝
```

# 🏝️ Les Colons de Catane — Discord Bot

**Jouez aux Colons de Catane directement dans votre serveur Discord.**  
Sans quitter le chat. Sans application tierce. Règles officielles complètes.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-green?style=flat-square)](LICENSE)

</div>

---

## 📖 Présentation

Un bot Discord qui implémente les **règles officielles des Colons de Catane** en intégralité. Le plateau est généré aléatoirement et rendu en temps réel sous forme d'image. Chaque joueur reçoit ses actions en **message privé** — personne ne peut jouer à la place d'un autre.

- 🗺️ Plateau rendu dynamiquement en PNG via canvas
- 🔒 Actions isolées par joueur (messages privés)
- 📜 Règles envoyées automatiquement à chaque joueur au lancement
- ⚡ Aucune base de données requise pour jouer

---

## ✨ Fonctionnalités

### Règles officielles complètes

| Mécanique | Statut |
|---|---|
| Phase de fondation — snake draft (tour 1 puis sens inverse) | ✅ |
| Ressources initiales issues de la 2ème colonie | ✅ |
| Production de ressources par les dés (colonies = 1, villes = 2) | ✅ |
| Commerce avec la banque (4:1 / 3:1 port générique / 2:1 port spécifique) | ✅ |
| Commerce entre joueurs — multi-ressources libres | ✅ |
| Offres d'échange expirées automatiquement en fin de tour | ✅ |
| Voleur sur le 7 + déplacement + vol d'une ressource | ✅ |
| Défausse obligatoire (moitié arrondie à l'inférieur) si > 7 cartes | ✅ |
| Cartes de développement — Chevalier, Monopole, Abondance, Routes, PV | ✅ |
| Carte dev jouable avant ou après le lancer de dés | ✅ |
| Armée la Plus Puissante (3 chevaliers min., strictement plus pour reprendre) | ✅ |
| Route la Plus Longue (5 routes consécutives min.) | ✅ |
| Égalité après interruption de route → carte mise de côté | ✅ |
| Cartes Point de Victoire cachées, révélées uniquement à la victoire | ✅ |
| Limite de stock (15 routes, 5 colonies, 4 villes par joueur) | ✅ |
| 9 ports affichés sur le plateau (4× 3:1 + 5× 2:1 spécifiques) | ✅ |
| Victoire à 10 PV | ✅ |

### Interface Discord

- Plateau mis à jour en temps réel dans un salon dédié
- Embed de tour enrichi : ressources, PV, classement en direct
- Sélection visuelle des emplacements (labels A, B, C… sur la carte)
- Menu cartes dev accessible avant **et** après le lancer de dés
- `/cards` : ressources + détail complet des cartes de développement + PV réels
- `/rules` : règles complètes en pages paginées

---

## 🚀 Installation

### Prérequis

- [Node.js](https://nodejs.org/) 18 ou supérieur
- Un bot Discord créé sur le [Developer Portal](https://discord.com/developers/applications)

### 1. Cloner le projet

```bash
git clone https://github.com/Shardzen/Les-Colons-de-Catane-.git
cd Les-Colons-de-Catane-
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

Créez un fichier `.env` à la racine :

```env
DISCORD_TOKEN=votre_token_bot
CLIENT_ID=votre_client_id

# IDs des salons Discord
CHANNEL_PLATEAU=id_du_salon_plateau
CHANNEL_JOURNAL=id_du_salon_journal
CHANNEL_COMMERCE=id_du_salon_commerce
```

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Token du bot (Developer Portal → Bot → Token) |
| `CLIENT_ID` | ID de l'application (Developer Portal → General Information) |
| `CHANNEL_PLATEAU` | Salon où le plateau est affiché et mis à jour en temps réel |
| `CHANNEL_JOURNAL` | Salon de log des actions (dés, constructions, vols…) |
| `CHANNEL_COMMERCE` | Salon où les propositions d'échange entre joueurs apparaissent |

### 4. Déployer les commandes slash

```bash
npx tsx src/discord/commands/deploy-commands.ts
```

> Cette étape est nécessaire une seule fois, ou après ajout d'une nouvelle commande.

### 5. Lancer le bot

```bash
# Développement — rechargement automatique
npm run dev

# Production
npm run build && npm start
```

---

## 🎮 Comment jouer

### Démarrer une partie

```
/start   →  Crée un lobby (le créateur est le premier joueur)
/join    →  Rejoindre le lobby (2 à 4 joueurs)
/begin   →  Lancer la partie quand tout le monde est prêt
```

### Pendant la partie

```
/cards   →  Voir tes ressources, PV et cartes de développement (privé, visible uniquement par toi)
/rules   →  Revoir les règles complètes à tout moment
```

> Toutes les actions de jeu se font via les **boutons et menus** reçus en message privé.

### Déroulement d'un tour

```
1. 🎲  Lancer les dés      →  ressources distribuées à tous les joueurs
2. 🤝  Commerce            →  optionnel (banque ou autres joueurs)
3. 🏗️  Construire / Acheter →  colonies, routes, villes, cartes dev
4. ⭐  Fin de tour
```

> Une carte de développement peut être jouée à **n'importe quel moment** du tour, y compris avant de lancer les dés.

---

## 🃏 Cartes de Développement

| Carte | Effet |
|---|---|
| ⚔️ **Chevalier** | Déplace le voleur sur une autre case + vole 1 ressource à un joueur adjacent |
| 🎯 **Monopole** | Désigne une ressource — tous les joueurs te remettent toutes leurs cartes de ce type |
| 🎁 **Abondance** | Prends 2 ressources de ton choix directement dans la banque |
| 🛣️ **Construction de Routes** | Pose 2 routes gratuitement (sans ressources) |
| ⭐ **Point de Victoire** | +1 PV caché, révélé uniquement au moment où tu atteins 10 PV |

> **Règles importantes :**
> - Une seule carte dev peut être jouée par tour.
> - Une carte achetée ce tour ne peut pas être jouée immédiatement.
> - Les cartes Point de Victoire ne sont jamais révélées aux adversaires avant la victoire.

---

## 🏗️ Coûts de Construction

| Bâtiment | Ressources nécessaires | Points de Victoire |
|---|---|---|
| 🏠 Colonie | 🌲 Bois + 🧱 Argile + 🐑 Mouton + 🌾 Blé | +1 PV |
| 🛣️ Route | 🌲 Bois + 🧱 Argile | — |
| 🏙️ Ville *(remplace une colonie)* | ⛰️⛰️⛰️ Minerai + 🌾🌾 Blé | +1 PV supplémentaire |
| 🃏 Carte de Développement | ⛰️ Minerai + 🐑 Mouton + 🌾 Blé | — |

---

## 🏆 Comment gagner

Le premier joueur à atteindre **10 Points de Victoire** remporte la partie.

| Source | Points |
|---|---|
| Chaque colonie | 1 PV |
| Chaque ville | 2 PV |
| Route la Plus Longue (5 routes min.) | 2 PV |
| Armée la Plus Puissante (3 chevaliers min.) | 2 PV |
| Chaque carte Point de Victoire | 1 PV |

---

## 📁 Structure des Salons

Créez 3 salons dédiés dans votre serveur :

```
📁 Catane
 ├── 🗺️ plateau    →  Le plateau est affiché et mis à jour ici à chaque action
 ├── 📖 journal    →  Log de toutes les actions (dés, constructions, échanges…)
 └── 🤝 commerce   →  Les propositions d'échange entre joueurs apparaissent ici
```

---

## ⚙️ Stack Technique

| Technologie | Rôle |
|---|---|
| **TypeScript 5** | Langage principal, typage strict |
| **discord.js v14** | Slash commands, boutons, menus déroulants, embeds |
| **@napi-rs/canvas** | Rendu du plateau en image PNG |
| **dotenv** | Gestion des variables d'environnement |
| **tsx / nodemon** | Développement avec rechargement automatique |

### Architecture

```
src/
├── index.ts                   Point d'entrée — tous les handlers d'interactions Discord
├── CatanEngine.ts             Moteur de jeu (état, règles, validation, phases)
├── MapRenderer.ts             Rendu du plateau + carte interactive avec labels
├── core/
│   └── types.ts               Types TypeScript (Player, Hex, GamePhase, DevCardType…)
└── discord/
    └── commands/
        ├── deploy-commands.ts  Script de déploiement des slash commands
        └── rules.ts            Commande /rules avec embeds paginés
```

> Le moteur (`CatanEngine`) est **entièrement découplé** de Discord. Il gère l'état du jeu et retourne des résultats que `index.ts` traduit en interactions Discord. Le moteur peut être testé indépendamment.

---

## 🛡️ Permissions Discord Requises

Activez les permissions suivantes pour votre bot :

- `Send Messages`
- `Embed Links`
- `Attach Files`
- `Read Message History`
- `Use Slash Commands`

Et dans le [Developer Portal](https://discord.com/developers/applications) → Bot :
- ✅ **Message Content Intent** activé

---

## 📄 Licence

Ce projet est sous licence **ISC**.

Les règles des Colons de Catane sont la propriété de [Catan GmbH](https://www.catan.com/).  
Ce projet est un fan-made non officiel à but non commercial.

---

<div align="center">

Fait avec ☕ et beaucoup de 🎲

**[Signaler un bug](https://github.com/Shardzen/Les-Colons-de-Catane-/issues)** · **[Proposer une amélioration](https://github.com/Shardzen/Les-Colons-de-Catane-/issues)**

</div>
