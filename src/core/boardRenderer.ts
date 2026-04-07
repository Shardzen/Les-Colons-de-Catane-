import { GameState, Hex, ResourceType, PlayerColor } from './types.js';
import { EmbedBuilder } from 'discord.js';

const TERRAIN_EMOJI: Record<string, string> = {
  [ResourceType.WOOD]: '🌲',
  [ResourceType.BRICK]: '🧱',
  [ResourceType.SHEEP]: '🐑',
  [ResourceType.WHEAT]: '🌾',
  [ResourceType.ORE]: '⛰️',
  [ResourceType.DESERT]: '🌵'
};

const COLOR_EMOJI: Record<string, string> = {
  [PlayerColor.RED]: '🔴',
  [PlayerColor.BLUE]: '🔵',
  [PlayerColor.WHITE]: '⚪',
  [PlayerColor.ORANGE]: '🟠'
};

const PHASE_LABEL: Record<string, string> = {
  SETUP_1: '📍 Placement (1)',
  SETUP_2: '📍 Placement (2)',
  PLAYING: '🎮 Jeu en cours',
  ROBBER_MOVE: '😈 Déplacement Voleur',
  DISCARDING: '🗑️ Défausse'
};

export function renderBoardEmoji(hexes: Hex[]): string {
  const rows = new Map<number, Hex[]>();
  for (const h of hexes) {
    if (!rows.has(h.r)) rows.set(h.r, []);
    rows.get(h.r)!.push(h);
  }
  const sortedRows = [...rows.entries()].sort(([a], [b]) => a - b);
  const lines = [];
  for (const [, tiles] of sortedRows) {
    const sorted = tiles.sort((a, b) => a.q - b.q);
    const line = sorted.map(t => t.hasRobber ? '😈' : TERRAIN_EMOJI[t.resource]).join('');
    lines.push(line);
  }
  return lines.join('\n');
}

export function buildGameEmbed(state: GameState): EmbedBuilder {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) return new EmbedBuilder().setTitle('Erreur');
  const phase = PHASE_LABEL[state.phase] ?? state.phase;
  const board = renderBoardEmoji(state.board.hexes);
  const playerList = state.players.map(p => (COLOR_EMOJI[p.color] || '⬛') + ' **' + p.username + '** — ' + p.victoryPoints + ' PV' + (p.id === currentPlayer.id ? ' ◀️' : '')).join('\n');
  const diceText = state.dice ? '🎲 ' + state.dice[0] + ' + ' + state.dice[1] + ' = **' + (state.dice[0] + state.dice[1]) + '**' : '🎲 -';

  return new EmbedBuilder()
    .setTitle('🏗️ Les Colons de Catane')
    .setDescription(board)
    .addFields(
      { name: 'Phase', value: phase, inline: true },
      { name: 'Dés', value: diceText, inline: true },
      { name: 'Joueurs', value: playerList }
    )
    .setColor(0xE8A838);
}