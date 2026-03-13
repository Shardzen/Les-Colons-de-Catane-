import { ResourceType, BuildingType, Player, Hex, Building, GameState, Node, Edge } from "./types.js";

const HEX_SIZE = 50;

export class CatanEngine {
  public map: Hex[] = [];
  public nodes = new Map<string, Node>();
  public edges = new Map<string, Edge>();
  
  public players: Player[] = [];
  public currentPlayerIndex: number = 0;
  public state: GameState = GameState.SETUP_1;
  public setupTurnOrder: number[] = [];
  
  public settlements = new Map<string, Building>();
  public roads = new Map<string, string>();

  constructor(playersData: { id: string, username: string, color: string }[]) {
    this.players = playersData.map(p => ({
      ...p,
      resources: {
        [ResourceType.WOOD]: 0, [ResourceType.BRICK]: 0, 
        [ResourceType.WOOL]: 0, [ResourceType.GRAIN]: 0, 
        [ResourceType.ORE]: 0, [ResourceType.DESERT]: 0
      },
      victoryPoints: 0,
      color: p.color,
      knightsPlayed: 0,
      longestRoad: 0
    }));
    this.setupTurnOrder = this.players.map((_, i) => i);
    this.generateMap();
  }

  private generateMap() {
    const terrains = [
      ...Array(4).fill(ResourceType.WOOD), ...Array(4).fill(ResourceType.WOOL),
      ...Array(4).fill(ResourceType.GRAIN), ...Array(3).fill(ResourceType.BRICK),
      ...Array(3).fill(ResourceType.ORE), ResourceType.DESERT
    ].sort(() => Math.random() - 0.5);

    const tokens = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12].sort(() => Math.random() - 0.5);

    let tokenIdx = 0;
    
