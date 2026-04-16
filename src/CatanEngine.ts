import { ResourceType, BuildingType, Player, Hex, Building, GamePhase, Node, Edge, DevCardType } from './core/types.js';

export class CatanEngine {
  public map: Hex[] = [];
  public nodes = new Map<string, Node>();
  public edges = new Map<string, Edge>();
  public players: Player[] = [];
  public currentPlayerIndex: number = 0;
  public phase: GamePhase = GamePhase.SETUP_1;
  public hasRolled: boolean = false;
  public setupStep: 'SETTLEMENT' | 'ROAD' = 'SETTLEMENT';
  public settlements = new Map<string, Building>();
  public roads = new Map<string, string>();
  public devCardDeck: DevCardType[] = [];
  public discardedPlayers = new Set<string>();
  public ports = new Map<string, ResourceType | '3:1'>();

  constructor(playersData: { id: string, username: string, color: string }[]) {
    this.players = playersData.map(p => ({
      ...p,
      resources: { [ResourceType.WOOD]: 0, [ResourceType.BRICK]: 0, [ResourceType.SHEEP]: 0, [ResourceType.WHEAT]: 0, [ResourceType.ORE]: 0, [ResourceType.DESERT]: 0 },
      devCards: [], playedDevCards: [], victoryPoints: 0, color: p.color, knightsPlayed: 0, longestRoadLength: 0, hasLongestRoad: false, hasLargestArmy: false,
      stock: { roads: 15, settlements: 5, cities: 4 }
    }));
    this.generateMap();
    this.generateDevCards();
  }

  public get state(): GamePhase { return this.phase; }
  public set state(s: GamePhase) { this.phase = s; }
  public get board() { return { hexes: this.map, tiles: this.map, robberPosition: this.map.find(h => h.hasRobber) || { q: 0, r: 0 }, settlements: this.settlements, roads: this.roads }; }

  private generateDevCards() {
    const cards = [...Array(14).fill(DevCardType.KNIGHT), ...Array(2).fill(DevCardType.ROAD_BUILDING), ...Array(2).fill(DevCardType.YEAR_OF_PLENTY), ...Array(2).fill(DevCardType.MONOPOLY), ...Array(5).fill(DevCardType.VICTORY_POINT)];
    this.devCardDeck = cards.sort(() => Math.random() - 0.5);
  }

