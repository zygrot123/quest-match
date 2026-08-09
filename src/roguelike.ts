import { Equipment, ItemPassive, ItemRarity, MapNode, MapNodeType, EnemyType } from './types';

export const generateMap = (depth: number): MapNode[][] => {
  const map: MapNode[][] = [];
  const minionTypes: EnemyType[] = ['goblin', 'slime', 'imp', 'skeleton'];
  const bossTypes: EnemyType[] = ['dragon', 'elf', 'golem'];

  for (let i = 0; i < depth; i++) {
    const isApexBossLayer = (i === depth - 1);
    const layerSize = isApexBossLayer ? 1 : Math.max(2, Math.floor(Math.random() * 2) + 2); // 2-3 nodes per layer, 1 Apex Boss
    const layer: MapNode[] = [];
    
    for (let j = 0; j < layerSize; j++) {
      let type: MapNodeType = 'combat';
      
      // 25% chance for rest or shop if not first or last layer
      if (i > 0 && i < depth - 1 && Math.random() < 0.25) {
        type = Math.random() > 0.5 ? 'rest' : 'shop';
      }
      
      let enemyType: EnemyType | undefined = undefined;
      let isBoss = false;

      if (type === 'combat') {
        if (isApexBossLayer) {
          isBoss = true;
          enemyType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
        } else {
          enemyType = minionTypes[Math.floor(Math.random() * minionTypes.length)];
        }
      }

      layer.push({
        id: `layer-${i}-node-${j}`,
        type,
        level: i + 1,
        enemyType,
        isBoss,
        completed: false,
        children: []
      });
    }

    map.push(layer);
  }

  // Generate explicit path connections (children indices) from layer i to layer i+1
  for (let i = 0; i < depth - 1; i++) {
    const currentLayer = map[i];
    const nextLayer = map[i + 1];

    currentLayer.forEach((node, j) => {
      const nextSize = nextLayer.length;
      if (nextSize === 1) {
        node.children = [0];
      } else {
        const ratio = j / Math.max(1, currentLayer.length - 1);
        const targetIdx = Math.round(ratio * (nextSize - 1));
        const children = new Set<number>();
        children.add(targetIdx);

        if (Math.random() < 0.5 && targetIdx + 1 < nextSize) {
          children.add(targetIdx + 1);
        } else if (Math.random() < 0.5 && targetIdx - 1 >= 0) {
          children.add(targetIdx - 1);
        }

        node.children = Array.from(children);
      }
    });

    // Ensure every node in nextLayer has at least one parent
    nextLayer.forEach((_, nextJ) => {
      const hasParent = currentLayer.some(n => n.children?.includes(nextJ));
      if (!hasParent) {
        let bestCurrentIdx = 0;
        let minDiff = 999;
        currentLayer.forEach((_, curJ) => {
          const diff = Math.abs((curJ / Math.max(1, currentLayer.length - 1)) - (nextJ / Math.max(1, nextLayer.length - 1)));
          if (diff < minDiff) {
            minDiff = diff;
            bestCurrentIdx = curJ;
          }
        });
        currentLayer[bestCurrentIdx].children?.push(nextJ);
      }
    });
  }

  return map;
};

const adjectives: Record<ItemRarity, string[]> = {
  common: ['Apprentice', 'Iron', 'Bronze', 'Wooden', 'Sturdy', 'Plain'],
  rare: ['Glacial', 'Volcanic', 'Verdant', 'Runic', 'Slayer\'s', 'Blessed'],
  epic: ['Infernal', 'Tidal', 'Gaia\'s', 'Phoenix', 'Abyssal', 'Vampiric'],
  legendary: ['Dragonlord\'s', 'Celestial', 'Godslayer', 'Eternal', 'Omni-Element', 'Mythic']
};

const headNouns = ['Helm', 'Crown', 'Diadem', 'Visor', 'Circlet'];
const bodyNouns = ['Armor', 'Cuirass', 'Robe', 'Plate', 'Vestments'];
const weaponNouns = ['Blade', 'Staff', 'Trident', 'Hammer', 'Greatsword'];

const icons = {
  head: ['🪖', '👑', '🎩', '🤠', '🔮'],
  body: ['👕', '🥋', '🧥', '🦺', '🛡️'],
  weapon: ['🗡️', '⚔️', '🪄', '🪓', '🔱']
};

export const getRarityColor = (rarity: ItemRarity) => {
  switch (rarity) {
    case 'common': return 'text-slate-300 border-slate-600 bg-slate-900/60';
    case 'rare': return 'text-blue-400 border-blue-500/60 bg-blue-950/60 shadow-[0_0_10px_rgba(59,130,246,0.3)]';
    case 'epic': return 'text-purple-400 border-purple-500/60 bg-purple-950/60 shadow-[0_0_15px_rgba(168,85,247,0.4)]';
    case 'legendary': return 'text-amber-300 border-amber-500/80 bg-amber-950/80 shadow-[0_0_20px_rgba(245,158,11,0.5)]';
  }
};

