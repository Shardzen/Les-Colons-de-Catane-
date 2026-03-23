import { GameState, Tile, TerrainType, PlayerColor } from "./types.js";
import { EmbedBuilder } from "discord.js";

// ============================================================
// MAPPINGS EMOJI → TYPES DE DONNÉES
// ============================================================

// Associe chaque type de terrain à son emoji représentatif
const TERRAIN_EMOJI: Record<TerrainType, string> = {
  WOOD:   "🌲", // Forêt
  BRICK:  "🧱", // Argile
  SHEEP:  "🐑", // Pâturage
  WHEAT:  "🌾", // Champs
  ORE:    "⛰️", // Montagne
  DESERT: "🏜️"  // Désert (pas de ressource)
};

// Associe chaque couleur de joueur à son emoji de pion coloré
const COLOR_EMOJI: Record<PlayerColor, string> = {
  RED:    "🔴",
  BLUE:   "🔵",
  WHITE:  "⚪",
  ORANGE: "🟠"
};

// Associe chaque valeur de dé possible (2–12, sans 7) à un emoji chiffre
const NUMBER_EMOJI: Record<number, string> = {
  2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣",
  6: "6️⃣", 8: "8️⃣", 9: "9️⃣", 10: "🔟",
  11: "⑪", 12: "⑫"
};

// Associe chaque phase de jeu à un label lisible en français avec emoji
const PHASE_LABEL: Record<string, string> = {
  SETUP_1:     "📍 Placement initial (tour 1)",  // Premier tour de placement des villages
  SETUP_2:     "📍 Placement initial (tour 2)",  // Deuxième tour de placement (ordre inversé)
  ROLLING:     "🎲 En attente du lancer de dés", // Le joueur courant doit lancer les dés
  TRADING:     "🤝 Phase d'échange & construction", // Échanges et construction après le lancer
  ROBBER_MOVE: "🦹 Déplacement du voleur",       // Le joueur doit déplacer le voleur (après un 7)
  DISCARDING:  "🗑️ Défausse des ressources"      // Les joueurs avec trop de cartes doivent défausser
};

// ============================================================
// RENDU DU PLATEAU EN EMOJIS
// ============================================================

/**
 * Génère une représentation textuelle du plateau sous forme d'emojis,
 * rangée par rangée, en respectant la grille hexagonale (coordonnées axiales q/r).
 * Le voleur remplace l'emoji du terrain sur la tuile où il se trouve.
 */
export function renderBoardEmoji(state: GameState): string {
  // Regroupe les tuiles par ligne (coordonnée r)
  const rows: Map<number, Tile[]> = new Map();

  for (const tile of state.board.tiles) {
    const row = tile.coord.r;
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row)!.push(tile);
  }

  // Trie les rangées de haut en bas (r croissant)
  const sortedRows = [...rows.entries()].sort(([a], [b]) => a - b);

  const lines: string[] = [];
  for (const [, tiles] of sortedRows) {
    // Trie les tuiles de gauche à droite (q croissant) dans chaque rangée
    const sorted = tiles.sort((a, b) => a.coord.q - b.coord.q);

    // Construit la ligne : affiche 🦹 si le voleur est sur cette tuile, sinon l'emoji du terrain
    const line = sorted.map(tile => {
      const emoji = TERRAIN_EMOJI[tile.terrain];
      const isRobber = state.board.robberPosition.q === tile.coord.q &&
                       state.board.robberPosition.r === tile.coord.r;
      return isRobber ? "🦹" : emoji;
    }).join("");

    lines.push(line);
  }

  // Assemble toutes les lignes en un seul bloc texte multiligne
  return lines.join("\n");
}

// ============================================================
// CONSTRUCTION DE L'EMBED DISCORD
// ============================================================

/**
 * Construit l'embed Discord complet représentant l'état courant de la partie :
 * plateau, phase de jeu, résultat des dés, et liste des joueurs avec leurs points.
 */
export function buildGameEmbed(state: GameState): EmbedBuilder {
  // Récupère le joueur dont c'est le tour à partir de l'index courant
  const currentPlayer = state.players[state.currentPlayerIndex];

  // Sécurité : si aucun joueur actif n'est trouvé, retourne un embed d'erreur
  if (!currentPlayer) {
    return new EmbedBuilder().setTitle("Erreur").setDescription("Aucun joueur actif.");
  }

  // Résout le libellé de la phase (utilise la clé brute en fallback si inconnue)
  const phase = PHASE_LABEL[state.phase] ?? state.phase;

  // Génère la représentation emoji du plateau
  const board = renderBoardEmoji(state);

  // Construit la liste des joueurs avec couleur, nom, points de victoire
  // et une flèche ◀ pour indiquer le joueur courant
  const playerList = state.players.map(p => {
    const color = COLOR_EMOJI[p.color];
    const isCurrent = p.id === currentPlayer.id ? " ◀" : "";
    return `${color} **${p.username}** — ${p.victoryPoints} PV${isCurrent}`;
  }).join("\n");

  // Formate le résultat des dés, ou indique qu'ils n'ont pas encore été lancés
  const diceText = state.dice
    ? `🎲 ${state.dice[0]} + ${state.dice[1]} = **${state.dice[0] + state.dice[1]}**`
    : "🎲 Pas encore lancés";

  // Assemble et retourne l'embed Discord final avec toutes les informations de la partie
  return new EmbedBuilder()
    .setTitle("🏝️ Les Colons de Catane")
    .setDescription(board)          // Plateau en emojis
    .addFields(
      { name: "Phase",    value: phase,       inline: true }, // Phase de jeu actuelle
      { name: "Dés",      value: diceText,    inline: true }, // Résultat du dernier lancer
      { name: "Joueurs",  value: playerList }                 // Classement et statut des joueurs
    )
    .setFooter({ text: `Partie #${state.gameId}` }) // Identifiant unique de la partie
    .setColor(0xE8A838); // Couleur dorée rappelant les ressources de Catane
}