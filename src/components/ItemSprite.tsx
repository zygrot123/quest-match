import React, { useState } from 'react';
import { ItemRarity, Equipment } from '../types';
import { cn } from '../utils';
import itemSpritesImg from '../assets/images/rpg_item_sprites_1786290844534.jpg';

// Mapping of item names / categories to 4x4 sprite grid coordinates (col: 0-3, row: 0-3)
const ITEM_SPRITE_COORDS: Record<string, { col: number; row: number; elemGlow?: string; fallbackEmoji: string }> = {
  // --- WEAPONS ---
  'Iron Broadsword': { col: 0, row: 0, fallbackEmoji: '🗡️' },
  'Hunter\'s Recurve Bow': { col: 1, row: 0, fallbackEmoji: '🏹' },
  'Ashwood Quarterstaff': { col: 2, row: 0, fallbackEmoji: '🦯' },
  'Tempered Steel Arming Sword': { col: 3, row: 0, fallbackEmoji: '⚔️' },
  'Silver-Edged Estoc': { col: 0, row: 1, fallbackEmoji: '🤺' },
  'Dwarven War Flail': { col: 1, row: 1, elemGlow: '#10b981', fallbackEmoji: '🪓' },
  'Flameforged Longsword': { col: 2, row: 1, elemGlow: '#ef4444', fallbackEmoji: '🔥' },
  'Tidecaller Glaive': { col: 3, row: 1, elemGlow: '#38bdf8', fallbackEmoji: '🔱' },
  'Dragonfang Halberd': { col: 0, row: 2, elemGlow: '#f97316', fallbackEmoji: '🐉' },
  'Dawnstar Relic Blade': { col: 1, row: 2, elemGlow: '#fbbf24', fallbackEmoji: '✨' },

  // --- HEADGEAR ---
  'Padded Arming Cap': { col: 2, row: 2, fallbackEmoji: '🧢' },
  'Hardened Leather Hood': { col: 3, row: 2, fallbackEmoji: '🤠' },
  'Iron Kettle Bascinet': { col: 0, row: 3, fallbackEmoji: '🪖' },
  'Ranger\'s Feathered Sallet': { col: 1, row: 3, fallbackEmoji: '🎩' },
  'Spired Mage Circlet': { col: 2, row: 3, elemGlow: '#38bdf8', fallbackEmoji: '🔮' },
  'Crown of the Mountain Sentinel': { col: 3, row: 3, elemGlow: '#eab308', fallbackEmoji: '👑' },

  // --- BODY ARMOR ---
  'Quilted Linen Gambeson': { col: 2, row: 2, fallbackEmoji: '🥋' },
  'Studded Leather Vest': { col: 3, row: 2, fallbackEmoji: '🦺' },
  'Interlocking Chainmail Hauberk': { col: 0, row: 3, fallbackEmoji: '🧥' },
  'Hardened Brigandine Coat': { col: 1, row: 3, fallbackEmoji: '🛡️' },
  'Tempered Knight Breastplate': { col: 2, row: 3, fallbackEmoji: '🛡️' },
  'Dragonscale Plate Armor': { col: 0, row: 2, elemGlow: '#f97316', fallbackEmoji: '🐉' },

  // --- SPECIAL / REWARDS / CHESTS ---
  'Barnaby\'s Mystery Chest': { col: 3, row: 3, elemGlow: '#c084fc', fallbackEmoji: '🎲' },
  'Mystery Relic': { col: 1, row: 2, elemGlow: '#eab308', fallbackEmoji: '🌟' },
  'Healing Flask': { col: 3, row: 0, elemGlow: '#ec4899', fallbackEmoji: '🧪' },
};

interface ItemSpriteProps {
  item?: Equipment | { name: string; rarity?: ItemRarity; icon?: string; slot?: string };
  name?: string;
  rarity?: ItemRarity;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showRarityGlow?: boolean;
  className?: string;
}

