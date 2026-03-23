import { GameState, Tile, TerrainType, PlayerColor } from "./types.js";
import { EmbedBuilder } from "discord.js";


const TERRAIN_EMOJI: Record<TerrainType, string> = {
  WOOD:   "🌲",
  BRICK:  "🧱",
  SHEEP:  "🐑",
  WHEAT:  "🌾",
  ORE:    "⛰️",
  DESERT: "🏜️"
};

const COLOR_EMOJI: Record<PlayerColor, string> = {
  RED:    "🔴",
  BLUE:   "🔵",
  WHITE:  "⚪",
  ORANGE: "🟠"
};

const NUMBER_EMOJI: Record<number, string> = {
  2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣",
  6: "6️⃣", 8: "8️⃣", 9: "9️⃣", 10: "🔟",
  11: "⑪", 12: "⑫"
};

const PHASE_LABEL: Record<string, string> = {
  SETUP_1:     "📍 Placement initial (tour 1)",
  SETUP_2:     "📍 Placement initial (tour 2)",
  ROLLING:     "🎲 En attente du lancer de dés",
  TRADING:     "🤝 Phase d'échange & construction",
  ROBBER_MOVE: "🦹 Déplacement du voleur",
  DISCARDING:  "🗑️ Défausse des ressources"
};


export function renderBoardEmoji(state: GameState): string {
  const rows: Map<number, Tile[]> = new Map();

  for (const tile of state.board.tiles) {
    const row = tile.coord.r;
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row)!.push(tile);
  }

  const sortedRows = [...rows.entries()].sort(([a], [b]) => a - b);

  const lines: string[] = [];
  for (const [, tiles] of sortedRows) {
    const sorted = tiles.sort((a, b) => a.coord.q - b.coord.q);
    const line = sorted.map(tile => {
      const emoji = TERRAIN_EMOJI[tile.terrain];
      const isRobber = state.board.robberPosition.q === tile.coord.q &&
                       state.board.robberPosition.r === tile.coord.r;
      return isRobber ? "🦹" : emoji;
    }).join("");
    lines.push(line);
  }

  return lines.join("\n");
}


export function buildGameEmbed(state: GameState): EmbedBuilder {
  const currentPlayer = state.players[state.currentPlayerIndex];
if (!currentPlayer) {
  return new EmbedBuilder().setTitle("Erreur").setDescription("Aucun joueur actif.");
}
  const phase = PHASE_LABEL[state.phase] ?? state.phase;
  const board = renderBoardEmoji(state);

  const playerList = state.players.map(p => {
    const color = COLOR_EMOJI[p.color];
    const isCurrent = p.id === currentPlayer.id ? " ◀" : "";
    return `${color} **${p.username}** — ${p.victoryPoints} PV${isCurrent}`;
  }).join("\n");

  const diceText = state.dice
    ? `🎲 ${state.dice[0]} + ${state.dice[1]} = **${state.dice[0] + state.dice[1]}**`
    : "🎲 Pas encore lancés";

  return new EmbedBuilder()
    .setTitle("🏝️ Les Colons de Catane")
    .setDescription(board)
    .addFields(
      { name: "Phase", value: phase, inline: true },
      { name: "Dés", value: diceText, inline: true },
      { name: "Joueurs", value: playerList }
    )
    .setFooter({ text: `Partie #${state.gameId}` })
    .setColor(0xE8A838);
}