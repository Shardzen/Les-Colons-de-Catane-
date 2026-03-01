/**
 * TYPES.TS - CORE ENGINE CONTRACT
 * Projet : Les Colons de Catane
 * Architecture : Clean Architecture / Domain Logic
 */

// --- 1. SYSTÈME DE RESSOURCES ---

export type ResourceType = \"WOOD\" | \"BRICK\" | \"SHEEP\" | \"WHEAT\" | \"ORE\";

/**
 * Représente la main d\\'un joueur ou un coût de construction.
 * Utilisation d\\'un Record pour faciliter l\\'accès : hand[\"WOOD\"]
 */
export type ResourceMap = Record<ResourceType, number>;

// --- 2. GÉOGRAPHIE DU PLATEAU ---

export type TerrainType = ResourceType | \"DESERT\";

/**
 * Coordonnées Axiales (q, r) pour les hexagones.
 * C\\'est le système le plus robuste pour les calculs de distance et de voisinage.
 */
export interface HexCoord {
  q: number;
  r: number;
}

/**
 * Jeton numérique (2 à 12). Le 7 est exclu de la production (Voleur).
 */
export type ProductionNumber = 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12;

export interface Tile {
  id: string;
  coord: HexCoord;
  terrain: TerrainType;
  numberToken?: ProductionNumber; // Le désert n\\'a pas de numéro
}

// --- 3. CONSTRUCTIONS & EMPLACEMENTS ---

export type PlayerColor = \"RED\" | \"BLUE\" | \"WHITE\" | \"ORANGE\";

export type ConstructionType = \"ROAD\" | \"SETTLEMENT\" | \"CITY\";

// --- 4. JOUEUR ---

export interface Player {
  id: string;
  username: string;
  color: PlayerColor;
  resources: ResourceMap;
  victoryPoints: number;
  // Stock restant pour respecter les règles de Catane (ex: 15 routes max)
  stock: {
    roads: number;
    settlements: number;
    cities: number;
  };
  // Cartes de développement possédées (simplifiées pour l\\'interface de base)
  devCards: {
    knights: number;
    victoryPoints: number;
    special: string[]; // Monopole, Invention, etc.
  };
}

// --- 5. ÉTAT GLOBAL DU JEU (SINGLE SOURCE OF TRUTH) ---

export type GamePhase = 
  | \"SETUP_1\"      // Placement initial 1
  | \"SETUP_2\"      // Placement initial 2 (ordre inverse)
  | \"ROLLING\"      // En attente du jet de dés
  | \"TRADING\"      // Phase d\\'échange et de construction
  | \"ROBBER_MOVE\"  // Le joueur doit déplacer le voleur (après un 7)
  | \"DISCARDING\";  // Les joueurs perdent la moitié de leurs ressources (>7)

export interface GameState {
  gameId: string;
  phase: GamePhase;
  currentPlayerIndex: number;
  players: Player[];
  board: {
    tiles: Tile[];
    robberPosition: HexCoord;
    // Les maps de constructions permettent une recherche rapide O(1)
    // Clé formatée : \"q,r,direction\"
    settlements: Map<string, { playerId: string; isCity: boolean }>;
    roads: Map<string, { playerId: string }>;
  };
  dice: [number, number] | null;
  winnerId: string | null;
}

// --- 6. RÉPONSES D\\'ACTION ---

/**
 * Format standardisé pour toute interaction avec le moteur.
 * Agnostique : peut être renvoyé via un WebSocket, une API ou une console.
 */
export interface ActionResponse {
  success: boolean;
  message?: string; // Utile pour logger l\\'action \"Joueur 1 a construit une route\"
  error?: {
    code: string;
    details: string;
  };
  state: GameState; // On renvoie toujours le nouvel état après une action
}

/**
 * Exemples de types d\\'actions (Input)
 */
export type GameAction = 
  | { type: \"ROLL_DICE\"; playerId: string }
  | { type: \"BUILD\"; playerId: string; buildType: ConstructionType; location: any }
  | { type: \"TRADE\"; playerId: string; offer: ResourceMap; demand: ResourceMap };
