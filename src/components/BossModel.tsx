import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dragonImg from '../assets/images/dragon_spritesheet_1786209780891.jpg';
import elfImg from '../assets/images/elf_spritesheet_1786209795354.jpg';
import golemImg from '../assets/images/golem_spritesheet_1786209813745.jpg';
import goblinImg from '../assets/images/goblin_spritesheet_1786216397754.jpg';
import slimeImg from '../assets/images/slime_spritesheet_1786216412229.jpg';
import impImg from '../assets/images/imp_spritesheet_1786216425329.jpg';
import skeletonImg from '../assets/images/skeleton_spritesheet_1786216438358.jpg';
import { EnemyType } from '../types';
import { cn } from '../utils';

// In-memory cache so we only ever pay the background-removal cost once per
// sprite sheet, even across repeated boss encounters / remounts.
const transparentSpriteCache = new Map<string, string>();

const useTransparentSprite = (src: string) => {
  const [transparentSrc, setTransparentSrc] = useState<string | null>(
    () => transparentSpriteCache.get(src) ?? null
  );

  useEffect(() => {
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
  }, [src]);

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
      const hitTexts: Record<EnemyType, string[]> = {
        dragon: ["ROARRR!", "Pathetic!", "Grrr..."],
        elf: ["Ugh!", "You dare?!", "My magic wanes..."],
        golem: ["*CRUMBLE*", "FEEBLE.", "STONE HOLDS."],
        goblin: ["Grah!", "My gold!", "Kee-kee!"],
        slime: ["*Squish!*", "Gloop...", "Blub!"],
        imp: ["Eek!", "Fire bites!", "No Fair!"],
        skeleton: ["*CLACK*", "Bones rattle...", "Arrgh!"]
      };
      const pool = hitTexts[type] || ["Ugh!"];
      setDialogue(pool[Math.floor(Math.random() * pool.length)]);
    } else if (isAttacking) {
      const atkTexts: Record<EnemyType, string[]> = {
        dragon: ["BURN TO ASHES!", "FEEL THE HEAT!"],
        elf: ["NATURE'S WRATH!", "WITHER AND DECAY!"],
        golem: ["CRUSH!", "EARTHQUAKE!"],
        goblin: ["STAB STAB!", "SNEAK ATTACK!"],
        slime: ["SLIME SPLASH!", "BOUNCE SLAM!"],
        imp: ["INFERNO BLAST!", "FIRE PYRE!"],
        skeleton: ["SHIELD BASH!", "BONE CUT!"]
      };
      const pool = atkTexts[type] || ["ATTACK!"];
      setDialogue(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      setDialogue(null);
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
      scale: [1, 1.35, 1],
      y: [0, -35, 12, 0],
      z: [0, 80, 0],
      filter: 'brightness(1.5) contrast(1.5) drop-shadow(0px 25px 35px rgba(255,255,255,0.7))',
      transition: { duration: 0.45, ease: "easeInOut" }
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
  const transparentSrc = useTransparentSprite(imgSrc);
  const currentRow = isHit ? 2 : isAttacking ? 1 : 0;

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
          {/* Swirling Outer Elemental Energy Ring */}
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.12, 1] }}
            transition={{ rotate: { repeat: Infinity, duration: 4, ease: "linear" }, scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } }}
            className={cn(
              "absolute w-[200px] h-[200px] rounded-full border-2 border-dashed z-0 pointer-events-none opacity-80",
              weakElement === 'fire' ? "border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.8)]" :
              weakElement === 'water' ? "border-blue-400 shadow-[0_0_30px_rgba(56,189,248,0.8)]" :
              "border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.8)]"
            )}
          />

          {/* Continuous Floating Elemental Particles around Boss Body */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            {[...Array(6)].map((_, idx) => {
              const angle = (idx / 6) * Math.PI * 2;
              const radius = 65;
              const xPos = Math.cos(angle) * radius;
              const yPos = Math.sin(angle) * radius;

              return (
                <motion.div
                  key={idx}
                  animate={{
                    x: [xPos, xPos + (Math.random() * 20 - 10), xPos],
                    y: [yPos, yPos - 30, yPos],
                    scale: [0.6, 1.3, 0.6],
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

          {/* Dizzy Overhead Spinning Stun Stars */}
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
            <motion.div
              animate={{ rotate: -360, y: [2, -2, 2] }}
              transition={{ rotate: { repeat: Infinity, duration: 1.5, ease: "linear" }, y: { repeat: Infinity, duration: 1 } }}
              className="text-lg drop-shadow-[0_0_8px_rgba(250,204,21,1)]"
            >
              ✨
            </motion.div>
          </div>
        </>
      )}

      {/* 3D Perspective Ground Shadow */}
      <motion.div 
        animate={{ 
          scaleX: isAttacking ? 1.5 : isHit ? 0.7 : [1, 1.15, 1], 
          opacity: isHit ? 0.3 : [0.4, 0.75, 0.4] 
        }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-2 w-36 h-8 bg-black/90 rounded-full blur-md z-0"
        style={{ transform: 'rotateX(75deg)' }}
      />
      
      {/* Speech Dialogue */}
      <AnimatePresence>
        {dialogue && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -85, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute z-40 bg-slate-950/95 border-2 border-amber-400/80 text-amber-200 font-pixel text-[11px] px-3.5 py-2 rounded-xl whitespace-nowrap shadow-[0_0_20px_rgba(251,191,36,0.5)]"
            style={{ top: '-5%' }}
          >
            {dialogue}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-amber-400/80" />
            <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-slate-950" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Sprite Container */}
      <motion.div 
        variants={variants} 
        animate={currentState}
        className="relative z-10 w-[170px] h-[170px] flex items-center justify-center transform-gpu"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {transparentSrc ? (
          <div 
            className="w-full h-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)] transform-gpu"
            style={{
              backgroundImage: `url(${transparentSrc})`,
              backgroundSize: '400% 300%',
              backgroundPosition: `${(frame / 3) * 100}% ${(currentRow / 2) * 100}%`,
              imageRendering: 'pixelated',
              transform: 'translateZ(30px)'
            }}
          />
        ) : (
          <div className="w-24 h-24 rounded-full animate-pulse bg-slate-800/80 border border-slate-700 flex items-center justify-center">
            <span className="text-[10px] text-amber-300 font-bold tracking-widest uppercase">Summoning...</span>
          </div>
        )}

        {/* Attack 3D Slash Energy Arc */}
        {isAttacking && (
          <motion.div
            initial={{ scale: 0.2, opacity: 1, rotate: -30 }}
            animate={{ scale: 1.8, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 z-30 border-t-4 border-r-4 border-amber-300 rounded-full blur-[1px] shadow-[0_0_20px_rgba(251,191,36,1)] pointer-events-none"
            style={{ transform: 'translateZ(60px)' }}
          />
        )}

        {/* Hit Damage Particles Burst */}
        {isHit && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-20 h-20 bg-red-500/40 rounded-full blur-md"
            />
            <motion.span animate={{ y: [-10, -35], opacity: [1, 0] }} transition={{ duration: 0.5 }} className="absolute text-xl font-bold text-red-400 font-pixel drop-shadow-[0_2px_4px_black]">
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

