import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dragonImg from '../assets/images/dragon_spritesheet.png';
import elfImg from '../assets/images/elf_spritesheet.png';
import golemImg from '../assets/images/golem_spritesheet.png';
import goblinImg from '../assets/images/goblin_spritesheet.png';
import slimeImg from '../assets/images/slime_spritesheet.png';
import impImg from '../assets/images/imp_spritesheet.png';
import skeletonImg from '../assets/images/skeleton_spritesheet.png';
import vampireImg from '../assets/images/vampire_boss_spritesheet.png';
import krakenImg from '../assets/images/kraken_boss_spritesheet.png';
import minotaurIdle from '../assets/images/generated/minotaur_idle.webp';
import minotaurAttack from '../assets/images/generated/minotaur_attack.webp';
import minotaurHit from '../assets/images/generated/minotaur_hit.webp';
import phoenixIdle from '../assets/images/generated/phoenix_idle.webp';
import phoenixAttack from '../assets/images/generated/phoenix_attack.webp';
import phoenixHit from '../assets/images/generated/phoenix_hit.webp';
import skeletonIdle from '../assets/images/generated/skeleton_idle.webp';
import skeletonAttack from '../assets/images/generated/skeleton_attack.webp';
import skeletonHit from '../assets/images/generated/skeleton_hit.webp';
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

const generatedAnimations: Partial<Record<EnemyType, Record<'idle' | 'attack' | 'hit', string>>> = {
  skeleton: { idle: skeletonIdle, attack: skeletonAttack, hit: skeletonHit },
  mummy: { idle: skeletonIdle, attack: skeletonAttack, hit: skeletonHit },
  minotaur: { idle: minotaurIdle, attack: minotaurAttack, hit: minotaurHit },
  phoenix: { idle: phoenixIdle, attack: phoenixAttack, hit: phoenixHit },
};

