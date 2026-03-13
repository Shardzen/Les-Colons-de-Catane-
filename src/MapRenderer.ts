import { createCanvas } from '@napi-rs/canvas';
import { CatanEngine } from './CatanEngine.js';
import { ResourceType, BuildingType } from './types.js';

export class MapRenderer {
  public static async renderMapToBuffer(engine: CatanEngine): Promise<Buffer> {
    const width = 800;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background water
    ctx.fillStyle = '#4CA8E0';
    ctx.fillRect(0, 0, width, height);

    const offsetX = width / 2;
    const offsetY = height / 2;
    const HEX_SIZE = 50;

    const getColor = (res: ResourceType) => {
      switch (res) {
        case ResourceType.WOOD: return '#2E7D32'; 
        case ResourceType.BRICK: return '#C62828'; 
        case ResourceType.WOOL: return '#9CCC65'; 
        case ResourceType.GRAIN: return '#FDD835'; 
        case ResourceType.ORE: return '#757575'; 
        case ResourceType.DESERT: return '#FFEE58'; 
        default: return '#000000';
      }
    };

    // Draw Hexes
    for (const hex of engine.map) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle_deg = 30 + 60 * i;
        const angle_rad = Math.PI / 180 * angle_deg;
        const x = offsetX + hex.x + HEX_SIZE * Math.cos(angle_rad);
        const y = offsetY + hex.y + HEX_SIZE * Math.sin(angle_rad);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      
      ctx.fillStyle = getColor(hex.resource);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Number Token
      if (hex.resource !== ResourceType.DESERT) {
        ctx.beginPath();
        ctx.arc(offsetX + hex.x, offsetY + hex.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#FFE0B2';
        ctx.fill();
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = (hex.value === 6 || hex.value === 8) ? '#D32F2F' : '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hex.value.toString(), offsetX + hex.x, offsetY + hex.y);
      } else if (hex.hasRobber) {
        ctx.fillStyle = '#000000';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('😈', offsetX + hex.x, offsetY + hex.y);
      }
    }

    // Draw Roads
    engine.edges.forEach((edge, id) => {
        const ownerId = engine.roads.get(id);
        if (ownerId) {
            const owner = engine.players.find(p => p.id === ownerId);
            const n1 = engine.nodes.get(edge.node1Id)!;
            const n2 = engine.nodes.get(edge.node2Id)!;
            
            ctx.beginPath();
            ctx.moveTo(offsetX + n1.x, offsetY + n1.y);
            ctx.lineTo(offsetX + n2.x, offsetY + n2.y);
            ctx.strokeStyle = owner ? owner.color : '#000000';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    });

    // Draw Settlements / Cities
    engine.settlements.forEach((building, nodeId) => {
        const node = engine.nodes.get(nodeId)!;
        const owner = engine.players.find(p => p.id === building.playerId);
        
        ctx.beginPath();
        if (building.type === BuildingType.CITY) {
            ctx.rect(offsetX + node.x - 12, offsetY + node.y - 12, 24, 24);
        } else {
            ctx.arc(offsetX + node.x, offsetY + node.y, 10, 0, Math.PI * 2);
        }
        ctx.fillStyle = owner ? owner.color : '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    return canvas.toBuffer('image/png');
  }

  public static async renderInteractiveMap(engine: CatanEngine, validSpots: {id: string, label: string}[], isNode: boolean): Promise<Buffer> {
     const width = 800;
     const height = 800;
     const canvas = createCanvas(width, height);
     const ctx = canvas.getContext('2d');
     
     ctx.fillStyle = '#4CA8E0';
     ctx.fillRect(0, 0, width, height);
 
     const offsetX = width / 2;
     const offsetY = height / 2;
     const HEX_SIZE = 50;

     const getColor = (res: ResourceType) => {
       switch (res) {
         case ResourceType.WOOD: return '#2E7D32'; 
         case ResourceType.BRICK: return '#C62828';
         case ResourceType.WOOL: return '#9CCC65';
         case ResourceType.GRAIN: return '#FDD835';
         case ResourceType.ORE: return '#757575';
         case ResourceType.DESERT: return '#FFEE58';
         default: return '#000000';
       }
     };
 
     for (const hex of engine.map) {
       ctx.beginPath();
       for (let i = 0; i < 6; i++) {
         const angle_deg = 30 + 60 * i;
         const angle_rad = Math.PI / 180 * angle_deg;
         const x = offsetX + hex.x + HEX_SIZE * Math.cos(angle_rad);
         const y = offsetY + hex.y + HEX_SIZE * Math.sin(angle_rad);
         if (i === 0) ctx.moveTo(x, y);
         else ctx.lineTo(x, y);
       }
       ctx.closePath();
       
       ctx.fillStyle = getColor(hex.resource);
       ctx.fill();
       ctx.strokeStyle = '#FFFFFF';
       ctx.lineWidth = 2;
       ctx.stroke();
 
       if (hex.resource !== ResourceType.DESERT) {
         ctx.beginPath();
         ctx.arc(offsetX + hex.x, offsetY + hex.y, 16, 0, Math.PI * 2);
         ctx.fillStyle = '#FFE0B2';
         ctx.fill();
         ctx.strokeStyle = '#3E2723';
         ctx.lineWidth = 1;
         ctx.stroke();
 
         ctx.fillStyle = (hex.value === 6 || hex.value === 8) ? '#D32F2F' : '#000000';
         ctx.font = 'bold 16px Arial';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText(hex.value.toString(), offsetX + hex.x, offsetY + hex.y);
       } else if (hex.hasRobber) {
         ctx.fillStyle = '#000000';
         ctx.font = '24px Arial';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText('😈', offsetX + hex.x, offsetY + hex.y);
       }
     }
 
     engine.edges.forEach((edge, id) => {
         const ownerId = engine.roads.get(id);
         if (ownerId) {
             const owner = engine.players.find(p => p.id === ownerId);
             const n1 = engine.nodes.get(edge.node1Id)!;
             const n2 = engine.nodes.get(edge.node2Id)!;
             ctx.beginPath();
             ctx.moveTo(offsetX + n1.x, offsetY + n1.y);
             ctx.lineTo(offsetX + n2.x, offsetY + n2.y);
             ctx.strokeStyle = owner ? owner.color : '#000000';
             ctx.lineWidth = 8;
             ctx.lineCap = 'round';
             ctx.stroke();
         }
     });
 
     engine.settlements.forEach((building, nodeId) => {
         const node = engine.nodes.get(nodeId)!;
         const owner = engine.players.find(p => p.id === building.playerId);
         ctx.beginPath();
         if (building.type === BuildingType.CITY) {
             ctx.rect(offsetX + node.x - 12, offsetY + node.y - 12, 24, 24);
         } else {
             ctx.arc(offsetX + node.x, offsetY + node.y, 10, 0, Math.PI * 2);
         }
         ctx.fillStyle = owner ? owner.color : '#FFFFFF';
         ctx.fill();
         ctx.strokeStyle = '#000000';
         ctx.lineWidth = 2;
         ctx.stroke();
     });

     for (const spot of validSpots) {
         if (isNode) {
             const node = engine.nodes.get(spot.id)!;
             ctx.beginPath();
             ctx.arc(offsetX + node.x, offsetY + node.y, 12, 0, Math.PI * 2);
             ctx.fillStyle = '#FFFFFF';
             ctx.fill();
             ctx.strokeStyle = '#E91E63';
             ctx.lineWidth = 2;
             ctx.stroke();

             ctx.fillStyle = '#000000';
             ctx.font = 'bold 12px Arial';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText(spot.label, offsetX + node.x, offsetY + node.y);
         } else {
             const edge = engine.edges.get(spot.id)!;
             const n1 = engine.nodes.get(edge.node1Id)!;
             const n2 = engine.nodes.get(edge.node2Id)!;
             const mx = (n1.x + n2.x) / 2;
             const my = (n1.y + n2.y) / 2;

             ctx.beginPath();
             ctx.arc(offsetX + mx, offsetY + my, 12, 0, Math.PI * 2);
             ctx.fillStyle = '#FFFFFF';
             ctx.fill();
             ctx.strokeStyle = '#E91E63';
             ctx.lineWidth = 2;
             ctx.stroke();

             ctx.fillStyle = '#000000';
             ctx.font = 'bold 12px Arial';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText(spot.label, offsetX + mx, offsetY + my);
         }
     }

     return canvas.toBuffer('image/png');
  }
}