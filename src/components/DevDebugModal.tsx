import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wrench,
  Play,
  Pause,
  Shield,
  Zap,
  Skull,
  Heart,
  Coins,
  Sparkles,
  Layers,
  Volume2,
  RefreshCw,
  X,
  Flame,
  Droplet,
  Compass,
  Award,
  Crown,
  Eye,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { GameState, EnemyType, SpecialGemType, Gem, Equipment } from '../types';
import { CHAPTERS_DATA } from '../data/chaptersData';
import { generateRandomEquipment, calculateTotalStats } from '../roguelike';
import { generateStageRuneSeals, generateSolvableGrid } from '../gameLogic';
import { cn } from '../utils';

interface DevDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  isGameFrozen: boolean;
  setIsGameFrozen: React.Dispatch<React.SetStateAction<boolean>>;
  isGodMode: boolean;
  setIsGodMode: React.Dispatch<React.SetStateAction<boolean>>;
  gems: Gem[];
  setGems: React.Dispatch<React.SetStateAction<Gem[]>>;
  startBGM: (trackNumber?: number) => void;
  stopBGM: () => void;
  playBossIntroSFX: (enemyType?: EnemyType) => void;
  playRelicBurstSFX: () => void;
  playRuneShatterSFX: () => void;
  playBombSFX: () => void;
  playRainbowSFX: () => void;
  playVictorySFX: () => void;
  playDefeatSFX: () => void;
  spawnLootDropEffects: (gold: number, item: Equipment | null) => void;
  setChainCombo: React.Dispatch<React.SetStateAction<number>>;
  setChainTimer: React.Dispatch<React.SetStateAction<number>>;
}

const ALL_ENEMIES: { type: EnemyType; name: string; icon: string; category: 'boss' | 'minion' | 'miniboss'; element: string }[] = [
  { type: 'minotaur', name: 'Minotaur Warlord', icon: '🐂', category: 'boss', element: 'Fire / Earth' },
  { type: 'phoenix', name: 'Solar Phoenix', icon: '🦅', category: 'boss', element: 'Fire / Light' },
  { type: 'vampire', name: 'Crimson Vampire', icon: '🧛', category: 'boss', element: 'Dark / Blood' },
  { type: 'kraken', name: 'Abyssal Kraken', icon: '🐙', category: 'boss', element: 'Water / Void' },
  { type: 'dragon', name: 'Apex Dragon', icon: '🐉', category: 'boss', element: 'Fire' },
  { type: 'golem', name: 'Granite Golem', icon: '🗿', category: 'boss', element: 'Earth' },
  { type: 'elf', name: 'Elven Ranger', icon: '🧝', category: 'boss', element: 'Nature / Mystic' },
  { type: 'mummy', name: 'Cursed Mummy', icon: '🧟', category: 'boss', element: 'Earth / Dark' },
  { type: 'specter', name: 'Void Specter', icon: '👻', category: 'boss', element: 'Void / Dark' },
  { type: 'gargoyle', name: 'Stone Gargoyle', icon: '🦇', category: 'boss', element: 'Earth' },
  { type: 'hydra', name: 'Toxic Hydra', icon: '🐍', category: 'boss', element: 'Water / Poison' },
  { type: 'goblin', name: 'Goblin Scout', icon: '👺', category: 'minion', element: 'Physical' },
  { type: 'slime', name: 'Crystal Slime', icon: '💧', category: 'minion', element: 'Water' },
  { type: 'imp', name: 'Fiery Imp', icon: '😈', category: 'minion', element: 'Fire' },
  { type: 'skeleton', name: 'Skeleton Warrior', icon: '💀', category: 'minion', element: 'Dark' },
];

const SPECIAL_GEMS_LIST: { type: SpecialGemType; name: string; icon: string; desc: string }[] = [
  { type: 'rainbow', name: 'Rainbow Star', icon: '🌈', desc: 'Clears all matching gems' },
  { type: 'bomb_3x3', name: '3x3 Bomb', icon: '💣', desc: 'Explodes 3x3 grid' },
  { type: 'bomb_cross', name: 'Cross Bomb', icon: '💥', desc: 'Explodes cross area' },
  { type: 'arrow_horizontal', name: 'Horizontal Laser', icon: '↔️', desc: 'Wipes entire row' },
  { type: 'arrow_vertical', name: 'Vertical Laser', icon: '↕️', desc: 'Wipes entire column' },
  { type: 'light_holy', name: 'Holy Light Gem', icon: '☀️', desc: 'Holy burst beam' },
  { type: 'dark_void', name: 'Void Nova Gem', icon: '🌌', desc: 'Cosmic void singularity' },
];

