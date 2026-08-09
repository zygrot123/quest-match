import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Coins, Play, RefreshCw, ShoppingCart, Crown, XCircle, Trophy, Skull, Map, Shield, Sword, Flame, Droplet, Leaf, Sparkles, Info, Package, Volume2, VolumeX } from 'lucide-react';
import { Gem, GameState, DamageNumber, GemType, MapNode, EquipmentSlot, Equipment, ShopItem, EnemyType, SpecialGemType } from './types';
import { generateGrid, findMatches, analyzeMatches, isAdjacent, createRandomGem, findHint } from './gameLogic';
import { generateMap, generateRandomEquipment, calculateTotalStats, getRarityColor, getRarityBadge, getItemPrice } from './roguelike';
import { ROWS, COLS, MATCH_DELAY, DROP_DELAY, SWIPE_LIMIT } from './constants';
import { GemIcon } from './components/GemIcon';
import { DamageOverlay } from './components/DamageOverlay';
import { BossModel } from './components/BossModel';
import { VFXCanvas, Particle, spawnExplosion, spawnFireEmbers, spawnWaterSplash, spawnEarthDust, spawnSwordSparks, spawnHeartAura, spawnElementalAura } from './components/VFXCanvas';
import { InventoryModal } from './components/InventoryModal';
import { audio } from './audio';
import { useGameAudio } from './hooks/useGameAudio';
import { cn } from './utils';

import dragonBg from './assets/images/dragon_bg_1786210057193.jpg';
import elfBg from './assets/images/elf_bg_1786210084496.jpg';
import golemBg from './assets/images/golem_bg_1786210071789.jpg';

const getEnemyInfo = (type: EnemyType) => {
  switch (type) {
    case 'dragon':
      return { name: 'ANCIENT DRAGON', isBoss: true, weak: 'water', weakText: 'Water', resist: 'fire', resistText: 'Fire', quote: '"Puny mortal! You shall burn in my flames!"' };
    case 'elf':
      return { name: 'CORRUPT WOOD ELF', isBoss: true, weak: 'earth', weakText: 'Earth', resist: 'water', resistText: 'Water', quote: '"My magic is absolute. Prepare to meet your end."' };
    case 'golem':
      return { name: 'STONE GOLEM', isBoss: true, weak: 'fire', weakText: 'Fire', resist: 'earth', resistText: 'Earth/Sword', quote: '"ROAR! STONE CRUSH WEAK FLESH!"' };
    case 'goblin':
      return { name: 'CAVE GOBLIN', isBoss: false, weak: 'fire', weakText: 'Fire', resist: 'earth', resistText: 'Earth', quote: '"Hand over your shiny gold, traveler!"' };
    case 'slime':
      return { name: 'CRYSTAL SLIME', isBoss: false, weak: 'earth', weakText: 'Earth', resist: 'water', resistText: 'Water', quote: '"*Bouncy gloop noises intensify!*"' };
    case 'imp':
      return { name: 'INFERNO IMP', isBoss: false, weak: 'water', weakText: 'Water', resist: 'fire', resistText: 'Fire', quote: '"Hehehe! Let us ignite your soul!"' };
    case 'skeleton':
      return { name: 'SKELETAL GUARD', isBoss: false, weak: 'fire', weakText: 'Fire', resist: 'water', resistText: 'Water', quote: '"None shall pass through this dungeon..."' };
  }
};

const MAX_GEM_SIZE = 60;
const MIN_GEM_SIZE = 26;
// Padding (px) inside the board's wrapper elements, subtracted from the measured
// container box to get the space actually usable by the grid itself.
const BOARD_WRAPPER_PADDING = 16 * 2; // backdrop wrapper's p-4 (left+right, top+bottom)
const BOARD_INNER_PADDING = 8; // gem-grid-container's own "+8" sizing
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Names of every item the player currently owns (bag + equipped), used to steer new drops away from exact repeats. */
const getOwnedItemNames = (state: GameState): Set<string> => {
  const names = new Set<string>();
  state.inventory.forEach(item => names.add(item.name));
  Object.values(state.equipment).forEach(item => { if (item) names.add(item.name); });
  return names;
};

/**
 * Computes the largest gem size that fits inside a measured container box,
 * instead of guessing how much vertical space the rest of the UI takes up.
 * This stays correct across screens (boss battles, different HUD heights),
 * orientations, and devices, since it's based on real measured layout space.
 */
const computeGemSizeForContainer = (containerWidth: number, containerHeight: number) => {
  const usableWidth = containerWidth - BOARD_WRAPPER_PADDING - BOARD_INNER_PADDING;
  const usableHeight = containerHeight - BOARD_WRAPPER_PADDING - BOARD_INNER_PADDING;
  const sizeFromWidth = Math.floor(usableWidth / COLS);
  const sizeFromHeight = Math.floor(usableHeight / ROWS);
  return Math.max(MIN_GEM_SIZE, Math.min(MAX_GEM_SIZE, sizeFromWidth, sizeFromHeight));
};

