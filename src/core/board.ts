import { Hex, ResourceType } from './types.js';

export function generateStandardBoard(): Hex[] {
  const resources: ResourceType[] = [
    'WOOD', 'WOOD', 'WOOD', 'WOOD',
    'SHEEP', 'SHEEP', 'SHEEP', 'SHEEP',
    'WHEAT', 'WHEAT', 'WHEAT', 'WHEAT',
    'BRICK', 'BRICK', 'BRICK',
    'ORE', 'ORE', 'ORE',
    'DESERT'
  ];

  const numberTokens: number[] = [
    2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12
  ];

  const coords = [
    { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 },
    { q: -1, r: -1 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: -1 },
    { q: -2, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 },
    { q: -2, r: 1 }, { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 },
    { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 }
  ];

  const shuffle = <T>(array: T[]): T[] => {
    return array.sort(() => Math.random() - 0.5);
  };

  const shuffledResources = shuffle(resources);
  const shuffledTokens = shuffle(numberTokens);

  let tokenIdx = 0;
  return coords.map((coord, idx) => {
    const resource = shuffledResources[idx]!;
    const hasRobber = resource === 'DESERT';
    const numberToken = hasRobber ? null : shuffledTokens[tokenIdx++];
    
    return {
      id: `${coord.q},${coord.r}`,
      q: coord.q,
      r: coord.r,
      resource,
      numberToken: numberToken ?? null,
      hasRobber
    };
  });
}
