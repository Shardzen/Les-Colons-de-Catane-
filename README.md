# Les Colons de Catane

Bot Discord en TypeScript qui permet de jouer a une version de **Catan** directement depuis un serveur Discord, avec rendu du plateau en image et interactions via slash commands, boutons et menus deroulants.

## Apercu

Le projet gere :

- un lobby de 2 a 4 joueurs
- la generation aleatoire du plateau
- les phases de setup puis de jeu
- les constructions (colonie, route, ville)
- les lancers de des et la distribution des ressources
- le voleur, la defausse et le vol
- les echanges entre joueurs et avec la banque
- le rendu du plateau en PNG via `@napi-rs/canvas`

## Stack

- `TypeScript`
- `discord.js` v14
- `@napi-rs/canvas` pour dessiner le plateau
- `Prisma` avec `SQLite`

## Structure

```text
src/
  index.ts                 Point d'entree principal du bot
  CatanEngine.ts           Logique principale de partie
  MapRenderer.ts           Generation des images du plateau
  core/types.ts           Types, enums et phases du jeu
  discord/commands/       Definitions de commandes Discord
handlers/
  eventHandler.ts         Ancienne base d'event handler, non branchee au flux principal
prisma/
  schema.prisma           Schema de base de donnees SQLite
```

## Installation

```bash
npm install
```

## Configuration

Cree un fichier `.env` a la racine avec les variables suivantes :

```env
DISCORD_TOKEN=ton_token_bot
DISCORD_CLIENT_ID=ton_client_id
GUILD_ID=ton_guild_id
CHANNEL_PLATEAU=id_du_salon_plateau
CHANNEL_JOURNAL=id_du_salon_journal
CHANNEL_COMMERCE=id_du_salon_commerce
DATABASE_URL="file:./dev.db"
```

## Important

Le code principal utilise `DISCORD_TOKEN`, `CHANNEL_PLATEAU`, `CHANNEL_JOURNAL` et `CHANNEL_COMMERCE`.

Le script de deploiement des slash commands utilise `DISCORD_CLIENT_ID`.

Dans le `.env` actuellement visible dans le depot, la variable est nommee `CLIENT_ID`. Il faut donc soit :

- renommer `CLIENT_ID` en `DISCORD_CLIENT_ID`
- soit adapter `src/discord/commands/deploy-commands.ts`

## Lancer le projet

Mode developpement :

```bash
npm run dev
```

Build production :

```bash
npm run build
```

Execution du build :

```bash
npm start
```

## Flux de jeu

1. Un joueur lance `/start` pour ouvrir le lobby.
2. Les autres rejoignent avec `/join`.
3. Un joueur lance `/begin` pour demarrer la partie.
4. Le bot publie :
   - le plateau dans `CHANNEL_PLATEAU`
   - les logs dans `CHANNEL_JOURNAL`
   - les controles dans `CHANNEL_COMMERCE`
5. Les actions de tour se font avec les boutons et menus proposes par le bot.

## Commandes actuellement gerees dans `src/index.ts`

- `/start` : ouvre un lobby
- `/join` : rejoint le lobby
- `/begin` : lance la partie
- `/inventory` : affiche les ressources du joueur en prive

## Attention sur le deploiement des commandes

Le fichier [deploy-commands.ts](C:/Users/arthu/Documents/Les-Colons-de-Catane-/src/discord/commands/deploy-commands.ts) n'enregistre actuellement que :

- `/join`
- `/start`
- `/build`

Cela ne correspond pas totalement aux commandes effectivement gerees dans [src/index.ts](C:/Users/arthu/Documents/Les-Colons-de-Catane-/src/index.ts). Si tu veux un fonctionnement coherent, il faudra aligner le script de deploiement avec les commandes du bot principal.

## Base de donnees

Le schema Prisma contient les modeles :

- `Game`
- `Player`
- `Hex`
- `Construction`

Aujourd'hui, la logique principale de `src/index.ts` fonctionne surtout en memoire avec `CatanEngine`. Prisma semble present pour une future persistance ou une ancienne iteration du projet.

## Notes techniques

- Le plateau est genere aleatoirement a chaque nouvelle partie.
- Le rendu image est produit par `MapRenderer.renderMapToBuffer()`.
- La condition de victoire est fixee a `10` points.
- Le bot maintient une seule partie courante en memoire via `currentGame`.

## Limitations actuelles

- Une seule partie simultanee semble geree globalement par le process.
- Le systeme de commandes du dossier `src/discord/commands` et le point d'entree `src/index.ts` ne sont pas totalement harmonises.
- `handlers/eventHandler.ts` parait incomplet et n'est pas utilise par le point d'entree principal.
- Certaines fonctionnalites existent dans le moteur (`cartes developpement`, ports, plus longue route, plus grande armee) mais ne sont pas encore toutes exposees proprement cote interface.

## Pistes d'amelioration

- unifier les slash commands et leur deploiement
- ajouter un vrai systeme multi-parties par serveur ou par salon
- persister les parties avec Prisma
- ajouter des tests sur le moteur de jeu
- ajouter un `.env.example`
