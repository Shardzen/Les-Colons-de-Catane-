import { createCanvas } from "@napi-rs/canvas";
import { CatanEngine } from "./CatanEngine.js";
import { ResourceType, BuildingType } from "./types.js";

export class MapRenderer {
  public static async renderMapToBuffer(engine: CatanEngine): Promise<Buffer> {
    const width = 800, height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const offsetX = width / 2, offsetY = height / 2, HEX_SIZE = 50;

    ctx.fillStyle = "#4CA8E0";
    ctx.fillRect(0, 0, width, height);

    const getColor = (res: ResourceType) => {
      switch (res) {
        case ResourceType.WOOD: return "#2E7D32";
        case ResourceType.BRICK: return "#C62828";
        case ResourceType.SHEEP: return "#9CCC65";
        case ResourceType.WHEAT: return "#FDD835";
        case ResourceType.ORE: return "#757575";
        case ResourceType.DESERT: return "#FFEE58";
        default: return "#000000";
      }
    };

    for (const hex of engine.map) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle_rad = Math.PI / 180 * (30 + 60 * i);
        const x = offsetX + hex.x + HEX_SIZE * Math.cos(angle_rad);
        const y = offsetY + hex.y + HEX_SIZE * Math.sin(angle_rad);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = getColor(hex.resource);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (hex.hasRobber) {
        ctx.beginPath();
        ctx.arc(offsetX + hex.x, offsetY + hex.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = "#212121";
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("R", offsetX + hex.x, offsetY + hex.y);
      } else if (hex.resource !== ResourceType.DESERT) {
        ctx.beginPath();
        ctx.arc(offsetX + hex.x, offsetY + hex.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = "#FFE0B2";
        ctx.fill();
        ctx.fillStyle = (hex.value === 6 || hex.value === 8) ? "#D32F2F" : "#000000";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(hex.value.toString(), offsetX + hex.x, offsetY + hex.y);
      }
    }

    engine.edges.forEach((edge, id) => {
      const ownerId = engine.roads.get(id);
      if (ownerId) {
        const owner = engine.players.find(p => p.id === ownerId)!;
        const n1 = engine.nodes.get(edge.node1Id)!, n2 = engine.nodes.get(edge.node2Id)!;
        ctx.beginPath();
        ctx.moveTo(offsetX + n1.x, offsetY + n1.y);
        ctx.lineTo(offsetX + n2.x, offsetY + n2.y);
        ctx.strokeStyle = owner.color;
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    });

    engine.settlements.forEach((b, nodeId) => {
      const node = engine.nodes.get(nodeId)!;
      const owner = engine.players.find(p => p.id === b.playerId)!;
      ctx.fillStyle = owner.color;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      if (b.type === BuildingType.CITY) {
        ctx.beginPath();
        ctx.rect(offsetX + node.x - 12, offsetY + node.y - 12, 24, 24);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(offsetX + node.x, offsetY + node.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

    const portColors: Record<string, string> = {
        '3:1': '#FFFFFF',
        [ResourceType.WOOD]: '#2E7D32',
        [ResourceType.BRICK]: '#C62828',
        [ResourceType.SHEEP]: '#9CCC65',
        [ResourceType.WHEAT]: '#FDD835',
        [ResourceType.ORE]: '#757575',
    };
    const portLabels: Record<string, string> = {
        '3:1': '3:1',
        [ResourceType.WOOD]: '🌲2:1',
        [ResourceType.BRICK]: '🧱2:1',
        [ResourceType.SHEEP]: '🐑2:1',
        [ResourceType.WHEAT]: '🌾2:1',
        [ResourceType.ORE]: '⛰2:1',
    };
    for (const port of engine.getPortEdges()) {
        const n1 = engine.nodes.get(port.node1Id)!, n2 = engine.nodes.get(port.node2Id)!;
        const mx = offsetX + (n1.x + n2.x) / 2;
        const my = offsetY + (n1.y + n2.y) / 2;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = portColors[port.type] ?? '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-8, -8, 16, 16);
        ctx.strokeRect(-8, -8, 16, 16);
        ctx.restore();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(portLabels[port.type] ?? port.type, mx, my + 18);
    }

    return canvas.toBuffer("image/png");
  }

  public static async renderInteractiveMap(engine: CatanEngine, validSpots: { id: string, label: string }[], isNode: boolean): Promise<Buffer> {
    const buffer = await this.renderMapToBuffer(engine);
    const canvas = createCanvas(800, 800);
    const ctx = canvas.getContext("2d");
    const { loadImage } = await import("@napi-rs/canvas");
    const img = await loadImage(buffer);
    ctx.drawImage(img, 0, 0);
    const offsetX = 400, offsetY = 400;
    for (const spot of validSpots) {
      let x, y;
      if (isNode) {
        const n = engine.nodes.get(spot.id)!;
        x = n.x; y = n.y;
      } else {
        const e = engine.edges.get(spot.id)!;
        const n1 = engine.nodes.get(e.node1Id)!, n2 = engine.nodes.get(e.node2Id)!;
        x = (n1.x + n2.x) / 2;
        y = (n1.y + n2.y) / 2;
      }
      ctx.beginPath();
      ctx.arc(offsetX + x, offsetY + y, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = "#E91E63";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#000000";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spot.label, offsetX + x, offsetY + y);
    }
    return canvas.toBuffer("image/png");
  }
}
