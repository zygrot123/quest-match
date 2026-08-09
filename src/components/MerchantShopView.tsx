import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Package, ShoppingBag, Shield, Sword, Heart, Sparkles, Check, X, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { Equipment, EquipmentSlot, GameState, ShopItem } from '../types';
import { getRarityColor, getRarityBadge, calculateTotalStats, getItemSellValue } from '../roguelike';
import { audio } from '../audio';
import { cn } from '../utils';

import merchantArtImg from '../assets/images/merchant_shop_character_1786285694138.jpg';
import merchantSpriteImg from '../assets/images/merchant_spritesheet_1786285712985.jpg';

interface MerchantShopViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onCloseShop?: () => void;
}

export const MERCHANT_QUOTES = {
  welcome: [
    "Ah, welcome, traveler! Step up to old Barnaby's desk...",
    "Gold, enchanted steel, ancient relics... I trade in all fine things!",
    "Looking to gear up for the dark dungeons? My prices are fair and my steel is sharp!"
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
  sellConfirm: [
    "Pleasure robbing... I mean, trading with you! Heheh!",
    "A fine deal! My coin pouch grows heavier while yours gets lighter!",
    "Sold! No take-backs, hero!"
  ],
  poke: [
    "Stop poking me and buy something!",
    "I've survived three dragon apocalypses, don't test me!",
    "Gold makes the world go round, hero! Don't waste my time!",
    "Touch the merchandise again and I'll double the prices!"
  ]
};

export const MerchantShopView: React.FC<MerchantShopViewProps> = ({
  gameState,
  setGameState,
  onCloseShop,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'equip'>('buy');
  const [merchantMsg, setMerchantMsg] = useState<string>(
    "Welcome to Barnaby's Shop! Step up to the counter and browse my fine collection!"
  );
  const [merchantMood, setMerchantMood] = useState<'idle' | 'happy' | 'taunt' | 'surprised'>('idle');
  const [pendingSellItem, setPendingSellItem] = useState<Equipment | null>(null);

  const triggerPoke = () => {
    const pokes = MERCHANT_QUOTES.poke;
    const msg = pokes[Math.floor(Math.random() * pokes.length)];
    setMerchantMsg(msg);
    setMerchantMood('taunt');
    audio.playTone(420, 'triangle', 0.08, 0.2);
  };

  const handleBuy = (item: ShopItem, idx: number) => {
    const eq = item.equipment;
    if (item.sold) return;

    if (gameState.gold >= item.price) {
      setGameState(prev => {
        const newShopItems = [...prev.shopItems];
        newShopItems[idx].sold = true;

        const newInventory = [...(prev.inventory || []), eq];
        let updatedEquipment = { ...prev.equipment };

        if (!updatedEquipment[eq.slot]) {
          updatedEquipment[eq.slot] = eq;
        }

        const updatedStats = calculateTotalStats(prev.stats, updatedEquipment);
        const newPlayerMaxHp = updatedStats.maxHp;

        return {
          ...prev,
          gold: prev.gold - item.price,
          equipment: updatedEquipment,
          inventory: newInventory,
          playerMaxHp: newPlayerMaxHp,
          playerHp: Math.min(newPlayerMaxHp, prev.playerHp),
          shopItems: newShopItems
        };
      });

      const buys = MERCHANT_QUOTES.buySuccess;
      setMerchantMsg(buys[Math.floor(Math.random() * buys.length)]);
      setMerchantMood('happy');
      audio.playTone(620, 'sine', 0.1, 0.3);
    } else {
      const nogolds = MERCHANT_QUOTES.noGold;
      setMerchantMsg(nogolds[Math.floor(Math.random() * nogolds.length)]);
      setMerchantMood('taunt');
      audio.playTone(200, 'sawtooth', 0.15, 0.3);
    }
  };

  const initiateSell = (item: Equipment) => {
    const value = getItemSellValue(item);
    setPendingSellItem(item);
    setMerchantMsg(`Are you sure you want to part with ${item.name}? I'll pay ${value}G cash on the spot!`);
    setMerchantMood('taunt');
  };

  const confirmSell = () => {
    if (!pendingSellItem) return;
    const value = getItemSellValue(pendingSellItem);

    setGameState(prev => ({
      ...prev,
      gold: prev.gold + value,
      inventory: prev.inventory.filter(i => i.id !== pendingSellItem.id),
      equipment: {
        head: prev.equipment.head?.id === pendingSellItem.id ? null : prev.equipment.head,
        body: prev.equipment.body?.id === pendingSellItem.id ? null : prev.equipment.body,
        weapon: prev.equipment.weapon?.id === pendingSellItem.id ? null : prev.equipment.weapon,
      }
    }));

    const confirms = MERCHANT_QUOTES.sellConfirm;
    setMerchantMsg(confirms[Math.floor(Math.random() * confirms.length)]);
    setMerchantMood('happy');
    setPendingSellItem(null);
    audio.playTone(550, 'sine', 0.1, 0.3);
  };

  return (
    <div className="flex-1 flex flex-col p-4 z-10 relative max-w-4xl mx-auto w-full h-full overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/40 via-slate-950 to-slate-950 -z-10" />

      {/* TAVERN SHOP COUNTER DESK SCENE */}
      <div className="relative rounded-3xl border-2 border-amber-600/60 bg-gradient-to-b from-amber-950/90 via-slate-900/95 to-slate-950 p-4 shadow-[0_15px_35px_rgba(0,0,0,0.85)] overflow-hidden shrink-0 mb-3">
        {/* Wood Texture Accent & Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        <div className="absolute top-2 left-3 text-amber-500/20 text-xs font-pixel tracking-widest uppercase">
          BARNABY'S TRADING POST • EST. 1422
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 pt-2">
          {/* Merchant Character Desk View */}
          <div 
            onClick={triggerPoke}
            className="relative group cursor-pointer shrink-0 flex items-center justify-center"
          >
            {/* Candle Light Aura */}
            <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-xl animate-pulse" />
            
            {/* Wooden Desk Frame & Merchant Art */}
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-slate-950">
              <motion.img 
                src={merchantArtImg} 
                alt="Barnaby the Merchant" 
                referrerPolicy="no-referrer"
                animate={
                  merchantMood === 'happy' 
                    ? { scale: [1, 1.06, 1], y: [0, -3, 0] } 
                    : merchantMood === 'taunt'
                    ? { rotateZ: [-2, 2, 0], scale: [1, 1.04, 1] }
                    : { y: [-2, 2, -2] }
                }
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-full h-full object-cover object-center image-rendering-pixelated transform-gpu"
              />

              {/* Wooden Shop Counter Overlay */}
              <div className="absolute bottom-0 inset-x-0 h-7 bg-gradient-to-t from-amber-950 via-amber-900/90 to-transparent border-t border-amber-500/40 flex items-center justify-center">
                <span className="text-[10px] text-amber-200 font-black tracking-wider uppercase drop-shadow">
                  🧙‍♂️ Barnaby
                </span>
              </div>

              {/* Interactive Tap Badge */}
              <div className="absolute top-1 right-1 bg-black/70 border border-amber-400/60 rounded-full px-1.5 py-0.5 text-[8px] text-amber-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Tap for banter
              </div>
            </div>
          </div>

          {/* Dialogue Speech Box & Gold Display */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 font-pixel text-xs flex items-center gap-1">
                  <span>🏪</span> BARNABY'S SHOP
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Dark Fantasy Merchant</span>
              </div>

              {/* Player Gold */}
              <div className="flex items-center gap-1.5 bg-yellow-950/90 border border-yellow-500/60 px-3.5 py-1.5 rounded-2xl text-yellow-300 font-black text-sm shadow-[0_0_12px_rgba(234,179,8,0.25)]">
                <Coins className="w-4 h-4 text-yellow-400 animate-bounce" /> 
                <span>{gameState.gold} Gold</span>
              </div>
            </div>

            {/* Merchant Speech Bubble */}
            <AnimatePresence mode="wait">
              <motion.div
                key={merchantMsg}
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="bg-slate-950/90 border-2 border-amber-500/50 rounded-2xl p-3 shadow-inner relative"
              >
                <div className="text-xs text-amber-100 font-medium leading-relaxed italic">
                  "{merchantMsg}"
                </div>
                <div className="text-[9px] text-amber-400/70 font-pixel uppercase block mt-1">
                  Barnaby the Wandering Merchant
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Shop Counter Action Tabs */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => { setActiveTab('buy'); audio.playTone(500, 'sine', 0.05, 0.2); }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 border",
                  activeTab === 'buy'
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                    : "bg-slate-900 hover:bg-slate-800 text-amber-300/80 border-amber-500/30"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>BUY GEAR ({gameState.shopItems.filter(i => !i.sold).length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('sell'); audio.playTone(500, 'sine', 0.05, 0.2); }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 border",
                  activeTab === 'sell'
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                    : "bg-slate-900 hover:bg-slate-800 text-amber-300/80 border-amber-500/30"
                )}
              >
                <Coins className="w-4 h-4" />
                <span>SELL BAG ({gameState.inventory.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('equip'); audio.playTone(500, 'sine', 0.05, 0.2); }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 border",
                  activeTab === 'equip'
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                    : "bg-slate-900 hover:bg-slate-800 text-amber-300/80 border-amber-500/30"
                )}
              >
                <Shield className="w-4 h-4" />
                <span>EQUIP LOADOUT</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SHOP TAB CONTENTS */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* TAB 1: BUY SHOP ITEMS */}
        {activeTab === 'buy' && (
          <div className="space-y-3">
            {gameState.shopItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-pixel text-xs border-2 border-dashed border-slate-800 rounded-2xl">
                Barnaby's shop is currently empty. Defeat dungeon bosses to restock!
              </div>
            ) : (
              gameState.shopItems.map((item, idx) => {
                const eq = item.equipment;
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "backdrop-blur-md border p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all",
                      getRarityColor(eq.rarity)
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-3xl shrink-0 relative">
                        {eq.icon}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">{eq.name}</span>
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider", getRarityBadge(eq.rarity))}>
                            {eq.rarity}
                          </span>
                        </div>
                        
                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/80 mt-1 font-semibold">
                          {eq.stats.attack ? <span className="text-red-300">ATK +{eq.stats.attack}</span> : null}
                          {eq.stats.defense ? <span className="text-blue-300">DEF +{eq.stats.defense}</span> : null}
                          {eq.stats.maxHp ? <span className="text-pink-300">HP +{eq.stats.maxHp}</span> : null}
                          {eq.stats.fireDmg ? <span className="text-red-400">🔥 Fire +{eq.stats.fireDmg}</span> : null}
                          {eq.stats.waterDmg ? <span className="text-blue-400">💧 Water +{eq.stats.waterDmg}</span> : null}
                          {eq.stats.earthDmg ? <span className="text-emerald-400">🌿 Earth +{eq.stats.earthDmg}</span> : null}
                          {eq.stats.lightDmg ? <span className="text-yellow-400">☀️ Light +{eq.stats.lightDmg}</span> : null}
                          {eq.stats.darkDmg ? <span className="text-purple-400">🌙 Dark +{eq.stats.darkDmg}</span> : null}
                          {eq.stats.critChance ? <span className="text-red-400">🎯 Crit Rate +{eq.stats.critChance}%</span> : null}
                          {eq.stats.critDmg ? <span className="text-orange-400">💥 Crit DMG +{eq.stats.critDmg}%</span> : null}
                        </div>

                        {/* Passive Effect */}
                        {eq.passive && (
                          <div className="text-[10px] text-amber-300/90 font-bold flex items-center gap-1 mt-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{eq.passive.description}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      disabled={item.sold}
                      onClick={() => handleBuy(item, idx)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 flex items-center gap-1.5 shadow-md",
                        item.sold 
                          ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                          : gameState.gold >= item.price
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold shadow-amber-500/20"
                          : "bg-red-950/80 text-red-300 border border-red-500/40 hover:bg-red-900"
                      )}
                    >
                      {item.sold ? (
                        <span>SOLD OUT</span>
                      ) : (
                        <>
                          <Coins className="w-3.5 h-3.5" />
                          <span>{item.price}G BUY</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: SELL INVENTORY BAG */}
        {activeTab === 'sell' && (
          <div className="space-y-3">
            {gameState.inventory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-pixel text-xs border-2 border-dashed border-slate-800 rounded-2xl">
                Your inventory bag is currently empty.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gameState.inventory.map((item) => {
                  const isEquipped = Object.values(gameState.equipment).some(e => e?.id === item.id);
                  const sellVal = getItemSellValue(item);

                  return (
                    <div 
                      key={item.id}
                      className={cn(
                        "p-3 rounded-2xl border bg-slate-900/90 flex items-center justify-between gap-2 transition-all",
                        getRarityColor(item.rarity)
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{item.name}</div>
                          <div className="text-[10px] text-amber-300/80 font-semibold">
                            Sell Value: +{sellVal}G
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => initiateSell(item)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 border border-amber-400/50 hover:text-black text-amber-300 font-bold text-xs shrink-0 transition-all active:scale-95"
                      >
                        Sell
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EQUIP LOADOUT */}
        {activeTab === 'equip' && (
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" /> Current Hero Loadout
            </h4>

            <div className="grid grid-cols-3 gap-3">
              {(['head', 'body', 'weapon'] as EquipmentSlot[]).map((slot) => {
                const eq = gameState.equipment[slot];
                return (
                  <div key={slot} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center flex flex-col items-center justify-center min-h-[100px]">
                    <div className="text-[10px] text-slate-400 font-pixel uppercase mb-1">{slot}</div>
                    {eq ? (
                      <>
                        <div className="text-2xl my-1">{eq.icon}</div>
                        <div className="text-xs font-bold text-white truncate w-full">{eq.name}</div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-600 font-bold">EMPTY</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SELL CONFIRMATION MODAL */}
      {pendingSellItem && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border-2 border-amber-500 rounded-2xl p-5 max-w-sm w-full text-center space-y-3 shadow-[0_0_35px_rgba(245,158,11,0.5)]">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center mx-auto text-3xl">
              💰
            </div>
            <div>
              <h4 className="text-amber-300 font-black text-sm uppercase">Barnaby's Counter Deal</h4>
              <p className="text-xs text-slate-300 mt-1">
                Selling <span className="text-white font-bold">{pendingSellItem.name}</span> for <span className="text-yellow-400 font-black">{getItemSellValue(pendingSellItem)} Gold</span>
              </p>
            </div>

            <div className="p-2.5 bg-amber-950/50 border border-amber-500/40 rounded-xl text-xs text-amber-200 italic">
              "{merchantMsg}"
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setPendingSellItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-all"
              >
                <X className="w-4 h-4" /> Keep Item
              </button>
              <button
                onClick={confirmSell}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
              >
                <Check className="w-4 h-4" /> Confirm Sell
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