    for (let q = -2; q <= 2; q++) {
      for (let r = Math.max(-2, -q - 2); r <= Math.min(2, -q + 2); r++) {
        const resource = terrains.pop()!;
        const value = resource === ResourceType.DESERT ? 0 : tokens[tokenIdx++];
        
        const cx = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
        const cy = HEX_SIZE * 3 / 2 * r;
        
        const hex: Hex = { id: `${q}_${r}`, q, r, x: cx, y: cy, resource, value, hasRobber: resource === ResourceType.DESERT };
        this.map.push(hex);
        
        let hexNodes: Node[] = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 30 + 60 * i;
            const angle_rad = Math.PI / 180 * angle_deg;
            const nx = cx + HEX_SIZE * Math.cos(angle_rad);
            const ny = cy + HEX_SIZE * Math.sin(angle_rad);
            
            const rx = Math.round(nx * 10) / 10;
            const ry = Math.round(ny * 10) / 10;
            const nodeId = `${rx},${ry}`;
            
            if (!this.nodes.has(nodeId)) {
                this.nodes.set(nodeId, { id: nodeId, x: rx, y: ry, hexes: [] });
            }
            this.nodes.get(nodeId)!.hexes.push(hex);
            hexNodes.push(this.nodes.get(nodeId)!);
        }
        
        for (let i = 0; i < 6; i++) {
            const n1 = hexNodes[i];
            const n2 = hexNodes[(i + 1) % 6];
            const edgeId = [n1.id, n2.id].sort().join("::");
            if (!this.edges.has(edgeId)) {
                this.edges.set(edgeId, { id: edgeId, node1Id: n1.id, node2Id: n2.id });
            }
        }
      }
    }
  }

  public get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  public nextTurn() {
    if (this.state === GameState.SETUP_1) {
        if (this.currentPlayerIndex < this.players.length - 1) {
            this.currentPlayerIndex++;
        } else {
            this.state = GameState.SETUP_2;
        }
    } else if (this.state === GameState.SETUP_2) {
        if (this.currentPlayerIndex > 0) {
            this.currentPlayerIndex--;
        } else {
            this.state = GameState.PLAYING;
        }
    } else if (this.state === GameState.PLAYING) {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
  }

  public rollDice(): { d1: number, d2: number, total: number, harvests: Record<string, Record<ResourceType, number>>, isRobber: boolean } {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;

    if (total === 7) return { d1, d2, total, harvests: {}, isRobber: true };

    const harvests: Record<string, Record<ResourceType, number>> = {};
    const activeHexes = this.map.filter(h => h.value === total && !h.hasRobber);

    for (const hex of activeHexes) {
      for (const node of this.nodes.values()) {
         if (node.hexes.some(h => h.id === hex.id)) {
            const building = this.settlements.get(node.id);
            if (building && hex.resource !== ResourceType.DESERT) {
              const player = this.players.find(p => p.id === building.playerId);
              if (player) {
                const amount = building.type === BuildingType.CITY ? 2 : 1;
                player.resources[hex.resource] += amount;
                
                if (!harvests[player.username]) harvests[player.username] = { ...player.resources, [hex.resource]: 0 } as any;
                harvests[player.username][hex.resource] += amount;
              }
            }
         }
      }
    }
    return { d1, d2, total, harvests, isRobber: false };
  }

  private isNodeTooClose(nodeId: string): boolean {
    for (const edge of this.edges.values()) {
        if (edge.node1Id === nodeId && this.settlements.has(edge.node2Id)) return true;
        if (edge.node2Id === nodeId && this.settlements.has(edge.node1Id)) return true;
    }
    return false;
  }

  public canBuildSettlement(playerId: string, nodeId: string): boolean {
    if (!this.nodes.has(nodeId)) return false;
    if (this.settlements.has(nodeId)) return false;
    if (this.isNodeTooClose(nodeId)) return false;

    const isSetup = this.state === GameState.SETUP_1 || this.state === GameState.SETUP_2;

    if (!isSetup) {
      let connectedToRoad = false;
      for (const edge of this.edges.values()) {
          if ((edge.node1Id === nodeId || edge.node2Id === nodeId) && this.roads.get(edge.id) === playerId) {
              connectedToRoad = true;
              break;
          }
      }
      if (!connectedToRoad) return false;

      const p = this.players.find(p => p.id === playerId)!;
      if (p.resources[ResourceType.WOOD] < 1 || p.resources[ResourceType.BRICK] < 1 || 
          p.resources[ResourceType.WOOL] < 1 || p.resources[ResourceType.GRAIN] < 1) {
        return false;
      }
    }

    return true;
  }

  public buildSettlement(playerId: string, nodeId: string): boolean {
    if (!this.canBuildSettlement(playerId, nodeId)) return false;

    const isSetup = this.state === GameState.SETUP_1 || this.state === GameState.SETUP_2;

    if (!isSetup) {
      const p = this.players.find(p => p.id === playerId)!;
      p.resources[ResourceType.WOOD]--; p.resources[ResourceType.BRICK]--;
      p.resources[ResourceType.WOOL]--; p.resources[ResourceType.GRAIN]--;
    } else if (this.state === GameState.SETUP_2) {
      const p = this.players.find(p => p.id === playerId)!;
      const node = this.nodes.get(nodeId)!;
      for (const hex of node.hexes) {
          if (hex.resource !== ResourceType.DESERT) {
              p.resources[hex.resource]++;
          }
      }
    }

    this.settlements.set(nodeId, { playerId, type: BuildingType.SETTLEMENT });
    this.players.find(p => p.id === playerId)!.victoryPoints += 1;
    return true;
  }

  public canBuildRoad(playerId: string, edgeId: string): boolean {
     if (!this.edges.has(edgeId)) return false;
     if (this.roads.has(edgeId)) return false;

     const edge = this.edges.get(edgeId)!;
     const isSetup = this.state === GameState.SETUP_1 || this.state === GameState.SETUP_2;

     let connected = false;
     if (this.settlements.get(edge.node1Id)?.playerId === playerId || this.settlements.get(edge.node2Id)?.playerId === playerId) {
         connected = true;
     } else {
         for (const otherEdge of this.edges.values()) {
             if (this.roads.get(otherEdge.id) === playerId) {
                 if (otherEdge.node1Id === edge.node1Id || otherEdge.node2Id === edge.node1Id ||
                     otherEdge.node1Id === edge.node2Id || otherEdge.node2Id === edge.node2Id) {
                     connected = true;
                     break;
                 }
             }
         }
     }

     if (!connected) return false;

     if (!isSetup) {
        const p = this.players.find(p => p.id === playerId)!;
        if (p.resources[ResourceType.WOOD] < 1 || p.resources[ResourceType.BRICK] < 1) return false;
     }

     return true;
  }

  public buildRoad(playerId: string, edgeId: string): boolean {
     if (!this.canBuildRoad(playerId, edgeId)) return false;
     
     const isSetup = this.state === GameState.SETUP_1 || this.state === GameState.SETUP_2;
     if (!isSetup) {
        const p = this.players.find(p => p.id === playerId)!;
        p.resources[ResourceType.WOOD]--; p.resources[ResourceType.BRICK]--;
     }

     this.roads.set(edgeId, playerId);
     return true;
  }

  public getPlaceableNodes(playerId: string): Node[] {
      return Array.from(this.nodes.values()).filter(n => this.canBuildSettlement(playerId, n.id));
  }
  public getPlaceableEdges(playerId: string): Edge[] {
      return Array.from(this.edges.values()).filter(e => this.canBuildRoad(playerId, e.id));
  }
}