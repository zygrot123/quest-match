import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageCircle } from 'lucide-react';
import merchantArtImg from '../assets/images/merchant_character_1786296941034.jpg';
import { audio } from '../audio';

interface MerchantSpriteProps {
  message: string;
  mood?: 'idle' | 'happy' | 'taunt' | 'surprised' | 'talking' | 'give_item' | 'take_item';
  onTap?: () => void;
  className?: string;
}

export const MERCHANT_TAUNTS = {
  welcome: [
    "Ah, welcome, traveler! Show me what shiny treasures you carry in that bag...",
    "Gold, relics, enchanted steel... old Barnaby trades in all fine things!",
    "Step right up, hero! My prices are fair and my goods are deadly!"
  ],
  sellHover: (itemName: string, gold: number) => [
    `Are you sure you want to part with ${itemName}? Selling for ${gold}G... I'll take it off your hands!`,
    `A foolish move to sell ${itemName}... but your loss is my profit! (${gold}G)`,
    `${itemName}? That piece has monster blood on it! I'll pay ${gold}G for the horror.`
  ],
  sellConfirm: [
    "Pleasure doing business! Heheh!",
    "A fine deal! My coin pouch grows heavier while yours gets lighter!",
    "Sold! No take-backs, hero!"
  ],
  buySuccess: [
    "An exquisite choice! May that gear keep your head attached to your neck!",
    "Pleasure doing business! Try not to drop it in lava!",
    "Ah, handed over those shiny coins! Use it wisely!"
  ],
  noGold: [
    "Hah! Do I look like a charity? Come back when your purse isn't empty!",
    "No coin, no gear! The dungeon doesn't accept credit!",
    "You're short on gold, friend! Go slay some beasts first!"
  ],
  poke: [
    "Stop poking me and buy something!",
    "I've survived three dragon apocalypses, don't test me!",
    "Gold makes the world go round, hero! Don't waste my time!",
    "Heheh! Looking for a discount? Defeat the Apex Boss and maybe we'll talk!"
  ]
};

export const MerchantSprite: React.FC<MerchantSpriteProps> = ({
  message,
  mood = 'idle',
  onTap,
  className = '',
}) => {
  const [flicker, setFlicker] = useState(1);
  const [isBlinking, setIsBlinking] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlicker(Math.random() * 0.3 + 0.85);
    }, 180);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3600);
    return () => clearInterval(blinkInterval);
  }, []);

  const handlePortraitTap = () => {
    // Spawn celebratory coin sparkle on click
    const newSparkle = { id: Date.now(), x: (Math.random() - 0.5) * 40, y: -20 - Math.random() * 30 };
    setSparkles(prev => [...prev.slice(-4), newSparkle]);
    audio.playTone(580, 'sine', 0.08, 0.25);
    if (onTap) onTap();
  };

  return (
    <div 
      onClick={handlePortraitTap}
      className={`relative flex items-center gap-3 bg-gradient-to-r from-[#2a1309] via-slate-900/95 to-slate-950/95 border-2 border-amber-500/70 rounded-2xl p-3 shadow-[0_10px_25px_rgba(0,0,0,0.8)] cursor-pointer select-none group transition-all hover:border-amber-400 ${className}`}
    >
      {/* 3D Animated Merchant Portrait with Candle Glow */}
      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
        {/* Glow & Aura */}
        <div 
          className="absolute inset-0 bg-amber-500/30 rounded-2xl blur-md transition-opacity duration-200"
          style={{ opacity: flicker }}
        />
        
        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-400 bg-slate-950 relative z-10 shadow">
          <motion.img
            src={merchantArtImg}
            alt="Barnaby the Merchant"
            referrerPolicy="no-referrer"
            animate={
              mood === 'give_item'
                ? { scale: [1, 1.15, 1.06, 1], y: [0, -4, -2, 0], rotate: [0, 2, -1, 0] }
                : mood === 'take_item'
                ? { scale: [1, 1.12, 1.04, 1], y: [0, -3, -1, 0], rotate: [0, -2, 1, 0] }
                : mood === 'happy' || mood === 'taunt'
                ? { scale: [1, 1.1, 1], y: [0, -3, 0], rotate: [-2, 2, 0] }
                : mood === 'talking'
                ? { y: [0, -2, 1, 0], scale: [1, 1.04, 1] }
                : { y: [-2, 2, -2] }
            }
            transition={{ repeat: Infinity, duration: (mood === 'give_item' || mood === 'take_item') ? 1.2 : mood === 'idle' ? 2.8 : 1.2, ease: "easeInOut" }}
            className={`w-full h-full object-cover object-top transition-all ${isBlinking ? 'brightness-90' : 'brightness-100'}`}
          />

          {/* Candle Warm Amber Overlay */}
          <div 
            className="absolute inset-0 bg-amber-500/10 pointer-events-none mix-blend-color-dodge"
            style={{ opacity: flicker * 0.8 }}
          />
        </div>

        {/* Floating Sparks on Click */}
        {sparkles.map(s => (
          <motion.div
            key={s.id}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: s.y, x: s.x, scale: 1.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute z-30 pointer-events-none text-xs text-yellow-300 font-bold"
          >
            ✨
          </motion.div>
        ))}

        {/* Merchant Gold Pouch Badge */}
        <div className="absolute -bottom-1 -right-1 z-20 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-black shadow flex items-center gap-0.5">
          <span>💰</span> BARNABY
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 min-w-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={message}
            initial={{ opacity: 0, x: -6, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="bg-black/85 border border-amber-400/50 rounded-xl p-2.5 text-xs text-amber-100 font-medium leading-relaxed shadow-inner"
          >
            <p className="line-clamp-2 italic">"{message}"</p>
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-amber-500/20 text-[10px] text-amber-300/80 font-bold tracking-wide">
              <span>Barnaby the Merchant</span>
              <span className="text-amber-400/60 font-normal italic flex items-center gap-1">
                <MessageCircle className="w-3 h-3" /> tap for banter
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
