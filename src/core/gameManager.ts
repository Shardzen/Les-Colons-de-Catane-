import { CatanEngine } from "../CatanEngine.js";
import { GamePhase } from "./types.js";

export class GameManager {
  private games = new Map<string, CatanEngine>();
  private lobbys = new Map<string, any[]>();

  public getLobby(channelId: string): any[] {
    if (!this.lobbys.has(channelId)) this.lobbys.set(channelId, []);
    return this.lobbys.get(channelId)!;
  }

  public joinGame(channelId: string, user: { id: string, username: string }): { success: boolean, error?: string } {
    const lobby = this.getLobby(channelId);
    if (this.games.has(channelId)) return { success: false, error: "Partie en cours." };
    if (lobby.find(p => p.id === user.id)) return { success: false, error: "Déjà dans le lobby." };
    if (lobby.length >= 4) return { success: false, error: "Lobby complet." };
    
    const colors = ["RED", "BLUE", "WHITE", "ORANGE"];
    lobby.push({ id: user.id, username: user.username, color: colors[lobby.length] });
    return { success: true };
  }

  public startGame(channelId: string): boolean {
    const lobby = this.lobbys.get(channelId);
    if (!lobby || lobby.length < 2) return false;
    const engine = new CatanEngine(lobby);
    this.games.set(channelId, engine);
    this.lobbys.delete(channelId);
    return true;
  }

  public createGame(channelId: string) {
      if (!this.lobbys.has(channelId)) this.lobbys.set(channelId, []);
  }

  public getGame(channelId: string): CatanEngine | undefined {
    return this.games.get(channelId);
  }

  public finishGame(channelId: string): boolean {
    return this.games.delete(channelId);
  }
}

