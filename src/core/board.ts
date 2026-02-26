export type RessourceType = 'WOOD' | 'BRICK' | 'SHEEP' | 'WHEAT' | 'ORE' | 'DESERT';

export interface Hex {
    id: string; 
    q: number;
    r: number;
    ressource: RessourceType;
    numberToken: number | null; 
    hasRobber: boolean;
}