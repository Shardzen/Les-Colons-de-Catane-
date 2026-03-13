import { CatanEngine } from "./CatanEngine.js";
import { ResourceType } from "./types.js";

export class CatanRenderer {
  public static getEmojiForResource(res: ResourceType): string {
    switch (res) {
      case ResourceType.WOOD: return "🌲";
      case ResourceType.BRICK: return "🧱";
      case ResourceType.WOOL: return "🐑";
      case ResourceType.GRAIN: return "🌾";
      case ResourceType.ORE: return "⛰️";
      case ResourceType.DESERT: return "🏜️";
      default: return "❓";
    }
  }

  public static renderDiscordMap(engine: CatanEngine): string {
    let output = "🗺️ **Plateau de Catane**\n```text\n";
    
    const mapRows = [-2, -1, 0, 1, 2];
    
    for (const r of mapRows) {
      const hexesInRow = engine.map.filter(h => h.r === r).sort((a, b) => a.q - b.q);
      const indent = Math.abs(r) * 3;
      output += " ".repeat(indent);

      for (const hex of hexesInRow) {
        const emoji = this.getEmojiForResource(hex.resource);
        const valStr = hex.hasRobber ? "😈" : (hex.value === 0 ? "  " : hex.value.toString().padStart(2, ' '));
        output += `[${emoji} ${valStr} (${hex.q},${hex.r})] `;
      }
      output += "\n\n";
    }

    output += "```\n*💡 Utilisez les coordonnées (q,r) pour construire (ex: /build settlement 0 1 2)*";
    return output;
  }
}
