import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Lightbulb, RefreshCw, X, Sparkles, Flame, Zap, ShieldAlert } from 'lucide-react';

interface QuestTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Tip {
  id: string;
  category: 'Elemental' | 'Special Gems' | 'Combat & Combos';
  icon: string;
  title: string;
  description: string;
  badgeColor: string;
}

const ALL_TIPS: Tip[] = [
  {
    id: 'elem-fire-earth',
    category: 'Elemental',
    icon: '🔥',
    title: 'Fire Burns Earth',
    description: 'Matching Fire gems deals extra super-effective damage against Earth/Golems!',
    badgeColor: 'border-orange-500/50 bg-orange-950/60 text-orange-400',
  },
  {
    id: 'elem-water-fire',
    category: 'Elemental',
    icon: '💧',
    title: 'Water Quenches Fire',
    description: 'Use Water gems against Fire elementals or Dragons to douse their flames and deal bonus damage.',
    badgeColor: 'border-blue-500/50 bg-blue-950/60 text-blue-400',
  },
  {
    id: 'elem-earth-water',
    category: 'Elemental',
    icon: '🍃',
    title: 'Earth Absorbs Water',
    description: 'Earth/Nature gems slice through aquatic enemies with crushing critical force.',
    badgeColor: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-400',
  },
  {
    id: 'elem-light-dark',
    category: 'Elemental',
    icon: '☯️',
    title: 'Light & Dark Rivalry',
    description: 'Light and Dark gems strike each other for massive catastrophic counter-damage.',
    badgeColor: 'border-purple-500/50 bg-purple-950/60 text-purple-300',
  },
  {
    id: 'special-line-gem',
    category: 'Special Gems',
    icon: '⚡',
    title: 'Line Magic Gems',
    description: 'Match 4 gems horizontally for a Sideways Laser (<->) or vertically for a Vertical Laser (^ v). Each must be matched in its arrow direction to proc!',
    badgeColor: 'border-yellow-500/50 bg-yellow-950/60 text-yellow-300',
  },
  {
    id: 'special-bomb-gem',
    category: 'Special Gems',
    icon: '💣',
    title: '3x3 Super Bombs',
    description: 'Match gems in a T or L shape to create a Super Bomb that explodes the surrounding 3x3 grid.',
    badgeColor: 'border-red-500/50 bg-red-950/60 text-red-400',
  },
  {
    id: 'special-rainbow-gem',
    category: 'Special Gems',
    icon: '🌈',
    title: 'Rainbow Stars',
    description: 'Match 5 gems in a line to spawn a Rainbow Star. Swapping it clears ALL gems of that element!',
    badgeColor: 'border-amber-500/50 bg-amber-950/60 text-amber-300',
  },
  {
    id: 'special-combos',
    category: 'Special Gems',
    icon: '💥',
    title: 'Special Gem Merges',
    description: 'Swap two Special Gems together (e.g. Bomb + Line or 2 Bombs) to trigger giant board-clearing mega combos!',
    badgeColor: 'border-pink-500/50 bg-pink-950/60 text-pink-300',
  },
  {
    id: 'combo-decay',
    category: 'Combat & Combos',
    icon: '⏱️',
    title: 'Keep the Chain Alive',
    description: 'Make rapid consecutive matches before the combo gauge drains to stack damage multipliers (+25% per combo)!',
    badgeColor: 'border-amber-500/50 bg-amber-950/60 text-amber-300',
  },
  {
    id: 'hearts-swords',
    category: 'Combat & Combos',
    icon: '❤️',
    title: 'Healing & Physical Strikes',
    description: 'Heart gems restore your HP in battle, while Sword gems bypass elemental affinities for raw weapon damage.',
    badgeColor: 'border-rose-500/50 bg-rose-950/60 text-rose-300',
  },
  {
    id: 'wrong-swipes',
    category: 'Combat & Combos',
    icon: '⚠️',
    title: 'Watch Invalid Swipes',
    description: 'Making 3 invalid swipes in a row will penalize your turn or deal damage. Stay sharp!',
    badgeColor: 'border-red-500/50 bg-red-950/60 text-red-400',
  },
];

export const QuestTipsModal: React.FC<QuestTipsModalProps> = ({ isOpen, onClose }) => {
  const [randomTips, setRandomTips] = useState<Tip[]>([]);

  const shuffleTips = () => {
    const shuffled = [...ALL_TIPS].sort(() => 0.5 - Math.random());
    setRandomTips(shuffled.slice(0, 3));
  };

  useEffect(() => {
    if (isOpen) {
      shuffleTips();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-white overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Lightbulb className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-pixel text-sm text-amber-300 font-bold tracking-wide">QUEST TIPS & SECRETS</h3>
                <p className="text-[11px] text-slate-400">Tactical guidance for your adventure</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Tips List */}
          <div className="my-5 space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {randomTips.map((tip) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tip.icon}</span>
                    <span className="font-pixel text-xs font-bold text-slate-100">{tip.title}</span>
                  </div>
                  <span className={`text-[9px] font-pixel px-2 py-0.5 rounded-md border ${tip.badgeColor}`}>
                    {tip.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans pl-7">
                  {tip.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              onClick={shuffleTips}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-pixel transition-all active:scale-95 border border-amber-500/30"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>More Tips</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-pixel font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              Got It!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
