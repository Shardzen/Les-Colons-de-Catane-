export type ResourceType = 'WOOD' | 'BRICK' | 'SHEEP' | 'WHEAT' | 'ORE' | 'DESERT';

export interface Hex {
    id: string; 
    q: number;
    r: number;
    resource: ResourceType;
    numberToken: number | null; 
    hasRobber: boolean;
}

export type BuildingType = 'SETTLEMENT' | 'CITY';

export interface Building {
    id: string;
    type: BuildingType;
    ownerId: string;
}

export interface Road {
    id: string; 
    ownerId: string;
}

export interface Player {
    id: string;
    username: string;
    resources: Record<ResourceType, number>;
    devCards: Record<string, number>;
    victoryPoints: number;
}

export interface GameState {
    id: number;
    players: Player[];
    currentPlayerIndex: number;
    board: {
        hexes: Hex[];
        buildings: Building[];
        roads: Road[];
    };
    status: 'PENDING' | 'ONGOING' | 'FINISHED';
}
