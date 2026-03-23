export enum ResourceType {
  WOOD = "Bois",
  BRICK = "Argile",
  WOOL = "Laine",
  GRAIN = "Blé",
  ORE = "Minerai",
  DESERT = "Désert"
}

export enum BuildingType {
  SETTLEMENT = "Colonie",
  CITY = "Ville",
  ROAD = "Route"
}

export interface Player {
  id: string; 
  username: string;
  resources: Record<ResourceType, number>;
  victoryPoints: number;
  color: string;
  knightsPlayed: number;
  longestRoad: number;
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

export enum GameState {
  SETUP_1 = "SETUP_1", 
  SETUP_2 = "SETUP_2", 
  PLAYING = "PLAYING",
  DISCARDING = "DISCARDING",
  ROBBER_MOVE = "ROBBER_MOVE",
  ROBBER_STEAL = "ROBBER_STEAL",
  FINISHED = "FINISHED"
}