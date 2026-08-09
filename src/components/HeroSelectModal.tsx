import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Sword, Flame, Sparkles, UserCheck, BookOpen, Crown, Zap } from 'lucide-react';
import { HeroProfile } from '../types';
import valeriusImg from '../assets/images/valerius_hero_portrait_1786296956609.jpg';
import lyraImg from '../assets/images/lyra_hero_portrait_1786296977248.jpg';

interface HeroSelectModalProps {
  onSelectHero: (hero: HeroProfile) => void;
}

const HEROES: (HeroProfile & { avatarImg: string })[] = [
  {
    id: 'valerius',
    gender: 'male',
    name: 'Valerius',
    title: 'The Sun-Forged Knight',
    portrait: '🛡️⚔️',
    avatarImg: valeriusImg,
    description: 'Former Lord Commander of the Sun Vanguard. Wields radiant steel forged in solar fire to cleanse the world of dark abominations.',
    perk: 'Radiant Strike (+10 Base ATK, +10% Crit Chance)',
    stats: {
      atkBonus: 10,
      hpBonus: 0,
      critBonus: 10,
      elementBoost: 'fire',
    }
  },
  {
    id: 'lyra',
    gender: 'female',
    name: 'Lyra',
    title: 'The Astral Sorceress',
    portrait: '🔮✨',
    avatarImg: lyraImg,
    description: 'High Guardian of the Celestial Nexus. Manipulates cosmic mana and elemental currents to obliterate foes with cascading arcane force.',
    perk: 'Astral Flow (+20 Max HP, +15% Elemental Magic Damage)',
    stats: {
      atkBonus: 5,
      hpBonus: 20,
      critBonus: 5,
      elementBoost: 'water',
    }
  }
];

export const HeroSelectModal: React.FC<HeroSelectModalProps> = ({ onSelectHero }) => {
  const [selectedId, setSelectedId] = useState<string>('valerius');
  const [customName, setCustomName] = useState<string>('');
  const [showStoryCutscene, setShowStoryCutscene] = useState<boolean>(false);

  const selectedHero = HEROES.find(h => h.id === selectedId) || HEROES[0];

  const handleStartStory = () => {
    setShowStoryCutscene(true);
  };

  const handleConfirmBegin = () => {
    const finalHero: HeroProfile = {
      ...selectedHero,
      name: customName.trim() || selectedHero.name,
    };
    onSelectHero(finalHero);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      {!showStoryCutscene ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-xl bg-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-slate-100 flex flex-col gap-5 overflow-hidden relative"
        >
          {/* Header Banner */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <Crown className="w-6 h-6 animate-pulse" />
              <h2 className="text-xl font-pixel tracking-widest uppercase drop-shadow-[0_2px_4px_black]">
                Choose Your Champion
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-pixel">Select your gender & hero identity to embark on Chapter I</p>
          </div>

          {/* Hero Selection Grid */}
          <div className="grid grid-cols-2 gap-4">
            {HEROES.map(hero => {
              const isSelected = hero.id === selectedId;
              return (
                <div
                  key={hero.id}
                  onClick={() => {
                    setSelectedId(hero.id);
                    if (!customName) setCustomName(hero.name);
                  }}
                  className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-300 flex flex-col items-center gap-3 relative overflow-hidden ${
                    isSelected
                      ? 'border-amber-400 bg-gradient-to-b from-amber-950/80 via-slate-900 to-amber-950/80 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-[1.02]'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                  }`}
                >
                  <div className="my-1 p-1 bg-black/60 rounded-2xl border border-amber-500/30 shadow-inner flex items-center justify-center">
                    <img 
                      src={hero.avatarImg} 
                      alt={hero.name} 
                      className="w-20 h-20 rounded-xl object-cover border border-amber-400/50 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="text-center space-y-0.5">
                    <span className="text-[10px] uppercase font-pixel tracking-wider text-amber-400 block">
                      {hero.gender === 'male' ? 'Male Warrior' : 'Female Sorceress'}
                    </span>
                    <h3 className="text-base font-pixel font-bold text-white tracking-wide">
                      {hero.name}
                    </h3>
                    <p className="text-[10px] text-amber-200/80 italic font-pixel">
                      {hero.title}
                    </p>
                  </div>

                  <div className="w-full bg-black/60 rounded-xl p-2 border border-white/5 text-[10px] text-slate-300 leading-relaxed">
                    {hero.description}
                  </div>

                  <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-2 text-[10px] text-amber-300 font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{hero.perk}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Name Input */}
          <div className="space-y-1.5 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <label className="text-[11px] font-pixel text-amber-300 block uppercase tracking-wider">
              Hero Custom Name:
            </label>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder={selectedHero.name}
              className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-sm text-amber-200 font-pixel focus:outline-none focus:border-amber-400 shadow-inner"
            />
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleStartStory}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-pixel font-black text-sm uppercase tracking-widest border-2 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.8)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5 text-slate-950" />
            <span>Begin Adventure Story</span>
          </button>
        </motion.div>
      ) : (
        /* Fantasy Story Intro Prologue Cutscene */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl bg-slate-950 border-2 border-amber-500/80 rounded-3xl p-6 shadow-[0_0_60px_rgba(245,158,11,0.5)] text-slate-100 flex flex-col gap-6 relative overflow-hidden"
        >
          <div className="text-center space-y-2 border-b border-amber-500/30 pb-4">
            <span className="text-[10px] font-pixel uppercase tracking-widest text-amber-400 bg-amber-950/80 border border-amber-500/40 px-3 py-1 rounded-full">
              Prologue: The Shattered Crystal
            </span>
            <h2 className="text-xl font-pixel text-amber-300 tracking-wider">
              THE REALMS OF AETHELGARD
            </h2>
          </div>

          <div className="space-y-4 text-xs font-pixel text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-2xl border border-white/10 max-h-[280px] overflow-y-auto">
            <p>
              For ten thousand years, the celestial World Crystal maintained supreme elemental balance across Aethelgard. But when the Void Sovereign shattered the core, 20 Elemental Shards plummeted into dark monster havens.
            </p>
            <p className="text-amber-200">
              Now, as <span className="text-amber-400 font-bold">{customName || selectedHero.name}</span>, you are chosen by the Ancient Shrine. You must traverse <span className="text-amber-300 font-bold">20 Chapters</span>, battle <span className="text-red-400 font-bold">20 Mini-Bosses</span>, and conquer <span className="text-purple-400 font-bold">20 Apex Bosses</span> to reclaim every shard.
            </p>
            <div className="bg-amber-950/60 p-3 rounded-xl border border-amber-500/40 text-amber-300 font-bold space-y-1">
              <p>📍 Chapter I Target: Sylvan Woods</p>
              <p>⚔️ Mini-Boss: Minotaur Warlord (Stage 5)</p>
              <p>👑 Apex Boss: Corrupt Wood Elf (Stage 10)</p>
            </div>
          </div>

          <button
            onClick={handleConfirmBegin}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-slate-950 font-pixel font-black text-sm uppercase tracking-widest border-2 border-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.8)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <UserCheck className="w-5 h-5 text-slate-950" />
            <span>Embark On Stage 1-1</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};
