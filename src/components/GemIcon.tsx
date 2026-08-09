import React from 'react';
import { Sword, Flame, Droplet, Leaf, Heart, Zap, Sparkles, Bomb, Sun, Moon, Star } from 'lucide-react';
import { GemType, SpecialGemType } from '../types';

interface GemIconProps {
  type: GemType;
  special?: SpecialGemType;
  className?: string;
}

export const GemIcon = ({ type, special, className = '' }: GemIconProps) => {
  if (special === 'light_holy') {
    return (
      <div className="relative flex items-center justify-center animate-bounce">
        <Sun className={`${className} text-amber-200 drop-shadow-[0_0_14px_rgba(251,191,36,1)]`} />
      </div>
    );
  }

  if (special === 'dark_void') {
    return (
      <div className="relative flex items-center justify-center animate-pulse">
        <Moon className={`${className} text-purple-300 drop-shadow-[0_0_14px_rgba(168,85,247,1)]`} />
      </div>
    );
  }

  if (special === 'rainbow') {
    return <Sparkles className={`${className} text-amber-300 animate-spin drop-shadow-[0_0_12px_rgba(250,204,21,1)]`} />;
  }

  if (special === 'bomb_3x3') {
    return <Bomb className={`${className} text-red-400 animate-pulse drop-shadow-[0_0_12px_rgba(239,68,68,1)]`} />;
  }

  switch (type) {
    case 'sword': return <Sword className={className} />;
    case 'fire': return <Flame className={className} />;
    case 'water': return <Droplet className={className} />;
    case 'earth': return <Leaf className={className} />;
    case 'heart': return <Heart className={className} />;
    case 'light': return <Sun className={className} />;
    case 'dark': return <Moon className={className} />;
    default: return <Star className={className} />;
  }
};
