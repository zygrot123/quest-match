export type GemType = 'sword' | 'fire' | 'water' | 'earth' | 'heart' | 'light' | 'dark';

export type SpecialGemType = 'bomb_3x3' | 'rainbow' | 'light_holy' | 'dark_void';

export interface Gem {
  id: string;
  type: GemType;
  row: number;
  col: number;
  special?: SpecialGemType;
}

export type EquipmentSlot = 'head' | 'body' | 'weapon';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type ItemPassiveType = 'slowHeal' | 'dotBurn' | 'elementBoost' | 'hpBoost' | 'vampire';

export interface ItemPassive {
  type: ItemPassiveType;
  value: number;
  name: string;
  description: string;
  element?: GemType;
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  stats: {
    attack?: number;
    defense?: number;
    maxHp?: number;
    fireDmg?: number;
    waterDmg?: number;
    earthDmg?: number;
    lightDmg?: number;
    darkDmg?: number;
    critChance?: number;
    critDmg?: number;
  };
  passive?: ItemPassive;
  icon: string;
}

export interface PlayerStats {
  baseAttack: number;
  baseDefense: number;
  baseMaxHp: number;
}

export type MapNodeType = 'combat' | 'rest' | 'shop';

export type EnemyType = 
  | 'goblin' 
  | 'slime' 
  | 'imp' 
  | 'skeleton' 
  | 'dragon' 
  | 'elf' 
  | 'golem'
  | 'minotaur'
  | 'mummy'
  | 'specter'
  | 'kraken'
  | 'phoenix'
  | 'gargoyle'
  | 'vampire'
  | 'hydra';

export type HeroGender = 'male' | 'female';

export interface HeroProfile {
  id: string;
  name: string;
  gender: HeroGender;
  title: string;
  avatar?: string;
  portrait?: string;
  description: string;
  startingTrait?: string;
  perk?: string;
  stats?: {
    atkBonus?: number;
    hpBonus?: number;
    critBonus?: number;
    elementBoost?: string;
  };
}

export interface MapNode {
  id: string;
  type: MapNodeType;
  level?: number;
  layer?: number;
  enemyType?: EnemyType;
  isBoss?: boolean;
  isMiniBoss?: boolean;
  completed?: boolean;
  children?: number[];
}

export interface ShopItem {
  equipment: Equipment;
  price: number;
  sold: boolean;
}

export interface ChapterInfo {
  chapterNumber: number;
  title: string;
  subtitle: string;
  location: string;
  description: string;
  boardTheme: 'emerald' | 'lava' | 'ice' | 'void' | 'golden' | 'gothic' | 'mystic' | 'abyssal';
  bossEnemy: EnemyType;
  miniBossEnemy: EnemyType;
  mobs: EnemyType[];
}

export interface GameState {
  status: 'characterSelect' | 'storyIntro' | 'menu' | 'playing' | 'gameover' | 'victory' | 'store' | 'map' | 'rest' | 'shop' | 'bossIntro';
  heroGender: HeroGender;
  heroName: string;
  chapter: number; // 1 - 20
  stage: number;   // 1 - 10
  enemyMaxHp: number;
  enemyHp: number;
  playerMaxHp: number;
  playerHp: number;
  wrongSwipes: number;
  timer: number;
  level: number;
  gold: number;
  crystals: number;
  enemyType: EnemyType;
  isMiniBoss?: boolean;
  bossAbilityCooldown: number;
  bossStunTimer: number;
  
  // Roguelike elements
  mapNodes: MapNode[][]; // 2D array representing layers/choices
  currentLayer: number;
  stats: PlayerStats;
  equipment: {
    head: Equipment | null;
    body: Equipment | null;
    weapon: Equipment | null;
  };
  inventory: Equipment[];
  shopItems: ShopItem[];
}

export interface DamageNumber {
  id: string;
  amount: number | string;
  type: 'damage' | 'heal' | 'enemyAttack' | 'combo' | 'crit';
  x: number;
  y: number;
}


