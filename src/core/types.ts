

export type ResourceType = "WOOD" | "BRICK" | "SHEEP" | "WHEAT" | "ORE";


export type ResourceMap = Record<ResourceType, number>;


export type TerrainType = ResourceType | "DESERT";


export interface HexCoord {
  q: number;
  r: number;
}


export type ProductionNumber = 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12;

export interface Tile {
  id: string;
  coord: HexCoord;
  terrain: TerrainType;
  numberToken?: ProductionNumber; 
}


export type PlayerColor = "RED" | "BLUE" | "WHITE" | "ORANGE";

export type ConstructionType = "ROAD" | "SETTLEMENT" | "CITY";


export interface Player {
  id: string;
  username: string;
  color: PlayerColor;
  resources: ResourceMap;
  victoryPoints: number;
  stock: {
    roads: number;
    settlements: number;
    cities: number;
  };
  devCards: {
    knights: number;
    victoryPoints: number;
    special: string[]; 
  };
}


export type GamePhase = 
  | "SETUP_1"   
  | "SETUP_2"    
  | "ROLLING"      
  | "TRADING"      
  | "ROBBER_MOVE"  
  | "DISCARDING"; 

export interface GameState {
  gameId: string;
  phase: GamePhase;
  currentPlayerIndex: number;
  players: Player[];
  board: {
    hexes(hexes: any): unknown;
    tiles: Tile[];
    robberPosition: HexCoord;
    settlements: Map<string, { playerId: string; isCity: boolean }>;
    roads: Map<string, { playerId: string }>;
  };
  dice: [number, number] | null;
  winnerId: string | null;
}


export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: {
    code: string;
    details: string;
  };
  state: GameState;
}


export class HexCoord {
  constructor(
    public q: number,
    public r: number
  ) {}
}


export type GameAction = 
  | { type: "ROLL_DICE"; playerId: string }
  | { type: "BUILD"; playerId: string; buildType: ConstructionType; location: any }
  | { type: "TRADE"; playerId: string; offer: ResourceMap; demand: ResourceMap };
