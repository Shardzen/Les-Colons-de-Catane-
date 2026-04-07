export enum ResourceType {
  WOOD = "WOOD",
  BRICK = "BRICK",
  SHEEP = "SHEEP",
  WHEAT = "WHEAT",
  ORE = "ORE",
  DESERT = "DESERT"
}

export enum BuildingType {
  SETTLEMENT = "SETTLEMENT",
  CITY = "CITY",
  ROAD = "ROAD"
}

export enum PlayerColor {
  RED = "RED",
  BLUE = "BLUE",
  WHITE = "WHITE",
  ORANGE = "ORANGE"
}

export enum DevCardType {
  KNIGHT = "KNIGHT",
  ROAD_BUILDING = "ROAD_BUILDING",
  YEAR_OF_PLENTY = "YEAR_OF_PLENTY",
  MONOPOLY = "MONOPOLY",
  VICTORY_POINT = "VICTORY_POINT"
}

export interface Player {
  id: string;
  username: string;
  resources: Record<ResourceType, number>;
  devCards: DevCardType[];
  playedDevCards: DevCardType[];
  victoryPoints: number;
  color: string;
  knightsPlayed: number;
  longestRoadLength: number;
  hasLongestRoad: boolean;
  hasLargestArmy: boolean;
  stock: {
    roads: number;
    settlements: number;
    cities: number;
  };
}

export interface Node {
  id: string;
  x: number;
  y: number;
  hexes: Hex[];
}

export interface Edge {
  id: string;
  node1Id: string;
  node2Id: string;
}

export interface Hex {
  id: string;
  q: number;
  r: number;
  x: number;
  y: number;
  resource: ResourceType;
  value: number;
  hasRobber: boolean;
}

export interface Building {
  playerId: string;
  type: BuildingType;
}

export enum GamePhase {
  SETUP_1 = "SETUP_1",
  SETUP_2 = "SETUP_2",
  PLAYING = "PLAYING",
  DISCARDING = "DISCARDING",
  ROBBER_MOVE = "ROBBER_MOVE",
  ROBBER_STEAL = "ROBBER_STEAL",
  FINISHED = "FINISHED"
}

export interface GameState {
  gameId: string;
  phase: GamePhase;
  currentPlayerIndex: number;
  players: Player[];
  board: {
    hexes: Hex[];
    tiles: Hex[];
    robberPosition: { q: number; r: number };
    settlements: Map<string, Building>;
    roads: Map<string, string>;
  };
  dice: [number, number] | null;
  winnerId: string | null;
}

