import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Compass, Sword, ShoppingCart, Flame, Skull, Sparkles, Navigation } from 'lucide-react';
import { MapNode } from '../types';
import { CHAPTERS_DATA } from '../data/chaptersData';
import { audio } from '../audio';
import { cn } from '../utils';

interface MapTravelTransitionProps {
  targetNode: MapNode | null;
  chapter: number;
  stage: number;
  heroName?: string;
  onComplete: () => void;
}

export const MapTravelTransition: React.FC<MapTravelTransitionProps> = ({
  targetNode,
  chapter,
  stage,
  heroName,
  onComplete,
}) => {
  useEffect(() => {
    audio.playMapTravelSound();
    const timer = setTimeout(() => {
      onComplete();
    }, 1250);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!targetNode) return null;

  const chapterInfo = CHAPTERS_DATA[(chapter - 1) % CHAPTERS_DATA.length];
  const isBoss = targetNode.isBoss;

  let nodeTitle = 'WILDERNESS TRAIL';
  let nodeDesc = 'Sensing hostile presence ahead...';
  let NodeIcon = Sword;
  let themeColor = 'text-red-400 border-red-500/50 bg-red-950/80';

  if (targetNode.type === 'combat') {
    if (isBoss) {
      nodeTitle = targetNode.isMiniBoss ? 'MINI-BOSS GUARDIAN' : 'CHAPTER BOSS CHAMBER';
      nodeDesc = 'A terrifying dark aura emanates from the lair ahead!';
      NodeIcon = Skull;
      themeColor = 'text-purple-400 border-purple-500/60 bg-purple-950/90';
    } else {
      nodeTitle = 'MONSTER ENCOUNTER';
      nodeDesc = 'Prepare for combat against dungeon fiends!';
      NodeIcon = Sword;
      themeColor = 'text-red-400 border-red-500/50 bg-red-950/80';
    }
  } else if (targetNode.type === 'rest') {
    nodeTitle = 'SANCTUARY CAMPFIRE';
    nodeDesc = 'Warm embers invite you to rest and mend wounds...';
    NodeIcon = Flame;
    themeColor = 'text-amber-400 border-amber-500/50 bg-amber-950/80';
  } else if (targetNode.type === 'shop') {
    nodeTitle = 'WANDERING BAZAAR';
    nodeDesc = 'Rare relics and glowing weapons for trade...';
    NodeIcon = ShoppingCart;
    themeColor = 'text-cyan-400 border-cyan-500/50 bg-cyan-950/80';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-auto bg-slate-950/95 backdrop-blur-xl">
      {/* 3D Perspective Page Turn Wrapper */}
      <div className="relative w-full max-w-lg h-[520px] px-4 flex items-center justify-center [perspective:1400px]">
        {/* Underneath Map Parchment Base */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-4 rounded-3xl bg-gradient-to-b from-[#2a2218] via-[#1a140e] to-[#0f0b08] border-4 border-amber-600/60 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col items-center justify-between p-6 overflow-hidden"
        >
          {/* Top Compass Rose & Chapter Header */}
          <div className="flex flex-col items-center gap-1 z-10 w-full text-center border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-2 text-amber-400/80 text-[10px] font-pixel tracking-widest uppercase">
              <Compass className="w-4 h-4 animate-spin [animation-duration:8s]" />
              <span>NAVIGATING CHAPTER {chapter} • STAGE {stage}</span>
            </div>
            <h2 className="text-xl font-pixel font-black text-amber-200 tracking-wider uppercase drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
              {chapterInfo.title}
            </h2>
            {heroName && (
              <span className="text-xs font-pixel text-slate-400">
                Hero <strong className="text-amber-300">{heroName}</strong> is advancing...
              </span>
            )}
          </div>

          {/* Center Map Travel Path Line & Node Destination Card */}
          <div className="flex flex-col items-center justify-center my-4 z-10 w-full gap-4">
            {/* Dashed Footstep Line */}
            <div className="relative w-full flex items-center justify-center h-8">
              <div className="w-3/4 border-b-2 border-dashed border-amber-500/40 relative">
                <motion.div
                  initial={{ x: '-50%' }}
                  animate={{ x: '50%' }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                  className="absolute top-1/2 left-1/2 -translate-y-1/2 text-amber-400 font-bold"
                >
                  <Navigation className="w-5 h-5 rotate-90 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse" />
                </motion.div>
              </div>
            </div>

            {/* Target Node Destination Badge */}
            <motion.div
              initial={{ scale: 0.6, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 350, damping: 20 }}
              className={cn(
                "w-full max-w-sm rounded-2xl p-4 border-2 flex items-center gap-4 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.8)]",
                themeColor
              )}
            >
              <div className="w-14 h-14 rounded-xl border border-white/20 bg-black/50 flex items-center justify-center shrink-0 shadow-inner">
                <NodeIcon className="w-8 h-8 animate-bounce" />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-pixel tracking-widest text-amber-300/80 uppercase">
                  DESTINATION
                </span>
                <h3 className="text-base font-pixel font-black text-white tracking-wide">
                  {nodeTitle}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {nodeDesc}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bottom Runic Seals */}
          <div className="w-full flex items-center justify-between text-[10px] font-pixel text-amber-500/60 z-10 border-t border-amber-500/20 pt-3">
            <span>🗺️ MAP TRAVEL</span>
            <span className="animate-pulse">ENTERING AREA...</span>
            <span>✨ CH {chapter}</span>
          </div>

          {/* Vintage Vignette & Grid Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
        </motion.div>

        {/* 3D Page Turn Overlay Sheet Flipping Across */}
        <motion.div
          initial={{ rotateY: 0, opacity: 1 }}
          animate={{ rotateY: -110, opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.645, 0.045, 0.355, 1.0] }}
          className="absolute inset-4 rounded-3xl bg-gradient-to-r from-[#1c1610] via-[#2c2217] to-[#120e0b] border-4 border-amber-700/80 shadow-[20px_0_50px_rgba(0,0,0,0.9)] origin-left pointer-events-none flex flex-col items-center justify-center p-6 z-20"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="flex flex-col items-center gap-3 opacity-90">
            <Compass className="w-16 h-16 text-amber-400 animate-spin [animation-duration:3s]" />
            <h3 className="text-lg font-pixel font-bold text-amber-200">TURNING PAGE...</h3>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
