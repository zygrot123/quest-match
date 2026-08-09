import { Gem, GemType, SpecialGemType } from './types';
import { ROWS, COLS } from './constants';

export const GEM_TYPES: GemType[] = ['sword', 'fire', 'water', 'earth', 'heart', 'light', 'dark'];

export const createRandomGem = (row: number, col: number): Gem => ({
  id: Math.random().toString(36).substring(2, 11),
  type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)],
  row,
  col,
});

export const generateGrid = (): Gem[] => {
  const grid: Gem[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Gem[] = [];
    for (let c = 0; c < COLS; c++) {
      let gem;
      do {
        gem = createRandomGem(r, c);
      } while (
        (r >= 2 && grid[r - 1][c].type === gem.type && grid[r - 2][c].type === gem.type) ||
        (c >= 2 && row[c - 1].type === gem.type && row[c - 2].type === gem.type)
      );
      row.push(gem);
    }
    grid.push(row);
  }
  return grid.flat();
};

// Like generateGrid, but also guarantees the board has at least one legal move
// available so the player is never handed (or left on) a board that's
// impossible to play. Used both for the initial deal and to reshuffle when a
// stalemate is detected mid-game.
export const generateSolvableGrid = (): Gem[] => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const grid = generateGrid();
    if (findHint(grid)) return grid;
  }
  // Astronomically unlikely to ever fall through, but return the last
  // attempt rather than nothing if it somehow does.
  return generateGrid();
};

export interface SpecialGemCreation {
  row: number;
  col: number;
  gemType: GemType;
  specialType: SpecialGemType;
}

export interface MatchAnalysis {
  matchedIds: Set<string>;
  specialsToCreate: SpecialGemCreation[];
}

export const analyzeMatches = (gems: Gem[], lastSwappedPos?: { row: number; col: number }): MatchAnalysis => {
  const matchedIds = new Set<string>();
  const specialsToCreate: SpecialGemCreation[] = [];

  const grid = new Array(ROWS).fill(null).map(() => new Array(COLS).fill(null)) as (Gem | null)[][];
  gems.forEach(g => {
    if (g.row >= 0 && g.row < ROWS && g.col >= 0 && g.col < COLS) {
      grid[g.row][g.col] = g;
    }
  });

  const hRuns: { row: number; cols: number[]; type: GemType }[] = [];
  const vRuns: { col: number; rows: number[]; type: GemType }[] = [];

  // 1. Scan Horizontal Runs (dark_void vertical gems cannot match horizontally)
  for (let r = 0; r < ROWS; r++) {
    let currentCols: number[] = [];
    let currentType: GemType | null = null;

    for (let c = 0; c < COLS; c++) {
      const gem = grid[r][c];
      const isValidForHRun = gem && gem.special !== 'dark_void';
      if (isValidForHRun && gem.type === currentType) {
        currentCols.push(c);
      } else {
        if (currentCols.length >= 3 && currentType) {
          hRuns.push({ row: r, cols: [...currentCols], type: currentType });
        }
        currentCols = isValidForHRun ? [c] : [];
        currentType = isValidForHRun ? gem.type : null;
      }
    }
    if (currentCols.length >= 3 && currentType) {
      hRuns.push({ row: r, cols: [...currentCols], type: currentType });
    }
  }

  // 2. Scan Vertical Runs (light_holy horizontal gems cannot match vertically)
  for (let c = 0; c < COLS; c++) {
    let currentRows: number[] = [];
    let currentType: GemType | null = null;

    for (let r = 0; r < ROWS; r++) {
      const gem = grid[r][c];
      const isValidForVRun = gem && gem.special !== 'light_holy';
      if (isValidForVRun && gem.type === currentType) {
        currentRows.push(r);
      } else {
        if (currentRows.length >= 3 && currentType) {
          vRuns.push({ col: c, rows: [...currentRows], type: currentType });
        }
        currentRows = isValidForVRun ? [r] : [];
        currentType = isValidForVRun ? gem.type : null;
      }
    }
    if (currentRows.length >= 3 && currentType) {
      vRuns.push({ col: c, rows: [...currentRows], type: currentType });
    }
  }

  // Collect all matched IDs
  hRuns.forEach(run => run.cols.forEach(c => {
    const g = grid[run.row][c];
    if (g) matchedIds.add(g.id);
  }));
  vRuns.forEach(run => run.rows.forEach(r => {
    const g = grid[r][run.col];
    if (g) matchedIds.add(g.id);
  }));

  // Helper to pick target position for Special Gem spawn
  const chooseTargetPos = (candidatePositions: { row: number; col: number }[]) => {
    if (lastSwappedPos) {
      const foundSwapped = candidatePositions.find(p => p.row === lastSwappedPos.row && p.col === lastSwappedPos.col);
      if (foundSwapped) return foundSwapped;
    }
    // Default to middle position of run
    return candidatePositions[Math.floor(candidatePositions.length / 2)];
  };

  // Check for T / L Intersections (3x3 Bomb creation)
  hRuns.forEach(hRun => {
    vRuns.forEach(vRun => {
      if (hRun.type === vRun.type && hRun.cols.includes(vRun.col) && vRun.rows.includes(hRun.row)) {
        const intersectionPos = { row: hRun.row, col: vRun.col };
        specialsToCreate.push({
          row: intersectionPos.row,
          col: intersectionPos.col,
          gemType: hRun.type,
          specialType: 'bomb_3x3'
        });
      }
    });
  });

  // If no intersection bomb created, check individual runs
  if (specialsToCreate.length === 0) {
    hRuns.forEach(run => {
      const coords = run.cols.map(c => ({ row: run.row, col: c }));
      const target = chooseTargetPos(coords);
      if (run.cols.length === 4) {
        specialsToCreate.push({ ...target, gemType: run.type, specialType: 'light_holy' });
      } else if (run.cols.length >= 5) {
        specialsToCreate.push({ ...target, gemType: run.type, specialType: 'rainbow' });
      }
    });

    vRuns.forEach(run => {
      const coords = run.rows.map(r => ({ row: r, col: run.col }));
      const target = chooseTargetPos(coords);
      if (run.rows.length === 4) {
        if (!specialsToCreate.some(s => s.row === target.row && s.col === target.col)) {
          specialsToCreate.push({ ...target, gemType: run.type, specialType: 'dark_void' });
        }
      } else if (run.rows.length >= 5) {
        if (!specialsToCreate.some(s => s.row === target.row && s.col === target.col)) {
          specialsToCreate.push({ ...target, gemType: run.type, specialType: 'rainbow' });
        }
      }
    });
  }

  return { matchedIds, specialsToCreate };
};