const BGM_TRACKS = [
  { num: 1, name: 'Emerald Canopy', desc: 'Sylvan Woods Flute & Lute' },
  { num: 2, name: 'Scorched Caverns', desc: 'Magma Mines Heavy War Drums' },
  { num: 3, name: 'Gothic Catacombs', desc: 'Echoes of Bone Harpsichord' },
  { num: 4, name: 'Glacial Citadel', desc: 'Frost Spire Crystalline Chimes' },
  { num: 5, name: 'Sunken Lemuria', desc: 'Abyssal Trench Deep Synth' },
  { num: 6, name: 'Sun Pharaoh', desc: 'Golden Desert Oud & Percussion' },
  { num: 7, name: 'Astral Void Rift', desc: 'Cosmic Singularity Choir' },
  { num: 8, name: 'The Gilded Tankard', desc: 'Cozy Tavern & Merchant Tune' },
  { num: 9, name: 'Rest Sanctuary', desc: 'Gentle Campfire & Harp' },
  { num: 10, name: 'APEX OVERLORD', desc: 'Boss Battle Epic Doom Theme' },
];

export const DevDebugModal: React.FC<DevDebugModalProps> = ({
  isOpen,
  onClose,
  gameState,
  setGameState,
  isGameFrozen,
  setIsGameFrozen,
  isGodMode,
  setIsGodMode,
  gems,
  setGems,
  startBGM,
  stopBGM,
  playBossIntroSFX,
  playRelicBurstSFX,
  playRuneShatterSFX,
  playBombSFX,
  playRainbowSFX,
  playVictorySFX,
  playDefeatSFX,
  spawnLootDropEffects,
  setChainCombo,
  setChainTimer,
}) => {
  const [activeTab, setActiveTab] = useState<'boss_stage' | 'cheats' | 'board' | 'loot' | 'audio'>('boss_stage');

  // Boss & Stage Warper state
  const [selectedChapter, setSelectedChapter] = useState<number>(gameState.chapter || 1);
  const [selectedStage, setSelectedStage] = useState<number>(gameState.stage || 1);
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyType>(gameState.enemyType || 'minotaur');
  const [isBossMode, setIsBossMode] = useState<boolean>(true);
  const [sealCountChoice, setSealCountChoice] = useState<number>(4);

  // Status Notification Toast inside Dev Menu
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 2500);
  };

  // Warp into specific battle
  const handleWarpBattle = (withIntro: boolean = false) => {
    const chapterFactor = selectedChapter;
    const enemyMaxHp = isBossMode
      ? 900 + chapterFactor * 300 + (selectedStage - 1) * 150
      : 300 + chapterFactor * 100 + (selectedStage - 1) * 50;

    const seals = generateStageRuneSeals(
      selectedStage - 1,
      selectedEnemy,
      isBossMode,
      selectedChapter
    );

    // Apply custom seal count override if specified
    const finalSeals = sealCountChoice === 0 ? [] : seals.slice(0, Math.max(1, sealCountChoice));

    if (isBossMode) {
      startBGM(10);
      playBossIntroSFX(selectedEnemy);
    } else {
      const track = ((selectedStage % 7) + 1);
      startBGM(track);
    }

    setGameState(prev => ({
      ...prev,
      status: withIntro && isBossMode ? 'bossIntro' : 'playing',
      chapter: selectedChapter,
      stage: selectedStage,
      currentLayer: selectedStage - 1,
      enemyType: selectedEnemy,
      enemyMaxHp,
      enemyHp: enemyMaxHp,
      timer: isBossMode ? 120 : 90,
      bossAbilityCooldown: isBossMode ? 15 : 20,
      bossStunTimer: 0,
      wrongSwipes: 0,
      runeSeals: finalSeals,
      totalSealsInStage: finalSeals.length,
      cleansedSealsCount: 0,
    }));

    setGems(generateSolvableGrid());
    setChainCombo(0);
    setChainTimer(0);
    showToast(`⚡ Warped to Chapter ${selectedChapter} - Stage ${selectedStage} vs ${selectedEnemy.toUpperCase()}`);
    onClose();
  };

  // Screen Warpers
  const handleWarpScreen = (status: GameState['status']) => {
    if (status === 'shop') startBGM(8);
    else if (status === 'rest') startBGM(9);
    else if (status === 'victory') playVictorySFX();
    else if (status === 'gameover') playDefeatSFX();
    else if (status === 'map' || status === 'characterSelect' || status === 'storyIntro') stopBGM();

    setGameState(prev => ({
      ...prev,
      status,
      playerHp: prev.stats.baseMaxHp,
    }));
    showToast(`🗺️ Switched screen to ${status.toUpperCase()}`);
    onClose();
  };

  // Cheats
  const handleInstantKill = () => {
    setGameState(prev => ({
      ...prev,
      enemyHp: 0,
    }));
    showToast('💀 Boss Enemy Defeated (HP = 0)!');
  };

  const handleFullHeal = () => {
    const totalHp = calculateTotalStats(gameState.stats, gameState.equipment).maxHp;
    setGameState(prev => ({
      ...prev,
      playerHp: totalHp,
    }));
    showToast(`💖 Player Fully Restored (${totalHp} HP)!`);
  };

  const handleRelicNovaFull = () => {
    setGameState(prev => ({
      ...prev,
      relicSteps: 50,
      relicBurstCharge: 100,
    }));
    playRelicBurstSFX();
    showToast('✨ Relic Nova 100% Charged (Ready to Blast)!');
  };

  const handleCleanseAllSeals = () => {
    setGameState(prev => ({
      ...prev,
      runeSeals: [],
      cleansedSealsCount: prev.totalSealsInStage,
    }));
    playRuneShatterSFX();
    showToast('🔓 All Rune Seals Cleansed & Vault Unlocked!');
  };

  const handleSpawnSeals = (count: number) => {
    const newSeals = generateStageRuneSeals(
      gameState.currentLayer || 0,
      gameState.enemyType || 'minotaur',
      true,
      gameState.chapter || 1
    ).slice(0, count);

    setGameState(prev => ({
      ...prev,
      runeSeals: newSeals,
      totalSealsInStage: newSeals.length,
      cleansedSealsCount: 0,
    }));
    showToast(`🔒 Spawned ${newSeals.length} Rune Seals on Board!`);
  };

  const handleAddGold = (amount: number) => {
    setGameState(prev => ({ ...prev, gold: Math.max(0, prev.gold + amount) }));
    showToast(`🪙 ${amount >= 0 ? '+' : ''}${amount} Gold Added!`);
  };

  const handleAddCrystals = (amount: number) => {
    setGameState(prev => ({ ...prev, crystals: Math.max(0, prev.crystals + amount) }));
    showToast(`💎 ${amount >= 0 ? '+' : ''}${amount} Crystals Added!`);
  };

  const handleSetTimer = (seconds: number) => {
    setGameState(prev => ({ ...prev, timer: seconds }));
    showToast(`⏱️ Timer set to ${seconds}s`);
  };

  // Board transforms
  const handleSpawnSpecial = (specialType: SpecialGemType) => {
    if (gems.length === 0) return;
    const randomIndex = Math.floor(Math.random() * gems.length);
    const updated = [...gems];
    updated[randomIndex] = {
      ...updated[randomIndex],
      special: specialType,
    };
    setGems(updated);
    if (specialType === 'rainbow') playRainbowSFX();
    else playBombSFX();
    showToast(`🌟 Spawned ${specialType.toUpperCase()} on board!`);
  };

  const handleFillSpecials = () => {
    const specials: SpecialGemType[] = ['rainbow', 'bomb_3x3', 'bomb_cross', 'arrow_horizontal', 'arrow_vertical', 'light_holy', 'dark_void'];
    const updated = gems.map(g => ({
      ...g,
      special: specials[Math.floor(Math.random() * specials.length)],
    }));
    setGems(updated);
    playRainbowSFX();
    showToast('💥 Converted ALL 49 gems to Special Gems!');
  };

  const handleBombField = () => {
    const updated = gems.map((g, i) => (i % 4 === 0 ? { ...g, special: 'bomb_3x3' as SpecialGemType } : g));
    setGems(updated);
    playBombSFX();
    showToast('💣 Spawned Bomb Field on Board!');
  };

  const handleRainbowParty = () => {
    const updated = gems.map((g, i) => (i % 5 === 0 ? { ...g, special: 'rainbow' as SpecialGemType } : g));
    setGems(updated);
    playRainbowSFX();
    showToast('🌈 Spawned Rainbow Gem Party on Board!');
  };

  const handleRerollBoard = () => {
    setGems(generateSolvableGrid());
    showToast('🔄 Re-rolled Solvable Match-3 Grid!');
  };

  const handleTestCombo = (comboCount: number) => {
    setChainCombo(comboCount);
    setChainTimer(4.5);
    showToast(`🔥 Activated ${comboCount}x Chain Combo Simulator!`);
  };

  // Equipment & Loot Spawners
  const handleGiveGear = (slot: 'weapon' | 'body' | 'head', rarity: 'epic' | 'legendary') => {
    const item = generateRandomEquipment(gameState.chapter || 5, slot, rarity === 'legendary');
    item.rarity = rarity;
    setGameState(prev => ({
      ...prev,
      inventory: [...prev.inventory, item],
    }));
    spawnLootDropEffects(75, item);
    showToast(`🎁 Added ${rarity.toUpperCase()} ${slot.toUpperCase()}: ${item.name}`);
  };

  const handleTestLootAnimation = () => {
    const sampleItem = generateRandomEquipment(gameState.chapter || 3, 'weapon', true);
    spawnLootDropEffects(150, sampleItem);
    showToast('🪙 Triggered Flying Gold & Item Loot Drop FX!');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="dev-debug-modal-backdrop"
        className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden"
        onClick={onClose}
      >
        <motion.div
          id="dev-debug-modal-window"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-xl max-h-[92vh] bg-slate-950 border-2 border-amber-500/60 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden relative"
          onClick={e => e.stopPropagation()}
        >
          {/* TOP HEADER */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 p-4 border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-inner">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-amber-300 tracking-wide uppercase font-pixel">DEVELOPER SUITE</h2>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                    DEBUG v2.5
                  </span>
                </div>
                <p className="text-xs text-slate-400">Dungeon boss inspector, game freezer & sandbox controls</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Freeze Toggle in Header */}
              <button
                id="dev-freeze-header-btn"
                onClick={() => {
                  setIsGameFrozen(!isGameFrozen);
                  showToast(isGameFrozen ? '▶️ Game Resumed' : '⏸️ Game FROZEN (Timers & Attacks Halted)');
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border shadow-sm",
                  isGameFrozen 
                    ? "bg-cyan-600 text-white border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse" 
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
                )}
                title="Freeze/Pause all game timers and enemy attacks"
              >
                {isGameFrozen ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                <span>{isGameFrozen ? 'FROZEN' : 'FREEZE'}</span>
              </button>

              <button
                id="dev-close-btn"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 flex items-center justify-center transition-colors"
                title="Close Dev Menu (ESC / ~)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ACTIVE STATUS STRIP */}
          <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-amber-300">Screen:</strong> {gameState.status}
              </span>
              <span className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-red-400" />
                <strong className="text-red-300">Enemy:</strong> {gameState.enemyType} ({gameState.enemyHp}/{gameState.enemyMaxHp} HP)
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                <strong className="text-pink-300">Player:</strong> {gameState.playerHp}/{calculateTotalStats(gameState.stats, gameState.equipment).maxHp} HP
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isGameFrozen && (
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold text-[10px] animate-pulse">
                  ⏸️ FROZEN
                </span>
              )}
              {isGodMode && (
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold text-[10px]">
                  🛡️ GOD MODE
                </span>
              )}
            </div>
          </div>

          {/* NOTIFICATION TOAST */}
          <AnimatePresence>
            {statusToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs py-1.5 px-4 text-center shadow-lg"
              >
                {statusToast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB NAVIGATION */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 overflow-x-auto scrollbar-none px-2 pt-2 gap-1.5">
            {[
              { id: 'boss_stage', label: 'Boss & Stage Warp', icon: Crown },
              { id: 'cheats', label: 'Engine & Cheats', icon: Zap },
              { id: 'board', label: 'Board & Gems', icon: Sparkles },
              { id: 'loot', label: 'Gear & Loot', icon: Award },
              { id: 'audio', label: 'Jukebox & SFX', icon: Volume2 },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`dev-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "px-3 py-2 rounded-t-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all border-t border-x",
                    active
                      ? "bg-slate-950 text-amber-300 border-amber-500/40 shadow-sm -mb-px"
                      : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT CONTAINER */}
          <div className="p-4 flex-1 overflow-y-auto max-h-[60vh] space-y-4">
            {/* TAB 1: BOSS & STAGE WARP */}
            {activeTab === 'boss_stage' && (
              <div className="space-y-4">
                {/* Chapter & Stage Selection */}
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    <span>Select Chapter & Stage Destination</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Chapter (1 to 20):</label>
                      <select
                        id="dev-select-chapter"
                        value={selectedChapter}
                        onChange={e => {
                          const ch = Number(e.target.value);
                          setSelectedChapter(ch);
                          const chData = CHAPTERS_DATA.find(c => c.chapterNumber === ch);
                          if (chData) setSelectedEnemy(chData.bossEnemy);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      >
                        {CHAPTERS_DATA.map(ch => (
                          <option key={ch.chapterNumber} value={ch.chapterNumber}>
                            Ch {ch.chapterNumber}: {ch.title.split(':')[1] || ch.title} ({ch.location})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold mb-1 block">
                        Stage / Layer (1 to 10): <span className="text-amber-300 font-bold">{selectedStage}</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 5, 7, 10].map(s => (
                          <button
                            key={s}
                            id={`dev-stage-btn-${s}`}
                            onClick={() => setSelectedStage(s)}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                              selectedStage === s
                                ? "bg-amber-500 text-slate-950 border-amber-400"
                                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                            )}
                          >
                            {s === 10 ? '👑10' : s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boss / Enemy Monster Picker */}
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Crown className="w-4 h-4" />
                      <span>Select Target Boss / Monster Model</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-slate-400 flex items-center gap-1.5 cursor-pointer">
                        <input
                          id="dev-is-boss-toggle"
                          type="checkbox"
                          checked={isBossMode}
                          onChange={e => setIsBossMode(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span className="font-bold text-xs text-amber-300">Apex Boss Stats</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_ENEMIES.map(enemy => (
                      <button
                        key={enemy.type}
                        id={`dev-enemy-select-${enemy.type}`}
                        onClick={() => setSelectedEnemy(enemy.type)}
                        className={cn(
                          "p-2 rounded-xl border text-left flex items-center gap-2 transition-all relative overflow-hidden",
                          selectedEnemy === enemy.type
                            ? "bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/50 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                            : "bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700"
                        )}
                      >
                        <span className="text-xl shrink-0">{enemy.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{enemy.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{enemy.element}</div>
                        </div>
                        {selectedEnemy === enemy.type && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Stage Rune Seal Preset Choice */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Rune Seals on Grid:</span>
                    <div className="flex gap-1.5">
                      {[0, 3, 5, 8].map(count => (
                        <button
                          key={count}
                          id={`dev-seals-choice-${count}`}
                          onClick={() => setSealCountChoice(count)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors",
                            sealCountChoice === count
                              ? "bg-amber-500 text-slate-950 border-amber-400"
                              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                          )}
                        >
                          {count === 0 ? 'No Seals' : `${count} Seals`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Primary Warp Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="dev-warp-battle-direct"
                    onClick={() => handleWarpBattle(false)}
                    className="py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>WARP DIRECTLY TO COMBAT</span>
                  </button>

                  <button
                    id="dev-warp-battle-intro"
                    onClick={() => handleWarpBattle(true)}
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-2xl border border-amber-500/40 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    <span>WARP WITH BOSS INTRO CINEMATIC</span>
                  </button>
                </div>

                {/* Screen Switchers */}
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Direct Screen Jump:</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {[
                      { status: 'map' as const, label: '🗺️ Map' },
                      { status: 'shop' as const, label: '🏪 Shop' },
                      { status: 'rest' as const, label: '⛺ Camp' },
                      { status: 'victory' as const, label: '🏆 Win' },
                      { status: 'gameover' as const, label: '💀 Defeat' },
                      { status: 'characterSelect' as const, label: '👤 Heroes' },
                    ].map(item => (
                      <button
                        key={item.status}
                        id={`dev-screen-jump-${item.status}`}
                        onClick={() => handleWarpScreen(item.status)}
                        className="py-2 px-1 text-center bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-[11px] font-bold text-slate-200 transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ENGINE & CHEATS */}
            {activeTab === 'cheats' && (
              <div className="space-y-4">
                {/* Real-time Toggles (Freeze & God Mode) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Freeze Combat */}
                  <div className={cn(
                    "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3",
                    isGameFrozen 
                      ? "bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]" 
                      : "bg-slate-900/80 border-slate-800"
                  )}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-black text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                          <Pause className="w-4 h-4" />
                          <span>Freeze Game Clock</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Halts match countdown timer and prevents enemy attack abilities from firing.
                        </p>
                      </div>
                    </div>
                    <button
                      id="dev-toggle-freeze-btn"
                      onClick={() => {
                        setIsGameFrozen(!isGameFrozen);
                        showToast(isGameFrozen ? '▶️ Game Resumed' : '⏸️ Game FROZEN!');
                      }}
                      className={cn(
                        "w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all",
                        isGameFrozen
                          ? "bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow-md"
                          : "bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/40"
                      )}
                    >
                      {isGameFrozen ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                      <span>{isGameFrozen ? 'RESUME GAME CLOCK' : 'FREEZE GAME NOW'}</span>
                    </button>
                  </div>

                  {/* God Mode */}
                  <div className={cn(
                    "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3",
                    isGodMode 
                      ? "bg-emerald-950/60 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                      : "bg-slate-900/80 border-slate-800"
                  )}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                          <Shield className="w-4 h-4" />
                          <span>God Mode (Invincible)</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Locks player HP to max and nullifies all incoming boss/enemy damage.
                        </p>
                      </div>
                    </div>
                    <button
                      id="dev-toggle-godmode-btn"
                      onClick={() => {
                        const next = !isGodMode;
                        setIsGodMode(next);
                        if (next) handleFullHeal();
                        showToast(next ? '🛡️ God Mode ACTIVATED!' : '🛡️ God Mode Deactivated');
                      }}
                      className={cn(
                        "w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all",
                        isGodMode
                          ? "bg-emerald-500 text-slate-950 border-emerald-300 font-black shadow-md"
                          : "bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-500/40"
                      )}
                    >
                      <Shield className="w-4 h-4 fill-current" />
                      <span>{isGodMode ? 'GOD MODE ACTIVE (UNTOUCHABLE)' : 'ENABLE GOD MODE'}</span>
                    </button>
                  </div>
                </div>

                {/* Instant Actions */}
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    <span>Instant Combat Actions</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      id="dev-insta-kill-btn"
                      onClick={handleInstantKill}
                      className="p-2.5 bg-red-950/70 hover:bg-red-900/80 border border-red-500/40 rounded-xl text-left transition-colors"
                    >
                      <div className="flex items-center gap-1 text-xs font-extrabold text-red-300">
                        <Skull className="w-3.5 h-3.5" /> Kill Enemy
                      </div>
                      <div className="text-[10px] text-red-400 mt-0.5">Set HP to 0</div>
                    </button>

                    <button
                      id="dev-full-heal-btn"
                      onClick={handleFullHeal}
                      className="p-2.5 bg-pink-950/70 hover:bg-pink-900/80 border border-pink-500/40 rounded-xl text-left transition-colors"
                    >
                      <div className="flex items-center gap-1 text-xs font-extrabold text-pink-300">
                        <Heart className="w-3.5 h-3.5" /> Full Heal
                      </div>
                      <div className="text-[10px] text-pink-400 mt-0.5">Player HP 100%</div>
                    </button>

                    <button
                      id="dev-nova-charge-btn"
                      onClick={handleRelicNovaFull}
                      className="p-2.5 bg-yellow-950/70 hover:bg-yellow-900/80 border border-yellow-500/40 rounded-xl text-left transition-colors"
                    >
                      <div className="flex items-center gap-1 text-xs font-extrabold text-yellow-300">
                        <Zap className="w-3.5 h-3.5" /> Relic Nova
                      </div>
                      <div className="text-[10px] text-yellow-400 mt-0.5">Charge 100% (50)</div>
                    </button>

                    <button
                      id="dev-cleanse-seals-btn"
                      onClick={handleCleanseAllSeals}
                      className="p-2.5 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 rounded-xl text-left transition-colors"
                    >
                      <div className="flex items-center gap-1 text-xs font-extrabold text-purple-300">
                        <Sparkles className="w-3.5 h-3.5" /> Clear Seals
                      </div>
                      <div className="text-[10px] text-purple-400 mt-0.5">Unlock Vault</div>
                    </button>
                  </div>
                </div>

                {/* Timers & Economy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Timer Controls */}
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                      <span>⏱️ Match Timer Control</span>
                      <span className="text-white font-mono">{gameState.timer}s</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        id="dev-add-30s-btn"
                        onClick={() => handleSetTimer(gameState.timer + 30)}
                        className="py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200"
                      >
                        +30s
                      </button>
                      <button
                        id="dev-set-999s-btn"
                        onClick={() => handleSetTimer(999)}
                        className="py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-amber-300"
                      >
                        999s (Inf)
                      </button>
                      <button
                        id="dev-set-5s-btn"
                        onClick={() => handleSetTimer(5)}
                        className="py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-red-400"
                      >
                        5s (Alert)
                      </button>
                    </div>
                  </div>

                  {/* Economy Controls */}
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                      <span>🪙 Currencies</span>
                      <span className="text-amber-300 font-bold">{gameState.gold}G | {gameState.crystals}💎</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        id="dev-add-500g-btn"
                        onClick={() => handleAddGold(500)}
                        className="py-1.5 bg-slate-950 hover:bg-slate-800 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-300"
                      >
                        +500G
                      </button>
                      <button
                        id="dev-add-5000g-btn"
                        onClick={() => handleAddGold(5000)}
                        className="py-1.5 bg-slate-950 hover:bg-slate-800 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-300"
                      >
                        +5k G
                      </button>
                      <button
                        id="dev-add-100c-btn"
                        onClick={() => handleAddCrystals(100)}
                        className="py-1.5 bg-slate-950 hover:bg-slate-800 border border-cyan-500/30 rounded-lg text-xs font-bold text-cyan-300"
                      >
                        +100💎
                      </button>
                      <button
                        id="dev-clear-gold-btn"
                        onClick={() => setGameState(prev => ({ ...prev, gold: 0, crystals: 0 }))}
                        className="py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-400"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BOARD & GEMS */}
            {activeTab === 'board' && (
              <div className="space-y-4">
                {/* Spawn Specific Special Gem */}
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Spawn Special Gem On Board</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SPECIAL_GEMS_LIST.map(spec => (
                      <button
                        key={spec.type}
                        id={`dev-spawn-gem-${spec.type}`}
                        onClick={() => handleSpawnSpecial(spec.type)}
                        className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/60 rounded-xl text-left transition-all active:scale-95"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{spec.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-white">{spec.name}</div>
                            <div className="text-[10px] text-slate-400 leading-tight">{spec.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mass Board Manipulators */}
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Mass Board Transformers</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      id="dev-board-all-specials"
                      onClick={handleFillSpecials}
                      className="p-3 bg-gradient-to-r from-purple-950 to-pink-950 hover:from-purple-900 hover:to-pink-900 border border-purple-400/50 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-pink-300 flex items-center gap-1.5">
                        🌟 All-Special Super Board
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Converts all 49 gems into Rainbows, Bombs & Lasers
                      </div>
                    </button>

                    <button
                      id="dev-board-bomb-field"
                      onClick={handleBombField}
                      className="p-3 bg-gradient-to-r from-red-950 to-orange-950 hover:from-red-900 hover:to-orange-900 border border-red-400/50 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-orange-300 flex items-center gap-1.5">
                        💣 10x Bomb Field
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Fills the board with explosive 3x3 bombs
                      </div>
                    </button>

                    <button
                      id="dev-board-rainbow-party"
                      onClick={handleRainbowParty}
                      className="p-3 bg-gradient-to-r from-amber-950 to-yellow-950 hover:from-amber-900 hover:to-yellow-900 border border-yellow-400/50 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-yellow-300 flex items-center gap-1.5">
                        🌈 Rainbow Star Grid
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Spawns 8+ Rainbow gems for super clearing
                      </div>
                    </button>

                    <button
                      id="dev-board-reroll-solvable"
                      onClick={handleRerollBoard}
                      className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Re-roll Solvable Grid
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Generates a guaranteed solvable fresh board
                      </div>
                    </button>
                  </div>
                </div>

                {/* Chain Combo Simulator */}
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">Simulate Chain Combo Multiplier:</span>
                  <div className="flex gap-1.5">
                    {[3, 5, 8, 12].map(c => (
                      <button
                        key={c}
                        id={`dev-test-combo-${c}`}
                        onClick={() => handleTestCombo(c)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-amber-600 hover:text-slate-950 border border-slate-700 text-amber-300 font-black rounded-lg text-xs transition-colors"
                      >
                        {c}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GEAR & LOOT */}
            {activeTab === 'loot' && (
              <div className="space-y-4">
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>Spawn Authentic High-Tier Equipment</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      id="dev-give-leg-weapon"
                      onClick={() => handleGiveGear('weapon', 'legendary')}
                      className="p-3 bg-slate-950 hover:bg-slate-800 border border-amber-500/40 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-amber-300">🗡️ Legendary Weapon</div>
                      <div className="text-[10px] text-slate-400">High ATK + Elemental Boost</div>
                    </button>

                    <button
                      id="dev-give-leg-body"
                      onClick={() => handleGiveGear('body', 'legendary')}
                      className="p-3 bg-slate-950 hover:bg-slate-800 border border-amber-500/40 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-amber-300">🛡️ Legendary Armor</div>
                      <div className="text-[10px] text-slate-400">High DEF + Slow Heal / HP</div>
                    </button>

                    <button
                      id="dev-give-leg-head"
                      onClick={() => handleGiveGear('head', 'legendary')}
                      className="p-3 bg-slate-950 hover:bg-slate-800 border border-amber-500/40 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-amber-300">👑 Legendary Helm</div>
                      <div className="text-[10px] text-slate-400">Crit Chance + Max HP</div>
                    </button>

                    <button
                      id="dev-give-epic-weapon"
                      onClick={() => handleGiveGear('weapon', 'epic')}
                      className="p-3 bg-slate-950 hover:bg-slate-800 border border-purple-500/40 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-purple-300">⚔️ Epic Weapon</div>
                      <div className="text-[10px] text-slate-400">Strong damage stats</div>
                    </button>

                    <button
                      id="dev-give-epic-body"
                      onClick={() => handleGiveGear('body', 'epic')}
                      className="p-3 bg-slate-950 hover:bg-slate-800 border border-purple-500/40 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-purple-300">🥋 Epic Armor</div>
                      <div className="text-[10px] text-slate-400">Defense & HP Boost</div>
                    </button>

                    <button
                      id="dev-give-epic-head"
                      onClick={() => handleGiveGear('head', 'epic')}
                      className="p-3 bg-slate-950 hover:bg-slate-800 border border-purple-500/40 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-purple-300">🎩 Epic Helmet</div>
                      <div className="text-[10px] text-slate-400">Balanced stats</div>
                    </button>
                  </div>
                </div>

                {/* Animation & Inventory Reset */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="dev-test-loot-drop-btn"
                    onClick={handleTestLootAnimation}
                    className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs text-amber-300 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Test Flying Loot Drop Animation</span>
                  </button>

                  <button
                    id="dev-clear-inventory-btn"
                    onClick={() => {
                      setGameState(prev => ({ ...prev, inventory: [] }));
                      showToast('🗑️ Emptied Bag Inventory');
                    }}
                    className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs text-red-300 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>Wipe Inventory Bag</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: AUDIO & JUKEBOX */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" />
                    <span>Background Music Jukebox (10 Synthesizer Tracks)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BGM_TRACKS.map(track => (
                      <button
                        key={track.num}
                        id={`dev-play-bgm-${track.num}`}
                        onClick={() => {
                          startBGM(track.num);
                          showToast(`🎵 Playing Track ${track.num}: ${track.name}`);
                        }}
                        className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left flex items-center justify-between transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-amber-300">
                            {track.num}. {track.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{track.desc}</div>
                        </div>
                        <Play className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>

                  <button
                    id="dev-stop-bgm-btn"
                    onClick={() => {
                      stopBGM();
                      showToast('🔇 Stopped BGM Music');
                    }}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 mt-2"
                  >
                    Stop All BGM Playback
                  </button>
                </div>

                {/* SFX Tester */}
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Test Procedural Web Audio SFX:</div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    <button onClick={() => playRelicBurstSFX()} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200">
                      ⚡ Relic Burst
                    </button>
                    <button onClick={() => playRuneShatterSFX()} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200">
                      🔓 Rune Shatter
                    </button>
                    <button onClick={() => playBombSFX()} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200">
                      💣 Bomb Boom
                    </button>
                    <button onClick={() => playRainbowSFX()} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200">
                      🌈 Rainbow Chime
                    </button>
                    <button onClick={() => playBossIntroSFX('minotaur')} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200">
                      🐂 Minotaur Roar
                    </button>
                    <button onClick={() => playBossIntroSFX('phoenix')} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200">
                      🦅 Phoenix Cry
                    </button>
                    <button onClick={() => playVictorySFX()} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200">
                      🏆 Victory Fanfare
                    </button>
                    <button onClick={() => playDefeatSFX()} className="py-2 px-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200">
                      💀 Defeat Dirge
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="bg-slate-900/90 px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Dev Menu active • Hotkeys: <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">~</kbd> or <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">F2</kbd>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
