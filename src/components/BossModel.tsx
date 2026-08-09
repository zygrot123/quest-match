import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dragonImg from '../assets/images/dragon_spritesheet.png';
import elfImg from '../assets/images/elf_spritesheet.png';
import golemImg from '../assets/images/golem_spritesheet.png';
import goblinImg from '../assets/images/goblin_spritesheet.png';
import slimeImg from '../assets/images/slime_spritesheet.png';
import impImg from '../assets/images/imp_spritesheet.png';
import skeletonImg from '../assets/images/skeleton_spritesheet_clean.png';
import minotaurImg from '../assets/images/minotaur_boss_sprite.png';
import phoenixImg from '../assets/images/phoenix_boss_sprite_clean.png';
import vampireImg from '../assets/images/vampire_boss_spritesheet.png';
import krakenImg from '../assets/images/kraken_boss_spritesheet.png';
import { EnemyType } from '../types';
import { cn } from '../utils';
import { speakMobTaunt } from '../utils/mobTaunts';

interface BossModelProps {
  type: EnemyType;
  isHit: boolean;
  isAttacking?: boolean;
  isStunned?: boolean;
  stunTimer?: number;
  weakElement?: 'water' | 'fire' | 'earth';
}

export const BossModel: React.FC<BossModelProps> = ({ 
  type, 
  isHit, 
  isAttacking, 
  isStunned, 
  stunTimer, 
  weakElement 
}) => {
  const [dialogue, setDialogue] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);

  // Cycle sprite-sheet frames. Resetting on state changes makes attacks/hits always
  // start on their first pose instead of jumping in halfway through the animation.
  useEffect(() => {
    setFrame(0);
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, isAttacking ? 95 : isHit ? 85 : 165);
    return () => clearInterval(interval);
  }, [isAttacking, isHit, type]);

  // Handle battle taunts
  useEffect(() => {
    if (isHit) {
      const line = speakMobTaunt(type, 'hit');
      if (line) setDialogue(line);
    } else if (isAttacking) {
      const line = speakMobTaunt(type, 'attack');
      if (line) setDialogue(line);
    } else {
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
      y: [-4, 4, -4],
      rotateZ: [-1, 1, -1],
      filter: 'brightness(1.1) contrast(1.15) drop-shadow(0px 8px 18px rgba(0,0,0,0.9))',
      transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
    },
    hit: {
      scale: [1, 1.25, 0.9, 1],
      x: [-12, 12, -8, 8, 0],
      rotateZ: [-6, 6, -3, 3, 0],
      filter: 'brightness(2.2) contrast(1.6) drop-shadow(0px 0px 25px rgba(239,68,68,1)) hue-rotate(25deg)',
      transition: { duration: 0.35, ease: "easeOut" }
    },
    attack: {
      scale: [1, 1.35, 0.95, 1],
      x: [0, -30, 40, 0],
      y: [0, -20, 15, 0],
      rotateZ: [0, -15, 18, 0],
      filter: 'brightness(1.6) contrast(1.4) drop-shadow(0px 15px 30px rgba(251,191,36,0.95))',
      transition: { duration: 0.5, ease: "easeInOut" }
    }
  };

  // These two bosses were supplied as single illustrations rather than sprite sheets.
  // Give them deliberate, character-specific motion instead of incorrectly slicing the art
  // into 4x3 frames. This keeps the existing working sprite-sheet enemies untouched.
  const singleImageVariants = type === 'phoenix' ? {
    idle: { y: [-8, 6, -8], scale: [0.98, 1.03, 0.98], rotateZ: [-1.5, 1.5, -1.5], filter: 'brightness(1.12) saturate(1.18) drop-shadow(0 10px 28px rgba(249,115,22,0.75))', transition: { repeat: Infinity, duration: 2.1, ease: 'easeInOut' } },
    attack: { y: [10, -18, 8, 0], x: [0, -18, 28, 0], scale: [1, 1.12, 1.22, 1], rotateZ: [0, -7, 9, 0], filter: 'brightness(1.55) saturate(1.35) drop-shadow(0 0 35px rgba(251,146,60,1))', transition: { duration: 0.65, ease: 'easeOut' } },
    hit: { x: [-10, 14, -8, 0], rotateZ: [-4, 5, -3, 0], scale: [1, 1.08, 0.94, 1], filter: 'brightness(1.9) saturate(1.4) drop-shadow(0 0 30px rgba(239,68,68,1))', transition: { duration: 0.38, ease: 'easeOut' } },
  } : {
    idle: { y: [3, -3, 3], scale: [1, 1.015, 1], rotateZ: [-0.8, 0.8, -0.8], filter: 'brightness(1.08) contrast(1.12) drop-shadow(0 12px 24px rgba(180,83,9,0.55))', transition: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } },
    attack: { y: [0, -12, 14, 0], x: [0, -22, 32, 0], scale: [1, 1.06, 1.18, 1], rotateZ: [0, -5, 7, 0], filter: 'brightness(1.45) contrast(1.2) drop-shadow(0 0 34px rgba(245,158,11,0.9))', transition: { duration: 0.62, ease: 'easeOut' } },
    hit: { x: [-12, 16, -9, 0], rotateZ: [-5, 6, -3, 0], scale: [1, 1.06, 0.94, 1], filter: 'brightness(1.8) contrast(1.25) drop-shadow(0 0 26px rgba(239,68,68,0.95))', transition: { duration: 0.36, ease: 'easeOut' } },
  };

  const currentState = isHit ? 'hit' : isAttacking ? 'attack' : 'idle';

  const getImgSrc = (): string => {
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
      case 'kraken': return krakenImg;
      case 'gargoyle': return golemImg;
      case 'vampire': return vampireImg;
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
      case 'minotaur': return 'bg-amber-700/50';
      case 'phoenix': return 'bg-orange-500/50';
      case 'vampire': return 'bg-rose-900/50';
      case 'kraken': return 'bg-blue-600/50';
      case 'specter': return 'bg-purple-900/50';
      case 'mummy': return 'bg-yellow-700/50';
      case 'gargoyle': return 'bg-slate-700/50';
      case 'hydra': return 'bg-emerald-700/50';
      default: return 'bg-red-600/30';
    }
  };

  const activeSpriteUrl = getImgSrc();
  const isSingleImageEnemy = type === 'minotaur' || type === 'phoenix';
  const currentRow = isHit ? 2 : isAttacking ? 1 : 0;

  return (
    <div className={baseClass} style={{ perspective: '1000px' }}>
      {/* Dynamic Element Aura Halo */}
      <div 
        className={`absolute inset-[-30%] ${isStunned ? 'bg-amber-500/50 blur-[50px] animate-pulse' : getAuraColor()} blur-[40px] rounded-full z-0 transition-all duration-500 pointer-events-none`} 
        style={{ transform: isAttacking ? 'scale(1.5)' : isHit ? 'scale(1.3)' : isStunned ? 'scale(1.4)' : 'scale(1)' }} 
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
            className="absolute z-40 bg-slate-950/95 border-2 border-amber-400/80 text-amber-200 font-pixel text-[11px] px-3.5 py-1.5 rounded-xl whitespace-nowrap shadow-[0_0_20px_rgba(251,191,36,0.5)] pointer-events-none"
            style={{ top: '-10%' }}
          >
            {dialogue}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-amber-400/80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Animated Pixel Sprite Container */}
      <motion.div 
        variants={variants} 
        animate={isSingleImageEnemy ? undefined : currentState}
        className="relative z-10 w-[145px] h-[145px] flex items-center justify-center transform-gpu select-none"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {isSingleImageEnemy ? (
          <motion.img
            src={activeSpriteUrl}
            alt=""
            draggable={false}
            variants={singleImageVariants}
            animate={currentState}
            className="w-full h-full object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.95)] transform-gpu select-none"
            style={{ imageRendering: 'pixelated', transform: 'translateZ(30px)' }}
          />
        ) : (
          <div 
            className="w-full h-full drop-shadow-[0_12px_22px_rgba(0,0,0,0.95)] transform-gpu"
            style={{
              backgroundImage: `url(${activeSpriteUrl})`,
              backgroundSize: '400% 300%',
              backgroundPosition: `${(frame / 3) * 100}% ${(currentRow / 2) * 100}%`,
              imageRendering: 'pixelated',
              transform: 'translateZ(30px)'
            }}
          />
        )}

        {/* Attack 3D Slash Energy Arcs */}
        {isAttacking && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
            <motion.div
              initial={{ scale: 0.2, opacity: 1, rotate: -45 }}
              animate={{ scale: [0.2, 2.2], opacity: [1, 0], rotate: 60 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute w-24 h-24 border-t-8 border-r-8 border-amber-300 rounded-full blur-[1px] shadow-[0_0_30px_rgba(251,191,36,1)] pointer-events-none"
              style={{ transform: 'translateZ(90px)' }}
            />
            <motion.div
              initial={{ scale: 0.1, opacity: 1, rotate: 45 }}
              animate={{ scale: [0.1, 1.9], opacity: [1, 0], rotate: -30 }}
              transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
              className="absolute w-24 h-24 border-b-6 border-l-6 border-red-400 rounded-full blur-[1px] shadow-[0_0_25px_rgba(239,68,68,1)] pointer-events-none"
              style={{ transform: 'translateZ(100px)' }}
            />
            <motion.div
              initial={{ scale: 0.4, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute w-20 h-20 bg-amber-400/30 rounded-full blur-xl pointer-events-none"
            />
          </div>
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
            <motion.div animate={{ y: [-20, 20], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute bottom-5 left-5 w-4 h-4 bg-orange-500 rounded-full blur-[3px] mix-blend-screen pointer-events-none" />
            <motion.div animate={{ y: [-30, 10], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }} className="absolute bottom-10 right-5 w-5 h-5 bg-red-500 rounded-full blur-[4px] mix-blend-screen pointer-events-none" />
          </>
        )}
        {type === 'slime' && (
          <>
            <motion.div animate={{ y: [-15, -40], opacity: [0, 1, 0], x: [-10, -20] }} transition={{ repeat: Infinity, duration: 1.6 }} className="absolute top-2 left-2 w-3 h-3 bg-cyan-300/80 rounded-full blur-[1px] pointer-events-none" />
            <motion.div animate={{ y: [-10, -35], opacity: [0, 1, 0], x: [10, 20] }} transition={{ repeat: Infinity, duration: 2, delay: 0.4 }} className="absolute top-4 right-2 w-3.5 h-3.5 bg-blue-300/80 rounded-full blur-[1px] pointer-events-none" />
          </>
        )}
        {type === 'imp' && (
          <>
            <motion.div animate={{ y: [-10, 10], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute top-0 left-0 text-xs pointer-events-none">🔥</motion.div>
            <motion.div animate={{ y: [10, -10], scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} className="absolute bottom-2 right-0 text-xs pointer-events-none">✨</motion.div>
          </>
        )}
        {type === 'skeleton' && (
          <>
            <motion.div animate={{ y: [-10, -25], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="absolute -top-2 right-2 text-xs pointer-events-none">💜</motion.div>
            <motion.div animate={{ y: [-5, -20], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.2, delay: 0.6 }} className="absolute bottom-2 left-0 text-xs pointer-events-none">✨</motion.div>
          </>
        )}
        {type === 'minotaur' && (
          <>
            <motion.div animate={{ y: [-10, -30], opacity: [0, 0.9, 0], scale: [0.6, 1.1, 0.6] }} transition={{ repeat: Infinity, duration: 1.8 }} className="absolute top-2 right-3 text-xs pointer-events-none">🔥</motion.div>
            <motion.div animate={{ y: [-8, -25], opacity: [0, 0.8, 0], scale: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2.2, delay: 0.6 }} className="absolute top-4 left-3 text-xs pointer-events-none">✨</motion.div>
          </>
        )}
        {type === 'phoenix' && (
          <>
            <motion.div animate={{ y: [-20, -50], opacity: [0, 1, 0], scale: [0.8, 1.5, 0.5] }} transition={{ repeat: Infinity, duration: 1.3 }} className="absolute -top-4 left-4 text-xs pointer-events-none">🔥</motion.div>
            <motion.div animate={{ y: [-15, -45], opacity: [0, 1, 0], scale: [0.8, 1.5, 0.5] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.4 }} className="absolute -top-2 right-4 text-xs pointer-events-none">✨</motion.div>
          </>
        )}
        {type === 'vampire' && (
          <>
            <motion.div animate={{ y: [-15, -35], opacity: [0, 0.9, 0], scale: [0.7, 1.2, 0.7] }} transition={{ repeat: Infinity, duration: 1.6 }} className="absolute -top-2 right-3 text-xs pointer-events-none">🩸</motion.div>
            <motion.div animate={{ y: [-10, -30], opacity: [0, 0.8, 0], scale: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="absolute top-2 left-2 text-xs pointer-events-none">🦇</motion.div>
          </>
        )}
        {type === 'kraken' && (
          <>
            <motion.div animate={{ y: [-15, -40], opacity: [0, 0.9, 0], scale: [0.6, 1.2, 0.6] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute top-1 left-2 text-xs pointer-events-none">🫧</motion.div>
            <motion.div animate={{ y: [-10, -35], opacity: [0, 0.9, 0], scale: [0.6, 1.2, 0.6] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.4 }} className="absolute top-3 right-2 text-xs pointer-events-none">🌊</motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};
