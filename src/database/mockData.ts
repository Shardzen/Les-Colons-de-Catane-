
export const mockGameState = {
    
  gameId: "catan_party_789",
  status: "PLAYING", 
  currentPlayerId: "discord_id_rayan", 
  
  players: [
    {
      id: "discord_id_rayan",
      username: "Rayan",
      color: "🔴", 
      score: 3, 
      resources: { WOOD: 2, BRICK: 2, SHEEP: 0, WHEAT: 1, ORE: 0 },
      devCards: { KNIGHT: 1, VICTORY_POINT: 0, MONOPOLY: 0 },
      longestRoad: false,
      largestArmy: false
    },
    {
      id: "discord_id_toi",
      username: "TechLead",
      color: "🔵",
      score: 5, 
      resources: { WOOD: 0, BRICK: 0, SHEEP: 4, WHEAT: 2, ORE: 3 }, 
      devCards: { KNIGHT: 0, VICTORY_POINT: 1, MONOPOLY: 0 },
      longestRoad: true,
      largestArmy: false
    }
  ],

  board: {
    hexes: [
      { id: "0,0", q: 0, r: 0, resource: "DESERT", numberToken: null, hasRobber: true },
      { id: "1,0", q: 1, r: 0, resource: "WOOD", numberToken: 6, hasRobber: false },
      { id: "0,1", q: 0, r: 1, resource: "ORE", numberToken: 8, hasRobber: false },
      { id: "-1,1", q: -1, r: 1, resource: "WHEAT", numberToken: 3, hasRobber: false }
    ],
    
    buildings: [
      { intersectionId: "0,0|1,0|0,1", ownerId: "discord_id_rayan", type: "CITY" },
      { intersectionId: "-1,1|0,0|0,1", ownerId: "discord_id_toi", type: "SETTLEMENT" }
    ],

    roads: [
      { edgeId: "0,0|1,0", ownerId: "discord_id_rayan" }
    ]
  }
};