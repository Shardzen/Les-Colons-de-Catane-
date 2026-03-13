export interface ScoreResult {
  total: number;
  details: {
    buildings: number;
    victoryCards: number;
    hasLongestRoad: boolean;
    hasLargestArmy: boolean;
  };
}
export function getPlayerScore(playerId: string, gameState: any): ScoreResult {
  const player = gameState.players.find((p: any) => p.id === playerId);
    const buildingPoints = gameState.board.buildings
    .filter((b: any) => b.ownerId === playerId)
    .reduce((acc: number, b: any) => acc + (b.type === 'CITY' ? 2 : 1), 0);

  const victoryCards = player.devCards.VICTORY_POINT || 0;
  const longestRoadPoints = player.hasLongestRoad ? 2 : 0;
  const largestArmyPoints = player.hasLargestArmy ? 2 : 0;

  return {
    total: buildingPoints + victoryCards + longestRoadPoints + largestArmyPoints,
    details: {
      buildings: buildingPoints,
      victoryCards,
      hasLongestRoad: player.hasLongestRoad,
      hasLargestArmy: player.hasLargestArmy
    }
  };
}