import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Dice5, Check, X, Shield, Sword, Heart, ArrowRight } from 'lucide-react';
import { Equipment } from '../types';
import { ItemSprite } from './ItemSprite';
import { getRarityBadge, getRarityColor } from '../roguelike';
import { audio } from '../audio';
import { cn } from '../utils';
import mysteryChestImg from '../assets/images/mystery_chest_art_1786290858963.jpg';

interface MysteryChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  rolledItem: Equipment | null;
  onEquip: (item: Equipment) => void;
  onKeepInBag: (item: Equipment) => void;
}

export const MysteryChestModal: React.FC<MysteryChestModalProps> = ({
  isOpen,
  onClose,
  rolledItem,
  onEquip,
  onKeepInBag,
}) => {
  const [stage, setStage] = useState<'rolling' | 'opening' | 'revealed'>('rolling');
  const [diceNumber, setDiceNumber] = useState(6);

  useEffect(() => {
    if (!isOpen || !rolledItem) {
      setStage('rolling');
      return;
    }

    setStage('rolling');
    // Fast dice shake SFX and number cycling
    const diceInterval = setInterval(() => {
      setDiceNumber(Math.floor(Math.random() * 6) + 1);
      audio.playTone(400 + Math.random() * 300, 'sine', 0.05, 0.15);
    }, 90);

    const rollTimer = setTimeout(() => {
      clearInterval(diceInterval);
      setStage('opening');
      audio.playRainbowSparkleSFX();
    }, 1100);

    const revealTimer = setTimeout(() => {
      setStage('revealed');
      audio.playSpecialGemCreatedSFX();
      audio.playTone(660, 'sine', 0.2, 0.35);
      setTimeout(() => audio.playTone(880, 'triangle', 0.25, 0.35), 100);
    }, 2000);

    return () => {
      clearInterval(diceInterval);
      clearTimeout(rollTimer);
      clearTimeout(revealTimer);
    };
  }, [isOpen, rolledItem]);

  if (!isOpen || !rolledItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-[#120803] border-2 border-amber-500 rounded-3xl p-5 shadow-[0_0_50px_rgba(245,158,11,0.6)] flex flex-col items-center text-center relative overflow-hidden">
        {/* Background Arcane Glow Rays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-purple-500/10 to-transparent -z-10 animate-pulse" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="mb-2">
          <span className="text-[10px] font-pixel uppercase tracking-widest text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
            🎲 BARNABY'S MYSTERY CHEST
          </span>
          <h3 className="text-lg font-black text-white mt-1">
            {stage === 'rolling' ? 'ROLLING THE DICE...' : stage === 'opening' ? 'UNLOCKING VAULT CHEST...' : 'TREASURE UNVEILED!'}
          </h3>
        </div>

        {/* Dynamic Center Visual */}
        <div className="w-36 h-36 my-3 relative flex items-center justify-center">
          {stage === 'rolling' && (
            <motion.div
              animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 1.25, 0.9, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 0.5, ease: 'linear' }}
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 via-amber-500 to-yellow-400 border-2 border-white shadow-[0_0_30px_rgba(234,179,8,0.9)] flex items-center justify-center text-5xl font-black text-slate-950 font-pixel"
            >
              {diceNumber}
            </motion.div>
          )}

          {stage === 'opening' && (
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
              className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-yellow-300 shadow-[0_0_35px_rgba(245,158,11,1)]"
            >
              <img
                src={mysteryChestImg}
                alt="Opening Mystery Chest"
                className="w-full h-full object-cover animate-pulse"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-yellow-400/30 mix-blend-overlay" />
            </motion.div>
          )}

          {stage === 'revealed' && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 180 }}
              className="relative"
            >
              {/* Radial Burst Ray Effect */}
              <div className="absolute -inset-6 bg-gradient-to-r from-amber-500/40 via-yellow-300/40 to-amber-500/40 rounded-full blur-xl animate-spin" style={{ animationDuration: '6s' }} />
              
              <ItemSprite item={rolledItem} size="xl" showRarityGlow className="shadow-2xl" />
            </motion.div>
          )}
        </div>

        {/* Item Details Box (When Revealed) */}
        {stage === 'revealed' ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-2"
          >
            <div className="flex flex-col items-center">
              <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider mb-1', getRarityBadge(rolledItem.rarity))}>
                {rolledItem.rarity} [{rolledItem.slot}]
              </span>
              <h4 className="text-base font-extrabold text-white">{rolledItem.name}</h4>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-black/60 border border-white/10 rounded-xl text-xs font-semibold">
              {rolledItem.stats.attack ? <span className="text-red-300">⚔️ ATK +{rolledItem.stats.attack}</span> : null}
              {rolledItem.stats.defense ? <span className="text-blue-300">🛡️ DEF +{rolledItem.stats.defense}</span> : null}
              {rolledItem.stats.maxHp ? <span className="text-pink-300">❤️ HP +{rolledItem.stats.maxHp}</span> : null}
              {rolledItem.stats.fireDmg ? <span className="text-red-400">🔥 +{rolledItem.stats.fireDmg}</span> : null}
              {rolledItem.stats.waterDmg ? <span className="text-blue-400">💧 +{rolledItem.stats.waterDmg}</span> : null}
              {rolledItem.stats.earthDmg ? <span className="text-emerald-400">🌿 +{rolledItem.stats.earthDmg}</span> : null}
              {rolledItem.stats.critChance ? <span className="text-amber-300">🎯 +{rolledItem.stats.critChance}%</span> : null}
            </div>

            {/* Passive */}
            {rolledItem.passive && (
              <div className="text-[10px] text-amber-300 font-bold bg-amber-950/70 border border-amber-500/40 p-1.5 rounded-lg flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{rolledItem.passive.name}: {rolledItem.passive.description}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  onKeepInBag(rolledItem);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-all"
              >
                🎒 Keep in Bag
              </button>
              <button
                onClick={() => {
                  onEquip(rolledItem);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
              >
                <Check className="w-4 h-4" /> Equip Now
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="text-xs text-amber-200/70 italic py-3">
            "The arcane spirits are inspecting the dungeon's forgotten reliquaries..."
          </div>
        )}
      </div>
    </div>
  );
};
