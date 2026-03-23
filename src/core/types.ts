

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


const enum PlayerColor {
  RED = 'RED',
  BLUE = 'BLUE',
  WHITE = 'WHITE',
  ORANGE = 'ORANGE'
}

export type ConstructionType = "ROAD" | "SETTLEMENT" | "CITY";

export type DevCard =
  | {
      type: "knight";
      knights: Knight[]; // Création type Knight avec tableau
      played: boolean;
      turn: number;
    }
  | {
      type: "victory";
      victoryPoints: number; // 1 à 10
      played: boolean;
      turn: number;
    }
  | {
      type: "progress";
      effect: ProgressEffect[];
      played: boolean;
      turn: number;
    };

export type Knight = {
    level: 1 | 2 | 3; // 2 chevaliers de type =/
    active: boolean; // Affiche si on peut l'utiliser ou pas
};

export type ProgressEffect =
  | { type: "roadBuilding" } // Construire routes
  | { type: "yearOfPlenty" } // Choisir 2 ressources dans le jeu
  | { type: "monopoly" }; // Monopole : joueur annonce un type de ressource et autres joueurs lui donnent

// --- 4. JOUEUR ---

export type Player = {
  id: string;
  username: string;
  color: PlayerColor;
  resources: {
    WOOD: number,
    BRICK: number,
    SHEEP: number,
    WHEAT: number,
    ORE: number,
  },
  victoryPoints: number;
  stock: {
    roads: number;
    settlements: number;
    cities: number;
  };
  devCards: DevCard[];
};



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