  private generateMap() {
    const HEX_SIZE = 50;
    const terrains = [...Array(4).fill(ResourceType.WOOD), ...Array(4).fill(ResourceType.SHEEP), ...Array(4).fill(ResourceType.WHEAT), ...Array(3).fill(ResourceType.BRICK), ...Array(3).fill(ResourceType.ORE), ResourceType.DESERT].sort(() => Math.random() - 0.5);
    const tokens = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12].sort(() => Math.random() - 0.5);
    let tokenIdx = 0;
    for (let q = -2; q <= 2; q++) {
      for (let r = Math.max(-2, -q - 2); r <= Math.min(2, -q + 2); r++) {
        const resource = terrains.pop()!;
        const value = resource === ResourceType.DESERT ? 0 : tokens[tokenIdx++];
        const cx = HEX_SIZE * Math.sqrt(3) * (q + r / 2), cy = HEX_SIZE * 3 / 2 * r;
        const hex: Hex = { id: q + '_' + r, q, r, x: cx, y: cy, resource, value, hasRobber: resource === ResourceType.DESERT };
        this.map.push(hex);
        let hexNodes: Node[] = [];
        for (let i = 0; i < 6; i++) {
          const angle_rad = Math.PI / 180 * (30 + 60 * i);
          const rx = Math.round((cx + HEX_SIZE * Math.cos(angle_rad)) * 10) / 10, ry = Math.round((cy + HEX_SIZE * Math.sin(angle_rad)) * 10) / 10;
          const nodeId = rx + ',' + ry;
          if (!this.nodes.has(nodeId)) this.nodes.set(nodeId, { id: nodeId, x: rx, y: ry, hexes: [] });
          this.nodes.get(nodeId)!.hexes.push(hex); hexNodes.push(this.nodes.get(nodeId)!);
        }
        for (let i = 0; i < 6; i++) {
          const n1 = hexNodes[i], n2 = hexNodes[(i + 1) % 6];
          const edgeId = [n1.id, n2.id].sort().join('::');
          if (!this.edges.has(edgeId)) this.edges.set(edgeId, { id: edgeId, node1Id: n1.id, node2Id: n2.id });
        }
      }
    }
    const bNodes = Array.from(this.nodes.values()).filter(n => n.hexes.length <= 2);
    const pTypes = ['3:1', ResourceType.WOOD, ResourceType.BRICK, ResourceType.SHEEP, ResourceType.WHEAT, ResourceType.ORE].sort(() => Math.random() - 0.5);
    for (let i = 0; i < pTypes.length; i++) { if (bNodes[i * 2]) this.ports.set(bNodes[i * 2].id, pTypes[i] as any); }
  }

  public get currentPlayer() { return this.players[this.currentPlayerIndex]; }

  public nextTurn() {
    if (this.phase === GamePhase.SETUP_1) { if (this.currentPlayerIndex < this.players.length - 1) this.currentPlayerIndex++; else this.phase = GamePhase.SETUP_2; }
    else if (this.phase === GamePhase.SETUP_2) { if (this.currentPlayerIndex > 0) this.currentPlayerIndex--; else this.phase = GamePhase.PLAYING; }
    else this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.hasRolled = false;
    this.setupStep = 'SETTLEMENT';
  }

  public getPlayerResourceCount(pId: string): number {
    const p = this.players.find(x => x.id === pId);
    return p ? Object.values(p.resources).reduce((a, b) => a + b, 0) : 0;
  }

  public rollDice() {
    if (this.hasRolled) return null;
    const d1 = Math.floor(Math.random() * 6) + 1, d2 = Math.floor(Math.random() * 6) + 1, total = d1 + d2;
    this.hasRolled = true;
    const harvests: Record<string, Record<string, number>> = {};
    if (total === 7) {
      const toDiscard = this.players.filter(p => this.getPlayerResourceCount(p.id) > 7).map(p => p.id);
      this.discardedPlayers.clear();
      this.phase = toDiscard.length > 0 ? GamePhase.DISCARDING : GamePhase.ROBBER_MOVE;
      return { total, harvests, isRobber: true, toDiscard };
    }
    this.map.filter(h => h.value === total && !h.hasRobber).forEach(hex => {
      for (const node of this.nodes.values()) {
        if (node.hexes.some(h => h.id === hex.id)) {
          const b = this.settlements.get(node.id);
          if (b) {
            const p = this.players.find(x => x.id === b.playerId)!, qty = b.type === BuildingType.CITY ? 2 : 1;
            p.resources[hex.resource] += qty;
            if (!harvests[p.username]) harvests[p.username] = {};
            harvests[p.username][hex.resource] = (harvests[p.username][hex.resource] || 0) + qty;
          }
        }
      }
    });
    return { total, harvests, isRobber: false, toDiscard: [] };
  }

  public discard(pId: string, resources: Partial<Record<ResourceType, number>>): boolean {
    const p = this.players.find(x => x.id === pId);
    if (!p || this.phase !== GamePhase.DISCARDING) return false;
    for (const [res, qty] of Object.entries(resources)) { if (p.resources[res as ResourceType] < (qty || 0)) return false; p.resources[res as ResourceType] -= (qty || 0); }
    this.discardedPlayers.add(pId);
    if (this.players.filter(pl => this.getPlayerResourceCount(pl.id) > 7).every(pl => this.discardedPlayers.has(pl.id))) this.phase = GamePhase.ROBBER_MOVE;
    return true;
  }

  public moveRobber(hexId: string, pId: string): { success: boolean, victims: string[] } {
    const newHex = this.map.find(h => h.id === hexId);
    if (!newHex || newHex.hasRobber) return { success: false, victims: [] };
    this.map.forEach(h => h.hasRobber = false);
    newHex.hasRobber = true;
    const vIds = Array.from(this.nodes.values())
      .filter(n => n.hexes.some(h => h.id === hexId))
      .map(n => this.settlements.get(n.id)?.playerId)
      .filter((id): id is string => !!id && id !== pId && this.getPlayerResourceCount(id) > 0);
    const victims = Array.from(new Set(vIds));
    this.phase = victims.length > 0 ? GamePhase.ROBBER_STEAL : GamePhase.PLAYING;
    return { success: true, victims };
  }

  public stealCard(rId: string, vId: string) {
    const v = this.players.find(x => x.id === vId), r = this.players.find(x => x.id === rId);
    if (!v || !r || this.getPlayerResourceCount(vId) === 0) return null;
    const pool: ResourceType[] = [];
    Object.entries(v.resources).forEach(([res, count]) => { for (let i = 0; i < count; i++) pool.push(res as ResourceType); });
    const stolen = pool[Math.floor(Math.random() * pool.length)];
    v.resources[stolen]--;
    r.resources[stolen]++;
    this.phase = GamePhase.PLAYING;
    return stolen;
  }

  public executeTrade(p1Id: string, p2Id: string, p1G: Partial<Record<ResourceType, number>>, p2G: Partial<Record<ResourceType, number>>): boolean {
    const p1 = this.players.find(x => x.id === p1Id), p2 = this.players.find(x => x.id === p2Id);
    if (!p1 || !p2) return false;
    for (const [r, q] of Object.entries(p1G)) if (p1.resources[r as ResourceType] < (q || 0)) return false;
    for (const [r, q] of Object.entries(p2G)) if (p2.resources[r as ResourceType] < (q || 0)) return false;
    for (const [r, q] of Object.entries(p1G)) { p1.resources[r as ResourceType] -= (q || 0); p2.resources[r as ResourceType] += (q || 0); }
    for (const [r, q] of Object.entries(p2G)) { p2.resources[r as ResourceType] -= (q || 0); p1.resources[r as ResourceType] += (q || 0); }
    return true;
  }

  public tradeWithBank(pId: string, give: ResourceType, receive: ResourceType): boolean {
    const p = this.players.find(x => x.id === pId);
    if (!p) return false;
    let rate = 4;
    for (const [nId, pT] of this.ports.entries()) { if (this.settlements.get(nId)?.playerId === pId) { if (pT === '3:1') rate = Math.min(rate, 3); else if (pT === give) rate = 2; } }
    if (p.resources[give] < rate) return false;
    p.resources[give] -= rate;
    p.resources[receive] += 1;
    return true;
  }

  public buyDevCard(pId: string) {
    const p = this.players.find(x => x.id === pId);
    if (!p || this.devCardDeck.length === 0 || p.resources[ResourceType.ORE] < 1 || p.resources[ResourceType.SHEEP] < 1 || p.resources[ResourceType.WHEAT] < 1) return null;
    p.resources[ResourceType.ORE]--;
    p.resources[ResourceType.SHEEP]--;
    p.resources[ResourceType.WHEAT]--;
    const card = this.devCardDeck.pop()!;
    p.devCards.push(card);
    if (card === DevCardType.VICTORY_POINT) p.victoryPoints++;
    return card;
  }

  public playDevCard(pId: string, type: DevCardType, data?: any) {
    const p = this.players.find(x => x.id === pId);
    if (!p || !p.devCards.includes(type)) return false;
    p.devCards.splice(p.devCards.indexOf(type), 1);
    p.playedDevCards.push(type);
    if (type === DevCardType.KNIGHT) { p.knightsPlayed++; this.phase = GamePhase.ROBBER_MOVE; this.updateLargestArmy(); }
    else if (type === DevCardType.MONOPOLY) { const res = data as ResourceType; this.players.forEach(other => { if (other.id !== p.id) { p.resources[res] += other.resources[res]; other.resources[res] = 0; } }); }
    else if (type === DevCardType.YEAR_OF_PLENTY) { p.resources[data.r1 as ResourceType]++; p.resources[data.r2 as ResourceType]++; }
    return true;
  }

  private updateLargestArmy() {
    let leader = this.players.find(x => x.hasLargestArmy), max = leader ? leader.knightsPlayed : 2;
    this.players.forEach(p => { if (p.knightsPlayed > max) { if (leader) { leader.hasLargestArmy = false; leader.victoryPoints -= 2; } p.hasLargestArmy = true; p.victoryPoints += 2; leader = p; max = p.knightsPlayed; } });
  }

  public buildSettlement(pId: string, nodeId: string) {
    if (!this.canBuildSettlement(pId, nodeId)) return false;
    const p = this.players.find(x => x.id === pId)!;
    if (this.phase === GamePhase.PLAYING) { p.resources[ResourceType.WOOD]--; p.resources[ResourceType.BRICK]--; p.resources[ResourceType.SHEEP]--; p.resources[ResourceType.WHEAT]--; }
    else if (this.phase === GamePhase.SETUP_2) { this.nodes.get(nodeId)!.hexes.forEach(h => { if (h.resource !== ResourceType.DESERT) p.resources[h.resource]++; }); }
    this.settlements.set(nodeId, { playerId: pId, type: BuildingType.SETTLEMENT });
    p.victoryPoints++;
    this.setupStep = 'ROAD';
    return true;
  }

  public buildRoad(pId: string, edgeId: string) {
    if (!this.canBuildRoad(pId, edgeId)) return false;
    const p = this.players.find(x => x.id === pId)!;
    if (this.phase === GamePhase.PLAYING) { p.resources[ResourceType.WOOD]--; p.resources[ResourceType.BRICK]--; }
    this.roads.set(edgeId, pId);
    this.updateLongestRoad();
    if (this.phase === GamePhase.SETUP_1 || this.phase === GamePhase.SETUP_2) this.nextTurn();
    return true;
  }

  public buildCity(pId: string, nodeId: string) {
    if (!this.canBuildCity(pId, nodeId)) return false;
    const p = this.players.find(x => x.id === pId)!;
    p.resources[ResourceType.ORE] -= 3;
    p.resources[ResourceType.WHEAT] -= 2;
    this.settlements.set(nodeId, { playerId: pId, type: BuildingType.CITY });
    p.victoryPoints++;
    return true;
  }

  public canBuildSettlement(pId: string, nodeId: string): boolean {
    if (this.settlements.has(nodeId)) return false;
    for (const e of this.edges.values()) if ((e.node1Id === nodeId && this.settlements.has(e.node2Id)) || (e.node2Id === nodeId && this.settlements.has(e.node1Id))) return false;
    if (this.phase === GamePhase.PLAYING) {
      if (!Array.from(this.edges.values()).some(e => (e.node1Id === nodeId || e.node2Id === nodeId) && this.roads.get(e.id) === pId)) return false;
      const p = this.players.find(x => x.id === pId)!;
      return p.resources[ResourceType.WOOD] >= 1 && p.resources[ResourceType.BRICK] >= 1 && p.resources[ResourceType.SHEEP] >= 1 && p.resources[ResourceType.WHEAT] >= 1;
    }
    return true;
  }

  public canBuildRoad(pId: string, edgeId: string): boolean {
    if (this.roads.has(edgeId)) return false;
    const e = this.edges.get(edgeId)!;
    const connected = (
      this.settlements.get(e.node1Id)?.playerId === pId ||
      this.settlements.get(e.node2Id)?.playerId === pId ||
      Array.from(this.edges.values()).some(oe =>
        this.roads.get(oe.id) === pId &&
        (oe.node1Id === e.node1Id || oe.node2Id === e.node1Id || oe.node1Id === e.node2Id || oe.node2Id === e.node2Id)
      )
    );
    if (!connected) return false;
    if (this.phase === GamePhase.PLAYING) {
      const p = this.players.find(x => x.id === pId)!;
      return p.resources[ResourceType.WOOD] >= 1 && p.resources[ResourceType.BRICK] >= 1;
    }
    return true;
  }

  public canBuildCity(pId: string, nodeId: string): boolean {
    const b = this.settlements.get(nodeId);
    if (!b || b.playerId !== pId || b.type !== BuildingType.SETTLEMENT) return false;
    const p = this.players.find(x => x.id === pId)!;
    return p.resources[ResourceType.ORE] >= 3 && p.resources[ResourceType.WHEAT] >= 2;
  }

  private updateLongestRoad() {
    this.players.forEach(p => { p.longestRoadLength = this.calculatePlayerLongestRoad(p.id); });
    let leader = this.players.find(x => x.hasLongestRoad), max = leader ? leader.longestRoadLength : 4;
    this.players.forEach(p => { if (p.longestRoadLength > max) { if (leader) { leader.hasLongestRoad = false; leader.victoryPoints -= 2; } p.hasLongestRoad = true; p.victoryPoints += 2; leader = p; max = p.longestRoadLength; } });
  }

  private calculatePlayerLongestRoad(pId: string): number {
    const pRoads = Array.from(this.edges.values()).filter(e => this.roads.get(e.id) === pId);
    let maxLen = 0;
    pRoads.forEach(startEdge => {
      maxLen = Math.max(
        maxLen,
        this.dfsRoad(startEdge, pId, new Set([startEdge.id]), startEdge.node1Id),
        this.dfsRoad(startEdge, pId, new Set([startEdge.id]), startEdge.node2Id)
      );
    });
    return maxLen;
  }

  private dfsRoad(cE: Edge, pId: string, visited: Set<string>, cNId: string): number {
    const nNId = cE.node1Id === cNId ? cE.node2Id : cE.node1Id;
    const occupant = this.settlements.get(nNId);
    if (occupant && occupant.playerId !== pId) return visited.size;
    let max = visited.size;
    for (const nE of this.edges.values()) {
      if (!visited.has(nE.id) && this.roads.get(nE.id) === pId && (nE.node1Id === nNId || nE.node2Id === nNId)) {
        visited.add(nE.id);
        max = Math.max(max, this.dfsRoad(nE, pId, visited, nNId));
        visited.delete(nE.id);
      }
    }
    return max;
  }

  public getPlaceableNodes(pId: string) { return Array.from(this.nodes.values()).filter(n => this.canBuildSettlement(pId, n.id)); }
  public getPlaceableEdges(pId: string) { return Array.from(this.edges.values()).filter(e => this.canBuildRoad(pId, e.id)); }
  public getUpgradableSettlements(pId: string) { return Array.from(this.nodes.values()).filter(n => this.canBuildCity(pId, n.id)); }
}
