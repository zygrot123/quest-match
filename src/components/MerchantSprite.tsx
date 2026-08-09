import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import goblinImg from '../assets/images/goblin_spritesheet_1786216397754.jpg';
import elfImg from '../assets/images/elf_spritesheet_1786209795354.jpg';

const transparentSpriteCache = new Map<string, string>();

const useTransparentSprite = (src: string) => {
  const [transparentSrc, setTransparentSrc] = useState<string | null>(
    () => transparentSpriteCache.get(src) ?? null
  );

  useEffect(() => {
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

      rSamples.sort((a, b) => a - b);
      gSamples.sort((a, b) => a - b);
      bSamples.sort((a, b) => a - b);

      const mid = Math.floor(rSamples.length / 2);
      const bgR = rSamples[mid] ?? 0;
      const bgG = gSamples[mid] ?? 0;
      const bgB = bSamples[mid] ?? 0;

      const tolerance = 60;

      for (let i = 0; i < data.length; i += 4) {
        const dr = Math.abs(data[i] - bgR);
        const dg = Math.abs(data[i + 1] - bgG);
        const db = Math.abs(data[i + 2] - bgB);

        if (dr < tolerance && dg < tolerance && db < tolerance) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const resultUrl = canvas.toDataURL();
      transparentSpriteCache.set(src, resultUrl);
      if (!cancelled) setTransparentSrc(resultUrl);
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return transparentSrc;
};

interface MerchantSpriteProps {
  message: string;
  mood?: 'idle' | 'happy' | 'taunt' | 'surprised';
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
    "Pleasure robbing... I mean, trading with you! Heheh!",
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
    "Gold makes the world go round, hero! Don't waste my time!"
  ]
};

export const MerchantSprite: React.FC<MerchantSpriteProps> = ({
  message,
  mood = 'idle',
  onTap,
  className = '',
}) => {
  const [frame, setFrame] = useState(0);
  const transparentSrc = useTransparentSprite(goblinImg);

  useEffect(() => {
    const interval = setInterval(() => setFrame(f => (f + 1) % 4), 160);
    return () => clearInterval(interval);
  }, []);

  const currentRow = mood === 'taunt' || mood === 'happy' ? 1 : mood === 'surprised' ? 2 : 0;

  return (
    <div 
      onClick={onTap}
      className={`relative flex items-center gap-3 bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-slate-950/90 border-2 border-amber-500/50 rounded-2xl p-3 shadow-[0_10px_25px_rgba(0,0,0,0.8)] cursor-pointer select-none group transition-all hover:border-amber-400 ${className}`}
    >
      {/* 3D Animated Merchant Sprite */}
      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center [perspective:600px]">
        {/* Glow & Aura */}
        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md animate-pulse" />
        
        {transparentSrc ? (
          <motion.div
            animate={
              mood === 'happy' || mood === 'taunt'
                ? { y: [0, -8, 0], scale: [1, 1.15, 1], rotateZ: [-4, 4, 0] }
                : { y: [-3, 3, -3] }
            }
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-full h-full transform-gpu relative z-10"
            style={{
              backgroundImage: `url(${transparentSrc})`,
              backgroundSize: '400% 300%',
              backgroundPosition: `${(frame / 3) * 100}% ${(currentRow / 2) * 100}%`,
              imageRendering: 'pixelated',
              transform: 'translateZ(20px)'
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-amber-600/40 animate-pulse flex items-center justify-center text-xl">
            🧙‍♂️
          </div>
        )}

        {/* Merchant Gold Pouch Badge */}
        <div className="absolute -bottom-1 -right-1 z-20 bg-amber-500 text-black text-[9px] font-black px-1 rounded-full border border-black shadow-md flex items-center gap-0.5">
          <span>💰</span> BARNABY
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 min-w-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={message}
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-black/60 border border-amber-400/40 rounded-xl p-2.5 text-xs text-amber-200 font-medium leading-snug shadow-inner"
          >
            <p className="line-clamp-3">"{message}"</p>
            <span className="text-[9px] text-amber-400/60 font-pixel uppercase block mt-1">
              Tap merchant for banter • Barnaby the Wandering Merchant
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
