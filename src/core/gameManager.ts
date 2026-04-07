import { CatanEngine } from "../CatanEngine.js";
import { GameState } from "../types.js";

export class GameManager {
  private games = new Map<string, CatanEngine>();
  private lobbys = new Map<string, any[]>();
  private pendingActions = new Map<string, Map<string, any>>();

  constructor(playerData: { id: string; username: string; color: PlayerColor }[]) {
    this.state = this.initializeGame(playerData);
  }


  private initializeGame(playerData: { id: string; username: string; color: PlayerColor }[]): GameState {
    const players: Player[] = playerData.map(p => ({
      id: p.id,
      username: p.username,
      color: p.color,
      resources: { WOOD: 0, BRICK: 0, SHEEP: 0, WHEAT: 0, ORE: 0 },
      victoryPoints: 0,
      stock: { roads: 15, settlements: 5, cities: 4 },
      devCards: []

    }));


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
    devCards: []
  };

  this.state.players.push(newPlayer);
  return { success: true, state: this.state, message: `${player.username} a rejoint la partie.` };
}
  

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
    devCards: []
  };

  this.state.players.push(newPlayer);
  return { success: true, state: this.state, message: `${player.username} a créé une nouvelle partie.` };
}
  

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
    return this.lobbys.get(channelId)!;
  }

  public joinGame(channelId: string, user: { id: string, username: string }): { success: boolean, error?: string } {
    const lobby = this.getLobby(channelId);
    
    if (this.games.has(channelId)) {
      return { success: false, error: "Une partie est déjà en cours dans ce salon." };
    }
    
    if (lobby.find(p => p.id === user.id)) {
      return { success: false, error: "Tu as déjà rejoint ce lobby." };
    }
    
    if (lobby.length >= 4) {
      return { success: false, error: "Le lobby est complet (4 joueurs max)." };
    }

    const colors = ["#FF0000", "#0000FF", "#00FF00", "#FFA500"];
    lobby.push({ 
      id: user.id, 
      username: user.username, 
      color: colors[lobby.length] 
    });
    
    return { success: true };
  }

  public createGame(channelId: string): CatanEngine | null {
    const lobby = this.lobbys.get(channelId);
    if (!lobby || lobby.length < 2) return null;

    const engine = new CatanEngine(lobby);
    this.games.set(channelId, engine);
    this.lobbys.delete(channelId);
    return engine;
  }

  public getGame(channelId: string): CatanEngine | undefined {
    return this.games.get(channelId);
  }

  public finishGame(channelId: string): boolean {
    const deleted = this.games.delete(channelId);
    this.pendingActions.delete(channelId);
    this.lobbys.delete(channelId);
    return deleted;
  }

  public setPendingAction(channelId: string, userId: string, data: any) {
    if (!this.pendingActions.has(channelId)) {
      this.pendingActions.set(channelId, new Map());
    }
    this.pendingActions.get(channelId)!.set(userId, data);
  }

  public getPendingAction(channelId: string, userId: string) {
    return this.pendingActions.get(channelId)?.get(userId);
  }

  public clearPendingAction(channelId: string, userId: string) {
    this.pendingActions.get(channelId)?.delete(userId);
  }
}
