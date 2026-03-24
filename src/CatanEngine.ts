import { ResourceType, BuildingType, Player, Hex, Building, GameState, Node, Edge } from "./types.js";    

export class CatanEngine {
  public map: Hex[] = [];
  public nodes = new Map<string, Node>();
  public edges = new Map<string, Edge>();
  public players: Player[] = [];
  public currentPlayerIndex: number = 0;
  public state: GameState = GameState.SETUP_1;
  
  public hasRolled: boolean = false;
  public setupStep: "SETTLEMENT" | "ROAD" = "SETTLEMENT";

  public settlements = new Map<string, Building>();
  public roads = new Map<string, string>();

  constructor(playersData: { id: string, username: string, color: string }[]) {
    this.players = playersData.map(p => ({
      ...p,
      resources: { [ResourceType.WOOD]: 0, [ResourceType.BRICK]: 0, [ResourceType.WOOL]: 0, [ResourceType.GRAIN]: 0, [ResourceType.ORE]: 0, [ResourceType.DESERT]: 0 },
      victoryPoints: 0, color: p.color, knightsPlayed: 0, longestRoad: 0
    }));
    this.generateMap();
  }

  private generateMap() {
    const HEX_SIZE = 50;
    const terrains = [...Array(4).fill(ResourceType.WOOD), ...Array(4).fill(ResourceType.WOOL), ...Array(4).fill(ResourceType.GRAIN), ...Array(3).fill(ResourceType.BRICK), ...Array(3).fill(ResourceType.ORE), ResourceType.DESERT].sort(() => Math.random() - 0.5);
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
            const angle_rad = Math.PI / 180 * (30 + 60 * i);
            const rx = Math.round((cx + HEX_SIZE * Math.cos(angle_rad)) * 10) / 10;
            const ry = Math.round((cy + HEX_SIZE * Math.sin(angle_rad)) * 10) / 10;
            const nodeId = `${rx},${ry}`;
            if (!this.nodes.has(nodeId)) this.nodes.set(nodeId, { id: nodeId, x: rx, y: ry, hexes: [] });
            this.nodes.get(nodeId)!.hexes.push(hex);
            hexNodes.push(this.nodes.get(nodeId)!);
        }
        for (let i = 0; i < 6; i++) {
            const n1 = hexNodes[i], n2 = hexNodes[(i + 1) % 6];
            const edgeId = [n1.id, n2.id].sort().join("::");
            if (!this.edges.has(edgeId)) this.edges.set(edgeId, { id: edgeId, node1Id: n1.id, node2Id: n2.id });
        }
      }
    }
  }

  public get currentPlayer() { return this.players[this.currentPlayerIndex]; }

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
    } else {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
    this.hasRolled = false;
    this.setupStep = "SETTLEMENT";
  }

  public getPlayerResourceCount(playerId: string): number {
    const p = this.players.find(p => p.id === playerId);
    if (!p) return 0;
    return Object.values(p.resources).reduce((a, b) => a + b, 0);
  }

  public rollDice() {
    if (this.hasRolled) return null;
    const d1 = Math.floor(Math.random() * 6) + 1, d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    this.hasRolled = true;

    const harvests: Record<string, Record<ResourceType, number>> = {};
    const toDiscard: string[] = [];

    if (total === 7) {
        this.players.forEach(p => {
            if (this.getPlayerResourceCount(p.id) > 7) toDiscard.push(p.id);
        });
        if (toDiscard.length > 0) this.state = GameState.DISCARDING;
        else this.state = GameState.ROBBER_MOVE;
    } else {
        this.map.filter(h => h.value === total && !h.hasRobber).forEach(hex => {
            this.nodes.values().forEach(node => {
                if (node.hexes.some(h => h.id === hex.id)) {
                    const b = this.settlements.get(node.id);
                    if (b) {
                        const p = this.players.find(p => p.id === b.playerId)!;
                        const qty = b.type === BuildingType.CITY ? 2 : 1;
                        p.resources[hex.resource] += qty;
                        if (!harvests[p.username]) harvests[p.username] = { [ResourceType.WOOD]:0,[ResourceType.BRICK]:0,[ResourceType.WOOL]:0,[ResourceType.GRAIN]:0,[ResourceType.ORE]:0,[ResourceType.DESERT]:0 };
                        harvests[p.username][hex.resource] += qty;
                    }
                }
            });
        });
    }
    return { total, harvests, isRobber: total === 7, toDiscard };
  }

  public discardResources(playerId: string, resources: Partial<Record<ResourceType, number>>): boolean {
      if (this.state !== GameState.DISCARDING) return false;
      const p = this.players.find(p => p.id === playerId);
      if (!p) return false;

      const totalToDiscard = Math.floor(this.getPlayerResourceCount(playerId) / 2);
      const givenCount = Object.values(resources).reduce((a, b) => a + (b || 0), 0);
      if (givenCount !== totalToDiscard) return false;

      //Vérifier si le joueur a bien ces ressources
      for (const [res, qty] of Object.entries(resources)) {
          if (p.resources[res as ResourceType] < (qty || 0)) return false;
      }

      //appliquer la défausse
      for (const [res, qty] of Object.entries(resources)) {
          p.resources[res as ResourceType] -= (qty || 0);
      }

      //vérifier si d'autres joueurs doivent défausser
      const stillNeeding = this.players.filter(pl => this.getPlayerResourceCount(pl.id) > 7);
      if (stillNeeding.length === 0) {
          this.state = GameState.ROBBER_MOVE;
      }
      return true;
  }

  public tradeWithBank(playerId: string, give: ResourceType, receive: ResourceType): boolean {
      const p = this.players.find(p => p.id === playerId);
      if (!p || !this.hasRolled || p.resources[give] < 4) return false;
      p.resources[give] -= 4; p.resources[receive] += 1;
      return true;
  }
 
  // Fonction LongestRoad qui va attribuer les IDs des rouutes du joueur 
  public calculateLongestRoad(playerId: string): number {
    const playerEdges = Array.from(this.roads.entries())
    .filter(([edgeId, owner]) => owner === playerId)
    .map(([edgeId]) => edgeId);
    return 0;
}

  public buildSettlement(playerId: string, nodeId: string): boolean {
    if (this.state.startsWith("SETUP") && this.setupStep !== "SETTLEMENT") return false;
    if (!this.canBuildSettlement(playerId, nodeId)) return false;

    const p = this.players.find(p => p.id === playerId)!;
    if (this.state === GameState.PLAYING) {
        p.resources[ResourceType.WOOD]--; p.resources[ResourceType.BRICK]--; p.resources[ResourceType.WOOL]--; p.resources[ResourceType.GRAIN]--;
    } else if (this.state === GameState.SETUP_2) {
        this.nodes.get(nodeId)!.hexes.forEach(h => { if (h.resource !== ResourceType.DESERT) p.resources[h.resource]++; });
    }
    this.settlements.set(nodeId, { playerId, type: BuildingType.SETTLEMENT });
    p.victoryPoints++;
    this.setupStep = "ROAD";
    return true;
  }

  public buildRoad(playerId: string, edgeId: string): boolean {
    if (this.state.startsWith("SETUP") && this.setupStep !== "ROAD") return false;
    if (!this.canBuildRoad(playerId, edgeId)) return false;

    if (this.state === GameState.PLAYING) {
        const p = this.players.find(p => p.id === playerId)!;
        p.resources[ResourceType.WOOD]--; p.resources[ResourceType.BRICK]--;
    }
    this.roads.set(edgeId, playerId);
    if (this.state.startsWith("SETUP")) this.nextTurn();
    return true;
  }

  public buildCity(playerId: string, nodeId: string): boolean {
      if (!this.canBuildCity(playerId, nodeId)) return false;
      const p = this.players.find(p => p.id === playerId)!;
      p.resources[ResourceType.ORE] -= 3; p.resources[ResourceType.GRAIN] -= 2;
      this.settlements.set(nodeId, { playerId, type: BuildingType.CITY });
      p.victoryPoints++;
      return true;
  }

  public canBuildSettlement(playerId: string, nodeId: string): boolean {
    if (this.settlements.has(nodeId)) return false;
    for (const e of this.edges.values()) {
        if ((e.node1Id === nodeId && this.settlements.has(e.node2Id)) || (e.node2Id === nodeId && this.settlements.has(e.node1Id))) return false;
    }
    if (this.state === GameState.PLAYING) {
        if (!Array.from(this.edges.values()).some(e => (e.node1Id === nodeId || e.node2Id === nodeId) && this.roads.get(e.id) === playerId)) return false;
        const p = this.players.find(p => p.id === playerId)!;
        return p.resources[ResourceType.WOOD] >= 1 && p.resources[ResourceType.BRICK] >= 1 && p.resources[ResourceType.WOOL] >= 1 && p.resources[ResourceType.GRAIN] >= 1;
    }
    return true;
  }

  public canBuildRoad(playerId: string, edgeId: string): boolean {
    if (this.roads.has(edgeId)) return false;
    const e = this.edges.get(edgeId)!;
    const connected = (this.settlements.get(e.node1Id)?.playerId === playerId || this.settlements.get(e.node2Id)?.playerId === playerId || Array.from(this.edges.values()).some(oe => this.roads.get(oe.id) === playerId && (oe.node1Id === e.node1Id || oe.node2Id === e.node1Id || oe.node1Id === e.node2Id || oe.node2Id === e.node2Id)));
    if (!connected) return false;
    if (this.state === GameState.PLAYING) {
        const p = this.players.find(p => p.id === playerId)!;
        return p.resources[ResourceType.WOOD] >= 1 && p.resources[ResourceType.BRICK] >= 1;
    }
    return true;
  }

  public canBuildCity(playerId: string, nodeId: string): boolean {
      const b = this.settlements.get(nodeId);
      if (!b || b.playerId !== playerId || b.type !== BuildingType.SETTLEMENT) return false;
      const p = this.players.find(p => p.id === playerId)!;
      return p.resources[ResourceType.ORE] >= 3 && p.resources[ResourceType.GRAIN] >= 2;
  }

  public getPlaceableNodes(playerId: string) { return Array.from(this.nodes.values()).filter(n => this.canBuildSettlement(playerId, n.id)); }
  public getPlaceableEdges(playerId: string) { return Array.from(this.edges.values()).filter(e => this.canBuildRoad(playerId, e.id)); }
  public getUpgradableSettlements(playerId: string) { return Array.from(this.nodes.values()).filter(n => this.canBuildCity(playerId, n.id)); }
}
