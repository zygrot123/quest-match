import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DamageNumber } from '../types';

export const DamageOverlay = ({ damageNumbers }: { damageNumbers: DamageNumber[] }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {damageNumbers.map((dn) => (
          <motion.div
            key={dn.id}
            initial={{ opacity: 1, left: dn.x, top: dn.y, x: '-50%', y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -100, scale: dn.type === 'combo' ? 1.5 : 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dn.type === 'combo' ? 1.5 : 1, ease: 'easeOut' }}
            className={`absolute font-pixel whitespace-nowrap drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] ${
              dn.type === 'damage' ? 'text-white text-3xl' : 
              dn.type === 'heal' ? 'text-green-400 text-3xl' : 
              dn.type === 'combo' ? 'text-amber-400 text-4xl italic bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-none filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)]' :
              'text-red-500 text-3xl'
            }`}
          >
            {dn.type === 'heal' ? '+' : dn.type === 'damage' || dn.type === 'enemyAttack' ? '-' : ''}{dn.amount}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
