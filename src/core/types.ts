/**
 * TYPES.TS - CORE ENGINE CONTRACT
 * Projet : Les Colons de Catane
 * Architecture : Clean Architecture / Domain Logic
 */

// --- 1. SYST�ME DE RESSOURCES ---

export type ResourceType = "WOOD" | "BRICK" | "SHEEP" | "WHEAT" | "ORE";

/**
 * Repr�sente la main d\\'un joueur ou un co�t de construction.
 * Utilisation d\\'un Record pour faciliter l\\'acc�s : hand[\"WOOD\"]
 */
export type ResourceMap = Record<ResourceType, number>;

// --- 2. G�OGRAPHIE DU PLATEAU ---

export type TerrainType = ResourceType | "DESERT";

/**
 * Coordonn�es Axiales (q, r) pour les hexagones.
 * C\\'est le syst�me le plus robuste pour les calculs de distance et de voisinage.
 */
export interface HexCoord {
  q: number;
  r: number;
}

/**
 * Jeton num�rique (2 � 12). Le 7 est exclu de la production (Voleur).
 */
export type ProductionNumber = 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12;

export interface Tile {
  id: string;
  coord: HexCoord;
  terrain: TerrainType;
  numberToken?: ProductionNumber; // Le d�sert n\\'a pas de num�ro
}

// --- 3. CONSTRUCTIONS & EMPLACEMENTS ---

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
      knights: Knight[];
      played: boolean;
      turn: number;
    }
  | {
      type: "victory";
      victoryPoints: number;
      played: boolean;
      turn: number;
    }
  | {
      type: "progress";
      effect: ProgressEffect;
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
  | { type: "monopoly" }; // Monopole : joueur annonce un type de ressource et autres joueur lui donnent

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
  // Stock restant pour respecter les r�gles de Catane (ex: 15 routes max)
  stock: {
    roads: number;
    settlements: number;
    cities: number;
  };
  // Cartes de d�veloppement poss�d�es (simplifi�es pour l\\'interface de base)
  devCards: DevCard[];
};


// --- 5. �TAT GLOBAL DU JEU (SINGLE SOURCE OF TRUTH) ---

export type GamePhase = 
  | "SETUP_1"      // Placement initial 1
  | "SETUP_2"      // Placement initial 2 (ordre inverse)
  | "ROLLING"      // En attente du jet de d�s
  | "TRADING"      // Phase d\\'�change et de construction
  | "ROBBER_MOVE"  // Le joueur doit d�placer le voleur (apr�s un 7)
  | "DISCARDING";  // Les joueurs perdent la moiti� de leurs ressources (>7)

export interface GameState {
  gameId: string;
  phase: GamePhase;
  currentPlayerIndex: number;
  players: Player[];
  board: {
    hexes(hexes: any): unknown;
    tiles: Tile[];
    robberPosition: HexCoord;
    // Les maps de constructions permettent une recherche rapide O(1)
    // Cl� format�e : \"q,r,direction\"
    settlements: Map<string, { playerId: string; isCity: boolean }>;
    roads: Map<string, { playerId: string }>;
  };
  dice: [number, number] | null;
  winnerId: string | null;
}

// --- 6. R�PONSES D\\'ACTION ---

/**
 * Format standardis� pour toute interaction avec le moteur.
 * Agnostique : peut �tre renvoy� via un WebSocket, une API ou une console.
 */
export interface ActionResponse {
  success: boolean;
  message?: string; // Utile pour logger l\\'action \"Joueur 1 a construit une route\"
  error?: {
    code: string;
    details: string;
  };
  state: GameState; // On renvoie toujours le nouvel �tat apr�s une action
}


export class HexCoord {
  constructor(
    public q: number,
    public r: number
  ) {}
}

/**
 * Exemples de types d\\'actions (Input)
 */
export type GameAction = 
  | { type: "ROLL_DICE"; playerId: string }
  | { type: "BUILD"; playerId: string; buildType: ConstructionType; location: any }
  | { type: "TRADE"; playerId: string; offer: ResourceMap; demand: ResourceMap };