export const findMatches = (gems: Gem[]): Set<string> => {
  return analyzeMatches(gems).matchedIds;
};

// Finds every gem orthogonally connected (up/down/left/right, transitively)
// to the given start gem that shares its element. Used by the bomb special so
// its blast only claims one unbroken patch of its own color, instead of
// clearing a fixed area regardless of what's actually touching it.
export const getConnectedSameTypeCluster = (gems: Gem[], start: Gem): Gem[] => {
  const grid = new Array(ROWS).fill(null).map(() => new Array(COLS).fill(null)) as (Gem | null)[][];
  gems.forEach(g => {
    if (g.row >= 0 && g.row < ROWS && g.col >= 0 && g.col < COLS) {
      grid[g.row][g.col] = g;
    }
  });

  const visited = new Set<string>();
  const cluster: Gem[] = [];
  const stack: Gem[] = [start];

  while (stack.length > 0) {
    const cur = stack.pop()!;
    const key = `${cur.row},${cur.col}`;
    if (visited.has(key)) continue;
    visited.add(key);
    cluster.push(cur);

    const neighbors = [
      cur.row > 0 ? grid[cur.row - 1][cur.col] : null,
      cur.row < ROWS - 1 ? grid[cur.row + 1][cur.col] : null,
      cur.col > 0 ? grid[cur.row][cur.col - 1] : null,
      cur.col < COLS - 1 ? grid[cur.row][cur.col + 1] : null,
    ];
    neighbors.forEach(n => {
      if (n && n.type === start.type && !visited.has(`${n.row},${n.col}`)) {
        stack.push(n);
      }
    });
  }

  return cluster;
};

export const shuffleGems = (gems: Gem[]): Gem[] => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const shuffled = [...gems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      
      // Swap properties but keep row/col the same to shuffle in place
      const tempType = shuffled[i].type;
      const tempSpecial = shuffled[i].special;
      const tempId = shuffled[i].id;
      
      shuffled[i] = { ...shuffled[i], type: shuffled[j].type, special: shuffled[j].special, id: shuffled[j].id };
      shuffled[j] = { ...shuffled[j], type: tempType, special: tempSpecial, id: tempId };
    }
    
    if (findMatches(shuffled).size === 0 && findHint(shuffled)) {
      return shuffled;
    }
  }
  // Fallback if we can't find a perfect shuffle
  return generateSolvableGrid();
};

export const isAdjacent = (g1: Gem, g2: Gem): boolean => {
  const dr = Math.abs(g1.row - g2.row);
  const dc = Math.abs(g1.col - g2.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
};

// Finds a legal swap that would create a match, for the "idle hint" nudge.
// Tries every gem against its right and bottom neighbor, swaps them in a
// throwaway copy of the board, and checks if that produces a match. Returns
// the pair of gem ids to highlight, or null if the board has no valid move
// (shouldn't normally happen since the grid is regenerated on stalemate).
export const findHint = (gems: Gem[]): [string, string] | null => {
  const grid = new Array(ROWS).fill(null).map(() => new Array(COLS).fill(null)) as (Gem | null)[][];
  gems.forEach(g => {
    if (g.row >= 0 && g.row < ROWS && g.col >= 0 && g.col < COLS) {
      grid[g.row][g.col] = g;
    }
  });

  const tryPair = (a: Gem, b: Gem): boolean => {
    const swapped = gems.map(g => {
      if (g.id === a.id) return { ...g, row: b.row, col: b.col };
      if (g.id === b.id) return { ...g, row: a.row, col: a.col };
      return g;
    });
    return findMatches(swapped).size > 0;
  };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gem = grid[r][c];
      if (!gem) continue;

      const right = c + 1 < COLS ? grid[r][c + 1] : null;
      if (right && tryPair(gem, right)) return [gem.id, right.id];

      const down = r + 1 < ROWS ? grid[r + 1][c] : null;
      if (down && tryPair(gem, down)) return [gem.id, down.id];
    }
  }

  return null;
};