export const getRarityBadge = (rarity: ItemRarity) => {
  switch (rarity) {
    case 'common': return 'bg-slate-800 text-slate-300 border-slate-600';
    case 'rare': return 'bg-blue-950 text-blue-300 border-blue-500/50';
    case 'epic': return 'bg-purple-950 text-purple-300 border-purple-500/50';
    case 'legendary': return 'bg-amber-950 text-amber-300 border-amber-500/80 animate-pulse';
  }
};

export const getItemPrice = (item: Equipment): number => {
  switch (item.rarity) {
    case 'legendary': return 220;
    case 'epic': return 120;
    case 'rare': return 60;
    case 'common': return 25;
  }
};

export const getItemSellValue = (item: Equipment): number => {
  switch (item.rarity) {
    case 'legendary': return 80;
    case 'epic': return 40;
    case 'rare': return 20;
    case 'common': return 8;
  }
};

export const generateRandomEquipment = (
  level: number, 
  slot?: 'head' | 'body' | 'weapon',
  isBoss: boolean = false,
  excludeNames?: Set<string>
): Equipment => {
  const selectedSlot = slot || (['head', 'body', 'weapon'][Math.floor(Math.random() * 3)] as 'head' | 'body' | 'weapon');
  
  // Calculate balanced rarity thresholds based on level & boss flag
  const rawRoll = Math.random() + (isBoss ? 0.18 : 0);
  let rarity: ItemRarity = 'common';

  if (level <= 2) {
    // Stage 1-2: Extremely rare legendary, low epic chance
    if (rawRoll > 0.985) rarity = 'legendary';
    else if (rawRoll > 0.92) rarity = 'epic';
    else if (rawRoll > 0.70) rarity = 'rare';
    else rarity = 'common';
  } else if (level <= 4) {
    // Stage 3-4: Modest rare & epic chance
    if (rawRoll > 0.95) rarity = 'legendary';
    else if (rawRoll > 0.82) rarity = 'epic';
    else if (rawRoll > 0.55) rarity = 'rare';
    else rarity = 'common';
  } else if (level <= 6) {
    // Stage 5-6: Higher tier drops unlocked
    if (rawRoll > 0.90) rarity = 'legendary';
    else if (rawRoll > 0.72) rarity = 'epic';
    else if (rawRoll > 0.42) rarity = 'rare';
    else rarity = 'common';
  } else {
    // Stage 7+: Endgame drops
    if (rawRoll > 0.82) rarity = 'legendary';
    else if (rawRoll > 0.58) rarity = 'epic';
    else if (rawRoll > 0.30) rarity = 'rare';
    else rarity = 'common';
  }

  const adjList = adjectives[rarity];
  const nounList = selectedSlot === 'head' ? headNouns : selectedSlot === 'body' ? bodyNouns : weaponNouns;

  // Build every adjective+noun combo available for this slot/rarity, and prefer
  // one the player doesn't already own (in inventory or equipped) so drops feel
  // fresh instead of handing back the same item name repeatedly.
  const allCombos = adjList.flatMap(a => nounList.map(n => `${a} ${n}`));
  const freshCombos = excludeNames ? allCombos.filter(name => !excludeNames.has(name)) : allCombos;
  const pool = freshCombos.length > 0 ? freshCombos : allCombos; // fall back to allowing a repeat only if every combo is owned
  const chosenName = pool[Math.floor(Math.random() * pool.length)];
  const [adj] = chosenName.split(' ');
  const noun = chosenName.slice(adj.length + 1);
  
  const icon = icons[selectedSlot][Math.floor(Math.random() * icons[selectedSlot].length)];
  
  const rarityMult = rarity === 'legendary' ? 2.5 : rarity === 'epic' ? 1.8 : rarity === 'rare' ? 1.3 : 1.0;

  const stats: Equipment['stats'] = {
    attack: selectedSlot === 'weapon' 
      ? Math.floor((Math.random() * 4 + 4) * Math.max(1, level * 0.8) * rarityMult) 
      : Math.floor((Math.random() * 2 + 1) * Math.max(1, level * 0.5) * rarityMult),
    defense: selectedSlot !== 'weapon' 
      ? Math.floor((Math.random() * 3 + 2) * Math.max(1, level * 0.7) * rarityMult) 
      : Math.floor((Math.random() * 1.5) * Math.max(1, level * 0.4) * rarityMult),
    maxHp: Math.floor((Math.random() * 12 + 10) * Math.max(1, level * 0.8) * rarityMult),
  };

  // Elemental Bonus DMG stats based on slot or rarity
  if (rarity !== 'common' || Math.random() < 0.25) {
    const elemTypes: ('fire' | 'water' | 'earth' | 'light' | 'dark' | 'crit')[] = ['fire', 'water', 'earth', 'light', 'dark', 'crit'];
    const chosenElem = elemTypes[Math.floor(Math.random() * elemTypes.length)];
    const elemBonus = Math.floor((Math.random() * 4 + 3) * Math.max(1, level * 0.7) * rarityMult);
    
    if (chosenElem === 'fire') stats.fireDmg = elemBonus;
    if (chosenElem === 'water') stats.waterDmg = elemBonus;
    if (chosenElem === 'earth') stats.earthDmg = elemBonus;
    if (chosenElem === 'light') stats.lightDmg = elemBonus;
    if (chosenElem === 'dark') stats.darkDmg = elemBonus;
    if (chosenElem === 'crit') {
      stats.critChance = Math.floor(elemBonus * 0.5);
      stats.critDmg = Math.floor(elemBonus * 2.5);
    }
  }

  // Generate Special Passives for Rare+ items
  let passive: ItemPassive | undefined = undefined;

  if (rarity === 'legendary' || rarity === 'epic' || (rarity === 'rare' && Math.random() < 0.5)) {
    const passivePool: ItemPassive[] = [
      {
        type: 'slowHeal',
        value: Math.floor(2 * rarityMult),
        name: 'Regeneration',
        description: `Passively heals +${Math.floor(2 * rarityMult)} HP per turn in battle`
      },
      {
        type: 'dotBurn',
        value: Math.floor(3 * rarityMult),
        name: 'Flame Burn',
        description: `Burns enemy for ${Math.floor(3 * rarityMult)} DMG per turn in battle`
      },
      {
        type: 'vampire',
        value: Math.floor(6 * rarityMult),
        name: 'Vampiric Drain',
        description: `Heals player for ${Math.floor(6 * rarityMult)}% of match damage dealt`
      },
      {
        type: 'hpBoost',
        value: Math.floor(12 * rarityMult),
        name: 'Giant\'s Heart',
        description: `Boosts Max HP by +${Math.floor(12 * rarityMult)}%`
      },
      {
        type: 'elementBoost',
        value: 35,
        element: 'fire',
        name: 'Pyro Essence',
        description: `Increases Fire Gem damage by +35%`
      },
      {
        type: 'elementBoost',
        value: 35,
        element: 'water',
        name: 'Aquatic Surge',
        description: `Increases Water Gem damage by +35%`
      },
      {
        type: 'elementBoost',
        value: 35,
        element: 'earth',
        name: 'Terran Might',
        description: `Increases Earth Gem damage by +35%`
      }
    ];

    passive = passivePool[Math.floor(Math.random() * passivePool.length)];
  }

  return {
    id: `eq-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: `${adj} ${noun}`,
    slot: selectedSlot,
    rarity,
    stats,
    passive,
    icon
  };
};

export const calculateTotalStats = (
  baseStats: { baseAttack: number; baseDefense: number; baseMaxHp: number },
  equipment: { head: Equipment | null; body: Equipment | null; weapon: Equipment | null }
) => {
  let attack = baseStats.baseAttack;
  let defense = baseStats.baseDefense;
  let maxHp = baseStats.baseMaxHp;
  let fireDmg = 0;
  let waterDmg = 0;
  let earthDmg = 0;
  let lightDmg = 0;
  let darkDmg = 0;
  let critChance = 5; // Base crit chance 5%
  let critDmg = 150; // Base crit damage 150%
  let passives: ItemPassive[] = [];

  Object.values(equipment).forEach(eq => {
    if (eq) {
      if (eq.stats.attack) attack += eq.stats.attack;
      if (eq.stats.defense) defense += eq.stats.defense;
      if (eq.stats.maxHp) maxHp += eq.stats.maxHp;
      if (eq.stats.fireDmg) fireDmg += eq.stats.fireDmg;
      if (eq.stats.waterDmg) waterDmg += eq.stats.waterDmg;
      if (eq.stats.earthDmg) earthDmg += eq.stats.earthDmg;
      if (eq.stats.lightDmg) lightDmg += eq.stats.lightDmg;
      if (eq.stats.darkDmg) darkDmg += eq.stats.darkDmg;
      if (eq.stats.critChance) critChance += eq.stats.critChance;
      if (eq.stats.critDmg) critDmg += eq.stats.critDmg;
      if (eq.passive) passives.push(eq.passive);
    }
  });

  // Apply HP boost passives if present
  passives.forEach(p => {
    if (p.type === 'hpBoost') {
      maxHp = Math.floor(maxHp * (1 + p.value / 100));
    }
  });

  return { attack, defense, maxHp, fireDmg, waterDmg, earthDmg, lightDmg, darkDmg, critChance, critDmg, passives };
};

