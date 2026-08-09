import { Equipment, ItemPassive, ItemRarity, MapNode, MapNodeType, EnemyType } from './types';

export const generateMap = (depth: number): MapNode[][] => {
  const map: MapNode[][] = [];
  const minionTypes: EnemyType[] = ['goblin', 'slime', 'imp', 'skeleton'];
  const bossTypes: EnemyType[] = ['dragon', 'elf', 'golem', 'minotaur', 'phoenix'];

  for (let i = 0; i < depth; i++) {
    const isApexBossLayer = (i === depth - 1);
    const layerSize = isApexBossLayer ? 1 : Math.max(2, Math.floor(Math.random() * 2) + 2);
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

// Realistic fantasy equipment database with authentic craftsmanship & balanced stats
interface RealisticItemTemplate {
  name: string;
  slot: 'head' | 'body' | 'weapon';
  baseRarity: ItemRarity;
  icon: string;
  description: string;
  baseAtk: number;
  baseDef: number;
  baseHp: number;
  elemBonus?: { type: 'fire' | 'water' | 'earth' | 'light' | 'dark'; value: number };
  critBonus?: { chance: number; dmg: number };
  possiblePassives?: ItemPassive[];
}

export const REALISTIC_ITEMS_DATABASE: RealisticItemTemplate[] = [
  // --- WEAPONS ---
  {
    name: 'Iron Broadsword',
    slot: 'weapon',
    baseRarity: 'common',
    icon: '🗡️',
    description: 'A standard castle-forged blade with sturdy crossguard and brass pommel.',
    baseAtk: 4,
    baseDef: 1,
    baseHp: 5
  },
  {
    name: 'Hunter\'s Recurve Bow',
    slot: 'weapon',
    baseRarity: 'common',
    icon: '🏹',
    description: 'Yew wood bow with waxed hemp string, built for swift pinpoint strikes.',
    baseAtk: 4,
    baseDef: 0,
    baseHp: 0,
    critBonus: { chance: 3, dmg: 15 }
  },
  {
    name: 'Ashwood Quarterstaff',
    slot: 'weapon',
    baseRarity: 'common',
    icon: '🦯',
    description: 'A balanced fighting stave tipped with bronze ferrules.',
    baseAtk: 3,
    baseDef: 2,
    baseHp: 10
  },
  {
    name: 'Tempered Steel Arming Sword',
    slot: 'weapon',
    baseRarity: 'rare',
    icon: '⚔️',
    description: 'Folded high-carbon steel, keenly balanced for tactical parries and slashes.',
    baseAtk: 6,
    baseDef: 2,
    baseHp: 10,
    critBonus: { chance: 3, dmg: 20 }
  },
  {
    name: 'Silver-Edged Estoc',
    slot: 'weapon',
    baseRarity: 'rare',
    icon: '🤺',
    description: 'A rigid thrusting rapier inlaid with fine silver filigree to pierce armor seams.',
    baseAtk: 6,
    baseDef: 1,
    baseHp: 8,
    critBonus: { chance: 5, dmg: 25 }
  },
  {
    name: 'Dwarven War Flail',
    slot: 'weapon',
    baseRarity: 'rare',
    icon: '🪓',
    description: 'A heavy spiked iron sphere on hardened steel chain links.',
    baseAtk: 7,
    baseDef: 1,
    baseHp: 12,
    elemBonus: { type: 'earth', value: 2 }
  },
  {
    name: 'Flameforged Longsword',
    slot: 'weapon',
    baseRarity: 'epic',
    icon: '🔥',
    description: 'Quenched in subterranean magma, its tempered edge radiates searing heat.',
    baseAtk: 9,
    baseDef: 2,
    baseHp: 15,
    elemBonus: { type: 'fire', value: 3 },
    possiblePassives: [
      { type: 'elementBoost', value: 12, element: 'fire', name: 'Pyro Resonance', description: '+12% Fire Gem Match Damage' },
      { type: 'dotBurn', value: 2, name: 'Searing Edge', description: 'Burns enemy for 2 DMG per turn' }
    ]
  },
  {
    name: 'Tidecaller Glaive',
    slot: 'weapon',
    baseRarity: 'epic',
    icon: '🔱',
    description: 'A marine-polearm carved from iridescent coral and tempered river-steel.',
    baseAtk: 8,
    baseDef: 3,
    baseHp: 20,
    elemBonus: { type: 'water', value: 3 },
    possiblePassives: [
      { type: 'elementBoost', value: 12, element: 'water', name: 'Tidal Flow', description: '+12% Water Gem Match Damage' },
      { type: 'vampire', value: 3, name: 'Siphon Tide', description: 'Heals hero for 3% of match damage dealt' }
    ]
  },
  {
    name: 'Dragonfang Halberd',
    slot: 'weapon',
    baseRarity: 'legendary',
    icon: '🐉',
    description: 'Masterwork poleaxe forged from a wyrm\'s hardened ivory tooth and obsidian core.',
    baseAtk: 12,
    baseDef: 4,
    baseHp: 25,
    elemBonus: { type: 'fire', value: 4 },
    critBonus: { chance: 4, dmg: 30 },
    possiblePassives: [
      { type: 'dotBurn', value: 3, name: 'Wyrmflame Brand', description: 'Burns enemy for 3 DMG per turn' },
      { type: 'vampire', value: 4, name: 'Draconic Feast', description: 'Heals hero for 4% of match damage dealt' }
    ]
  },
  {
    name: 'Dawnstar Relic Blade',
    slot: 'weapon',
    baseRarity: 'legendary',
    icon: '✨',
    description: 'Ancient solar greatsword passed down by the holy Knights of the Radiant Dawn.',
    baseAtk: 11,
    baseDef: 4,
    baseHp: 30,
    elemBonus: { type: 'light', value: 4 },
    critBonus: { chance: 5, dmg: 25 },
    possiblePassives: [
      { type: 'slowHeal', value: 2, name: 'Sunlight Blessing', description: 'Regenerates +2 HP each turn in battle' },
      { type: 'elementBoost', value: 15, element: 'earth', name: 'Radiant Might', description: '+15% Earth/Light match potency' }
    ]
  },

  // --- HEADGEAR ---
  {
    name: 'Padded Arming Cap',
    slot: 'head',
    baseRarity: 'common',
    icon: '🧢',
    description: 'Multi-layered quilted linen coif that softens bludgeoning impacts.',
    baseAtk: 0,
    baseDef: 2,
    baseHp: 12
  },
  {
    name: 'Hardened Leather Hood',
    slot: 'head',
    baseRarity: 'common',
    icon: '🤠',
    description: 'Boiled cowhide hood with brass rivets, favored by scouts and trackers.',
    baseAtk: 1,
    baseDef: 2,
    baseHp: 10
  },
  {
    name: 'Iron Kettle Bascinet',
    slot: 'head',
    baseRarity: 'rare',
    icon: '🪖',
    description: 'A conical iron helmet with broad protective brim and chin strap.',
    baseAtk: 0,
    baseDef: 4,
    baseHp: 22
  },
  {
    name: 'Ranger\'s Feathered Sallet',
    slot: 'head',
    baseRarity: 'rare',
    icon: '🎩',
    description: 'Streamlined curved helmet crowned with a falcon feather for vision agility.',
    baseAtk: 2,
    baseDef: 3,
    baseHp: 18,
    critBonus: { chance: 2, dmg: 10 }
  },
  {
    name: 'Spired Mage Circlet',
    slot: 'head',
    baseRarity: 'epic',
    icon: '🔮',
    description: 'A silver band set with a focusing sapphire that steadies elemental concentration.',
    baseAtk: 2,
    baseDef: 4,
    baseHp: 25,
    elemBonus: { type: 'water', value: 2 },
    possiblePassives: [
      { type: 'slowHeal', value: 2, name: 'Mind Clarity', description: 'Restores +2 HP every turn in combat' }
    ]
  },
  {
    name: 'Crown of the Mountain Sentinel',
    slot: 'head',
    baseRarity: 'legendary',
    icon: '👑',
    description: 'Heavy granite-forged coronet that grants unshakable stoic resilience.',
    baseAtk: 2,
    baseDef: 7,
    baseHp: 45,
    elemBonus: { type: 'earth', value: 3 },
    possiblePassives: [
      { type: 'hpBoost', value: 10, name: 'Titan Fortitude', description: '+10% Max HP pool boost' },
      { type: 'slowHeal', value: 3, name: 'Earthen Vigour', description: 'Restores +3 HP every turn in combat' }
    ]
  },

  // --- BODY ARMOR ---
  {
    name: 'Quilted Linen Gambeson',
    slot: 'body',
    baseRarity: 'common',
    icon: '🥋',
    description: 'Tough multilayered wool and linen tunic providing essential defense.',
    baseAtk: 0,
    baseDef: 3,
    baseHp: 18
  },
  {
    name: 'Studded Leather Vest',
    slot: 'body',
    baseRarity: 'common',
    icon: '🦺',
    description: 'Reinforced oiled leather with iron studs across the chest and shoulders.',
    baseAtk: 1,
    baseDef: 3,
    baseHp: 20
  },
  {
    name: 'Interlocking Chainmail Hauberk',
    slot: 'body',
    baseRarity: 'rare',
    icon: '🧥',
    description: 'Thousands of riveted iron rings layered over heavy boiled padding.',
    baseAtk: 0,
    baseDef: 6,
    baseHp: 35
  },
  {
    name: 'Hardened Brigandine Coat',
    slot: 'body',
    baseRarity: 'rare',
    icon: '🛡️',
    description: 'Overlapping rectangular steel plates riveted beneath a sturdy velvet shell.',
    baseAtk: 1,
    baseDef: 5,
    baseHp: 30
  },
  {
    name: 'Tempered Knight Breastplate',
    slot: 'body',
    baseRarity: 'epic',
    icon: '🛡️',
    description: 'Solid forged steel cuirass with central deflection ridge and brass trim.',
    baseAtk: 1,
    baseDef: 9,
    baseHp: 50,
    possiblePassives: [
      { type: 'hpBoost', value: 8, name: 'Knight\'s Vow', description: '+8% Max HP pool boost' }
    ]
  },
  {
    name: 'Dragonscale Plate Armor',
    slot: 'body',
    baseRarity: 'legendary',
    icon: '🐉',
    description: 'Laminated crimson dragon scales woven with dwarf-steel wire, impervious to heat.',
    baseAtk: 2,
    baseDef: 12,
    baseHp: 70,
    elemBonus: { type: 'fire', value: 3 },
    possiblePassives: [
      { type: 'hpBoost', value: 12, name: 'Dragon Heart', description: '+12% Max HP pool boost' },
      { type: 'slowHeal', value: 2, name: 'Molten Blood', description: 'Restores +2 HP every turn in combat' }
    ]
  }
];

export const getRarityColor = (rarity: ItemRarity) => {
  switch (rarity) {
    case 'common': return 'text-slate-300 border-slate-700/80 bg-slate-900/80';
    case 'rare': return 'text-sky-300 border-sky-500/50 bg-sky-950/70 shadow-[0_0_12px_rgba(14,165,233,0.2)]';
    case 'epic': return 'text-purple-300 border-purple-500/50 bg-purple-950/70 shadow-[0_0_15px_rgba(168,85,247,0.25)]';
    case 'legendary': return 'text-amber-300 border-amber-500/70 bg-amber-950/80 shadow-[0_0_20px_rgba(245,158,11,0.35)]';
  }
};

export const getRarityBadge = (rarity: ItemRarity) => {
  switch (rarity) {
    case 'common': return 'bg-slate-800 text-slate-300 border-slate-600';
    case 'rare': return 'bg-sky-950 text-sky-300 border-sky-500/50';
    case 'epic': return 'bg-purple-950 text-purple-300 border-purple-500/50';
    case 'legendary': return 'bg-amber-950 text-amber-300 border-amber-500/80';
  }
};

export const getItemPrice = (item: Equipment): number => {
  switch (item.rarity) {
    case 'legendary': return 160;
    case 'epic': return 90;
    case 'rare': return 45;
    case 'common': return 20;
  }
};

export const getItemSellValue = (item: Equipment): number => {
  switch (item.rarity) {
    case 'legendary': return 80;
    case 'epic': return 45;
    case 'rare': return 22;
    case 'common': return 10;
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
  const roll = Math.random() + (isBoss ? 0.25 : 0);
  let targetRarity: ItemRarity = 'common';

  if (level <= 2) {
    if (roll > 0.98) targetRarity = 'legendary';
    else if (roll > 0.90) targetRarity = 'epic';
    else if (roll > 0.65) targetRarity = 'rare';
    else targetRarity = 'common';
  } else if (level <= 5) {
    if (roll > 0.94) targetRarity = 'legendary';
    else if (roll > 0.80) targetRarity = 'epic';
    else if (roll > 0.45) targetRarity = 'rare';
    else targetRarity = 'common';
  } else {
    if (roll > 0.85) targetRarity = 'legendary';
    else if (roll > 0.60) targetRarity = 'epic';
    else if (roll > 0.30) targetRarity = 'rare';
    else targetRarity = 'common';
  }

  // Filter templates matching slot and rarity (or fall back to closest)
  let pool = REALISTIC_ITEMS_DATABASE.filter(t => t.slot === selectedSlot && t.baseRarity === targetRarity);
  if (pool.length === 0) {
    pool = REALISTIC_ITEMS_DATABASE.filter(t => t.slot === selectedSlot);
  }

  const unownedPool = excludeNames ? pool.filter(t => !excludeNames.has(t.name)) : pool;
  const chosenTemplate = unownedPool.length > 0 
    ? unownedPool[Math.floor(Math.random() * unownedPool.length)]
    : pool[Math.floor(Math.random() * pool.length)];

  // Level scaling: +10% per dungeon tier (realistic and capped, avoiding power-trip spikes)
  const levelMult = 1 + (Math.max(1, level) - 1) * 0.12;

  const stats: Equipment['stats'] = {
    attack: Math.round(chosenTemplate.baseAtk * levelMult),
    defense: Math.round(chosenTemplate.baseDef * levelMult),
    maxHp: Math.round(chosenTemplate.baseHp * levelMult),
  };

  if (chosenTemplate.elemBonus) {
    const val = Math.round(chosenTemplate.elemBonus.value * (level > 4 ? 1.3 : 1.0));
    if (chosenTemplate.elemBonus.type === 'fire') stats.fireDmg = val;
    if (chosenTemplate.elemBonus.type === 'water') stats.waterDmg = val;
    if (chosenTemplate.elemBonus.type === 'earth') stats.earthDmg = val;
    if (chosenTemplate.elemBonus.type === 'light') stats.lightDmg = val;
    if (chosenTemplate.elemBonus.type === 'dark') stats.darkDmg = val;
  }

  if (chosenTemplate.critBonus) {
    stats.critChance = chosenTemplate.critBonus.chance;
    stats.critDmg = chosenTemplate.critBonus.dmg;
  }

  let passive: ItemPassive | undefined = undefined;
  if (chosenTemplate.possiblePassives && chosenTemplate.possiblePassives.length > 0) {
    passive = chosenTemplate.possiblePassives[Math.floor(Math.random() * chosenTemplate.possiblePassives.length)];
  }

  return {
    id: `eq-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: chosenTemplate.name,
    slot: chosenTemplate.slot,
    rarity: chosenTemplate.baseRarity,
    stats,
    passive,
    icon: chosenTemplate.icon,
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

  // Apply HP boost passives in balanced percentages
  passives.forEach(p => {
    if (p.type === 'hpBoost') {
      maxHp = Math.floor(maxHp * (1 + Math.min(25, p.value) / 100));
    }
  });

  return { attack, defense, maxHp, fireDmg, waterDmg, earthDmg, lightDmg, darkDmg, critChance, critDmg, passives };
};
