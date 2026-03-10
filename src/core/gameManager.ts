/**
 * GAMEMANAGER.TS - CORE ENGINE LOGIC
 * Responsabilit� : Orchestrer les r�gles et valider les transitions d\\'�tat.
 */

import { 
  GameState, 
  GameAction, 
  GamePhase,
  ActionResponse, 
  Player, 
  Tile, 
  HexCoord, 
  ResourceType, 
  ProductionNumber,
  PlayerColor,
  TerrainType
} from "./types.js";

export class GameManager {
  private state: GameState;

  constructor(playerData: { id: string; username: string; color: PlayerColor }[]) {
    this.state = this.initializeGame(playerData);
  }

  /**
   * INITIALISATION : Cr�ation du plateau et des joueurs
   */
  private initializeGame(playerData: { id: string; username: string; color: PlayerColor }[]): GameState {
    const players: Player[] = playerData.map(p => ({
      id: p.id,
      username: p.username,
      color: p.color,
      resources: { WOOD: 0, BRICK: 0, SHEEP: 0, WHEAT: 0, ORE: 0 },
      victoryPoints: 0,
      stock: { roads: 15, settlements: 5, cities: 4 },
      devCards: { knights: 0, victoryPoints: 0, special: [] }
    }));


    // Calcul du premier �tat
    const initialState: GameState = {
    gameId: Math.random().toString(36).substring(7),
    phase: "SETUP_1" as GamePhase,
    currentPlayerIndex: 0,
    players,
    board: {
    tiles: [],
    robberPosition: { q: 0, r: 0 },
    hexes(hexes) {
    },
    settlements: new Map(),
    roads: new Map()
    },
   dice: null,
    winnerId: null
    };

    initialState.board.tiles = this.generateStandardBoard(initialState);
    return initialState;
  }

  
  
  public joinGame(channelId: string, player: { id: string; username: string; color: PlayerColor }): ActionResponse {
  if (this.state.players.find(p => p.id === player.id)) {
    return { success: false, state: this.state, error: { code: "ALREADY_JOINED", details: "Ce joueur a déjà rejoint la partie." } };
  }

  if (this.state.players.length >= 4) {
    return { success: false, state: this.state, error: { code: "GAME_FULL", details: "La partie est complète (4 joueurs max)." } };
  }

  const newPlayer: Player = {
    id: player.id,
    username: player.username,
    color: player.color,
    resources: { WOOD: 0, BRICK: 0, SHEEP: 0, WHEAT: 0, ORE: 0 },
    victoryPoints: 0,
    stock: { roads: 15, settlements: 5, cities: 4 },
    devCards: { knights: 0, victoryPoints: 0, special: [] }
  };

  this.state.players.push(newPlayer);
  return { success: true, state: this.state, message: `${player.username} a rejoint la partie.` };
}
  

      //Commande qui va créer une nouvelle partie ou en rejoindre une 
  public createGame(channelId: string, player: Player): ActionResponse {
  if (this.state.players.length > 0) {
    return { success: false, state: this.state, error: { code: "GAME_EXISTS", details: "Une partie existe déjà dans ce salon." } };
  }

  const newPlayer: Player = {
    id: player.id,
    username: player.username,
    color: player.color,
    resources: { WOOD: 0, BRICK: 0, SHEEP: 0, WHEAT: 0, ORE: 0 },
    victoryPoints: 0,
    stock: { roads: 15, settlements: 5, cities: 4 },
    devCards: { knights: 0, victoryPoints: 0, special: [] }
  };

  this.state.players.push(newPlayer);
  return { success: true, state: this.state, message: `${player.username} a créé une nouvelle partie.` };
}
  
  
  /**
   * POINT D\\'ENTR�E UNIQUE : Toute action passe par ici
   */
  public execute(action: GameAction): ActionResponse {
    try {
      const currentPlayer = this.state.players[this.state.currentPlayerIndex];
      if (!currentPlayer) {
  return { success: false, state: this.state, error: { code: "NO_PLAYER", details: "Aucun joueur actif." } };
                        }
      if (action.playerId !== currentPlayer.id) {
        throw new Error("Ce n'est pas votre tour.");
      }

      switch (action.type) {
        case "ROLL_DICE":
          return this.handleRollDice();
        case "BUILD":
          // Logique de construction simplifi�e pour Rayan
          return { success: true, state: this.state, message: "Construction valid�e (Mock)" };
        case "TRADE":
          return { success: true, state: this.state, message: "�change valid� (Mock)" };
        default:
          return { success: false, state: this.state, error: { code: "UNKNOWN_ACTION", details: "Action non reconnue" } };
      }
    } catch (e: any) {
      return {
        success: false,
        state: this.state,
        error: { code: "RULE_VIOLATION", details: e.message }
      };
    }
  }

  private handleRollDice(): ActionResponse {
    if (this.state.phase !== "ROLLING") {
      throw new Error("Vous ne pouvez pas lancer les d�s maintenant.");
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;

    this.state.dice = [d1, d2];

    if (total === 7) {
      this.state.phase = "ROBBER_MOVE";
    } else {
      this.distributeResources(total);
      this.state.phase = "TRADING";
    }

    return { success: true, state: this.state, message: `R�sultat du d� : ${total}` };
  }

  private distributeResources(roll: number) {
    // Logique de distribution spatiale (prochaine �tape)
  }

  private generateStandardBoard(state: GameState): Tile[] {
    const terrains: TerrainType[] = [
      "DESERT", 
      "WOOD", "WOOD", "WOOD", "WOOD",
      "SHEEP", "SHEEP", "SHEEP", "SHEEP",
      "WHEAT", "WHEAT", "WHEAT", "WHEAT",
      "BRICK", "BRICK", "BRICK",
      "ORE", "ORE", "ORE"
    ];
    
    const numbers: ProductionNumber[] = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
    const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);
    
    shuffle(terrains);
    shuffle(numbers);

    const tiles: Tile[] = [];
    let numIdx = 0;

    // Coordonn�es axiales standard de Catane
    const coords: HexCoord[] = [];
    for (let q = -2; q <= 2; q++) {
      for (let r = Math.max(-2, -q - 2); r <= Math.min(2, -q + 2); r++) {
        coords.push({ q, r });
      }
    }

   coords.forEach((coord, i) => {
  const terrain = (terrains[i] ?? "DESERT") as TerrainType;
  const hasNumber = terrain !== "DESERT";
  const numberToken = hasNumber ? numbers[numIdx++] as ProductionNumber : undefined;
  
  const tile: Tile = {
    id: `tile_${i}`,
    coord,
    terrain,
    ...(numberToken !== undefined && { numberToken })
  };

  tiles.push(tile);
  if (terrain === "DESERT") state.board.robberPosition = coord;
});
    return tiles;
  }

  public getState(): GameState {
    return this.state;
  }

public getGame(): GameState {
  return this.state
}
}