const GEM_ICON_COLORS: Record<GemType, string> = {
  sword: 'text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.8)]',
  fire: 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]',
  water: 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]',
  earth: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]',
  heart: 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]',
  light: 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]',
  dark: 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.9)]',
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'menu',
    enemyMaxHp: 100,
    enemyHp: 100,
    playerMaxHp: 100,
    playerHp: 100,
    wrongSwipes: 0,
    timer: 90,
    level: 1,
    gold: 0,
    crystals: 0,
    enemyType: 'dragon',
    bossAbilityCooldown: 15,
    bossStunTimer: 0,
    mapNodes: [],
    currentLayer: 0,
    stats: {
      baseAttack: 10,
      baseDefense: 5,
      baseMaxHp: 100,
    },
    equipment: {
      head: null,
      body: null,
      weapon: null,
    },
    inventory: [],
    shopItems: [],
  });

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [selectedEqModal, setSelectedEqModal] = useState<Equipment | null>(null);

  // GEM_SIZE now scales to whatever space Flexbox actually gives the board
  // wrapper (boardWrapperRef), rather than being a fixed pixel constant or a
  // guessed "reserved space" number. This stays correct even when the HUD
  // above the board (boss card, HP bars, etc.) varies in height between screens.
  const [GEM_SIZE, setGemSize] = useState(MAX_GEM_SIZE);
  const boardWrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = boardWrapperRef.current;
    if (!el) return;
    const recompute = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setGemSize(computeGemSizeForContainer(width, height));
      }
    };
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(el);
    window.addEventListener('orientationchange', recompute);
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', recompute);
    };
  }, [gameState.status]);

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const [gems, setGems] = useState<Gem[]>([]);
  const [selectedGemId, setSelectedGemId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Idle hint: if the player hasn't made a move in a while, gently glow a
  // valid 3-match so they can find one without hunting the whole board.
  const IDLE_HINT_DELAY = 6000; // ms of inactivity before showing a hint
  const [hintGemIds, setHintGemIds] = useState<string[]>([]);
  useEffect(() => {
    setHintGemIds([]); // any board/selection change clears the previous hint
    if (gameState.status !== 'playing' || isProcessing) return;
    const timer = setTimeout(() => {
      const hint = findHint(gems);
      if (hint) setHintGemIds(hint);
    }, IDLE_HINT_DELAY);
    return () => clearTimeout(timer);
  }, [gems, isProcessing, gameState.status, selectedGemId]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [enemyHit, setEnemyHit] = useState(false);
  const [enemyAttacking, setEnemyAttacking] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeGimmick, setActiveGimmick] = useState<'dragon' | 'golem' | 'elf' | null>(null);

  // Visual Chain Combo System
  const MAX_CHAIN_TIMER = 4.5;
  const [chainCombo, setChainCombo] = useState(0);
  const [chainTimer, setChainTimer] = useState(0);

  const chainComboRef = useRef(chainCombo);
  useEffect(() => {
    chainComboRef.current = chainCombo;
  }, [chainCombo]);

  useEffect(() => {
    if (gameState.status !== 'playing' || chainCombo <= 0) return;

    const interval = setInterval(() => {
      setChainTimer(prev => {
        if (prev <= 0.1) {
          setChainCombo(0);
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.status, chainCombo]);

  // Audio system hook
  const {
    playMatchSFX,
    playChainComboSFX,
    playEnemyAttackSFX,
    playSwapSFX,
    playErrorSFX,
    playVictorySFX,
    playDefeatSFX,
    playBombSFX,
    playLightSFX,
    playDarkSFX,
    playCritSFX,
    playRainbowSFX,
    playSpecialCreatedSFX,
    toggleBGM,
    startBGM,
    stopBGM,
    isBGMActive,
  } = useGameAudio();

  const lastSwappedPosRef = useRef<{ row: number; col: number } | undefined>(undefined);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const addDamageNumber = (amount: number | string, type: DamageNumber['type'], x: number, y: number) => {
    const id = Math.random().toString();
    setDamageNumbers(prev => [...prev, { id, amount, type, x, y }]);
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
    }, 1000);
  };

  const processMatches = async (
    currentGems: Gem[], 
    currentGameState: GameState, 
    comboMultiplier: number = 1,
    directSwappedPair?: { g1: Gem; g2: Gem }
  ) => {
    const { matchedIds, specialsToCreate } = analyzeMatches(currentGems, lastSwappedPosRef.current);
    lastSwappedPosRef.current = undefined;

    const finalMatchedIds = new Set<string>(matchedIds);

    let hasBomb = false;
    let hasLine = false;
    let hasRainbow = false;

    // Queue for Special Gems that will explode and trigger special effects
    const explodeQueue: Gem[] = [];

    // 1. Check if directSwappedPair contains special gem(s)
    if (directSwappedPair) {
      const { g1, g2 } = directSwappedPair;

      if (g1.special && g2.special) {
        // SPECIAL + SPECIAL SUPER COMBO!
        finalMatchedIds.add(g1.id);
        finalMatchedIds.add(g2.id);

        if (g1.special === 'rainbow' && g2.special === 'rainbow') {
          // Clear whole board!
          currentGems.forEach(g => finalMatchedIds.add(g.id));
          hasRainbow = true;
          hasBomb = true;
        } else if (g1.special === 'rainbow' || g2.special === 'rainbow') {
          // Rainbow + Special -> convert all gems of other type to special type & detonate!
          const otherSpecial = g1.special === 'rainbow' ? g2.special : g1.special;
          const targetType = g1.special === 'rainbow' ? g2.type : g1.type;
          hasRainbow = true;

          currentGems.forEach(g => {
            if (g.type === targetType) {
              finalMatchedIds.add(g.id);
              if (otherSpecial) explodeQueue.push({ ...g, special: otherSpecial });
            }
          });
        } else if ((g1.special === 'light_holy' || g1.special === 'dark_void') && (g2.special === 'light_holy' || g2.special === 'dark_void')) {
          // Cross laser (row + col)!
          hasLine = true;
          currentGems.filter(g => g.row === g2.row || g.col === g2.col).forEach(g => {
            finalMatchedIds.add(g.id);
            if (g.special) explodeQueue.push(g);
          });
        } else if (g1.special === 'bomb_3x3' && g2.special === 'bomb_3x3') {
          // Mega 5x5 Bomb!
          hasBomb = true;
          currentGems.filter(g => Math.abs(g.row - g2.row) <= 2 && Math.abs(g.col - g2.col) <= 2).forEach(g => {
            finalMatchedIds.add(g.id);
            if (g.special) explodeQueue.push(g);
          });
        } else {
          // Bomb + Line = 3 Rows + 3 Cols Mega Explosion!
          hasBomb = true;
          hasLine = true;
          currentGems.filter(g => Math.abs(g.row - g2.row) <= 1 || Math.abs(g.col - g2.col) <= 1).forEach(g => {
            finalMatchedIds.add(g.id);
            if (g.special) explodeQueue.push(g);
          });
        }
      } else if (g1.special || g2.special) {
        // SPECIAL + REGULAR GEM SWAP!
        const spec = g1.special ? g1 : g2;
        const reg = g1.special ? g2 : g1;

        finalMatchedIds.add(spec.id);

        if (spec.special === 'rainbow') {
          // Rainbow + Regular -> Destroy all gems of that regular type!
          hasRainbow = true;
          currentGems.filter(g => g.type === reg.type).forEach(g => {
            finalMatchedIds.add(g.id);
            if (g.special) explodeQueue.push(g);
          });
        } else {
          explodeQueue.push(spec);
        }
      }
    }

    // 2. Add standard matched special gems to explodeQueue
    currentGems.filter(g => matchedIds.has(g.id) && g.special).forEach(g => {
      explodeQueue.push(g);
    });

    // 3. Process explodeQueue (chain reactions)
    const processedSpecialIds = new Set<string>();

    while (explodeQueue.length > 0) {
      const g = explodeQueue.shift()!;
      if (!g || processedSpecialIds.has(g.id)) continue;
      processedSpecialIds.add(g.id);
      finalMatchedIds.add(g.id);

      if (g.special === 'light_holy') {
        hasLine = true;
        currentGems.filter(other => other.row === g.row).forEach(other => {
          finalMatchedIds.add(other.id);
          if (other.special && !processedSpecialIds.has(other.id)) {
            explodeQueue.push(other);
          }
        });
      } else if (g.special === 'dark_void') {
        hasLine = true;
        currentGems.filter(other => other.col === g.col).forEach(other => {
          finalMatchedIds.add(other.id);
          if (other.special && !processedSpecialIds.has(other.id)) {
            explodeQueue.push(other);
          }
        });
      } else if (g.special === 'bomb_3x3') {
        hasBomb = true;
        currentGems.filter(other => Math.abs(other.row - g.row) <= 1 && Math.abs(other.col - g.col) <= 1).forEach(other => {
          finalMatchedIds.add(other.id);
          if (other.special && !processedSpecialIds.has(other.id)) {
            explodeQueue.push(other);
          }
        });
      } else if (g.special === 'rainbow') {
        hasRainbow = true;
        currentGems.filter(other => other.type === g.type).forEach(other => {
          finalMatchedIds.add(other.id);
          if (other.special && !processedSpecialIds.has(other.id)) {
            explodeQueue.push(other);
          }
        });
      }
    }

    if (finalMatchedIds.size === 0) {
      setIsProcessing(false);
      return;
    }

    if (hasBomb) playBombSFX();
    else if (hasLine) playLightSFX(); // or dark, just use light for both
    else if (hasRainbow) playRainbowSFX();

    const matchedGems = currentGems.filter(g => finalMatchedIds.has(g.id));

    // Keep newly created special gem cells in remainingGems
    const specialCoords = new Set(specialsToCreate.map(s => `${s.row},${s.col}`));
    const remainingGems = currentGems.filter(g => !finalMatchedIds.has(g.id) || specialCoords.has(`${g.row},${g.col}`));

    // Insert new Special Gems
    specialsToCreate.forEach(s => {
      playSpecialCreatedSFX();
      const existingIdx = remainingGems.findIndex(g => g.row === s.row && g.col === s.col);
      const newSpecialGem: Gem = {
        id: `special-${Date.now()}-${Math.random()}`,
        type: s.gemType,
        special: s.specialType,
        row: s.row,
        col: s.col,
      };
      if (existingIdx >= 0) {
        remainingGems[existingIdx] = newSpecialGem;
      } else {
        remainingGems.push(newSpecialGem);
      }

      const gridEl = document.getElementById('gem-grid-container');
      const gridRect = gridEl ? gridEl.getBoundingClientRect() : null;
      const x = gridRect ? gridRect.left + s.col * GEM_SIZE + GEM_SIZE / 2 : window.innerWidth / 2;
      const y = gridRect ? gridRect.top + s.row * GEM_SIZE + GEM_SIZE / 2 : window.innerHeight / 2;

      if (s.specialType === 'light_holy' || s.specialType === 'dark_void') {
        addDamageNumber('⚡ MAGIC GEM!', 'combo', x, y - 20);
      } else if (s.specialType === 'bomb_3x3') {
        addDamageNumber('💣 SUPER BOMB!', 'combo', x, y - 20);
      } else if (s.specialType === 'rainbow') {
        addDamageNumber('🌈 RAINBOW STAR!', 'combo', x, y - 20);
      }
    });

    let dmg = 0;
    let heal = 0;
    
    const totalStats = calculateTotalStats(currentGameState.stats, currentGameState.equipment);
    
    // Spawn specific elemental explosions at matched gems
    let newParticles: Particle[] = [];
    const gridEl = document.getElementById('gem-grid-container');
    const gridRect = gridEl ? gridEl.getBoundingClientRect() : null;

    matchedGems.forEach(g => {
      const x = gridRect 
        ? gridRect.left + g.col * GEM_SIZE + GEM_SIZE / 2 
        : window.innerWidth / 2 - (COLS * GEM_SIZE) / 2 + g.col * GEM_SIZE + GEM_SIZE / 2;
      const y = gridRect 
        ? gridRect.top + g.row * GEM_SIZE + GEM_SIZE / 2 
        : window.innerHeight - 80 - (ROWS * GEM_SIZE) + g.row * GEM_SIZE + GEM_SIZE / 2;
      
      let color = '#fff';
      let gemDmg = 0;
      let gemHeal = 0;
      
      switch(g.type) {
        case 'sword': 
          gemDmg = Math.floor(totalStats.attack * 0.5); 
          color = '#cbd5e1'; 
          newParticles = newParticles.concat(spawnSwordSparks(x, y, 16));
          break;
        case 'fire': 
          gemDmg = Math.floor(totalStats.attack * 0.8) + (totalStats.fireDmg || 0); 
          if (totalStats.passives.some(p => p.type === 'elementBoost' && p.element === 'fire')) {
            gemDmg = Math.floor(gemDmg * 1.5);
          }
          color = '#f87171'; 
          newParticles = newParticles.concat(spawnFireEmbers(x, y, 22));
          break;
        case 'water': 
          gemDmg = Math.floor(totalStats.attack * 0.6) + (totalStats.waterDmg || 0); 
          if (totalStats.passives.some(p => p.type === 'elementBoost' && p.element === 'water')) {
            gemDmg = Math.floor(gemDmg * 1.5);
          }
          color = '#60a5fa'; 
          newParticles = newParticles.concat(spawnWaterSplash(x, y, 22));
          break;
        case 'earth': 
          gemDmg = Math.floor(totalStats.attack * 0.6) + (totalStats.earthDmg || 0); 
          if (totalStats.passives.some(p => p.type === 'elementBoost' && p.element === 'earth')) {
            gemDmg = Math.floor(gemDmg * 1.5);
          }
          color = '#34d399'; 
          newParticles = newParticles.concat(spawnEarthDust(x, y, 24));
          break;
        case 'light': 
          gemDmg = Math.floor(totalStats.attack * 0.7) + (totalStats.lightDmg || 0); 
          color = '#fde047'; 
          newParticles = newParticles.concat(spawnExplosion(x, y, color, 20));
          break;
        case 'dark': 
          gemDmg = Math.floor(totalStats.attack * 0.7) + (totalStats.darkDmg || 0); 
          color = '#a855f7'; 
          newParticles = newParticles.concat(spawnExplosion(x, y, color, 20));
          break;
        case 'heart': 
          gemHeal += Math.floor(totalStats.maxHp * 0.08); 
          color = '#f472b6'; 
          newParticles = newParticles.concat(spawnHeartAura(x, y, 16));
          break;
      }
      
      let isWeakness = false;
      let isResisted = false;
      
      if (currentGameState.enemyType === 'dragon' || currentGameState.enemyType === 'imp') {
        if (g.type === 'water') isWeakness = true;
        if (g.type === 'fire') isResisted = true;
        if (g.type === 'dark') isResisted = true;
      } else if (currentGameState.enemyType === 'golem' || currentGameState.enemyType === 'goblin' || currentGameState.enemyType === 'skeleton') {
        if (g.type === 'fire') isWeakness = true;
        if (g.type === 'earth' || g.type === 'sword') isResisted = true;
        if (g.type === 'light' && currentGameState.enemyType === 'skeleton') isWeakness = true;
      } else if (currentGameState.enemyType === 'elf' || currentGameState.enemyType === 'slime') {
        if (g.type === 'earth') isWeakness = true;
        if (g.type === 'water') isResisted = true;
      }

      if (isWeakness && gemDmg > 0) {
         gemDmg = Math.floor(gemDmg * 1.5);
         newParticles = newParticles.concat(spawnExplosion(x, y, '#eab308', 8)); // gold weakness sparks
      } else if (isResisted && gemDmg > 0) {
         gemDmg = Math.floor(gemDmg * 0.5);
         newParticles = newParticles.concat(spawnExplosion(x, y, '#64748b', 4)); // dim gray resist sparks
      }

      let isCrit = false;
      if (gemDmg > 0 && Math.random() * 100 < (totalStats.critChance || 5)) {
        isCrit = true;
        gemDmg = Math.floor(gemDmg * ((totalStats.critDmg || 150) / 100));
        playCritSFX();
        newParticles = newParticles.concat(spawnExplosion(x, y, '#ff0000', 16));
      }
      
      if (isCrit && gemDmg > 0) {
        addDamageNumber(gemDmg, 'crit', x + Math.random() * 20 - 10, y - 20 - Math.random() * 20);
      }
      
      dmg += gemDmg;
      heal += gemHeal;
    });
    setParticles(prev => [...prev, ...newParticles]);

    // Increment chain combo & refresh combo window timer
    const nextChain = chainComboRef.current + 1;
    setChainCombo(nextChain);
    setChainTimer(MAX_CHAIN_TIMER);

    // Chain damage multiplier: +25% per chain (e.g. 1st match = 1.25x, 2nd = 1.50x, 3rd = 1.75x)
    const chainMultiplier = 1 + (nextChain * 0.25);

    let currentMultiplier = comboMultiplier;
    if (matchedGems.length > 3) {
      currentMultiplier += (matchedGems.length - 3) * 0.5;
    }
    
    const totalMultiplier = currentMultiplier * chainMultiplier;

    // Trigger rich elemental match SFX and chain combo audio feedback
    const matchedTypes = matchedGems.map(g => g.type);
    playMatchSFX(matchedTypes, totalMultiplier, nextChain);

    dmg = Math.floor(dmg * totalMultiplier);
    heal = Math.floor(heal * totalMultiplier);

    // Apply Vampiric Passive if available
    const vampirePassive = totalStats.passives.find(p => p.type === 'vampire');
    if (vampirePassive && dmg > 0) {
      const vHeal = Math.max(1, Math.floor(dmg * (vampirePassive.value / 100)));
      heal += vHeal;
    }

    // Apply Turn-Based Passives (Regeneration & Flame Burn) on player move/turn
    if (nextChain === 1) {
      totalStats.passives.forEach(p => {
        if (p.type === 'slowHeal' && p.value > 0) {
          heal += p.value;
          addDamageNumber(`+${p.value} Regen`, 'heal', 60, 110);
        }
        if (p.type === 'dotBurn' && p.value > 0) {
          dmg += p.value;
          addDamageNumber(`-${p.value} Burn`, 'damage', window.innerWidth / 2 + 50, 180);
        }
      });
    }

    setGems(remainingGems);
    
    if (nextChain > 1) {
      addDamageNumber(`${nextChain}x CHAIN! (${totalMultiplier.toFixed(1)}x DMG)`, 'combo', window.innerWidth / 2, 120);
    } else if (currentMultiplier > 1) {
      addDamageNumber(`Combo x${currentMultiplier.toFixed(1)}`, 'combo', window.innerWidth / 2, 120);
    }

    if (dmg > 0) {
      addDamageNumber(dmg, 'damage', window.innerWidth / 2, 200);
      setEnemyHit(true);
      setTimeout(() => setEnemyHit(false), 300);
    }
    if (heal > 0) addDamageNumber(heal, 'heal', 50, 80);

    let nextGameState = { ...currentGameState };
    if (matchedGems.length >= 5) {
      nextGameState.bossStunTimer = 3;
      addDamageNumber('STAGGERED!', 'combo', window.innerWidth / 2, window.innerHeight / 2 - 50);
    }

    if (dmg > 0) {
      nextGameState.enemyHp -= dmg;
      if (nextGameState.enemyHp <= 0) {
        const enemyInfo = getEnemyInfo(nextGameState.enemyType);
        const isBossEnemy = enemyInfo.isBoss || nextGameState.currentLayer === nextGameState.mapNodes.length - 1;

        // Balanced stage gold rewards
        const goldEarned = isBossEnemy 
          ? (40 + nextGameState.level * 15) 
          : (12 + nextGameState.level * 5 + Math.floor(Math.random() * 6));
        nextGameState.gold += goldEarned;
        addDamageNumber(`+${goldEarned} Gold!`, 'heal', window.innerWidth / 2, 120);

        // Advance layer
        nextGameState.currentLayer += 1;

        if (nextGameState.currentLayer >= nextGameState.mapNodes.length) {
          nextGameState.status = 'victory';
          stopBGM();
          setIsMusicPlaying(false);
          playVictorySFX();
        } else {
          nextGameState.status = 'map';

          // Equipment drop rate: 30% for minions, 100% for bosses
          const dropChance = isBossEnemy ? 1.0 : 0.30;
          if (Math.random() < dropChance) {
            const ownedNames = getOwnedItemNames(nextGameState);
            const newEq = generateRandomEquipment(nextGameState.level, undefined, isBossEnemy, ownedNames);
            
            // Add to player's inventory bag
            nextGameState.inventory = [...(nextGameState.inventory || []), newEq];

            // If slot is empty, auto-equip it as a convenience
            if (!nextGameState.equipment[newEq.slot]) {
              nextGameState.equipment = {
                ...nextGameState.equipment,
                [newEq.slot]: newEq,
              };
              const updatedStats = calculateTotalStats(nextGameState.stats, nextGameState.equipment);
              nextGameState.playerMaxHp = updatedStats.maxHp;
              nextGameState.playerHp = Math.min(nextGameState.playerMaxHp, nextGameState.playerHp);
            }

            addDamageNumber(`DROPPED: ${newEq.name}!`, 'combo', window.innerWidth / 2, 180);
          }
        }

        setGameState(nextGameState);
        setIsProcessing(false);
        return;
      }
    }
    if (heal > 0) {
      nextGameState.playerHp = Math.min(nextGameState.playerMaxHp, nextGameState.playerHp + heal);
    }
    setGameState(nextGameState);

    await sleep(MATCH_DELAY);

    const nextGems = [...remainingGems];
    for (let c = 0; c < COLS; c++) {
      const colGems = nextGems.filter(g => g.col === c).sort((a, b) => b.row - a.row);
      let targetRow = ROWS - 1;
      for (const g of colGems) {
        g.row = targetRow;
        targetRow--;
      }
      for (let r = targetRow; r >= 0; r--) {
        nextGems.push(createRandomGem(r, c));
      }
    }
    setGems(nextGems);
    await sleep(DROP_DELAY);
    
    processMatches(nextGems, nextGameState, currentMultiplier + 0.5);
  };

  // --- Swipe/drag-to-swap support -------------------------------------------------
  // Players expect a match-3 to respond to a single swipe gesture, not a
  // tap-select-then-tap-target sequence. A drag resolves the swiped direction,
  // finds the adjacent target cell, and calls the same swapGems() used by
  // tap-to-select — so both input methods always stay in sync with one source
  // of truth for what counts as a valid swap. Tap-to-select still works
  // untouched as a fallback (and for precision on small screens).
  const dragOriginGemRef = useRef<Gem | null>(null);
  const dragInProgressRef = useRef(false); // true once this drag has committed a direction
  const suppressNextClickRef = useRef(false); // true briefly so the trailing synthetic click is ignored
  const DRAG_THRESHOLD = 14; // px of movement before a direction is committed

  // Attempts to swap two adjacent gems and resolves the resulting match (or
  // penalizes a wrong swipe if nothing matched). Shared by both tap-to-select
  // and drag-to-swap input paths so the two input methods can never diverge
  // in behavior.
  const swapGems = async (gemA: Gem, gemB: Gem) => {
    setIsProcessing(true);

    lastSwappedPosRef.current = { row: gemB.row, col: gemB.col };

    const swappedGems = gems.map(g => {
      if (g.id === gemA.id) return { ...g, row: gemB.row, col: gemB.col };
      if (g.id === gemB.id) return { ...g, row: gemA.row, col: gemA.col };
      return g;
    });
    setGems(swappedGems);

    await sleep(MATCH_DELAY);

    const matchedIds = findMatches(swappedGems);
    if (matchedIds.size > 0 || gemA.special || gemB.special) {
      setGameState(prev => ({ ...prev, wrongSwipes: 0 }));
      const g1Swapped = swappedGems.find(g => g.id === gemA.id)!;
      const g2Swapped = swappedGems.find(g => g.id === gemB.id)!;
      processMatches(swappedGems, { ...gameState, wrongSwipes: 0 }, 1, { g1: g1Swapped, g2: g2Swapped });
    } else {
      playErrorSFX();
      setGems(gems);
      setChainCombo(0);
      setChainTimer(0);
      await sleep(MATCH_DELAY);

      let nextState = { ...gameState };
      nextState.wrongSwipes += 1;

      if (nextState.wrongSwipes >= SWIPE_LIMIT) {
        if (nextState.bossStunTimer > 0) {
          nextState.wrongSwipes = 0;
          addDamageNumber('STUNNED', 'combo', window.innerWidth / 2, 80);
        } else {
          const isBossEnemy = getEnemyInfo(gameState.enemyType)?.isBoss || false;
          playEnemyAttackSFX(isBossEnemy, false);
          const totalStats = calculateTotalStats(nextState.stats, nextState.equipment);
          let enemyDmg = 15 + (gameState.level * 5);
          enemyDmg = Math.max(1, enemyDmg - Math.floor(totalStats.defense * 0.5));

          nextState.playerHp -= enemyDmg;
          nextState.wrongSwipes = 0;
          addDamageNumber(enemyDmg, 'enemyAttack', window.innerWidth / 2, 80);
          setPlayerHit(true);
          setEnemyAttacking(true);
          setTimeout(() => setPlayerHit(false), 300);
          setTimeout(() => setEnemyAttacking(false), 500);

          if (nextState.playerHp <= 0) {
            nextState.status = 'gameover';
            playDefeatSFX();
          }
        }
      }
      setGameState(nextState);
      setIsProcessing(false);
    }
  };

  const handleGemClick = (gem: Gem) => {
    if (isProcessing || gameState.status !== 'playing') return;
    // A drag gesture on this same pointer-down/up cycle already resolved a
    // swap via handleGemPan; ignore the synthetic click some browsers fire
    // afterward so we don't double-trigger a second, unwanted selection.
    if (suppressNextClickRef.current) return;

    if (!selectedGemId) {
      setSelectedGemId(gem.id);
      playSwapSFX();
      return;
    }

    if (selectedGemId === gem.id) {
      setSelectedGemId(null);
      return;
    }

    const selectedGem = gems.find(g => g.id === selectedGemId);
    if (!selectedGem || !isAdjacent(selectedGem, gem)) {
      setSelectedGemId(gem.id);
      playSwapSFX();
      return;
    }

    setSelectedGemId(null);
    swapGems(selectedGem, gem);
  };

  const handleGemPanStart = (gem: Gem) => {
    if (isProcessing || gameState.status !== 'playing') return;
    dragOriginGemRef.current = gem;
    dragInProgressRef.current = false;
  };

  const handleGemPan = (offsetX: number, offsetY: number) => {
    const origin = dragOriginGemRef.current;
    if (!origin || dragInProgressRef.current) return;
    if (isProcessing || gameState.status !== 'playing') return;
    if (Math.abs(offsetX) < DRAG_THRESHOLD && Math.abs(offsetY) < DRAG_THRESHOLD) return;

    // Determine the dominant swipe direction and the target cell it points to.
    let dRow = 0;
    let dCol = 0;
    if (Math.abs(offsetX) > Math.abs(offsetY)) {
      dCol = offsetX > 0 ? 1 : -1;
    } else {
      dRow = offsetY > 0 ? 1 : -1;
    }

    const targetRow = origin.row + dRow;
    const targetCol = origin.col + dCol;
    if (targetRow < 0 || targetRow >= ROWS || targetCol < 0 || targetCol >= COLS) return;

    const targetGem = gems.find(g => g.row === targetRow && g.col === targetCol);
    if (!targetGem) return;

    dragInProgressRef.current = true;
    suppressNextClickRef.current = true;
    setSelectedGemId(null);
    swapGems(origin, targetGem);
  };

  const handleGemPanEnd = () => {
    dragOriginGemRef.current = null;
    dragInProgressRef.current = false;
    // Clear the click-suppression a tick later so this drag's own trailing
    // synthetic click is swallowed, but the player's very next real tap works.
    setTimeout(() => { suppressNextClickRef.current = false; }, 100);
  };

  useEffect(() => {
    if (gameState.status !== 'playing') return;
    const interval = setInterval(() => {
      const current = gameStateRef.current;
      if (current.timer <= 1) {
        setGameState(prev => ({ ...prev, timer: 0, status: 'gameover' }));
        playDefeatSFX();
        return;
      }
      
      let nextStunTimer = Math.max(0, current.bossStunTimer - 1);

      if (current.bossAbilityCooldown <= 1) {
         if (current.bossStunTimer > 0) {
           addDamageNumber('STUNNED!', 'combo', window.innerWidth / 2, 200);
           setGameState(prev => {
             return { ...prev, timer: prev.timer - 1, bossAbilityCooldown: 15, bossStunTimer: nextStunTimer };
           });
         } else {
           playEnemyAttackSFX(true, true);
           setEnemyAttacking(true);
           setTimeout(() => setEnemyAttacking(false), 500);
           
           setActiveGimmick(current.enemyType);
           setTimeout(() => setActiveGimmick(null), current.enemyType === 'dragon' ? 1500 : 1000);

           if (current.enemyType === 'dragon') {
             addDamageNumber('Time -10s!', 'combo', window.innerWidth / 2, window.innerHeight / 2);
             setEnemyHit(true);
             setTimeout(() => setEnemyHit(false), 300);
           } else if (current.enemyType === 'elf') {
             addDamageNumber(30, 'heal', window.innerWidth / 2, 200);
           } else if (current.enemyType === 'golem') {
             const dmg = Math.max(1, 20 - Math.floor(calculateTotalStats(current.stats, current.equipment).defense * 0.5));
             addDamageNumber(dmg, 'enemyAttack', window.innerWidth / 2, 80);
             setPlayerHit(true);
             setTimeout(() => setPlayerHit(false), 300);
           } else {
             // Minions (goblin/slime/imp/skeleton) don't have a unique gimmick like the
             // bosses do, but their ability countdown still fires an attack — make sure
             // it actually deals damage instead of silently doing nothing.
             const dmg = Math.max(1, (10 + current.level * 3) - Math.floor(calculateTotalStats(current.stats, current.equipment).defense * 0.5));
             addDamageNumber(dmg, 'enemyAttack', window.innerWidth / 2, 80);
             setPlayerHit(true);
             setTimeout(() => setPlayerHit(false), 300);
           }
           
           setGameState(prev => {
              let nextState = { ...prev, timer: prev.timer - 1, bossAbilityCooldown: 15, bossStunTimer: nextStunTimer };
              if (prev.enemyType === 'dragon') {
                nextState.timer = Math.max(0, nextState.timer - 10);
              } else if (prev.enemyType === 'elf') {
                nextState.enemyHp = Math.min(nextState.enemyMaxHp, nextState.enemyHp + 30);
              } else if (prev.enemyType === 'golem') {
                const dmg = Math.max(1, 20 - Math.floor(calculateTotalStats(prev.stats, prev.equipment).defense * 0.5));
                nextState.playerHp -= dmg;
                if (nextState.playerHp <= 0) nextState.status = 'gameover';
              } else {
                const dmg = Math.max(1, (10 + prev.level * 3) - Math.floor(calculateTotalStats(prev.stats, prev.equipment).defense * 0.5));
                nextState.playerHp -= dmg;
                if (nextState.playerHp <= 0) nextState.status = 'gameover';
              }
              return nextState;
           });
         }
      } else {
         setGameState(prev => {
           return { 
             ...prev, 
             timer: prev.timer - 1, 
             bossAbilityCooldown: prev.bossAbilityCooldown - 1, 
             bossStunTimer: nextStunTimer 
           };
         });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.status]);

  // Continuous elemental aura particle effect while boss is stunned/staggered/vulnerable
  useEffect(() => {
    if (gameState.status !== 'playing' || gameState.bossStunTimer <= 0) return;
    const interval = setInterval(() => {
      const enemyInfo = getEnemyInfo(gameState.enemyType);
      const weakElem = enemyInfo.weak as 'fire' | 'water' | 'earth';
      const x = window.innerWidth / 2;
      const y = window.innerHeight * 0.32;
      setParticles(prev => [...prev, ...spawnElementalAura(x, y, weakElem, 5)]);
    }, 250);
    return () => clearInterval(interval);
  }, [gameState.status, gameState.bossStunTimer, gameState.enemyType]);

  const startRun = () => {
    setChainCombo(0);
    setChainTimer(0);
    stopBGM();
    setIsMusicPlaying(false);
    setGameState(prev => ({
      ...prev,
      status: 'map',
      level: 1,
      mapNodes: generateMap(10), // 10 layers
      currentLayer: 0,
      playerHp: prev.stats.baseMaxHp,
      playerMaxHp: prev.stats.baseMaxHp,
    }));
  };

  const selectNode = (node: MapNode) => {
    setChainCombo(0);
    setChainTimer(0);
    if (node.type === 'combat') {
      const isBoss = node.isBoss || gameState.currentLayer === gameState.mapNodes.length - 1;
      const enemyMaxHp = isBoss 
        ? 1200 + (gameState.currentLayer * 220) + (gameState.level * 150)
        : 380 + (gameState.currentLayer * 60) + (gameState.level * 40);

      startBGM();
      setIsMusicPlaying(true);

      setGameState(prev => ({
        ...prev,
        status: isBoss ? 'bossIntro' : 'playing',
        timer: isBoss ? 120 : 90,
        enemyMaxHp,
        enemyHp: enemyMaxHp,
        wrongSwipes: 0,
        enemyType: node.enemyType || 'goblin',
        bossAbilityCooldown: isBoss ? 15 : 20,
        bossStunTimer: 0,
      }));
      setGems(generateGrid());
    } else if (node.type === 'rest') {
      stopBGM();
      setIsMusicPlaying(false);
      setGameState(prev => ({ ...prev, status: 'rest' }));
    } else if (node.type === 'shop') {
      stopBGM();
      setIsMusicPlaying(false);
      const ownedNames = getOwnedItemNames(gameState);
      const items: ShopItem[] = [1, 2, 3].map(() => {
        const eq = generateRandomEquipment(gameState.level + gameState.currentLayer, undefined, false, ownedNames);
        ownedNames.add(eq.name); // also avoid repeating a name within the same shop's 3 offers
        const price = getItemPrice(eq);
        return { equipment: eq, price, sold: false };
      });
      setGameState(prev => ({ ...prev, status: 'shop', shopItems: items }));
    }
  };


  useEffect(() => {
    if (gameState.status === 'bossIntro') {
      const timeout = setTimeout(() => {
        setGameState(prev => ({ ...prev, status: 'playing' }));
      }, 3500); // 3.5 seconds intro
      return () => clearTimeout(timeout);
    }
  }, [gameState.status]);

  const handlePurchase = (item: string) => {
    if (window.confirm(`Mock OS Prompt: Do you want to purchase ${item}?`)) {
       if (item === '100 Crystals ($0.99)') {
         setGameState(prev => ({ ...prev, crystals: prev.crystals + 100 }));
       } else if (item === 'Meteor Strike (50 Crystals)') {
         if (gameState.crystals >= 50) {
            setGameState(prev => ({ ...prev, crystals: prev.crystals - 50 }));
            alert("Power-up acquired!");
         } else alert("Not enough crystals!");
       } else if (item === 'Golden Knight Skin (500 Crystals)') {
         if (gameState.crystals >= 500) {
            setGameState(prev => ({ ...prev, crystals: prev.crystals - 500 }));
            alert("Cosmetic acquired!");
         } else alert("Not enough crystals!");
       } else if (item === 'Watch Ad') {
         setGameState(prev => ({ ...prev, gold: prev.gold + 50 }));
       } else if (item === 'Revive') {
         if (gameState.crystals >= 50) {
            setGameState(prev => ({ ...prev, crystals: prev.crystals - 50, playerHp: prev.playerMaxHp, status: 'playing', timer: 60 }));
         } else {
            alert('Not enough crystals!');
         }
       }
    }
  };

  const getBgImage = () => {
    if (gameState.status === 'playing') {
      switch (gameState.enemyType) {
        case 'dragon': return `url(${dragonBg})`;
        case 'elf': return `url(${elfBg})`;
        case 'golem': return `url(${golemBg})`;
      }
    }
    return '';
  };

  return (
    <motion.div 
      className="max-w-md mx-auto h-[100dvh] bg-slate-950 text-white overflow-hidden flex flex-col relative font-sans shadow-2xl select-none"
      animate={
        gameState.status === 'bossIntro' ? { x: [-15, 15, -10, 10, -5, 5, 0], y: [-10, 10, -8, 8, -4, 4, 0] } :
        (activeGimmick === 'golem' || activeGimmick === 'dragon' ? { x: [-10, 10, -10, 10, 0], y: [-5, 5, -5, 5, 0] } : { x: 0, y: 0 })
      }
      transition={{ duration: gameState.status === 'bossIntro' ? 0.6 : 0.4 }}
    >
      {/* Dynamic Background Image */}
      {(gameState.status === 'playing' || gameState.status === 'bossIntro') && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: getBgImage() }}
        >
          <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay for readability */}
        </div>
      )}

      {/* Ambient static blur balls */}
      {(gameState.status !== 'playing' && gameState.status !== 'bossIntro') && (
        <>
          <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[70%] h-[50%] bg-red-600/10 rounded-full blur-[150px]"></div>
          <div className="absolute top-[30%] right-[10%] w-[50%] h-[30%] bg-blue-600/15 rounded-full blur-[100px]"></div>
        </>
      )}

      <VFXCanvas particles={particles} onParticlesUpdate={setParticles} />
      <DamageOverlay damageNumbers={damageNumbers} />

      {/* BOSS INTRO SCREEN */}
      <AnimatePresence>
        {gameState.status === 'bossIntro' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.1, type: "spring" }}
              className="mb-12 relative w-48 h-48 flex justify-center items-center"
            >
              <div className="absolute inset-0 bg-red-600/40 blur-3xl rounded-full" />
              <BossModel type={gameState.enemyType} isHit={false} isAttacking={true} />
            </motion.div>
            
            <motion.h2 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="text-4xl font-pixel text-red-500 mb-6 tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] uppercase leading-tight"
            >
              {getEnemyInfo(gameState.enemyType).name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="text-white/90 font-pixel text-sm uppercase tracking-widest leading-relaxed border-t border-b border-red-900/50 py-4 bg-red-950/40 w-full shadow-[0_0_30px_rgba(239,68,68,0.2)]"
            >
              {getEnemyInfo(gameState.enemyType).quote}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeGimmick === 'dragon' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 z-50 pointer-events-none overflow-hidden flex flex-col items-center justify-start pt-20"
          >
            {/* Massive Fire blast coming from boss */}
            <motion.div 
              initial={{ y: -200, scaleY: 0, opacity: 0 }}
              animate={{ y: [0, window.innerHeight / 2], scaleY: [0, 4, 10], scaleX: [1, 3, 5], opacity: [0.8, 1, 0] }}
              transition={{ duration: 0.8, ease: 'easeIn' }}
              className="w-64 h-64 bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 rounded-full blur-[40px] mix-blend-screen origin-top"
            />
            {/* Screen Burn effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute inset-0 border-[40px] border-red-600/40 blur-xl mix-blend-screen"
            />
          </motion.div>
        )}
        {activeGimmick === 'golem' && (
          <motion.div 
            className="absolute inset-0 z-50 pointer-events-none overflow-hidden"
          >
            {/* Giant Rock Slamming */}
            <motion.div
              initial={{ y: -800, rotate: 0, x: '-50%' }}
              animate={{ y: window.innerHeight - 200, rotate: 45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeIn' }}
              className="absolute left-1/2 w-64 h-64 bg-stone-700 rounded-3xl border-4 border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/50" />
               <div className="w-full h-1 bg-stone-800/40 absolute rotate-45" />
               <div className="w-1 h-full bg-stone-800/40 absolute -rotate-12" />
            </motion.div>
            
            {/* Impact Flash & Dust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="absolute inset-0 bg-amber-500/30 mix-blend-screen"
            />
          </motion.div>
        )}
        {activeGimmick === 'elf' && (
          <motion.div 
            className="absolute inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-center"
          >
            {/* Arcane Magic Beams */}
            {Array.from({length: 6}).map((_, i) => (
              <motion.div
                 key={i}
                 initial={{ width: 0, opacity: 0, rotate: i * 30 - 75 }}
                 animate={{ width: '200%', opacity: [0, 1, 0] }}
                 transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                 className="absolute h-16 bg-gradient-to-r from-transparent via-green-400 to-transparent blur-md shadow-[0_0_30px_rgba(74,222,128,1)]"
                 style={{ transformOrigin: 'center' }}
              />
            ))}
            
            {/* Expanding Magic Ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 4, 8], opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute w-32 h-32 rounded-full border-[8px] border-green-400 shadow-[0_0_40px_rgba(74,222,128,1)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* MENU SCREEN */}
      {gameState.status === 'menu' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950 -z-10" />
          
          <div className="mb-8 relative group w-48 h-48 flex justify-center items-center">
            <div className="absolute inset-0 bg-red-600/30 blur-2xl rounded-full group-hover:bg-red-500/40 transition-all duration-500" />
            <BossModel type="dragon" isHit={false} isAttacking={false} />
          </div>
          
          <h1 className="text-4xl font-pixel text-center mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] leading-tight pt-4">
            GEM KNIGHT
          </h1>
          <p className="text-red-400 mb-12 font-bold tracking-widest uppercase text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Descent into Darkness
          </p>
          
          <button 
            onClick={startRun}
            className="w-full py-5 bg-gradient-to-r from-red-700/80 to-red-900/80 hover:from-red-600 hover:to-red-800 border border-red-500/50 rounded-2xl font-pixel text-[12px] transition-all flex items-center justify-center gap-3 mb-4 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transform hover:scale-[1.02]"
          >
            <Play fill="currentColor" className="w-5 h-5" /> BEGIN QUEST
          </button>
          <button 
            onClick={() => setGameState(prev => ({ ...prev, status: 'store' }))}
            className="w-full py-4 backdrop-blur-md bg-white/5 hover:bg-white/10 rounded-2xl font-pixel text-[10px] border border-white/10 transition-colors flex items-center justify-center gap-3 uppercase tracking-widest text-white/60 hover:text-white shadow-md transform hover:scale-[1.01]"
          >
            <ShoppingCart className="w-5 h-5" /> Armory
          </button>
        </div>
      )}

      {/* MAP SCREEN */}
      {gameState.status === 'map' && (
        <div className="flex-1 flex flex-col p-6 z-10 relative overflow-hidden bg-slate-950">
          {/* Background Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ 
              backgroundImage: `linear-gradient(30deg, #ffffff 1px, transparent 1px), linear-gradient(-30deg, #ffffff 1px, transparent 1px)`, 
              backgroundSize: '40px 69.28px' 
            }} 
          />
          
          <div className="flex items-center justify-between mb-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-4 shadow-lg z-20">
            <h2 className="text-2xl font-black font-pixel bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">CHOOSE PATH</h2>
            <div className="flex items-center gap-4 text-xs font-bold">
               <span className="flex items-center gap-1 text-red-400"><Heart className="w-4 h-4" /> {gameState.playerHp}/{calculateTotalStats(gameState.stats, gameState.equipment).maxHp}</span>
               <span className="flex items-center gap-1 text-yellow-400"><Coins className="w-4 h-4" /> {gameState.gold}</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col-reverse items-center justify-start pb-32 pt-10 px-2 relative scrollbar-hide z-10">
             {gameState.mapNodes.map((layer, layerIdx) => (
               <React.Fragment key={`layer-${layerIdx}`}>
                 <div className={cn("w-full flex justify-around px-4 relative z-10", layerIdx > gameState.currentLayer ? "opacity-50 grayscale-[50%]" : "opacity-100")}>
                    {layer.map((node, nIdx) => {
                       const isCurrentLayer = layerIdx === gameState.currentLayer;
                       const isPast = layerIdx < gameState.currentLayer;
                       const isBoss = layerIdx === gameState.mapNodes.length - 1;
                       
                       let bgColor = "bg-slate-900";
                       let borderColor = "border-slate-700";
                       let shadow = "";
                       let iconColor = "text-slate-500";
                       
                       if (node.type === 'combat') {
                         bgColor = isCurrentLayer ? "bg-red-950/80" : "bg-red-950/40";
                         borderColor = isCurrentLayer ? "border-red-500" : "border-red-900";
                         shadow = isCurrentLayer ? "shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "";
                         iconColor = isCurrentLayer ? "text-red-400" : "text-red-700";
                       } else if (node.type === 'rest') {
                         bgColor = isCurrentLayer ? "bg-amber-950/80" : "bg-amber-950/40";
                         borderColor = isCurrentLayer ? "border-amber-500" : "border-amber-900";
                         shadow = isCurrentLayer ? "shadow-[0_0_20px_rgba(245,158,11,0.5)]" : "";
                         iconColor = isCurrentLayer ? "text-amber-400" : "text-amber-700";
                       } else if (node.type === 'shop') {
                         bgColor = isCurrentLayer ? "bg-cyan-950/80" : "bg-cyan-950/40";
                         borderColor = isCurrentLayer ? "border-cyan-500" : "border-cyan-900";
                         shadow = isCurrentLayer ? "shadow-[0_0_20px_rgba(6,182,212,0.5)]" : "";
                         iconColor = isCurrentLayer ? "text-cyan-400" : "text-cyan-700";
                       }
                       
                       if (isPast) {
                         bgColor = "bg-slate-900/60";
                         borderColor = "border-slate-600";
                         iconColor = "text-slate-500";
                       }

                       return (
                          <button 
                            key={node.id}
                            disabled={!isCurrentLayer}
                            onClick={() => selectNode(node)}
                            className={cn(
                              "relative w-14 h-14 rotate-45 border-[2px] flex items-center justify-center transition-all duration-300",
                              isCurrentLayer ? "cursor-pointer hover:scale-110 hover:brightness-125 z-20" : "cursor-not-allowed",
                              bgColor, borderColor, shadow,
                              isBoss ? "w-16 h-16 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.6)]" : ""
                            )}
                          >
                             <div className="-rotate-45 flex flex-col items-center justify-center w-full h-full">
                               {node.type === 'combat' && (isBoss ? <Skull className={cn("w-7 h-7 animate-pulse", iconColor)} /> : <Sword className={cn("w-6 h-6", iconColor)} />)}
                               {node.type === 'rest' && <Flame className={cn("w-6 h-6", iconColor)} />}
                               {node.type === 'shop' && <ShoppingCart className={cn("w-6 h-6", iconColor)} />}
                             </div>
                          </button>
                       );
                    })}
                 </div>
                 
                 {/* Connectors to the next layer (visually above) */}
                 {layerIdx < gameState.mapNodes.length - 1 && (
                    <div className="w-full h-12 relative flex-shrink-0 z-0">
                       <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                          {layer.map((node, nIdx) => {
                             const nextLayer = gameState.mapNodes[layerIdx + 1];
                             return nextLayer.map((nextNode, nxIdx) => {
                                const visualX1 = (nIdx + 0.5) / layer.length;
                                const visualX2 = (nxIdx + 0.5) / nextLayer.length;
                                const x1 = visualX1 * 100;
                                const x2 = visualX2 * 100;
                                
                                // Connect if paths don't cross too extremely (based on visual horizontal distance)
                                const diff = Math.abs(visualX1 - visualX2);
                                if (node.children && node.children.length > 0 && !node.children.includes(nxIdx)) return null;
                                
                                const isPastPath = layerIdx < gameState.currentLayer;
                                const isNextPath = layerIdx === gameState.currentLayer;
                                const strokeColor = isPastPath ? "rgba(255,255,255,0.2)" : (isNextPath ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.05)");
                                const strokeWidth = isNextPath ? 2 : 1;

                                return (
                                  <line 
                                    key={`${nIdx}-${nxIdx}`} 
                                    x1={`${x1}%`} y1="100%" 
                                    x2={`${x2}%`} y2="0%" 
                                    stroke={strokeColor} 
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={isPastPath ? "none" : "4 4"}
                                  />
                                )
                             })
                          })}
                       </svg>
                    </div>
                 )}
               </React.Fragment>
             ))}
          </div>
          
          {/* Equipment Overlay */}
          <div className="absolute bottom-6 left-6 right-6 backdrop-blur-xl bg-slate-950/90 border border-slate-800 rounded-3xl p-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex justify-between items-center z-20">
             <div className="flex items-center gap-2">
               {(['head', 'body', 'weapon'] as EquipmentSlot[]).map(slot => {
                 const eq = gameState.equipment[slot];
                 return (
                   <button 
                     key={slot}
                     onClick={() => setIsInventoryOpen(true)}
                     className={cn(
                       "w-11 h-11 rounded-2xl border flex items-center justify-center text-xl relative transition-transform hover:scale-105 active:scale-95",
                       eq ? getRarityColor(eq.rarity) : "bg-slate-900/50 border-slate-700/50 text-slate-600"
                     )}
                   >
                     {eq ? eq.icon : (slot === 'head' ? '🪖' : slot === 'body' ? '👕' : '🗡️')}
                     {eq && eq.passive && (
                       <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border border-black flex items-center justify-center text-[8px] text-black font-extrabold">✨</span>
                     )}
                   </button>
                 );
               })}

               <button
                 onClick={() => setIsInventoryOpen(true)}
                 className="h-11 px-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-700/20 hover:from-amber-500/30 hover:to-amber-700/30 border border-amber-500/50 text-amber-300 flex items-center gap-1.5 font-extrabold text-xs transition-transform active:scale-95"
               >
                 <Package className="w-4 h-4 text-amber-400" />
                 <span>Bag ({gameState.inventory.length})</span>
               </button>
             </div>
             
             <div className="text-right flex flex-col items-end">
               <div className="text-[10px] text-white/50 uppercase font-extrabold tracking-widest mb-0.5">Hero Stats</div>
               {(() => {
                 const stats = calculateTotalStats(gameState.stats, gameState.equipment);
                 return (
                   <div className="flex flex-col items-end gap-0.5">
                     <div className="flex gap-2 text-xs font-bold">
                       <span className="text-red-400 flex items-center"><Sword className="w-3 h-3 mr-0.5"/> {stats.attack}</span>
                       <span className="text-blue-400 flex items-center"><Shield className="w-3 h-3 mr-0.5"/> {stats.defense}</span>
                       <span className="text-pink-400 flex items-center"><Heart className="w-3 h-3 mr-0.5"/> {stats.maxHp}</span>
                     </div>
                     {(stats.fireDmg > 0 || stats.waterDmg > 0 || stats.earthDmg > 0 || stats.lightDmg > 0 || stats.darkDmg > 0) && (
                       <div className="flex gap-1.5 text-[10px] font-bold flex-wrap justify-end max-w-[150px]">
                         {stats.fireDmg > 0 && <span className="text-red-300">🔥 +{stats.fireDmg}</span>}
                         {stats.waterDmg > 0 && <span className="text-blue-300">💧 +{stats.waterDmg}</span>}
                         {stats.earthDmg > 0 && <span className="text-emerald-300">🌿 +{stats.earthDmg}</span>}
                         {stats.lightDmg > 0 && <span className="text-yellow-300">☀️ +{stats.lightDmg}</span>}
                         {stats.darkDmg > 0 && <span className="text-purple-300">🌙 +{stats.darkDmg}</span>}
                       </div>
                     )}
                     {(stats.critChance > 5 || stats.critDmg > 150) && (
                       <div className="flex gap-1.5 text-[10px] font-bold text-orange-300">
                         {stats.critChance > 5 && <span>🎯 {stats.critChance}%</span>}
                         {stats.critDmg > 150 && <span>💥 {stats.critDmg}%</span>}
                       </div>
                     )}
                   </div>
                 );
               })()}
             </div>
          </div>
        </div>
      )}

      {/* REST SCREEN */}
      {gameState.status === 'rest' && (
        <div className="flex-1 flex flex-col p-6 z-10 items-center justify-center relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-900/20 via-slate-950 to-slate-950 -z-10" />
          <Heart className="w-24 h-24 text-pink-400 mb-8 animate-pulse drop-shadow-[0_0_20px_rgba(244,114,182,0.8)]" />
          <h2 className="text-3xl font-black mb-4">REST CAMP</h2>
          <p className="text-white/60 text-center mb-12">Recover your strength before the next battle.</p>
          
          <button 
            onClick={() => {
              const maxHp = calculateTotalStats(gameState.stats, gameState.equipment).maxHp;
              setGameState(prev => ({ 
                ...prev, 
                playerHp: Math.min(maxHp, prev.playerHp + Math.floor(maxHp * 0.3)),
                status: 'map',
                currentLayer: prev.currentLayer + 1,
              }));
            }}
            className="w-full py-4 bg-gradient-to-r from-pink-600 to-pink-800 rounded-2xl font-bold flex justify-center items-center gap-2"
          >
             <Heart className="w-5 h-5" /> RECOVER 30% HP
          </button>
        </div>
      )}

      {/* ROGUELIKE SHOP SCREEN */}
      {gameState.status === 'shop' && (
        <div className="flex-1 flex flex-col p-6 z-10 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10" />
          <div className="flex items-center justify-between mb-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-4 shadow-lg">
            <div>
              <h2 className="text-2xl font-black">MERCHANT SHOP</h2>
              <p className="text-xs text-slate-400">Upgrade gear & elemental power</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsInventoryOpen(true)}
                className="px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Package className="w-4 h-4 text-amber-400" />
                <span>Bag ({gameState.inventory.length})</span>
              </button>
              <div className="flex items-center gap-1.5 bg-yellow-950/80 border border-yellow-500/40 px-3 py-1.5 rounded-2xl text-yellow-300 font-extrabold text-sm">
                <Coins className="w-4 h-4 text-yellow-400" /> {gameState.gold}G
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto">
            {gameState.shopItems.map((item, idx) => {
               const eq = item.equipment;
               return (
                 <div key={idx} className={cn("backdrop-blur-md border p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all", getRarityColor(eq.rarity))}>
                    <div className="flex items-center gap-3">
                       <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-3xl shrink-0 relative">
                          {eq.icon}
                       </div>
                       <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                             <span className="font-extrabold text-sm text-white">{eq.name}</span>
                             <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider", getRarityBadge(eq.rarity))}>
                               {eq.rarity}
                             </span>
                          </div>
                          
                          {/* Stats Row */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-white/80 mt-1 font-semibold">
                            {eq.stats.attack ? <span className="text-red-300">ATK +{eq.stats.attack}</span> : null}
                            {eq.stats.defense ? <span className="text-blue-300">DEF +{eq.stats.defense}</span> : null}
                            {eq.stats.maxHp ? <span className="text-pink-300">HP +{eq.stats.maxHp}</span> : null}
                            {eq.stats.fireDmg ? <span className="text-red-400">🔥 Fire +{eq.stats.fireDmg}</span> : null}
                            {eq.stats.waterDmg ? <span className="text-blue-400">💧 Water +{eq.stats.waterDmg}</span> : null}
                            {eq.stats.earthDmg ? <span className="text-emerald-400">🌿 Earth +{eq.stats.earthDmg}</span> : null}
                            {eq.stats.lightDmg ? <span className="text-yellow-400">☀️ Light +{eq.stats.lightDmg}</span> : null}
                            {eq.stats.darkDmg ? <span className="text-purple-400">🌙 Dark +{eq.stats.darkDmg}</span> : null}
                            {eq.stats.critChance ? <span className="text-red-400">🎯 Crit Rate +{eq.stats.critChance}%</span> : null}
                            {eq.stats.critDmg ? <span className="text-orange-400">💥 Crit DMG +{eq.stats.critDmg}%</span> : null}
                          </div>

                          {/* Passive Effect */}
                          {eq.passive && (
                            <div className="text-[10px] text-amber-300/90 font-bold flex items-center gap-1 mt-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{eq.passive.description}</span>
                            </div>
                          )}
                       </div>
                    </div>

                    <button 
                      disabled={item.sold}
                      onClick={() => {
                        if (item.sold) return;
                        if (gameState.gold >= item.price) {
                          setGameState(prev => {
                            const newShopItems = [...prev.shopItems];
                            newShopItems[idx].sold = true;

                            const newInventory = [...(prev.inventory || []), eq];
                            let updatedEquipment = { ...prev.equipment };
                            
                            // Auto-equip if slot is currently empty
                            if (!updatedEquipment[eq.slot]) {
                              updatedEquipment[eq.slot] = eq;
                            }

                            const updatedStats = calculateTotalStats(prev.stats, updatedEquipment);
                            const newPlayerMaxHp = updatedStats.maxHp;

                            return {
                              ...prev,
                              gold: prev.gold - item.price,
                              equipment: updatedEquipment,
                              inventory: newInventory,
                              playerMaxHp: newPlayerMaxHp,
                              playerHp: Math.min(newPlayerMaxHp, prev.playerHp),
                              shopItems: newShopItems
                            };
                          });
                          audio.playTone(600, 'sine', 0.1, 0.3);
                        } else alert("Not enough gold!");
                      }}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-transform active:scale-95 flex items-center gap-1",
                        item.sold 
                          ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" 
                          : "bg-gradient-to-r from-amber-500 to-amber-700 text-black border border-yellow-300 font-extrabold shadow-md hover:brightness-110"
                      )}
                    >
                      {item.sold ? 'SOLD' : <><Coins className="w-3.5 h-3.5" /> {item.price}G</>}
                    </button>
                 </div>
               );
            })}
          </div>
          
          <button 
            onClick={() => setGameState(prev => ({ ...prev, status: 'map', currentLayer: prev.currentLayer + 1 }))}
            className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl font-bold mt-4 text-white hover:border-slate-500 transition-colors shadow-lg"
          >
             LEAVE SHOP
          </button>
        </div>
      )}

      {gameState.status === 'store' && (
        <div className="flex-1 flex flex-col p-6 z-10">
          <div className="flex items-center justify-between mb-8 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-4 shadow-lg">
            <h2 className="text-3xl font-black">Store</h2>
            <button onClick={() => setGameState(prev => ({ ...prev, status: 'menu' }))} className="text-white/40 hover:text-white transition-colors">
              <XCircle className="w-8 h-8" />
            </button>
          </div>

          <div className="flex gap-4 mb-8 backdrop-blur-md bg-white/5 p-4 rounded-3xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-2 text-yellow-400 font-bold"><Coins /> {gameState.gold} Gold</div>
            <div className="flex items-center gap-2 text-purple-400 font-bold"><Crown /> {gameState.crystals} Crystals</div>
          </div>

          <div className="space-y-4 overflow-y-auto pb-8">
            <div className="backdrop-blur-md bg-white/5 p-4 rounded-3xl flex items-center justify-between border border-white/10 shadow-md">
               <div>
                  <div className="font-bold text-lg text-purple-400 flex items-center gap-1"><Crown className="w-5 h-5"/> 100 Crystals</div>
                  <div className="text-sm text-white/40 uppercase tracking-tighter text-[10px]">Premium Currency</div>
               </div>
               <button onClick={() => handlePurchase('100 Crystals ($0.99)')} className="bg-green-600/80 hover:bg-green-500 px-4 py-2 rounded-xl font-bold border border-green-400/50 text-sm shadow-md transition-colors">$0.99</button>
            </div>
            <div className="backdrop-blur-md bg-white/5 p-4 rounded-3xl flex items-center justify-between border border-white/10 shadow-md">
               <div>
                  <div className="font-bold text-lg text-amber-400 flex items-center gap-1">☄️ Meteor Strike (Power-up)</div>
                  <div className="text-sm text-white/40 uppercase tracking-tighter text-[10px]">Deal massive damage instantly</div>
               </div>
               <button onClick={() => handlePurchase('Meteor Strike (50 Crystals)')} className="bg-purple-600/80 hover:bg-purple-500 px-4 py-2 rounded-xl font-bold border border-purple-400/50 text-sm shadow-md transition-colors flex items-center gap-1"><Crown className="w-3 h-3"/> 50</button>
            </div>
            <div className="backdrop-blur-md bg-white/5 p-4 rounded-3xl flex items-center justify-between border border-white/10 shadow-md">
               <div>
                  <div className="font-bold text-lg text-pink-400 flex items-center gap-1">✨ Golden Knight Skin (Cosmetic)</div>
                  <div className="text-sm text-white/40 uppercase tracking-tighter text-[10px]">Look glorious in battle</div>
               </div>
               <button onClick={() => handlePurchase('Golden Knight Skin (500 Crystals)')} className="bg-purple-600/80 hover:bg-purple-500 px-4 py-2 rounded-xl font-bold border border-purple-400/50 text-sm shadow-md transition-colors flex items-center gap-1"><Crown className="w-3 h-3"/> 500</button>
            </div>
            <div className="backdrop-blur-md bg-white/5 p-4 rounded-3xl flex items-center justify-between border border-white/10 shadow-md">
               <div>
                  <div className="font-bold text-lg text-yellow-400 flex items-center gap-1"><Coins className="w-5 h-5"/> Free Gold</div>
                  <div className="text-sm text-white/40 uppercase tracking-tighter text-[10px]">Watch Ad for 50 Gold</div>
               </div>
               <button onClick={() => handlePurchase('Watch Ad')} className="bg-blue-600/80 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold border border-blue-400/50 text-sm shadow-md transition-colors">Watch</button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER & VICTORY SCREEN */}
      {(gameState.status === 'gameover' || gameState.status === 'victory') && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
          <div className="flex justify-center mb-6">
            {gameState.status === 'victory' ? (
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                <Trophy className="w-24 h-24 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] relative z-10" />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full" />
                <Skull className="w-24 h-24 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] relative z-10" />
              </div>
            )}
          </div>
          <h2 className={cn("text-3xl font-pixel mb-4 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-tight", gameState.status === 'victory' ? 'text-amber-400' : 'text-red-500')}>
            {gameState.status === 'victory' ? 'LEVEL CLEARED!' : 'DEFEATED'}
          </h2>
          <p className="text-white/60 mb-8 uppercase tracking-widest text-xs font-pixel leading-relaxed">
            {gameState.status === 'victory' ? `You earned 10 Gold!` : 'The boss overpowered you.'}
          </p>

          {gameState.status === 'victory' ? (
             <button 
               onClick={() => setGameState(prev => ({ ...prev, status: 'menu' }))}
               className="w-full py-4 backdrop-blur-md bg-green-500/20 hover:bg-green-500/30 border border-green-400/50 rounded-2xl font-pixel text-[12px] transition-all flex items-center justify-center gap-3 mb-4 text-green-400 shadow-lg"
             >
               VICTORY ACHIEVED - MAIN MENU
             </button>
          ) : (
             <button 
               onClick={() => handlePurchase('Revive')}
               className="w-full py-4 backdrop-blur-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 rounded-2xl font-pixel text-[12px] transition-all flex items-center justify-center gap-3 mb-4 text-purple-400 shadow-lg"
             >
               <Crown className="w-5 h-5"/> REVIVE (50)
             </button>
          )}
          
          <button 
            onClick={() => setGameState(prev => ({ ...prev, status: 'menu' }))}
            className="w-full py-4 backdrop-blur-md bg-white/5 hover:bg-white/10 rounded-2xl font-pixel text-[10px] border border-white/10 transition-colors flex items-center justify-center gap-3 text-white/80 shadow-md"
          >
            <RefreshCw className="w-5 h-5"/> MAIN MENU
          </button>
        </div>
      )}

      {/* PLAYING SCREEN */}
      {gameState.status === 'playing' && (
        <motion.div 
          className="flex-1 flex flex-col z-10 w-full h-full relative"
          animate={playerHit ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {gameState.timer <= 10 && (
            <motion.div 
              className="absolute inset-0 bg-red-600/20 pointer-events-none z-0"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}

          {/* TOP-RIGHT VISUAL CHAIN COMBO COUNTER */}
          <AnimatePresence>
            {chainCombo > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: -20, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: -20 }}
                key={`chain-hud-${chainCombo}`}
                className="absolute top-[72px] right-3 z-30 flex flex-col items-end pointer-events-none"
              >
                <div className="relative bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-orange-950/95 border-2 border-amber-400/90 rounded-2xl px-3 py-2 shadow-[0_0_25px_rgba(245,158,11,0.7)] backdrop-blur-md flex flex-col items-end overflow-hidden min-w-[130px]">
                  {/* Glowing Aura Overlay */}
                  <motion.div 
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="absolute inset-0 bg-gradient-to-l from-amber-500/20 via-orange-500/10 to-transparent rounded-2xl pointer-events-none"
                  />

                  {/* Header: Flame/Lightning Icon + CHAIN xCOUNT */}
                  <div className="flex items-center gap-1.5 z-10">
                    <motion.span 
                      animate={{ scale: [1, 1.35, 1], rotate: [-10, 10, 0] }}
                      transition={{ duration: 0.2 }}
                      className="text-amber-400 text-base"
                    >
                      ⚡
                    </motion.span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[9px] font-pixel text-amber-200/80 uppercase tracking-widest">CHAIN</span>
                      <motion.span 
                        key={`chain-count-num-${chainCombo}`}
                        initial={{ scale: 1.5, color: '#fef08a' }}
                        animate={{ scale: 1, color: '#fbbf24' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                        className="text-xl font-pixel font-black text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.9)]"
                      >
                        x{chainCombo}
                      </motion.span>
                    </div>
                  </div>

                  {/* Damage Bonus Multiplier Badge */}
                  <div className="text-[9px] font-pixel text-orange-200 font-bold bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/50 my-1 z-10 shadow-sm flex items-center gap-1">
                    <span className="text-amber-400/90">BONUS:</span>
                    <span className="text-yellow-300 font-black">
                      +{(chainCombo * 25)}% DMG
                    </span>
                  </div>

                  {/* Decay Timer Window Gauge */}
                  <div className="w-full h-1.5 bg-black/70 rounded-full border border-amber-500/30 overflow-hidden mt-0.5 z-10">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 shadow-[0_0_8px_rgba(251,191,36,1)] rounded-full"
                      style={{ width: `${Math.max(0, (chainTimer / MAX_CHAIN_TIMER) * 100)}%` }}
                      transition={{ duration: 0.1, ease: 'linear' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="w-full flex items-center justify-between p-4 backdrop-blur-xl bg-slate-950/60 border-b border-white/10 shadow-sm z-10">
            <div className="flex flex-col gap-2 w-2/3">
              <div className="flex items-center gap-3">
                 <div className="bg-red-500/20 border border-red-500/40 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-inner shrink-0">
                   <Heart className="w-3 h-3 text-red-400" fill="currentColor" />
                   <span className="text-red-400 font-pixel text-xs pt-1">{Math.max(0, gameState.playerHp)}</span>
                 </div>
                 <div className="flex-1 h-2 bg-black/40 rounded-full border border-white/5 p-0.5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-red-600 to-orange-400 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                      animate={{ width: `${Math.max(0, (gameState.playerHp / calculateTotalStats(gameState.stats, gameState.equipment).maxHp) * 100)}%` }} 
                    />
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setIsInventoryOpen(true)}
                   className="flex items-center gap-1.5 text-xs bg-slate-900/80 hover:bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-lg transition-transform active:scale-95"
                   title="Open Equipment & Inventory"
                 >
                   {gameState.equipment.head ? <span>{gameState.equipment.head.icon}</span> : <span className="opacity-40">🪖</span>}
                   {gameState.equipment.body ? <span>{gameState.equipment.body.icon}</span> : <span className="opacity-40">👕</span>}
                   {gameState.equipment.weapon ? <span>{gameState.equipment.weapon.icon}</span> : <span className="opacity-40">🗡️</span>}
                   <span className="text-amber-400 font-extrabold flex items-center gap-0.5 ml-1 text-[10px]">
                     <Package className="w-3 h-3" /> {gameState.inventory.length}
                   </span>
                 </button>

                 <button
                   onClick={() => {
                     const active = toggleBGM();
                     setIsMusicPlaying(active);
                   }}
                   className={cn(
                     "flex items-center gap-1 text-[10px] font-pixel border px-2 py-0.5 rounded-lg transition-all active:scale-95",
                     isMusicPlaying 
                       ? "bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                       : "bg-slate-900/80 border-slate-700 text-slate-400"
                   )}
                   title="Toggle Encounter Music"
                 >
                   {isMusicPlaying ? <Volume2 className="w-3 h-3 text-amber-400 animate-pulse" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
                   <span>{isMusicPlaying ? 'BGM ON' : 'BGM OFF'}</span>
                 </button>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-xl font-pixel text-red-500 tracking-widest drop-shadow-md pt-1">
                {Math.floor(gameState.timer / 60).toString().padStart(2, '0')}:{(gameState.timer % 60).toString().padStart(2, '0')}
              </div>
              <div className="h-1 w-16 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-red-500 transition-all duration-1000 shadow-[0_0_8px_rgba(239,68,68,1)]" style={{ width: `${(gameState.timer / 60) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-center py-4 gap-3 z-10">
             {[0, 1, 2].map(i => (
                <div key={i} className={cn(
                   "w-8 h-2 rounded-full transition-colors shadow-sm",
                   i < gameState.wrongSwipes ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]" : "bg-white/20"
                )} />
             ))}
          </div>

          <div className="w-full shrink-0 flex flex-col items-center justify-center relative px-4 z-10">
            <div className="backdrop-blur-xl bg-slate-950/80 border border-slate-800 rounded-3xl p-3 flex flex-col items-center justify-center relative w-full max-w-[340px] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              {/* Card Header Badges */}
              <div className="w-full flex items-center justify-between mb-1">
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-widest shadow-sm",
                  getEnemyInfo(gameState.enemyType).isBoss 
                    ? "bg-red-950/90 text-red-400 border-red-500/40" 
                    : "bg-emerald-950/90 text-emerald-400 border-emerald-500/40"
                )}>
                  {getEnemyInfo(gameState.enemyType).isBoss ? 'APEX BOSS' : 'MINION BATTLE'}
                </span>
                <span className="bg-purple-950/90 text-purple-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-purple-500/40 uppercase tracking-widest shadow-sm">
                  {gameState.bossStunTimer > 0 ? (
                    <span className="text-yellow-400 animate-pulse">STUNNED ({gameState.bossStunTimer}s)</span>
                  ) : (
                    <>Ability: {gameState.bossAbilityCooldown}s</>
                  )}
                </span>
              </div>

              {/* Boss/Enemy Name Banner */}
              <div className="w-full text-center py-1 my-0.5 bg-gradient-to-r from-red-950/50 via-slate-900/80 to-red-950/50 border-y border-red-500/30 rounded-lg">
                <span className="text-base font-pixel tracking-widest text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase">
                  {getEnemyInfo(gameState.enemyType).name}
                </span>
              </div>
              
              {/* Boss/Enemy Sprite Frame */}
              <div className="w-full h-[110px] flex items-center justify-center relative my-1 rounded-2xl bg-slate-900/40 border border-white/10 shadow-inner overflow-visible">
                 <div className="flex items-center justify-center pointer-events-none w-full h-full">
                   <BossModel 
                     type={gameState.enemyType} 
                     isHit={enemyHit} 
                     isAttacking={enemyAttacking} 
                     isStunned={gameState.bossStunTimer > 0}
                     stunTimer={gameState.bossStunTimer}
                     weakElement={getEnemyInfo(gameState.enemyType).weak as 'fire' | 'water' | 'earth'}
                   />
                 </div>
              </div>

              {/* Elemental Weakness & Resistance Box */}
              {(() => {
                const enemyInfo = getEnemyInfo(gameState.enemyType);
                const weakElem = enemyInfo.weak;
                const resistElem = enemyInfo.resist;

                const auraGlow = 
                  weakElem === 'water' ? 'shadow-[0_0_20px_rgba(56,189,248,0.2)] border-blue-500/40 bg-slate-950/95' :
                  weakElem === 'fire' ? 'shadow-[0_0_20px_rgba(249,115,22,0.2)] border-red-500/40 bg-slate-950/95' :
                  'shadow-[0_0_20px_rgba(16,185,129,0.2)] border-emerald-500/40 bg-slate-950/95';

                return (
                  <div className={cn("w-full rounded-xl p-1.5 my-1.5 grid grid-cols-2 gap-1.5 text-[10px] font-black uppercase tracking-wider shadow-xl border relative overflow-hidden transition-all duration-500", auraGlow)}>
                    {/* Weakness Indicator Pill */}
                    <div className="flex items-center justify-between bg-black/60 px-2 py-1.5 rounded-lg border border-white/10 relative z-10 overflow-hidden min-w-0">
                      <span className="text-white/50 text-[9px] font-extrabold shrink-0 mr-1">WEAK:</span>
                      {weakElem === 'water' && (
                        <motion.span 
                          animate={{ scale: [1, 1.04, 1] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                          className="flex items-center text-blue-300 gap-1 font-black text-[10px] truncate shrink-0"
                        >
                          <Droplet className="w-3.5 h-3.5 text-blue-400 fill-blue-400/30 shrink-0" />
                          <span className="truncate">WATER</span>
                          <span className="text-blue-200 text-[8px] bg-blue-900/80 px-1 py-0.2 rounded border border-blue-400/40 shrink-0">1.5x</span>
                        </motion.span>
                      )}
                      {weakElem === 'fire' && (
                        <motion.span 
                          animate={{ scale: [1, 1.04, 1] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                          className="flex items-center text-red-300 gap-1 font-black text-[10px] truncate shrink-0"
                        >
                          <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400/30 shrink-0" />
                          <span className="truncate">FIRE</span>
                          <span className="text-red-200 text-[8px] bg-red-900/80 px-1 py-0.2 rounded border border-red-400/40 shrink-0">1.5x</span>
                        </motion.span>
                      )}
                      {weakElem === 'earth' && (
                        <motion.span 
                          animate={{ scale: [1, 1.04, 1] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                          className="flex items-center text-emerald-300 gap-1 font-black text-[10px] truncate shrink-0"
                        >
                          <Leaf className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30 shrink-0" />
                          <span className="truncate">EARTH</span>
                          <span className="text-emerald-200 text-[8px] bg-emerald-900/80 px-1 py-0.2 rounded border border-emerald-400/40 shrink-0">1.5x</span>
                        </motion.span>
                      )}
                    </div>

                    {/* Resistance Indicator Pill */}
                    <div className="flex items-center justify-between bg-black/60 px-2 py-1.5 rounded-lg border border-white/10 relative z-10 overflow-hidden min-w-0">
                      <span className="text-white/50 text-[9px] font-extrabold shrink-0 mr-1">RESIST:</span>
                      {resistElem === 'fire' && (
                        <span className="flex items-center text-amber-300 gap-1 font-black text-[10px] truncate shrink-0">
                          <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">FIRE</span>
                          <span className="text-amber-200 text-[8px] bg-amber-900/60 px-1 py-0.2 rounded border border-amber-500/30 shrink-0">0.5x</span>
                        </span>
                      )}
                      {resistElem === 'earth' && (
                        <span className="flex items-center text-emerald-300 gap-1 font-black text-[10px] truncate shrink-0">
                          <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">EARTH</span>
                          <span className="text-emerald-200 text-[8px] bg-emerald-900/60 px-1 py-0.2 rounded border border-emerald-500/30 shrink-0">0.5x</span>
                        </span>
                      )}
                      {resistElem === 'water' && (
                        <span className="flex items-center text-blue-300 gap-1 font-black text-[10px] truncate shrink-0">
                          <Droplet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">WATER</span>
                          <span className="text-blue-200 text-[8px] bg-blue-900/60 px-1 py-0.2 rounded border border-blue-500/30 shrink-0">0.5x</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Boss Health Bar */}
              <div className="w-full space-y-1 mt-1">
                 <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-red-400">
                   <span>Boss HP</span>
                   <span>{Math.max(0, gameState.enemyHp)} / {gameState.enemyMaxHp}</span>
                 </div>
                 <div className="h-3.5 bg-black/60 rounded-full border border-white/10 p-0.5 overflow-hidden">
                    <motion.div 
                       className="h-full bg-gradient-to-r from-red-600 to-orange-400 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]" 
                       initial={{ width: '100%' }}
                       animate={{ width: `${Math.max(0, (gameState.enemyHp / gameState.enemyMaxHp) * 100)}%` }} 
                    />
                 </div>
              </div>
            </div>
          </div>

          <div className="w-full flex-1 min-h-0 p-4 pb-8 flex justify-center z-20">
            <div ref={boardWrapperRef} className="w-full h-full max-w-[460px] backdrop-blur-xl bg-slate-950/60 border border-white/10 rounded-[40px] p-4 flex items-center justify-center shadow-2xl">
              <div id="gem-grid-container" className="relative" style={{ width: COLS * GEM_SIZE + 8, height: ROWS * GEM_SIZE + 8 }}>
                <AnimatePresence>
                  {gems.map(gem => (
                    <motion.div
                      key={gem.id}
                      initial={{ opacity: 0, y: gem.row * GEM_SIZE - 200 }}
                      animate={{ opacity: 1, x: gem.col * GEM_SIZE, y: gem.row * GEM_SIZE }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      className="absolute p-[2px] cursor-pointer touch-none"
                      style={{ width: GEM_SIZE, height: GEM_SIZE }}
                      onClick={() => handleGemClick(gem)}
                      onPanStart={() => handleGemPanStart(gem)}
                      onPan={(_, info) => handleGemPan(info.offset.x, info.offset.y)}
                      onPanEnd={handleGemPanEnd}
                    >
                      <div className={cn(
                        "w-full h-full rounded-[10px] flex items-center justify-center transition-all duration-200 border bg-gradient-to-br from-white/10 to-black/40 backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_8px_rgba(0,0,0,0.6)]",
                        selectedGemId === gem.id 
                          ? 'border-white ring-2 ring-white scale-110 z-20 shadow-[0_0_20px_rgba(255,255,255,0.5)]' 
                          : gem.special === 'rainbow'
                          ? 'border-amber-300 ring-2 ring-amber-400/80 bg-gradient-to-tr from-purple-800 via-pink-700 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.9)] animate-pulse'
                          : gem.special === 'bomb_3x3'
                          ? 'border-red-400 ring-2 ring-red-500/80 bg-gradient-to-tr from-red-950 via-orange-900 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-pulse'
                          : gem.special === 'light_holy'
                          ? 'border-yellow-300 ring-1 ring-yellow-400/80 bg-gradient-to-tr from-yellow-950 via-amber-900 to-yellow-600 shadow-[0_0_12px_rgba(250,204,21,0.8)]'
                          : gem.special === 'dark_void'
                          ? 'border-purple-300 ring-1 ring-purple-400/80 bg-gradient-to-tr from-purple-950 via-indigo-900 to-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.8)]'
                          : hintGemIds.includes(gem.id)
                          ? 'border-emerald-300 ring-2 ring-emerald-300/80 animate-pulse shadow-[0_0_16px_rgba(110,231,183,0.8)]'
                          : 'border-white/20 hover:bg-white/15 hover:border-white/40'
                      )}>
                        <GemIcon
                          type={gem.type}
                          special={gem.special}
                          className={cn("drop-shadow-lg", GEM_ICON_COLORS[gem.type] || 'text-white')}
                          style={{ width: GEM_SIZE * 0.72, height: GEM_SIZE * 0.72 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* EQUIPMENT DETAIL MODAL */}
      <AnimatePresence>
        {selectedEqModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedEqModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={cn("w-full max-w-sm rounded-3xl border p-6 flex flex-col items-center shadow-2xl relative", getRarityColor(selectedEqModal.rarity))}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedEqModal(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>

              <div className="w-20 h-20 rounded-2xl bg-black/50 border border-white/20 flex items-center justify-center text-5xl mb-4 shadow-inner">
                {selectedEqModal.icon}
              </div>

              <span className={cn("text-xs font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider mb-2", getRarityBadge(selectedEqModal.rarity))}>
                {selectedEqModal.rarity} {selectedEqModal.slot}
              </span>

              <h3 className="text-xl font-extrabold text-white text-center mb-4">{selectedEqModal.name}</h3>

              {/* Stats breakdown */}
              <div className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col gap-2 text-xs font-semibold mb-4">
                {selectedEqModal.stats.attack ? <div className="flex justify-between"><span className="text-slate-400">Attack:</span><span className="text-red-400 font-bold">+{selectedEqModal.stats.attack}</span></div> : null}
                {selectedEqModal.stats.defense ? <div className="flex justify-between"><span className="text-slate-400">Defense:</span><span className="text-blue-400 font-bold">+{selectedEqModal.stats.defense}</span></div> : null}
                {selectedEqModal.stats.maxHp ? <div className="flex justify-between"><span className="text-slate-400">Max HP:</span><span className="text-pink-400 font-bold">+{selectedEqModal.stats.maxHp}</span></div> : null}
                {selectedEqModal.stats.fireDmg ? <div className="flex justify-between"><span className="text-slate-400">Fire Gem Dmg:</span><span className="text-red-400 font-bold">+{selectedEqModal.stats.fireDmg}</span></div> : null}
                {selectedEqModal.stats.waterDmg ? <div className="flex justify-between"><span className="text-slate-400">Water Gem Dmg:</span><span className="text-blue-400 font-bold">+{selectedEqModal.stats.waterDmg}</span></div> : null}
                {selectedEqModal.stats.earthDmg ? <div className="flex justify-between"><span className="text-slate-400">Earth Gem Dmg:</span><span className="text-emerald-400 font-bold">+{selectedEqModal.stats.earthDmg}</span></div> : null}
                {selectedEqModal.stats.lightDmg ? <div className="flex justify-between"><span className="text-slate-400">Light Gem Dmg:</span><span className="text-yellow-400 font-bold">+{selectedEqModal.stats.lightDmg}</span></div> : null}
                {selectedEqModal.stats.darkDmg ? <div className="flex justify-between"><span className="text-slate-400">Dark Gem Dmg:</span><span className="text-purple-400 font-bold">+{selectedEqModal.stats.darkDmg}</span></div> : null}
                {selectedEqModal.stats.critChance ? <div className="flex justify-between"><span className="text-slate-400">Crit Chance:</span><span className="text-red-400 font-bold">+{selectedEqModal.stats.critChance}%</span></div> : null}
                {selectedEqModal.stats.critDmg ? <div className="flex justify-between"><span className="text-slate-400">Crit Damage:</span><span className="text-orange-400 font-bold">+{selectedEqModal.stats.critDmg}%</span></div> : null}
              </div>

              {/* Passive Breakdown */}
              {selectedEqModal.passive && (
                <div className="w-full bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3 flex items-start gap-2 text-xs text-amber-200 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-amber-300 uppercase tracking-wider text-[10px]">Passive Effect</div>
                    <div>{selectedEqModal.passive.description}</div>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setSelectedEqModal(null)}
                className="w-full py-3 bg-slate-800 border border-slate-600 rounded-xl font-extrabold text-xs text-white"
              >
                CLOSE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        gameState={gameState}
        setGameState={setGameState}
      />
    </motion.div>
  );
}