export const BossModel: React.FC<BossModelProps> = ({
  type,
  isHit,
  isAttacking,
  isStunned,
  weakElement,
}) => {
  const [dialogue, setDialogue] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const generatedSet = generatedAnimations[type];
  const isGeneratedPortrait = Boolean(generatedSet);

  // Existing sprite-sheet enemies still use their original art. The sheet now
  // advances continuously, while the parent motion adds sub-frame smoothness.
  useEffect(() => {
    if (isGeneratedPortrait) return;
    const interval = window.setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, isAttacking ? 85 : isHit ? 75 : 120);
    return () => window.clearInterval(interval);
  }, [isGeneratedPortrait, isAttacking, isHit]);

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
        const timer = window.setTimeout(() => setDialogue(null), 3000);
        return () => window.clearTimeout(timer);
      }
    }
  }, [isHit, isAttacking, type]);

  const currentRow = isHit ? 2 : isAttacking ? 1 : 0;
  const currentState = isHit ? 'hit' : isAttacking ? 'attack' : 'idle';

  const variants = useMemo(() => ({
    idle: {
      y: [0, -10, -4, 0, 5, 0],
      x: [0, -3, 3, 0],
      rotateZ: [-2, 2, -1.5, 1.5, -2],
      scale: [1, 1.035, 0.985, 1.025, 1],
      transition: { repeat: Infinity, duration: type === 'phoenix' ? 1.25 : type === 'minotaur' ? 1.55 : 1.8, ease: 'easeInOut' },
    },
    hit: {
      scale: [1, 1.18, 0.88, 1.08, 0.98, 1],
      x: [-18, 28, -18, 10, -4, 0],
      y: [0, -4, 10, -3, 2, 0],
      rotateZ: [-7, 9, -6, 4, -1, 0],
      transition: { duration: 0.32, ease: 'easeOut' },
    },
    attack: {
      scale: [1, 1.12, 1.28, 0.92, 1.08, 1],
      x: [0, -28, 52, 18, -6, 0],
      y: [0, -10, 18, -4, 3, 0],
      rotateZ: [0, -8, 14, -6, 2, 0],
      transition: { duration: type === 'minotaur' ? 0.62 : 0.52, ease: 'easeOut' },
    },
  }), [type]);

  const getImgSrc = (): string => {
    switch (type) {
      case 'dragon': return dragonImg;
      case 'elf': return elfImg;
      case 'golem': return golemImg;
      case 'goblin': return goblinImg;
      case 'slime': return slimeImg;
      case 'imp': return impImg;
      case 'skeleton': return skeletonImg;
      case 'vampire': return vampireImg;
      case 'kraken': return krakenImg;
      case 'mummy': return skeletonImg;
      case 'specter': return impImg;
      case 'gargoyle': return golemImg;
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

  return (
    <div className="relative flex items-center justify-center w-full h-full" style={{ perspective: '1000px' }}>
      <div
        className={`absolute inset-[-30%] ${isStunned ? 'bg-amber-500/50 blur-[50px] animate-pulse' : getAuraColor()} blur-[40px] rounded-full z-0 transition-all duration-500 pointer-events-none`}
        style={{ transform: isAttacking ? 'scale(1.5)' : isHit ? 'scale(1.3)' : isStunned ? 'scale(1.4)' : 'scale(1)' }}
      />

      {isStunned && (
        <>
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.12, 1] }}
            transition={{ rotate: { repeat: Infinity, duration: 4, ease: 'linear' }, scale: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' } }}
            className={cn(
              'absolute w-[180px] h-[180px] rounded-full border-2 border-dashed z-0 pointer-events-none opacity-80',
              weakElement === 'fire' ? 'border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.8)]' :
              weakElement === 'water' ? 'border-blue-400 shadow-[0_0_30px_rgba(56,189,248,0.8)]' :
              'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.8)]'
            )}
          />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 pointer-events-none">
            <motion.div animate={{ rotate: 360, y: [-2, 2, -2] }} transition={{ rotate: { repeat: Infinity, duration: 1.5, ease: 'linear' }, y: { repeat: Infinity, duration: 1 } }} className="text-lg">💫</motion.div>
            <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="px-2 py-0.5 rounded-full bg-yellow-500 text-black font-extrabold text-[9px] tracking-widest border border-black shadow-[0_0_15px_rgba(234,179,8,1)] uppercase">VULNERABLE 1.5x</motion.span>
          </div>
        </>
      )}

      <motion.div
        animate={{ scaleX: isAttacking ? 1.35 : isHit ? 0.75 : [1, 1.1, 1], opacity: isHit ? 0.25 : [0.4, 0.72, 0.4] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="absolute bottom-1 w-32 h-6 bg-black/90 rounded-full blur-md z-0"
        style={{ transform: 'rotateX(75deg)' }}
      />

      <AnimatePresence>
        {dialogue && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: -75, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute z-40 bg-slate-950/95 border-2 border-amber-400/80 text-amber-200 font-pixel text-[11px] px-3.5 py-1.5 rounded-xl whitespace-nowrap shadow-[0_0_20px_rgba(251,191,36,0.5)] pointer-events-none" style={{ top: '-10%' }}>
            {dialogue}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-amber-400/80" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={variants}
        animate={currentState}
        className={cn(
          'relative z-10 w-[145px] h-[145px] flex items-center justify-center transform-gpu select-none',
          isGeneratedPortrait && 'generated-enemy-stage',
          isGeneratedPortrait && `generated-enemy-${type}`,
          isHit && 'generated-enemy-hit',
          isAttacking && 'generated-enemy-attack',
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {isGeneratedPortrait ? (
          <img
            key={`${type}-${currentState}`}
            src={generatedSet![currentState]}
            alt=""
            draggable={false}
            className={cn('generated-enemy-art', `generated-enemy-art-${type}`)}
          />
        ) : (
          <div
            className="w-full h-full drop-shadow-[0_12px_22px_rgba(0,0,0,0.95)] transform-gpu"
            style={{
              backgroundImage: `url(${activeSpriteUrl})`,
              backgroundSize: '400% 300%',
              backgroundPosition: `${(frame / 3) * 100}% ${(currentRow / 2) * 100}%`,
              imageRendering: 'pixelated',
              transform: 'translateZ(30px)',
            }}
          />
        )}

        {/* Always-visible micro VFX make the portrait read as alive even while idle. */}
        {(type === 'skeleton' || type === 'minotaur' || type === 'phoenix') && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <span className="enemy-spark enemy-spark-a" />
            <span className="enemy-spark enemy-spark-b" />
            <span className="enemy-spark enemy-spark-c" />
          </div>
        )}

        {isAttacking && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
            <motion.div initial={{ scale: 0.2, opacity: 1, rotate: -45 }} animate={{ scale: [0.2, 2.2], opacity: [1, 0], rotate: 60 }} transition={{ duration: 0.42, ease: 'easeOut' }} className="absolute w-24 h-24 border-t-8 border-r-8 border-amber-300 rounded-full shadow-[0_0_30px_rgba(251,191,36,1)]" />
            <motion.div initial={{ scale: 0.15, opacity: 1, x: -10 }} animate={{ scale: 2, opacity: 0, x: 35 }} transition={{ duration: 0.38, delay: 0.05 }} className="absolute w-20 h-20 rounded-full bg-orange-400/35 blur-xl" />
          </div>
        )}

        {isHit && (
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            <motion.div initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 2.1, opacity: 0 }} transition={{ duration: 0.28 }} className="w-16 h-16 bg-red-500/45 rounded-full blur-md" />
            <motion.span animate={{ y: [-8, -34], opacity: [1, 0] }} transition={{ duration: 0.45 }} className="absolute text-lg font-bold text-red-400 font-pixel drop-shadow-[0_2px_4px_black]">CRIT!</motion.span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
