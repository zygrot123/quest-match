import React from 'react';
import { Sword, Flame, Droplet, Leaf, Heart, Sparkles, Bomb, Sun, Moon, ArrowLeftRight, ArrowUpDown, Move } from 'lucide-react';
import { GemType, SpecialGemType } from '../types';

interface GemIconProps {
  type: GemType;
  special?: SpecialGemType;
  className?: string;
  style?: React.CSSProperties;
}

export const GemIcon = ({ type, special, className = '', style }: GemIconProps) => {
  // Render 3D Faceted Crystal Gem Vectors with internal refraction and specular lighting
  const render3DCrystal = () => {
    switch (type) {
      case 'fire':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff7733" />
                <stop offset="40%" stopColor="#e60000" />
                <stop offset="100%" stopColor="#800000" />
              </linearGradient>
              <linearGradient id="rubyTop" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffcc00" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ff3300" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {/* Outer Ruby Gem Facets */}
            <path d="M50 5 L88 30 L80 85 L50 98 L20 85 L12 30 Z" fill="url(#rubyGrad)" stroke="#ff9966" strokeWidth="2.5" />
            {/* Top Crown Facets */}
            <path d="M50 5 L88 30 L68 45 L32 45 L12 30 Z" fill="url(#rubyTop)" />
            {/* Side Facet Cuts */}
            <path d="M12 30 L32 45 L20 85 Z" fill="#660000" opacity="0.6" />
            <path d="M88 30 L68 45 L80 85 Z" fill="#ff4d4d" opacity="0.5" />
            <path d="M32 45 L68 45 L50 98 Z" fill="#990000" opacity="0.7" />
            {/* Center Flame Symbol Overlay */}
            <foreignObject x="25" y="25" width="50" height="50">
              <div className="w-full h-full flex items-center justify-center">
                <Flame className="w-7 h-7 text-yellow-200 drop-shadow-[0_0_8px_rgba(255,200,0,0.9)] stroke-[2.5]" />
              </div>
            </foreignObject>
          </svg>
        );

      case 'water':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="sapphireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="sapphireGloss" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Teardrop Sapphire Gem Geometry */}
            <path d="M50 4 C50 4 88 45 88 70 C88 88 71 96 50 96 C29 96 12 88 12 70 C12 45 50 4 50 4 Z" fill="url(#sapphireGrad)" stroke="#7dd3fc" strokeWidth="2.5" />
            {/* Inner Facet Lines */}
            <path d="M50 4 L50 96 M12 70 L88 70 M30 45 L70 45" stroke="#bae6fd" strokeWidth="1.5" opacity="0.6" strokeDasharray="2,2" />
            <path d="M50 4 L30 45 L20 70 L50 96 Z" fill="url(#sapphireGloss)" opacity="0.4" />
            {/* Droplet Icon */}
            <foreignObject x="25" y="28" width="50" height="50">
              <div className="w-full h-full flex items-center justify-center">
                <Droplet className="w-7 h-7 text-cyan-100 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)] stroke-[2.5]" />
              </div>
            </foreignObject>
          </svg>
        );

      case 'earth':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="45%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
            </defs>
            {/* Hexagonal Shield Cut Emerald */}
            <path d="M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z" fill="url(#emeraldGrad)" stroke="#86efac" strokeWidth="2.5" />
            {/* Emerald Facet Cuts */}
            <path d="M50 6 L50 94 M12 28 L88 28 M12 72 L88 72" stroke="#dcfce7" strokeWidth="1.5" opacity="0.5" />
            <path d="M30 28 L50 6 L70 28 L70 72 L50 94 L30 72 Z" fill="#22c55e" opacity="0.3" />
            {/* Leaf Symbol */}
            <foreignObject x="25" y="25" width="50" height="50">
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="w-7 h-7 text-emerald-100 drop-shadow-[0_0_8px_rgba(74,222,128,0.9)] stroke-[2.5]" />
              </div>
            </foreignObject>
          </svg>
        );

      case 'sword':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="steelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f1f5f9" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            {/* Octagonal Diamond Cut Steel Gem */}
            <path d="M32 8 L68 8 L92 32 L92 68 L68 92 L32 92 L8 68 L8 32 Z" fill="url(#steelGrad)" stroke="#e2e8f0" strokeWidth="2.5" />
            <path d="M32 8 L32 92 M68 8 L68 92 M8 32 L92 32 M8 68 L92 68" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />
            {/* Sword Icon */}
            <foreignObject x="25" y="25" width="50" height="50">
              <div className="w-full h-full flex items-center justify-center">
                <Sword className="w-7 h-7 text-slate-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] stroke-[2.5]" />
              </div>
            </foreignObject>
          </svg>
        );

      case 'heart':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="50%" stopColor="#db2777" />
                <stop offset="100%" stopColor="#831843" />
              </linearGradient>
            </defs>
            {/* Faceted Heart Gem Geometry */}
            <path d="M50 92 C20 70 8 50 8 32 C8 16 20 8 34 8 C43 8 48 13 50 18 C52 13 57 8 66 8 C80 8 92 16 92 32 C92 50 80 70 50 92 Z" fill="url(#heartGrad)" stroke="#fbcfe8" strokeWidth="2.5" />
            <path d="M50 18 L50 92 M8 32 L92 32" stroke="#fdf2f8" strokeWidth="1.5" opacity="0.4" />
            <foreignObject x="25" y="25" width="50" height="50">
              <div className="w-full h-full flex items-center justify-center">
                <Heart className="w-7 h-7 text-pink-100 drop-shadow-[0_0_8px_rgba(244,114,182,0.9)] fill-pink-300/30 stroke-[2.5]" />
              </div>
            </foreignObject>
          </svg>
        );

      case 'light':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="topazGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
            </defs>
            <path d="M50 6 L94 50 L50 94 L6 50 Z" fill="url(#topazGrad)" stroke="#fef9c3" strokeWidth="2.5" />
            <path d="M50 6 L50 94 M6 50 L94 50 M28 28 L72 72 M28 72 L72 28" stroke="#ffffff" strokeWidth="1.2" opacity="0.5" />
            <foreignObject x="25" y="25" width="50" height="50">
              <div className="w-full h-full flex items-center justify-center">
                <Sun className="w-7 h-7 text-amber-100 drop-shadow-[0_0_8px_rgba(234,179,8,0.9)] stroke-[2.5]" />
              </div>
            </foreignObject>
          </svg>
        );

      case 'dark':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="amethystGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#7e22ce" />
                <stop offset="100%" stopColor="#3b0764" />
              </linearGradient>
            </defs>
            <path d="M22 8 L78 8 L92 22 L92 78 L78 92 L22 92 L8 78 L8 22 Z" fill="url(#amethystGrad)" stroke="#e9d5ff" strokeWidth="2.5" />
            <path d="M22 8 L78 92 M78 8 L22 92 M8 22 L92 78 M8 78 L92 22" stroke="#f3e8ff" strokeWidth="1.2" opacity="0.3" />
            <foreignObject x="25" y="25" width="50" height="50">
              <div className="w-full h-full flex items-center justify-center">
                <Moon className="w-7 h-7 text-purple-100 drop-shadow-[0_0_8px_rgba(192,132,252,0.9)] stroke-[2.5]" />
              </div>
            </foreignObject>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`} style={style}>
      {render3DCrystal()}

      {/* DIRECTIONAL INTERNAL ENERGY STREAKS */}
      {(special === 'arrow_horizontal' || special === 'light_holy') && (
        <div className="absolute inset-x-1 h-[3px] bg-gradient-to-r from-transparent via-yellow-200 to-transparent pointer-events-none z-10 shadow-[0_0_8px_rgba(250,204,21,0.9)] animate-pulse" />
      )}

      {(special === 'arrow_vertical' || special === 'dark_void') && (
        <div className="absolute inset-y-1 w-[3px] bg-gradient-to-b from-transparent via-cyan-200 to-transparent pointer-events-none z-10 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse" />
      )}

      {(special === 'bomb_cross' || special === 'bomb_3x3') && (
        <>
          <div className="absolute inset-x-1.5 h-[2px] bg-gradient-to-r from-transparent via-orange-300 to-transparent pointer-events-none z-10 shadow-[0_0_8px_rgba(249,115,22,0.9)] animate-pulse" />
          <div className="absolute inset-y-1.5 w-[2px] bg-gradient-to-b from-transparent via-orange-300 to-transparent pointer-events-none z-10 shadow-[0_0_8px_rgba(249,115,22,0.9)] animate-pulse" />
        </>
      )}

      {/* SPECIAL EFFECT BADGES - COMPACT TOP-RIGHT BADGES */}
      {special === 'rainbow' && (
        <div className="absolute -top-1 -right-1 z-20 pointer-events-none">
          <div className="bg-slate-950/90 border border-amber-300 rounded-full p-1 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-spin">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_0_4px_rgba(250,204,21,1)]" />
          </div>
        </div>
      )}

      {(special === 'arrow_horizontal' || special === 'light_holy') && (
        <div className="absolute -top-1 -right-1 z-20 pointer-events-none">
          <div className="bg-slate-950/95 border border-yellow-300 rounded-full p-1 shadow-[0_0_10px_rgba(250,204,21,0.9)] animate-pulse flex items-center justify-center">
            <ArrowLeftRight className="w-3.5 h-3.5 text-yellow-300 drop-shadow-[0_0_4px_rgba(250,204,21,1)] stroke-[3]" />
          </div>
        </div>
      )}

      {(special === 'arrow_vertical' || special === 'dark_void') && (
        <div className="absolute -top-1 -right-1 z-20 pointer-events-none">
          <div className="bg-slate-950/95 border border-cyan-400 rounded-full p-1 shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse flex items-center justify-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-300 drop-shadow-[0_0_4px_rgba(6,182,212,1)] stroke-[3]" />
          </div>
        </div>
      )}

      {special === 'bomb_cross' && (
        <div className="absolute -top-1 -right-1 z-20 pointer-events-none">
          <div className="bg-slate-950/95 border border-orange-400 rounded-full p-1 shadow-[0_0_10px_rgba(249,115,22,0.9)] animate-pulse flex items-center justify-center">
            <Move className="w-3.5 h-3.5 text-orange-300 drop-shadow-[0_0_4px_rgba(249,115,22,1)] stroke-[2.5]" />
          </div>
        </div>
      )}

      {special === 'bomb_3x3' && (
        <div className="absolute -top-1 -right-1 z-20 pointer-events-none">
          <div className="bg-slate-950/95 border border-red-500 rounded-full p-1 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse flex items-center justify-center">
            <Bomb className="w-3.5 h-3.5 text-red-400 drop-shadow-[0_0_4px_rgba(239,68,68,1)] stroke-[2.5]" />
          </div>
        </div>
      )}
    </div>
  );
};

