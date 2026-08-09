import React from 'react';
import { motion } from 'motion/react';
import { RuneSeal } from '../types';

interface RuneSealTileProps {
  seal: RuneSeal;
  gemSize: number;
  isShaking?: boolean;
}

const RUNE_GLYPHS: Record<string, string[]> = {
  frost: ['❄️', 'ᛏ', 'ᛃ', 'ᛁ'],
  arcane: ['🔮', 'ᛟ', 'ᚱ', 'ᛉ'],
  dragon: ['🔥', 'ᚦ', 'ᚢ', 'ᚠ'],
  relic: ['✨', 'ᛊ', 'ᛞ', 'ᚨ'],
};

export const RuneSealTile: React.FC<RuneSealTileProps> = ({ seal, gemSize, isShaking }) => {
  const isCracked = seal.hp < seal.maxHp;
  const glyph = (RUNE_GLYPHS[seal.type] || RUNE_GLYPHS.arcane)[
    (seal.row * 3 + seal.col) % (RUNE_GLYPHS[seal.type] || RUNE_GLYPHS.arcane).length
  ];

  // Theme styling for the magical translucent rune barrier block
  const typeStyles = {
    frost: {
      border: isCracked 
        ? 'border-cyan-300/80 shadow-[0_0_12px_rgba(6,182,212,0.6)]' 
        : 'border-cyan-400/90 shadow-[0_0_10px_rgba(6,182,212,0.4),inset_0_0_8px_rgba(6,182,212,0.3)]',
      bg: 'bg-gradient-to-br from-cyan-400/30 via-sky-500/25 to-blue-600/35',
      glyphColor: 'text-cyan-200/70',
      bracketColor: 'border-cyan-300',
      glowRing: 'ring-1 ring-cyan-300/50',
      badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-400/60',
    },
    arcane: {
      border: isCracked 
        ? 'border-purple-300/80 shadow-[0_0_12px_rgba(168,85,247,0.6)]' 
        : 'border-purple-400/90 shadow-[0_0_10px_rgba(168,85,247,0.4),inset_0_0_8px_rgba(168,85,247,0.3)]',
      bg: 'bg-gradient-to-br from-purple-400/30 via-indigo-600/25 to-fuchsia-600/35',
      glyphColor: 'text-purple-200/70',
      bracketColor: 'border-purple-300',
      glowRing: 'ring-1 ring-purple-300/50',
      badge: 'bg-purple-950/80 text-purple-300 border-purple-400/60',
    },
    dragon: {
      border: isCracked 
        ? 'border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.6)]' 
        : 'border-orange-500/90 shadow-[0_0_10px_rgba(249,115,22,0.4),inset_0_0_8px_rgba(249,115,22,0.3)]',
      bg: 'bg-gradient-to-br from-amber-400/35 via-orange-600/25 to-red-700/40',
      glyphColor: 'text-amber-200/70',
      bracketColor: 'border-amber-400',
      glowRing: 'ring-1 ring-amber-400/50',
      badge: 'bg-amber-950/80 text-amber-300 border-amber-400/60',
    },
    relic: {
      border: isCracked 
        ? 'border-yellow-300/80 shadow-[0_0_12px_rgba(234,179,8,0.6)]' 
        : 'border-yellow-400/90 shadow-[0_0_10px_rgba(234,179,8,0.4),inset_0_0_8px_rgba(234,179,8,0.3)]',
      bg: 'bg-gradient-to-br from-yellow-300/35 via-amber-500/25 to-yellow-600/35',
      glyphColor: 'text-yellow-200/70',
      bracketColor: 'border-yellow-300',
      glowRing: 'ring-1 ring-yellow-300/50',
      badge: 'bg-yellow-950/80 text-yellow-300 border-yellow-400/60',
    },
  }[seal.type] || {
    border: 'border-cyan-400/80',
    bg: 'bg-cyan-500/25',
    glyphColor: 'text-cyan-200/70',
    bracketColor: 'border-cyan-300',
    glowRing: 'ring-1 ring-cyan-300/40',
    badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-400/60',
  };

  return (
    <motion.div
      key={seal.id}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: isCracked ? [1, 0.96, 1] : 1, 
        opacity: 1,
        x: isShaking 
          ? [seal.col * gemSize - 4, seal.col * gemSize + 4, seal.col * gemSize - 3, seal.col * gemSize + 3, seal.col * gemSize] 
          : seal.col * gemSize, 
        y: seal.row * gemSize 
      }}
      transition={isShaking ? { duration: 0.25 } : undefined}
      exit={{ 
        scale: 1.35, 
        opacity: 0,
        filter: "blur(4px)",
        transition: { duration: 0.28, ease: "easeOut" } 
      }}
      className="absolute p-[2px] pointer-events-none z-25 select-none"
      style={{ width: gemSize, height: gemSize }}
    >
      <div 
        className={`w-full h-full rounded-[12px] border-2 relative overflow-hidden backdrop-blur-[1.5px] transition-all duration-200 ${typeStyles.border} ${typeStyles.bg} ${typeStyles.glowRing}`}
      >
        {/* Top 3D Specular Sheen (Glass / Crystal Effect) */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-[10px] pointer-events-none" />

        {/* Diagonal Ice / Crystal Prism Facet Light */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Runic Corner Brackets */}
        <div className={`absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l ${typeStyles.bracketColor}`} />
        <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r ${typeStyles.bracketColor}`} />
        <div className={`absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l ${typeStyles.bracketColor}`} />
        <div className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r ${typeStyles.bracketColor}`} />

        {/* Center Translucent Runic Sigil */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`text-base font-pixel font-bold drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] ${typeStyles.glyphColor}`}>
            {glyph}
          </span>
        </div>

        {/* Tiny Lock Icon indicator in bottom right */}
        <div className="absolute bottom-1 right-1 pointer-events-none opacity-85 text-[9px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          🔒
        </div>

        {/* Fractured Glass Crack Overlay (When Damaged / 1 HP left on 2 HP seal) */}
        {isCracked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
          >
            <svg 
              viewBox="0 0 40 40" 
              className="w-full h-full text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] opacity-85 stroke-white"
              fill="none" 
              strokeWidth="1.6"
            >
              {/* Jagged Fracture Lines */}
              <path d="M4 18 L16 22 L24 14 L36 20" />
              <path d="M16 22 L20 34" />
              <path d="M24 14 L28 6" />
              <path d="M12 8 L18 16 L14 26 L26 32" />
              <circle cx="20" cy="20" r="1.5" fill="white" />
            </svg>
            <div className="absolute inset-0 bg-white/10 animate-pulse" />
          </motion.div>
        )}

        {/* Seal Tier 2 HP Indicator Badge */}
        {seal.maxHp > 1 && (
          <div className={`absolute top-0.5 right-0.5 z-30 px-1 py-0.2 rounded text-[8px] font-black font-pixel border shadow ${typeStyles.badge}`}>
            {seal.hp}/{seal.maxHp}
          </div>
        )}
      </div>
    </motion.div>
  );
};
