import { Gem, GemType, SpecialGemType, RuneSeal, RuneSealType, EnemyType } from './types';
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

  // 1. Scan Horizontal Runs
  for (let r = 0; r < ROWS; r++) {
    let currentCols: number[] = [];
    let currentType: GemType | null = null;

    for (let c = 0; c < COLS; c++) {
      const gem = grid[r][c];
      if (gem && gem.type === currentType) {
        currentCols.push(c);
      } else {
        if (currentCols.length >= 3 && currentType) {
          hRuns.push({ row: r, cols: [...currentCols], type: currentType });
        }
        currentCols = gem ? [c] : [];
        currentType = gem ? gem.type : null;
      }
    }
    if (currentCols.length >= 3 && currentType) {
      hRuns.push({ row: r, cols: [...currentCols], type: currentType });
    }
  }

  // 2. Scan Vertical Runs
  for (let c = 0; c < COLS; c++) {
    let currentRows: number[] = [];
    let currentType: GemType | null = null;

    for (let r = 0; r < ROWS; r++) {
      const gem = grid[r][c];
      if (gem && gem.type === currentType) {
        currentRows.push(r);
      } else {
        if (currentRows.length >= 3 && currentType) {
          vRuns.push({ col: c, rows: [...currentRows], type: currentType });
        }
        currentRows = gem ? [r] : [];
        currentType = gem ? gem.type : null;
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

  // Check for T / L Intersections (Cross Bomb creation: detonates row + col)
  hRuns.forEach(hRun => {
    vRuns.forEach(vRun => {
      if (hRun.type === vRun.type && hRun.cols.includes(vRun.col) && vRun.rows.includes(hRun.row)) {
        const intersectionPos = { row: hRun.row, col: vRun.col };
        specialsToCreate.push({
          row: intersectionPos.row,
          col: intersectionPos.col,
          gemType: hRun.type,
          specialType: 'bomb_cross'
        });
      }
    });
  });

  // If no intersection bomb created, check individual runs
  if (specialsToCreate.length === 0) {
    // 5-matches in a straight line create Rainbow Star
    hRuns.forEach(run => {
      const coords = run.cols.map(c => ({ row: run.row, col: c }));
      const target = chooseTargetPos(coords);
      if (run.cols.length >= 5) {
        specialsToCreate.push({ ...target, gemType: run.type, specialType: 'rainbow' });
      }
    });

    vRuns.forEach(run => {
      const coords = run.rows.map(r => ({ row: r, col: run.col }));
      const target = chooseTargetPos(coords);
      if (run.rows.length >= 5) {
        if (!specialsToCreate.some(s => s.row === target.row && s.col === target.col)) {
          specialsToCreate.push({ ...target, gemType: run.type, specialType: 'rainbow' });
        }
      }
    });

    // 4-matches (Horizontal Arrow Gem or Vertical Arrow Gem)
    if (specialsToCreate.length === 0) {
      hRuns.forEach(run => {
        const coords = run.cols.map(c => ({ row: run.row, col: c }));
        const target = chooseTargetPos(coords);
        if (run.cols.length === 4) {
          specialsToCreate.push({ ...target, gemType: run.type, specialType: 'arrow_horizontal' });
        }
      });

      vRuns.forEach(run => {
        const coords = run.rows.map(r => ({ row: r, col: run.col }));
        const target = chooseTargetPos(coords);
        if (run.rows.length === 4) {
          if (!specialsToCreate.some(s => s.row === target.row && s.col === target.col)) {
            specialsToCreate.push({ ...target, gemType: run.type, specialType: 'arrow_vertical' });
          }
        }
      });
    }
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

export const isCellFrozen = (row: number, col: number, runeSeals?: RuneSeal[]): boolean => {
  if (!runeSeals || runeSeals.length === 0) return false;
  return runeSeals.some(s => s.row === row && s.col === col && s.hp > 0);
};

export const shuffleGems = (gems: Gem[], runeSeals: RuneSeal[] = []): Gem[] => {
  const frozenPosKeys = new Set(runeSeals.filter(s => s.hp > 0).map(s => `${s.row},${s.col}`));

  for (let attempt = 0; attempt < 100; attempt++) {
    const nonFrozenGems = gems.filter(g => !frozenPosKeys.has(`${g.row},${g.col}`));
    const frozenGems = gems.filter(g => frozenPosKeys.has(`${g.row},${g.col}`));

    const shuffledNonFrozen = [...nonFrozenGems];
    for (let i = shuffledNonFrozen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      
      // Swap properties but keep row/col the same to shuffle in place
      const tempType = shuffledNonFrozen[i].type;
      const tempSpecial = shuffledNonFrozen[i].special;
      const tempId = shuffledNonFrozen[i].id;
      
      shuffledNonFrozen[i] = { ...shuffledNonFrozen[i], type: shuffledNonFrozen[j].type, special: shuffledNonFrozen[j].special, id: shuffledNonFrozen[j].id };
      shuffledNonFrozen[j] = { ...shuffledNonFrozen[j], type: tempType, special: tempSpecial, id: tempId };
    }
    
    const combined = [...frozenGems, ...shuffledNonFrozen];
    if (findMatches(combined).size === 0 && findHint(combined, runeSeals)) {
      return combined;
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
// Also respects frozen/sealed tiles: frozen gems cannot be swapped!
export const findHint = (gems: Gem[], runeSeals: RuneSeal[] = []): [string, string] | null => {
  const frozenPosKeys = new Set(runeSeals.filter(s => s.hp > 0).map(s => `${s.row},${s.col}`));
  const grid = new Array(ROWS).fill(null).map(() => new Array(COLS).fill(null)) as (Gem | null)[][];
  gems.forEach(g => {
    if (g.row >= 0 && g.row < ROWS && g.col >= 0 && g.col < COLS) {
      grid[g.row][g.col] = g;
    }
  });

  const tryPair = (a: Gem, b: Gem): boolean => {
    // If either gem is frozen, player cannot swap it!
    if (frozenPosKeys.has(`${a.row},${a.col}`) || frozenPosKeys.has(`${b.row},${b.col}`)) {
      return false;
    }
    // Special + Special combo is always valid
    if (a.special && b.special) {
      return true;
    }
    // Rainbow + any gem is always valid
    if (a.special === 'rainbow' || b.special === 'rainbow') {
      return true;
    }
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

/**
 * Generates Arcane Rune Seals (translucent block barriers over grid cells)
 * based on the encounter difficulty, enemy type, and dungeon chapter.
 */
export const generateStageRuneSeals = (
  layer: number,
  enemyType: EnemyType = 'goblin',
  isBoss = false,
  chapter = 1
): RuneSeal[] => {
  // Determine seal theme based on enemy affinity
  let sealType: RuneSealType = 'arcane';
  if (['dragon', 'imp', 'phoenix'].includes(enemyType)) {
    sealType = 'dragon';
  } else if (['kraken', 'slime', 'elf'].includes(enemyType)) {
    sealType = 'frost';
  } else if (['golem', 'mummy', 'skeleton'].includes(enemyType)) {
    sealType = 'relic';
  } else {
    sealType = 'arcane';
  }

  const positions: { row: number; col: number; hp: number }[] = [];
  const patternIndex = (layer + chapter) % 4;

  if (isBoss) {
    // Boss pattern: 8 to 10 seals with reinforced 2-HP seals
    const bossCoords = [
      { row: 1, col: 1, hp: 2 }, { row: 1, col: 5, hp: 2 },
      { row: 5, col: 1, hp: 2 }, { row: 5, col: 5, hp: 2 },
      { row: 2, col: 3, hp: 1 }, { row: 4, col: 3, hp: 1 },
      { row: 3, col: 2, hp: 1 }, { row: 3, col: 4, hp: 1 },
      { row: 3, col: 3, hp: 2 },
    ];
    positions.push(...bossCoords);
  } else {
    switch (patternIndex) {
      case 0: // Cross / Plus
        positions.push(
          { row: 3, col: 3, hp: layer >= 4 ? 2 : 1 },
          { row: 2, col: 3, hp: 1 },
          { row: 4, col: 3, hp: 1 },
          { row: 3, col: 2, hp: 1 },
          { row: 3, col: 4, hp: 1 }
        );
        break;
      case 1: // Four Corners + Center
        positions.push(
          { row: 1, col: 1, hp: layer >= 3 ? 2 : 1 },
          { row: 1, col: 5, hp: layer >= 3 ? 2 : 1 },
          { row: 5, col: 1, hp: layer >= 3 ? 2 : 1 },
          { row: 5, col: 5, hp: layer >= 3 ? 2 : 1 },
          { row: 3, col: 3, hp: 1 }
        );
        break;
      case 2: // Diamond Ring
        positions.push(
          { row: 2, col: 3, hp: 1 },
          { row: 3, col: 2, hp: 1 },
          { row: 3, col: 4, hp: 1 },
          { row: 4, col: 3, hp: 1 },
          { row: 1, col: 3, hp: layer >= 4 ? 2 : 1 },
          { row: 5, col: 3, hp: layer >= 4 ? 2 : 1 }
        );
        break;
      default: // Twin Columns
        positions.push(
          { row: 2, col: 2, hp: 1 },
          { row: 3, col: 2, hp: layer >= 4 ? 2 : 1 },
          { row: 4, col: 2, hp: 1 },
          { row: 2, col: 4, hp: 1 },
          { row: 3, col: 4, hp: layer >= 4 ? 2 : 1 },
          { row: 4, col: 4, hp: 1 }
        );
        break;
    }
  }

  return positions.map((p, idx) => ({
    id: `seal-${Date.now()}-${idx}-${p.row}-${p.col}`,
    row: p.row,
    col: p.col,
    hp: p.hp,
    maxHp: p.hp,
    type: sealType,
  }));
};

/**
 * Checks for direct matches on a rune seal OR adjacent matches touching it.
 * Damaged seals drop 1 HP; at 0 HP they shatter and trigger Arcane bursts.
 */
export const checkRuneSealHits = (
  currentSeals: RuneSeal[],
  matchedGems: Gem[],
  blastCoords: { row: number; col: number }[] = []
): {
  remainingSeals: RuneSeal[];
  shatteredSeals: RuneSeal[];
  crackedSeals: RuneSeal[];
} => {
  if (currentSeals.length === 0) {
    return { remainingSeals: [], shatteredSeals: [], crackedSeals: [] };
  }

  // Set of all affected coordinate keys
  const affectedKeys = new Set<string>();

  // 1. Direct matched gem locations
  matchedGems.forEach(g => {
    affectedKeys.add(`${g.row},${g.col}`);
    // 2. Orthogonally adjacent neighbors (Up, Down, Left, Right)
    if (g.row > 0) affectedKeys.add(`${g.row - 1},${g.col}`);
    if (g.row < ROWS - 1) affectedKeys.add(`${g.row + 1},${g.col}`);
    if (g.col > 0) affectedKeys.add(`${g.row},${g.col - 1}`);
    if (g.col < COLS - 1) affectedKeys.add(`${g.row},${g.col + 1}`);
  });

  // 3. Any special bomb or laser blast coordinates
  blastCoords.forEach(b => {
    affectedKeys.add(`${b.row},${b.col}`);
    if (b.row > 0) affectedKeys.add(`${b.row - 1},${b.col}`);
    if (b.row < ROWS - 1) affectedKeys.add(`${b.row + 1},${b.col}`);
    if (b.col > 0) affectedKeys.add(`${b.row},${b.col - 1}`);
    if (b.col < COLS - 1) affectedKeys.add(`${b.row},${b.col + 1}`);
  });

  const remainingSeals: RuneSeal[] = [];
  const shatteredSeals: RuneSeal[] = [];
  const crackedSeals: RuneSeal[] = [];

  currentSeals.forEach(seal => {
    const sealKey = `${seal.row},${seal.col}`;
    if (affectedKeys.has(sealKey)) {
      const nextHp = seal.hp - 1;
      if (nextHp <= 0) {
        shatteredSeals.push({ ...seal, hp: 0 });
      } else {
        const updated = { ...seal, hp: nextHp };
        crackedSeals.push(updated);
        remainingSeals.push(updated);
      }
    } else {
      remainingSeals.push(seal);
    }
  });

  return { remainingSeals, shatteredSeals, crackedSeals };
};
