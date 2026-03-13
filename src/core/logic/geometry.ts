export function getIntersectionId(h1: string, h2: string, h3: string): string {
    return [h1, h2, h3].sort().join('|');
}

export function getEdgeId(h1: string, h2: string): string {
    return [h1, h2].sort().join('|');
}

export interface Point {
    q: number;
    r: number;
}

export function getNeighbors(q: number, r: number): Point[] {
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    return directions.map(d => ({ q: q + d.q, r: r + d.r }));
}