export const ItemSprite: React.FC<ItemSpriteProps> = ({
  item,
  name: propName,
  rarity: propRarity,
  size = 'md',
  showRarityGlow = true,
  className = '',
}) => {
  const [imgLoaded, setImgLoaded] = useState(true);
  const itemName = propName || item?.name || 'Iron Broadsword';
  const itemRarity = propRarity || item?.rarity || 'common';

  // Find exact coordinate or match by slot/name keyword
  let coord = ITEM_SPRITE_COORDS[itemName];
  if (!coord) {
    if (itemName.toLowerCase().includes('sword') || itemName.toLowerCase().includes('blade')) {
      coord = ITEM_SPRITE_COORDS['Iron Broadsword'];
    } else if (itemName.toLowerCase().includes('bow')) {
      coord = ITEM_SPRITE_COORDS['Hunter\'s Recurve Bow'];
    } else if (itemName.toLowerCase().includes('staff') || itemName.toLowerCase().includes('stave')) {
      coord = ITEM_SPRITE_COORDS['Ashwood Quarterstaff'];
    } else if (itemName.toLowerCase().includes('cap') || itemName.toLowerCase().includes('hood') || itemName.toLowerCase().includes('helm')) {
      coord = ITEM_SPRITE_COORDS['Iron Kettle Bascinet'];
    } else if (itemName.toLowerCase().includes('armor') || itemName.toLowerCase().includes('plate') || itemName.toLowerCase().includes('vest') || itemName.toLowerCase().includes('mail')) {
      coord = ITEM_SPRITE_COORDS['Interlocking Chainmail Hauberk'];
    } else {
      coord = { col: 0, row: 0, fallbackEmoji: item?.icon || '🗡️' };
    }
  }

  const sizeClasses = {
    xs: 'w-6 h-6 rounded-md text-xs',
    sm: 'w-8 h-8 rounded-lg text-sm',
    md: 'w-11 h-11 rounded-xl text-lg',
    lg: 'w-14 h-14 rounded-2xl text-2xl',
    xl: 'w-20 h-20 rounded-2xl text-4xl',
  };

  const rarityBorderClasses = {
    common: 'border-slate-600 bg-slate-900/90 shadow-sm',
    rare: 'border-cyan-400 bg-cyan-950/90 shadow-[0_0_10px_rgba(6,182,212,0.4)]',
    epic: 'border-purple-400 bg-purple-950/90 shadow-[0_0_12px_rgba(192,132,252,0.5)]',
    legendary: 'border-amber-400 bg-amber-950/90 shadow-[0_0_18px_rgba(251,191,36,0.65)] ring-1 ring-yellow-400/50',
  };

  // Background position on 4x4 grid: col 0..3 (0%, 33.33%, 66.66%, 100%), row 0..3
  const bgX = (coord.col / 3) * 100;
  const bgY = (coord.row / 3) * 100;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden border-2 shrink-0 select-none transition-all group',
        sizeClasses[size],
        showRarityGlow ? rarityBorderClasses[itemRarity] : 'border-white/10 bg-black/60',
        className
      )}
    >
      {/* Dynamic Element / Rarity Ambient Glow */}
      {coord.elemGlow && (
        <div
          className="absolute inset-0 opacity-40 blur-[4px] pointer-events-none rounded-full"
          style={{ backgroundColor: coord.elemGlow }}
        />
      )}

      {/* Rendered 2D Pixel Sprite from RPG Sprite Sheet */}
      {imgLoaded ? (
        <div
          className="w-full h-full transform transition-transform group-hover:scale-110 duration-200"
          style={{
            backgroundImage: `url(${itemSpritesImg})`,
            backgroundSize: '400% 400%',
            backgroundPosition: `${bgX}% ${bgY}%`,
            imageRendering: 'pixelated',
          }}
          onError={() => setImgLoaded(false)}
        />
      ) : (
        <span className="transform transition-transform group-hover:scale-110 duration-200">
          {item?.icon || coord.fallbackEmoji}
        </span>
      )}

      {/* Legendary / Epic Shine Accent Line */}
      {(itemRarity === 'legendary' || itemRarity === 'epic') && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  );
};
