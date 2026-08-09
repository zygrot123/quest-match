import React from 'react';
import { Sword, Flame, Droplet, Leaf, Heart, Zap, Sparkles, Bomb, Sun, Moon, Star } from 'lucide-react';
import { GemType, SpecialGemType } from '../types';

interface GemIconProps {
  type: GemType;
  special?: SpecialGemType;
  className?: string;
  style?: React.CSSProperties;
}

export const GemIcon = ({ type, special, className = '', style }: GemIconProps) => {
  if (special === 'light_holy') {
    return (
      <div className="relative flex items-center justify-center animate-bounce">
        <Sun style={style} className={`${className} text-amber-200 drop-shadow-[0_0_14px_rgba(251,191,36,1)]`} />
      </div>
    );
  }

  if (special === 'dark_void') {
    return (
      <div className="relative flex items-center justify-center animate-pulse">
        <Moon style={style} className={`${className} text-purple-300 drop-shadow-[0_0_14px_rgba(168,85,247,1)]`} />
      </div>
    );
  }

  if (special === 'rainbow') {
    return <Sparkles style={style} className={`${className} text-amber-300 animate-spin drop-shadow-[0_0_12px_rgba(250,204,21,1)]`} />;
  }

  if (special === 'bomb_3x3') {
    return <Bomb style={style} className={`${className} text-red-400 animate-pulse drop-shadow-[0_0_12px_rgba(239,68,68,1)]`} />;
  }

  switch (type) {
    case 'sword': return <Sword style={style} className={className} />;
    case 'fire': return <Flame style={style} className={className} />;
    case 'water': return <Droplet style={style} className={className} />;
    case 'earth': return <Leaf style={style} className={className} />;
    case 'heart': return <Heart style={style} className={className} />;
    case 'light': return <Sun style={style} className={className} />;
    case 'dark': return <Moon style={style} className={className} />;
    default: return <Star style={style} className={className} />;
  }
};
