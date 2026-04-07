import { CatanEngine } from "../CatanEngine.js";
import { GameState } from "../types.js";

export class GameManager {
  private games = new Map<string, CatanEngine>();
  private lobbys = new Map<string, any[]>();
  private pendingActions = new Map<string, Map<string, any>>();

  public getLobby(channelId: string): any[] {
    if (!this.lobbys.has(channelId)) {
      this.lobbys.set(channelId, []);
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

  public startGame(channelId: string): boolean { return this.createGame(channelId) !== null; }
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
