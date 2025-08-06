import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Poker hand matrix data
export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

export const HANDS: string[][] = [];
for (let i = 0; i < RANKS.length; i++) {
  const row: string[] = [];
  for (let j = 0; j < RANKS.length; j++) {
    const rank1 = RANKS[i];
    const rank2 = RANKS[j];

    if (i === j) {
      row.push(`${rank1}${rank1}`);
    } else if (i < j) {
      row.push(`${rank1}${rank2}s`);
    } else {
      row.push(`${rank2}${rank1}o`);
    }
  }
  HANDS.push(row);
}

export const allHands = HANDS.flat();

export const handToPositionMap = new Map<string, { row: number; col: number }>();
HANDS.forEach((row, rowIndex) => {
  row.forEach((hand, colIndex) => {
    handToPositionMap.set(hand, { row: rowIndex, col: colIndex });
  });
});

// Helper to get the number of combinations for a given hand type
export const getCombinations = (hand: string): number => {
  if (hand.length === 2 && hand[0] === hand[1]) { // Pair, e.g., 'AA'
    return 6;
  }
  if (hand.endsWith('s')) { // Suited, e.g., 'AKs'
    return 4;
  }
  if (hand.endsWith('o')) { // Offsuit, e.g., 'AKo'
    return 12;
  }
  return 0; // Should not happen for valid poker hands
};

export const allPossibleHands = allHands.flatMap(hand => {
  const combos = getCombinations(hand);
  return Array(combos).fill(hand);
});

// Calculate total possible combinations (1326)
export const TOTAL_POKER_COMBINATIONS = allHands.reduce((sum, hand) => sum + getCombinations(hand), 0);

export const getNeighbors = (row: number, col: number): string[] => {
  const neighbors: string[] = [];
  const moves = [
    [-1, 0], // up
    [1, 0],  // down
    [0, -1], // left
    [0, 1],  // right
  ];

  for (const [dr, dc] of moves) {
    const newRow = row + dr;
    const newCol = col + dc;

    if (newRow >= 0 && newRow < 13 && newCol >= 0 && newCol < 13) {
      neighbors.push(HANDS[newRow][newCol]);
    }
  }
  return neighbors;
};

export const generateBorderHands = (rangeHands: Record<string, string>, expansionLevel: 0 | 1 | 2): string[] => {
  if (!rangeHands || Object.keys(rangeHands).length === 0) {
    return [];
  }

  // 1. Find the initial border hands (Layer 0 on the edge of the range)
  let borderHands = new Set<string>();
  for (const hand in rangeHands) {
    const pos = handToPositionMap.get(hand);
    if (!pos) continue;

    const neighbors = getNeighbors(pos.row, pos.col);
    for (const neighbor of neighbors) {
      if (!rangeHands.hasOwnProperty(neighbor)) {
        borderHands.add(hand);
        break;
      }
    }
  }

  if (expansionLevel === 0) {
    return Array.from(borderHands);
  }

  // 2. Iteratively find neighbors for the given expansion level
  let currentLayer = new Set<string>(borderHands);
  const allExpandedHands = new Set<string>(borderHands);

  // We start with the border hands, so we find neighbors `expansionLevel` times
  for (let i = 0; i < expansionLevel; i++) {
    const nextLayer = new Set<string>();
    for (const hand of currentLayer) {
      const pos = handToPositionMap.get(hand);
      if (!pos) continue;
      const neighbors = getNeighbors(pos.row, pos.col);
      for (const neighbor of neighbors) {
        nextLayer.add(neighbor);
      }
    }
    
    // Add the new layer to the final set
    nextLayer.forEach(hand => allExpandedHands.add(hand));
    
    // The next iteration should expand from the newly found layer
    currentLayer = nextLayer;
  }

  return Array.from(allExpandedHands);
};
