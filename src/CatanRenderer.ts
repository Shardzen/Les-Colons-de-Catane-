import { CatanEngine } from "./CatanEngine.js";
import { ResourceType } from "./types.js";

export class CatanRenderer {
  public static getEmojiForResource(res: ResourceType): string {
    switch (res) {
      case ResourceType.WOOD: return "??";
      case ResourceType.BRICK: return "??";
      case ResourceType.SHEEP: return "??";
      case ResourceType.WHEAT: return "??";
      case ResourceType.ORE: return "??";
      case ResourceType.DESERT: return "??";
      default: return "?";
    }
  }

  public static renderDiscordMap(engine: CatanEngine): string {
    let output = "??? **Plateau**\n```text\n";
    const mapRows = [-2, -1, 0, 1, 2];
    for (const r of mapRows) {
      const hexesInRow = engine.map.filter(h => h.r === r).sort((a, b) => a.q - b.q);
      output += " ".repeat(Math.abs(r) * 3);
      for (const hex of hexesInRow) {
        const emoji = this.getEmojiForResource(hex.resource);
        const valStr = hex.hasRobber ? "??" : (hex.value === 0 ? "  " : hex.value.toString().padStart(2, " "));
        output += `[${emoji} ${valStr} (${hex.q},${hex.r})] `;
      }
      output += "\n\n";
    }
    output += "```";
    return output;
  }
}

