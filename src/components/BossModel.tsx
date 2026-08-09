import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dragonImg from '../assets/images/dragon_spritesheet_1786209780891.jpg';
import elfImg from '../assets/images/elf_spritesheet_1786209795354.jpg';
import golemImg from '../assets/images/golem_spritesheet_1786209813745.jpg';
import goblinImg from '../assets/images/goblin_spritesheet_1786216397754.jpg';
import slimeImg from '../assets/images/slime_spritesheet_1786216412229.jpg';
import impImg from '../assets/images/imp_spritesheet_1786216425329.jpg';
import skeletonImg from '../assets/images/skeleton_spritesheet_1786216438358.jpg';
import minotaurImg from '../assets/images/minotaur_boss_sprite_1786283663794.jpg';
import phoenixImg from '../assets/images/phoenix_boss_sprite_1786283681083.jpg';
import { EnemyType } from '../types';
import { cn } from '../utils';
import { speakMobTaunt } from '../utils/mobTaunts';

// In-memory cache so we only ever pay the background-removal cost once per
// sprite sheet, even across repeated boss encounters / remounts.
const transparentSpriteCache = new Map<string, string>();

const useTransparentSprite = (src: string, skip = false) => {
  const [transparentSrc, setTransparentSrc] = useState<string | null>(
    () => (skip ? src : transparentSpriteCache.get(src) ?? null)
  );

  useEffect(() => {
    // Full-bleed scene art (no flat backdrop to detect) — render as-is,
    // skip the background-removal pass entirely so it doesn't mistake real
    // artwork (torches, stone, lava) for background and erase it.
    if (skip) {
      setTransparentSrc(src);
      return;
    }

    // Already processed this exact sheet before — reuse it, no rework.
    const cached = transparentSpriteCache.get(src);
    if (cached) {
      setTransparentSrc(cached);
      return;
    }

    let cancelled = false;
    setTransparentSrc(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample a small border strip (not just 4 single pixels) so one noisy
      // corner pixel can't skew the estimated background color, then use
      // the median rather than the mean to stay robust against outliers
      // (e.g. a wingtip or flame that happens to touch a corner).
      const w = img.width;
      const h = img.height;
      const sampleStep = 4;
      const rSamples: number[] = [];
      const gSamples: number[] = [];
      const bSamples: number[] = [];

      const sampleAt = (x: number, y: number) => {
        const i = (y * w + x) * 4;
        rSamples.push(data[i]);
        gSamples.push(data[i + 1]);
        bSamples.push(data[i + 2]);
      };

      for (let x = 0; x < w; x += sampleStep) {
        sampleAt(x, 0);
        sampleAt(x, h - 1);
      }
      for (let y = 0; y < h; y += sampleStep) {
        sampleAt(0, y);
        sampleAt(w - 1, y);
      }

      const median = (arr: number[]) => {
        const sorted = [...arr].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
      };
      const bgR = median(rSamples);
      const bgG = median(gSamples);
      const bgB = median(bSamples);

      const tolerance = 55;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

        if (dist < tolerance) {
          data[i + 3] = 0;
        } else if (dist < tolerance + 20) {
          data[i + 3] = Math.floor((dist - tolerance) * (255 / 20));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const result = canvas.toDataURL('image/png');
      transparentSpriteCache.set(src, result);
      if (!cancelled) {
        setTransparentSrc(result);
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        // Fall back to the raw (opaque-background) sprite rather than
        // leaving the boss stuck on the "Summoning..." placeholder forever.
        transparentSpriteCache.set(src, src);
        setTransparentSrc(src);
      }
    };

    return () => {
      cancelled = true;
    };
  }, [src, skip]);

  return transparentSrc;
};

interface BossModelProps {
  type: EnemyType;
  isHit: boolean;
  isAttacking?: boolean;
  isStunned?: boolean;
  stunTimer?: number;
  weakElement?: 'water' | 'fire' | 'earth';
}

export const BossModel = ({ type, isHit, isAttacking, isStunned, stunTimer, weakElement }: BossModelProps) => {
  const [dialogue, setDialogue] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setFrame(f => (f + 1) % 4), 140);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isHit) {
      const line = speakMobTaunt(type, 'hit');
      if (line) setDialogue(line);
    } else if (isAttacking) {
      const line = speakMobTaunt(type, 'attack');
      if (line) setDialogue(line);
    } else {
      // Optional initial encounter taunt
      const line = speakMobTaunt(type, 'taunt');
      if (line) {
        setDialogue(line);
        const timer = setTimeout(() => setDialogue(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isHit, isAttacking, type]);

  const baseClass = "relative flex items-center justify-center w-full h-full";
  
  const variants = {
    idle: {
      y: [-6, 6, -6],
      rotateZ: [-1, 1, -1],
      filter: 'brightness(1) drop-shadow(0px 12px 25px rgba(0,0,0,0.85))',
      transition: { repeat: Infinity, duration: 2.8, ease: "easeInOut" }
    },
    hit: {
      scale: [1, 1.18, 0.88, 1],
      x: [-12, 12, -8, 8, 0],
      rotateZ: [-5, 5, -3, 3, 0],
      filter: 'brightness(1.8) contrast(1.4) drop-shadow(0px 0px 25px rgba(239,68,68,1)) hue-rotate(20deg)',
      transition: { duration: 0.35, ease: "easeOut" }
    },
    attack: {
      scale: [1, 1.45, 0.95, 1],
      x: [0, -45, 55, 0],
      y: [0, -35, 20, 0],
      z: [0, 110, -20, 0],
      rotateZ: [0, -20, 25, 0],
      filter: 'brightness(1.8) contrast(1.6) drop-shadow(0px 30px 45px rgba(251,191,36,0.95))',
      transition: { duration: 0.5, ease: "easeInOut" }
    }
  };

  const currentState = isHit ? 'hit' : isAttacking ? 'attack' : 'idle';

  const getImgSrc = () => {
    switch (type) {
      case 'dragon': return dragonImg;
      case 'elf': return elfImg;
      case 'golem': return golemImg;
      case 'goblin': return goblinImg;
      case 'slime': return slimeImg;
      case 'imp': return impImg;
      case 'skeleton': return skeletonImg;
      case 'minotaur': return minotaurImg;
      case 'phoenix': return phoenixImg;
      case 'mummy': return skeletonImg;
      case 'specter': return impImg;
      case 'kraken': return dragonImg;
      case 'gargoyle': return golemImg;
      case 'vampire': return elfImg;
      case 'hydra': return dragonImg;
      default: return dragonImg;
    }
  };

  const getAuraColor = () => {
    switch (type) {
      case 'dragon': return 'bg-red-600/40';
      case 'elf': return 'bg-fuchsia-600/40';
      case 'golem': return 'bg-amber-600/40';
      case 'slime': return 'bg-cyan-500/40';
      case 'goblin': return 'bg-emerald-600/40';
      case 'imp': return 'bg-orange-600/40';
      case 'skeleton': return 'bg-purple-800/40';
    }
  };

  const imgSrc = getImgSrc();
  
  const SPRITESHEET_TYPES: EnemyType[] = [
    'dragon', 'elf', 'golem', 'goblin', 'slime', 'imp', 'skeleton',
    'mummy', 'specter', 'kraken', 'gargoyle', 'vampire', 'hydra'
  ];
  const isSpriteSheetType = SPRITESHEET_TYPES.includes(type);

  // Full-bleed scene portraits (art touches every edge — torches, walls,
  // lava, etc.) have no flat backdrop for the background-removal pass to
  // detect, so it ends up erasing real artwork. Render these as-is instead.
  const FULL_SCENE_PORTRAIT_TYPES: EnemyType[] = ['minotaur', 'phoenix'];
  const skipBgRemoval = FULL_SCENE_PORTRAIT_TYPES.includes(type);

  const transparentSrc = useTransparentSprite(imgSrc, skipBgRemoval);
  const currentRow = isHit ? 2 : isAttacking ? 1 : 0;

  const renderExtendedMonsterVector = () => {
    switch (type) {
      case 'minotaur':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.9)]">
            <path d="M20 30 L10 10 L30 25 M80 30 L90 10 L70 25" stroke="#f59e0b" strokeWidth="6" fill="none" strokeLinecap="round" />
            <circle cx="50" cy="45" r="28" fill="#78350f" stroke="#b45309" strokeWidth="2" />
            <circle cx="40" cy="40" r="4" fill="#ef4444" />
            <circle cx="60" cy="40" r="4" fill="#ef4444" />
            <path d="M42 55 Q50 62 58 55" stroke="#f59e0b" strokeWidth="3" fill="none" />
            <path d="M25 65 L50 92 L75 65 Z" fill="#451a03" stroke="#78350f" strokeWidth="2" />
            <path d="M15 50 L35 75 M85 50 L65 75" stroke="#94a3b8" strokeWidth="4" />
          </svg>
        );
      case 'mummy':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.9)]">
            <rect x="28" y="15" width="44" height="70" rx="12" fill="#fef08a" stroke="#ca8a04" strokeWidth="3" />
            <line x1="28" y1="28" x2="72" y2="32" stroke="#854d0e" strokeWidth="3" />
            <line x1="28" y1="42" x2="72" y2="38" stroke="#854d0e" strokeWidth="3" />
            <line x1="28" y1="56" x2="72" y2="58" stroke="#854d0e" strokeWidth="3" />
            <circle cx="40" cy="35" r="5" fill="#000" />
            <circle cx="40" cy="35" r="2" fill="#eab308" />
            <circle cx="60" cy="35" r="5" fill="#000" />
            <circle cx="60" cy="35" r="2" fill="#eab308" />
          </svg>
        );
      case 'specter':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
            <path d="M25 80 C20 40 30 15 50 15 C70 15 80 40 75 80 C65 70 55 85 50 70 C45 85 35 70 25 80 Z" fill="#7e22ce" stroke="#c084fc" strokeWidth="2.5" opacity="0.9" />
            <circle cx="40" cy="38" r="5" fill="#06b6d4" className="animate-pulse" />
            <circle cx="60" cy="38" r="5" fill="#06b6d4" className="animate-pulse" />
          </svg>
        );
      case 'kraken':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.9)]">
            <circle cx="50" cy="38" r="26" fill="#0369a1" stroke="#38bdf8" strokeWidth="3" />
            <path d="M20 60 Q10 85 25 95 M35 62 Q30 90 42 95 M50 64 Q50 92 58 95 M65 62 Q70 90 75 95 M80 60 Q90 85 85 95" stroke="#0284c7" strokeWidth="5" fill="none" strokeLinecap="round" />
            <circle cx="40" cy="35" r="6" fill="#e0f2fe" />
            <circle cx="40" cy="35" r="3" fill="#000" />
            <circle cx="60" cy="35" r="6" fill="#e0f2fe" />
            <circle cx="60" cy="35" r="3" fill="#000" />
          </svg>
        );
      case 'phoenix':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(234,179,8,0.9)]">
            <path d="M50 15 L20 45 L35 50 L10 75 L45 65 L50 90 L55 65 L90 75 L65 50 L80 45 Z" fill="#f97316" stroke="#fef08a" strokeWidth="2.5" />
            <circle cx="50" cy="30" r="10" fill="#ef4444" />
            <circle cx="46" cy="28" r="2" fill="#fff" />
            <circle cx="54" cy="28" r="2" fill="#fff" />
          </svg>
        );
      case 'gargoyle':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.9)]">
            <path d="M15 30 Q30 10 40 35 M85 30 Q70 10 60 35" stroke="#475569" strokeWidth="6" fill="none" />
            <rect x="30" y="25" width="40" height="55" rx="8" fill="#334155" stroke="#94a3b8" strokeWidth="3" />
            <circle cx="42" cy="40" r="4" fill="#f59e0b" />
            <circle cx="58" cy="40" r="4" fill="#f59e0b" />
            <path d="M40 58 L50 65 L60 58" stroke="#e2e8f0" strokeWidth="2" fill="none" />
          </svg>
        );
      case 'vampire':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(185,28,28,0.8)]">
            <path d="M10 20 L50 90 L90 20 Z" fill="#450a0a" stroke="#dc2626" strokeWidth="2" />
            <circle cx="50" cy="35" r="18" fill="#fecdd3" stroke="#9f1239" strokeWidth="2" />
            <circle cx="43" cy="32" r="3" fill="#9f1239" />
            <circle cx="57" cy="32" r="3" fill="#9f1239" />
            <path d="M45 45 L47 50 M55 45 L53 50" stroke="#fff" strokeWidth="2" />
          </svg>
        );
      case 'hydra':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(16,185,129,0.9)]">
            <path d="M20 70 Q30 20 35 30 M50 80 Q50 15 50 25 M80 70 Q70 20 65 30" stroke="#059669" strokeWidth="6" fill="none" />
            <circle cx="35" cy="30" r="10" fill="#10b981" />
            <circle cx="50" cy="25" r="12" fill="#10b981" />
            <circle cx="65" cy="30" r="10" fill="#10b981" />
            <circle cx="47" cy="22" r="2" fill="#000" />
            <circle cx="53" cy="22" r="2" fill="#000" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={baseClass} style={{ perspective: '1000px' }}>
      {/* Dynamic Element Aura Halo */}
      <div 
        className={`absolute inset-[-40%] ${isStunned ? 'bg-amber-500/50 blur-[60px] animate-pulse' : getAuraColor()} blur-[45px] rounded-full z-0 transition-all duration-500`} 
        style={{ transform: isAttacking ? 'scale(1.6)' : isHit ? 'scale(1.3)' : isStunned ? 'scale(1.4)' : 'scale(1)' }} 
      />

      {/* Staggered / Vulnerable Elemental Aura Ring & Swirling Particles */}
      {isStunned && (
        <>
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.12, 1] }}
            transition={{ rotate: { repeat: Infinity, duration: 4, ease: "linear" }, scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } }}
            className={cn(
              "absolute w-[180px] h-[180px] rounded-full border-2 border-dashed z-0 pointer-events-none opacity-80",
              weakElement === 'fire' ? "border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.8)]" :
              weakElement === 'water' ? "border-blue-400 shadow-[0_0_30px_rgba(56,189,248,0.8)]" :
              "border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.8)]"
            )}
          />

          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            {[...Array(6)].map((_, idx) => {
              const angle = (idx / 6) * Math.PI * 2;
              const radius = 55;
              const xPos = Math.cos(angle) * radius;
              const yPos = Math.sin(angle) * radius;

              return (
                <motion.div
                  key={idx}
                  animate={{
                    x: [xPos, xPos + (Math.random() * 20 - 10), xPos],
                    y: [yPos, yPos - 25, yPos],
                    scale: [0.6, 1.2, 0.6],
                    opacity: [0.2, 0.9, 0.2],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.8 + idx * 0.2,
                    ease: "easeInOut",
                    delay: idx * 0.25,
                  }}
                  className={cn(
                    "absolute w-4 h-4 rounded-full flex items-center justify-center text-xs font-black shadow-lg",
                    weakElement === 'fire' ? "bg-red-500/80 text-yellow-200 shadow-red-500" :
                    weakElement === 'water' ? "bg-blue-500/80 text-cyan-100 shadow-blue-500" :
                    "bg-emerald-500/80 text-emerald-100 shadow-emerald-500"
                  )}
                >
                  {weakElement === 'fire' ? '🔥' : weakElement === 'water' ? '💧' : '🌿'}
                </motion.div>
              );
            })}
          </div>

          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 pointer-events-none">
            <motion.div
              animate={{ rotate: 360, y: [-2, 2, -2] }}
              transition={{ rotate: { repeat: Infinity, duration: 1.5, ease: "linear" }, y: { repeat: Infinity, duration: 1 } }}
              className="text-lg drop-shadow-[0_0_8px_rgba(250,204,21,1)]"
            >
              💫
            </motion.div>
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="px-2 py-0.5 rounded-full bg-yellow-500 text-black font-extrabold text-[9px] tracking-widest border border-black shadow-[0_0_15px_rgba(234,179,8,1)] uppercase"
            >
              VULNERABLE 1.5x
            </motion.span>
          </div>
        </>
      )}

      {/* Ground Shadow */}
      <motion.div 
        animate={{ 
          scaleX: isAttacking ? 1.4 : isHit ? 0.7 : [1, 1.12, 1], 
          opacity: isHit ? 0.3 : [0.4, 0.75, 0.4] 
        }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-1 w-32 h-6 bg-black/90 rounded-full blur-md z-0"
        style={{ transform: 'rotateX(75deg)' }}
      />
      
      {/* Speech Dialogue */}
      <AnimatePresence>
        {dialogue && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -75, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute z-40 bg-slate-950/95 border-2 border-amber-400/80 text-amber-200 font-pixel text-[11px] px-3.5 py-1.5 rounded-xl whitespace-nowrap shadow-[0_0_20px_rgba(251,191,36,0.5)]"
            style={{ top: '-10%' }}
          >
            {dialogue}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-amber-400/80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Sprite Container — Scaled to fit 100% inside container without cutting off */}
      <motion.div 
        variants={variants} 
        animate={currentState}
        className="relative z-10 w-[125px] h-[125px] flex items-center justify-center transform-gpu"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {isSpriteSheetType && transparentSrc ? (
          <div 
            className="w-full h-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.9)] transform-gpu"
            style={{
              backgroundImage: `url(${transparentSrc})`,
              backgroundSize: '400% 300%',
              backgroundPosition: `${(frame / 3) * 100}% ${(currentRow / 2) * 100}%`,
              imageRendering: 'pixelated',
              transform: 'translateZ(30px)'
            }}
          />
        ) : !isSpriteSheetType && transparentSrc ? (
          <img
            src={transparentSrc}
            alt={type}
            className="w-full h-full object-contain filter drop-shadow-[0_12px_22px_rgba(0,0,0,0.95)] transform-gpu select-none pointer-events-none rounded-xl"
            style={{ transform: 'translateZ(30px)' }}
          />
        ) : imgSrc ? (
          <img
            src={imgSrc}
            alt={type}
            className="w-full h-full object-contain filter drop-shadow-[0_12px_22px_rgba(0,0,0,0.95)] transform-gpu select-none pointer-events-none rounded-xl"
            style={{ transform: 'translateZ(30px)' }}
          />
        ) : (
          <div className="w-full h-full p-1 flex items-center justify-center bg-slate-900 border border-white/20 rounded-xl">
            {renderExtendedMonsterVector() || <div className="text-4xl">👾</div>}
          </div>
        )}

        {/* Attack 3D Slash Energy Arcs */}
        {isAttacking && (
          <>
            <motion.div
              initial={{ scale: 0.2, opacity: 1, rotate: -45 }}
              animate={{ scale: 2.2, opacity: 0, rotate: 60 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute inset-0 z-30 border-t-8 border-r-8 border-amber-300 rounded-full blur-[1px] shadow-[0_0_30px_rgba(251,191,36,1)] pointer-events-none"
              style={{ transform: 'translateZ(90px)' }}
            />
            <motion.div
              initial={{ scale: 0.1, opacity: 1, rotate: 45 }}
              animate={{ scale: 1.9, opacity: 0, rotate: -30 }}
              transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
              className="absolute inset-0 z-30 border-b-6 border-l-6 border-red-400 rounded-full blur-[1px] shadow-[0_0_25px_rgba(239,68,68,1)] pointer-events-none"
              style={{ transform: 'translateZ(100px)' }}
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-20 bg-amber-400/30 rounded-full blur-xl pointer-events-none"
            />
          </>
        )}

        {/* Hit Damage Particles Burst */}
        {isHit && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-16 h-16 bg-red-500/40 rounded-full blur-md"
            />
            <motion.span animate={{ y: [-10, -35], opacity: [1, 0] }} transition={{ duration: 0.5 }} className="absolute text-lg font-bold text-red-400 font-pixel drop-shadow-[0_2px_4px_black]">
              CRIT!
            </motion.span>
          </div>
        )}
        {/* Unique Monster Ambient Particles */}
        {type === 'dragon' && (
          <>
            <motion.div animate={{ y: [-20, 20], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute bottom-5 left-5 w-4 h-4 bg-orange-500 rounded-full blur-[3px] mix-blend-screen" />
            <motion.div animate={{ y: [-30, 10], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }} className="absolute bottom-10 right-5 w-5 h-5 bg-red-500 rounded-full blur-[4px] mix-blend-screen" />
          </>
        )}
        {type === 'slime' && (
          <>
            <motion.div animate={{ y: [-15, -40], opacity: [0, 1, 0], x: [-10, -20] }} transition={{ repeat: Infinity, duration: 1.6 }} className="absolute top-2 left-2 w-3 h-3 bg-cyan-300/80 rounded-full blur-[1px]" />
            <motion.div animate={{ y: [-10, -35], opacity: [0, 1, 0], x: [10, 20] }} transition={{ repeat: Infinity, duration: 2, delay: 0.4 }} className="absolute top-4 right-2 w-3.5 h-3.5 bg-blue-300/80 rounded-full blur-[1px]" />
          </>
        )}
        {type === 'imp' && (
          <>
            <motion.div animate={{ y: [-10, 10], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute top-0 left-0 text-xs">🔥</motion.div>
            <motion.div animate={{ y: [10, -10], scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} className="absolute bottom-2 right-0 text-xs">✨</motion.div>
          </>
        )}
        {type === 'skeleton' && (
          <>
            <motion.div animate={{ y: [-10, -25], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="absolute -top-2 right-2 text-xs">💜</motion.div>
            <motion.div animate={{ y: [-5, -20], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.2, delay: 0.6 }} className="absolute bottom-2 left-0 text-xs">✨</motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};

