import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, ShoppingBag, Shield, Sparkles, Check, X, Dice5, MessageSquare, HelpCircle, ArrowRightLeft } from 'lucide-react';
import { Equipment, EquipmentSlot, GameState, ShopItem } from '../types';
import { getRarityColor, getRarityBadge, calculateTotalStats, getItemSellValue, generateRandomEquipment } from '../roguelike';
import { audio } from '../audio';
import { cn } from '../utils';
import { ItemSprite } from './ItemSprite';
import { MysteryChestModal } from './MysteryChestModal';
import merchantArtImg from '../assets/images/merchant_character_1786296941034.jpg';
import merchantSpritesheetImg from '../assets/images/merchant_character_1786296941034.jpg';

interface MerchantShopViewProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onCloseShop?: () => void;
}

interface DealAnimation {
  id: number;
  type: 'give_item' | 'take_item';
  item: Equipment;
  gold?: number;
}

export const MERCHANT_QUOTES = {
  welcome: [
    "Welcome to my shop, traveler! Fresh goods just in from the kingdom!",
    "Ah! Looking to gear up? My steel is sharp and my prices are honest!",
    "Step up to the counter! What catches your eye today, hero?",
    "Gold, tempered blades, enchanted mail... I trade only in fine craftsmanship!"
  ],
  buySuccess: [
    "An exquisite purchase! That steel will keep you in one piece!",
    "Pleasure doing business! May it strike true in the dungeons below!",
    "A fine piece of craftsmanship! Hand-inspected by yours truly!",
    "Here you go! Treat that gear well and it'll save your neck!"
  ],
  noGold: [
    "Hah! My coin purse is empty too, but I can't give goods away for free!",
    "You're a few coins short, friend! Slay a few more beasts first!",
    "No credit in the dungeon, hero! Come back when you've struck gold!"
  ],
  sellConfirm: [
    "A fair trade! I'll find a good buyer for this piece back in town.",
    "Pleasure doing business! Here's your gold, fresh and shiny!",
    "Deal! My inventory expands while your purse grows heavier!"
  ],
  poke: [
    "Hey! Watch the merchandise, hero! Heheh!",
    "Careful there! That feather took three days to dye!",
    "Don't just poke the counter—take a look at that fine broadsword!",
    "Looking for a discount? Slay the dragon and we'll talk!"
  ],
  rumors: [
    "TIP: Ancient Dragons and Inferno Imps dread Water gems! Match blues for massive weakness damage!",
    "TIP: Stone Golems and Cave Goblins are weak against Fire. Match reds to melt their thick defense!",
    "TIP: Wood Elves and Crystal Slimes crumble against Earth gems. Keep the emerald matches flowing!",
    "TIP: Matching 4 gems in a line creates a magic laser that clears entire rows or columns!",
    "TIP: Combining two Special Gems together creates huge chain explosions that stagger boss cooldowns!"
  ]
};

export const MerchantShopView: React.FC<MerchantShopViewProps> = ({
  gameState,
  setGameState,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'equip' | 'rumors'>('buy');
  const [merchantMsg, setMerchantMsg] = useState<string>(
    "Welcome to the Trading Post! Step right up to the counter and browse today's stock."
  );
  const [merchantMood, setMerchantMood] = useState<'idle' | 'happy' | 'taunt' | 'talking'>('idle');
  const [pendingSellItem, setPendingSellItem] = useState<Equipment | null>(null);
  const [rolledMysteryItem, setRolledMysteryItem] = useState<Equipment | null>(null);
  const [isMysteryModalOpen, setIsMysteryModalOpen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [coinSparkle, setCoinSparkle] = useState(false);
  const [dealAnimation, setDealAnimation] = useState<DealAnimation | null>(null);
  const [dealToast, setDealToast] = useState<{ id: number; message: string; type: 'buy' | 'sell'; item: Equipment; gold?: number } | null>(null);

  // Switch to cozy Shop Tavern BGM (Track 8: The Gilded Tankard) when entering shop
  useEffect(() => {
    audio.startBGM(8);
  }, []);

  // Natural breathing & eye blinking animation intervals
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3800);

    return () => clearInterval(blinkInterval);
  }, []);

  const triggerPoke = () => {
    const pokes = MERCHANT_QUOTES.poke;
    const msg = pokes[Math.floor(Math.random() * pokes.length)];
    setMerchantMsg(msg);
    setMerchantMood('taunt');
    audio.playTone(480, 'triangle', 0.1, 0.25);
    setTimeout(() => setMerchantMood('idle'), 2000);
  };

  const triggerRumor = () => {
    const rumors = MERCHANT_QUOTES.rumors;
    const msg = rumors[Math.floor(Math.random() * rumors.length)];
    setMerchantMsg(msg);
    setMerchantMood('talking');
    audio.playTone(600, 'sine', 0.12, 0.25);
    setTimeout(() => setMerchantMood('idle'), 3000);
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
      setCoinSparkle(true);
      setDealAnimation({ id: Date.now(), type: 'give_item', item: eq, gold: item.price });
      setDealToast({ id: Date.now(), message: `Barnaby handed over ${eq.name}!`, type: 'buy', item: eq, gold: item.price });
      setTimeout(() => setDealAnimation(null), 2400);
      setTimeout(() => setDealToast(null), 2800);
      setTimeout(() => setCoinSparkle(false), 1200);
      audio.playTone(650, 'sine', 0.15, 0.35);
      setTimeout(() => audio.playTone(880, 'triangle', 0.2, 0.3), 80);
      setTimeout(() => setMerchantMood('idle'), 2500);
    } else {
      const nogolds = MERCHANT_QUOTES.noGold;
      setMerchantMsg(nogolds[Math.floor(Math.random() * nogolds.length)]);
      setMerchantMood('taunt');
      audio.playTone(220, 'sawtooth', 0.2, 0.3);
      setTimeout(() => setMerchantMood('idle'), 2000);
    }
  };

  const handleMysteryGamble = () => {
    const gambleCost = 25;
    if (gameState.gold < gambleCost) {
      setMerchantMsg(`Mystery roll costs 25 Gold, traveler! You have ${gameState.gold}G. Slay monsters or sell old gear in the SELL tab!`);
      setMerchantMood('taunt');
      audio.playTone(200, 'sawtooth', 0.15, 0.3);
      return;
    }

    const currentTier = (gameState.chapter || 1) + gameState.currentLayer;
    const rolledEquipment = generateRandomEquipment(currentTier, undefined, true);

    // Deduct gold immediately and open animated chest modal
    setGameState(prev => ({
      ...prev,
      gold: prev.gold - gambleCost,
    }));

    setRolledMysteryItem(rolledEquipment);
    setIsMysteryModalOpen(true);
    setMerchantMsg(`Heheh! Rolling the dice for the bottom of the chest... what treasure lies within?`);
    setMerchantMood('happy');
  };

  const handleEquipRolledItem = (eq: Equipment) => {
    setGameState(prev => {
      const slot = eq.slot;
      const currentlyEquipped = prev.equipment[slot];
      const newInventory = [...(prev.inventory || [])];
      if (currentlyEquipped) {
        newInventory.push(currentlyEquipped);
      }
      const updatedEquipment = { ...prev.equipment, [slot]: eq };
      const updatedStats = calculateTotalStats(prev.stats, updatedEquipment);
      return {
        ...prev,
        equipment: updatedEquipment,
        inventory: newInventory,
        playerMaxHp: updatedStats.maxHp,
        playerHp: Math.min(updatedStats.maxHp, prev.playerHp)
      };
    });
    setMerchantMsg(`Equipped ${eq.name}! A glorious pull, hero!`);
    setMerchantMood('happy');
  };

  const handleKeepRolledItemInBag = (eq: Equipment) => {
    setGameState(prev => ({
      ...prev,
      inventory: [...(prev.inventory || []), eq],
    }));
    setMerchantMsg(`Stored ${eq.name} safely in your backpack!`);
    setMerchantMood('idle');
  };

  const initiateSell = (item: Equipment) => {
    const value = getItemSellValue(item);
    setPendingSellItem(item);
    setMerchantMsg(`Looking to part with ${item.name}? I'll gladly pay ${value}G in crisp castle gold!`);
    setMerchantMood('talking');
  };

  const confirmSell = () => {
    if (!pendingSellItem) return;
    const value = getItemSellValue(pendingSellItem);
    const itemToSell = pendingSellItem;

    setGameState(prev => {
      // 1. Filter out from inventory
      const newInventory = prev.inventory.filter(i => i.id !== itemToSell.id);

      // 2. Also unequip if currently equipped
      const newEquipment = { ...prev.equipment };
      if (newEquipment.head?.id === itemToSell.id) newEquipment.head = null;
      if (newEquipment.body?.id === itemToSell.id) newEquipment.body = null;
      if (newEquipment.weapon?.id === itemToSell.id) newEquipment.weapon = null;

      const updatedStats = calculateTotalStats(prev.stats, newEquipment);
      const newPlayerMaxHp = updatedStats.maxHp;

      return {
        ...prev,
        gold: prev.gold + value,
        inventory: newInventory,
        equipment: newEquipment,
        playerMaxHp: newPlayerMaxHp,
        playerHp: Math.min(newPlayerMaxHp, prev.playerHp),
      };
    });

    const confirms = MERCHANT_QUOTES.sellConfirm;
    setMerchantMsg(confirms[Math.floor(Math.random() * confirms.length)]);
    setMerchantMood('happy');
    setPendingSellItem(null);
    setCoinSparkle(true);
    setDealAnimation({ id: Date.now(), type: 'take_item', item: itemToSell, gold: value });
    setDealToast({ id: Date.now(), message: `Barnaby took ${itemToSell.name} & paid +${value}G!`, type: 'sell', item: itemToSell, gold: value });
    setTimeout(() => setDealAnimation(null), 2400);
    setTimeout(() => setDealToast(null), 2800);
    setTimeout(() => setCoinSparkle(false), 1000);
    audio.playTone(550, 'sine', 0.1, 0.3);
    setTimeout(() => audio.playTone(720, 'triangle', 0.15, 0.25), 60);
    setTimeout(() => setMerchantMood('idle'), 2500);
  };

  const handleEquipFromLoadout = (itemToEquip: Equipment) => {
    setGameState(prev => {
      const slot = itemToEquip.slot;
      const currentlyEquipped = prev.equipment[slot];
      const newInventory = prev.inventory.filter(i => i.id !== itemToEquip.id);
      if (currentlyEquipped) {
        newInventory.push(currentlyEquipped);
      }
      const updatedEquipment = { ...prev.equipment, [slot]: itemToEquip };
      const updatedStats = calculateTotalStats(prev.stats, updatedEquipment);
      return {
        ...prev,
        equipment: updatedEquipment,
        inventory: newInventory,
        playerMaxHp: updatedStats.maxHp,
        playerHp: Math.min(updatedStats.maxHp, prev.playerHp),
      };
    });
    audio.playSwapSound();
  };

  const handleUnequipSlot = (slot: EquipmentSlot) => {
    const item = gameState.equipment[slot];
    if (!item) return;
    setGameState(prev => {
      const updatedEquipment = { ...prev.equipment, [slot]: null };
      const updatedStats = calculateTotalStats(prev.stats, updatedEquipment);
      return {
        ...prev,
        equipment: updatedEquipment,
        inventory: [...prev.inventory, item],
        playerMaxHp: updatedStats.maxHp,
        playerHp: Math.min(updatedStats.maxHp, prev.playerHp),
      };
    });
    audio.playSwapSound();
  };

  return (
    <div className="flex-1 flex flex-col p-2.5 sm:p-4 z-10 relative max-w-4xl mx-auto w-full h-full overflow-hidden select-none">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/50 via-slate-950 to-slate-950 -z-10" />

      {/* --- CLEAN MEDIEVAL RPG SHOP HEADER & COUNTER --- */}
      <div className="relative rounded-2xl border-2 border-amber-600/70 bg-gradient-to-b from-[#2a140b] via-[#1a0c07] to-[#0d0704] p-3 sm:p-4 shadow-[0_12px_35px_rgba(0,0,0,0.85)] overflow-hidden shrink-0 mb-3">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-gradient-to-r from-red-700 to-red-900 border border-amber-400/80 rounded-lg shadow flex items-center gap-1.5">
              <span className="text-amber-300 font-pixel text-xs font-black tracking-wider uppercase drop-shadow">
                🏪 MERCHANT POST
              </span>
            </div>
            <span className="hidden md:inline text-xs text-amber-200/80 italic">
              "Honest Steel & Ancient Curiosities"
            </span>
          </div>

          {/* Player Gold Pill */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-950 via-amber-900 to-yellow-950 border-2 border-yellow-400 px-3 py-1 rounded-xl text-yellow-300 font-black text-xs sm:text-sm shadow-[0_0_12px_rgba(234,179,8,0.35)] relative overflow-hidden">
            {coinSparkle && (
              <motion.div
                initial={{ x: -80 }}
                animate={{ x: 160 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-white/30 transform -skew-x-12"
              />
            )}
            <Coins className="w-4 h-4 text-yellow-300 animate-bounce" />
            <span>{gameState.gold} Gold</span>
          </div>
        </div>

        {/* Shopkeeper Portrait & Dialogue Box */}
        <div className="flex flex-row items-center gap-3.5">
          
          {/* Shopkeeper Card with Animated Deal Overlays & Tap for Banter */}
          <div 
            onClick={triggerPoke}
            className="relative group cursor-pointer shrink-0 flex items-center justify-center select-none"
            title="Tap Barnaby for banter!"
          >
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] bg-slate-950">
              
              {/* Merchant Character Artwork */}
              <motion.img 
                src={merchantArtImg} 
                alt="Barnaby the Merchant" 
                referrerPolicy="no-referrer"
                animate={
                  dealAnimation?.type === 'give_item'
                    ? { scale: [1, 1.16, 1.08, 1], y: [0, -6, -4, 0], rotate: [0, 2, -1, 0] }
                    : dealAnimation?.type === 'take_item'
                    ? { scale: [1, 1.12, 1.04, 1], y: [0, -4, -2, 0], rotate: [0, -2, 1, 0] }
                    : merchantMood === 'happy' 
                    ? { scale: [1, 1.08, 1], y: [0, -3, 0] } 
                    : merchantMood === 'taunt'
                    ? { rotate: [-2, 2, 0], scale: [1, 1.04, 1] }
                    : merchantMood === 'talking'
                    ? { y: [0, -2, 1, 0] }
                    : { y: [-1.5, 1.5, -1.5] }
                }
                transition={{ 
                  repeat: dealAnimation ? 1 : Infinity, 
                  duration: dealAnimation ? 1.2 : merchantMood === 'idle' ? 3.0 : 1.4, 
                  ease: "easeInOut" 
                }}
                className={cn(
                  "w-full h-full object-cover object-top image-rendering-pixelated transform-gpu",
                  isBlinking ? "brightness-90" : "brightness-100"
                )}
              />

              {/* Interactive Deal Overlay: Handing Out Item or Taking Item */}
              <AnimatePresence>
                {dealAnimation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-1.5 text-center z-20"
                  >
                    {dealAnimation.type === 'give_item' ? (
                      <>
                        <motion.div
                          animate={{ y: [0, -4, 0], scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="relative"
                        >
                          <ItemSprite item={dealAnimation.item} size="sm" />
                          <span className="absolute -top-1 -right-1 text-xs">✨</span>
                        </motion.div>
                        <span className="text-[8px] font-black text-amber-300 mt-1 uppercase tracking-wider leading-tight">
                          HANDING OUT!
                        </span>
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ y: [0, -3, 0], scale: [1, 1.15, 1] }}
                          transition={{ repeat: Infinity, duration: 0.7 }}
                          className="text-lg"
                        >
                          💰
                        </motion.div>
                        <span className="text-[8px] font-black text-yellow-300 mt-0.5 uppercase tracking-wider leading-tight">
                          +{dealAnimation.gold}G PAID!
                        </span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Candle Warm Light Overlay */}
              <div className="absolute inset-0 bg-amber-500/10 pointer-events-none mix-blend-color-dodge" />

              {/* Bottom Tag */}
              <div className="absolute bottom-0 inset-x-0 h-5 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between px-1.5 border-t border-amber-500/40 z-10">
                <span className="text-[9px] text-amber-200 font-black">Barnaby</span>
                <span className="text-[7px] bg-amber-500 text-black font-black px-1 rounded">PROPRIETOR</span>
              </div>
            </div>
          </div>

          {/* Spacious Merchant Speech Balloon */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={merchantMsg}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.15 }}
                className="bg-black/90 border-2 border-amber-500/60 rounded-2xl p-3 shadow-inner flex flex-col justify-between min-h-[96px]"
              >
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 text-sm mt-0.5 shrink-0">💬</span>
                  <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed italic">
                    "{merchantMsg}"
                  </p>
                </div>
                <div className="text-[10px] text-amber-300/80 font-bold flex items-center justify-between pt-1.5 mt-1 border-t border-amber-500/20 tracking-wide">
                  <span>Barnaby the Merchant</span>
                  <span className="text-amber-400/60 text-[9px] font-normal italic flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> tap portrait for banter
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* --- DEDICATED SHOP NAVIGATION TABS (BELOW MERCHANT COUNTER) --- */}
      <div className="w-full grid grid-cols-4 gap-2 mb-3 shrink-0">
        <button
          onClick={() => { setActiveTab('buy'); audio.playTone(520, 'sine', 0.05, 0.2); }}
          className={cn(
            "py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 border whitespace-nowrap shadow-md",
            activeTab === 'buy'
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.55)] ring-1 ring-amber-300"
              : "bg-slate-900/90 hover:bg-slate-800 text-amber-200 border-amber-500/30 hover:border-amber-400"
          )}
        >
          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>BUY</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-black",
            activeTab === 'buy' ? "bg-black/30 text-black" : "bg-black/50 text-amber-300"
          )}>
            {gameState.shopItems.filter(i => !i.sold).length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('sell'); audio.playTone(520, 'sine', 0.05, 0.2); }}
          className={cn(
            "py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 border whitespace-nowrap shadow-md",
            activeTab === 'sell'
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.55)] ring-1 ring-amber-300"
              : "bg-slate-900/90 hover:bg-slate-800 text-amber-200 border-amber-500/30 hover:border-amber-400"
          )}
        >
          <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>SELL</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-black",
            activeTab === 'sell' ? "bg-black/30 text-black" : "bg-black/50 text-amber-300"
          )}>
            {gameState.inventory.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('equip'); audio.playTone(520, 'sine', 0.05, 0.2); }}
          className={cn(
            "py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 border whitespace-nowrap shadow-md",
            activeTab === 'equip'
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.55)] ring-1 ring-amber-300"
              : "bg-slate-900/90 hover:bg-slate-800 text-amber-200 border-amber-500/30 hover:border-amber-400"
          )}
        >
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>EQUIP</span>
        </button>

        <button
          onClick={() => { setActiveTab('rumors'); triggerRumor(); }}
          className={cn(
            "py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 border whitespace-nowrap shadow-md",
            activeTab === 'rumors'
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.55)] ring-1 ring-amber-300"
              : "bg-slate-900/90 hover:bg-slate-800 text-amber-200 border-amber-500/30 hover:border-amber-400"
          )}
        >
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>RUMORS</span>
        </button>
      </div>

      {/* --- SHOP CONTENT TABS --- */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 pb-2">
        
        {/* TAB 1: BUY SHOP ITEMS */}
        {activeTab === 'buy' && (
          <div className="space-y-2.5">
            
            {/* Interactive Mystery Chest Gamble Banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-amber-950/80 border border-purple-500/50 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <ItemSprite name="Barnaby's Mystery Chest" rarity="epic" size="md" />
                <div>
                  <div className="text-xs font-black text-purple-200">Barnaby's Mystery Chest</div>
                  <div className="text-[10px] text-slate-400">Roll for a mystery rare, epic, or legendary artifact!</div>
                </div>
              </div>

              <button
                onClick={handleMysteryGamble}
                className={cn(
                  "px-3.5 py-2 rounded-xl font-black text-xs shrink-0 flex items-center gap-1 shadow-md transition-all active:scale-95",
                  gameState.gold >= 25
                    ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 shadow-[0_0_12px_rgba(234,179,8,0.5)] animate-pulse"
                    : "bg-slate-800 border border-slate-700 text-slate-400 cursor-pointer hover:border-red-500"
                )}
              >
                <Dice5 className="w-3.5 h-3.5" />
                <span>{gameState.gold >= 25 ? "25G ROLL" : `25G (${gameState.gold}G)`}</span>
              </button>
            </div>

            {gameState.shopItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-pixel text-xs border-2 border-dashed border-slate-800 rounded-2xl">
                Barnaby's shop is sold out for this floor. Progress to the next node to restock!
              </div>
            ) : (
              gameState.shopItems.map((item, idx) => {
                const eq = item.equipment;
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "backdrop-blur-md border p-3 rounded-2xl flex items-center justify-between gap-3 transition-all",
                      getRarityColor(eq.rarity)
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rich Dedicated Item Sprite */}
                      <ItemSprite item={eq} size="md" />

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs sm:text-sm text-white">{eq.name}</span>
                          <span className={cn("text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider", getRarityBadge(eq.rarity))}>
                            {eq.rarity}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase font-pixel">
                            [{eq.slot}]
                          </span>
                        </div>
                        
                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/90 mt-0.5 font-semibold">
                          {eq.stats.attack ? <span className="text-red-300">⚔️ ATK +{eq.stats.attack}</span> : null}
                          {eq.stats.defense ? <span className="text-blue-300">🛡️ DEF +{eq.stats.defense}</span> : null}
                          {eq.stats.maxHp ? <span className="text-pink-300">❤️ HP +{eq.stats.maxHp}</span> : null}
                          {eq.stats.fireDmg ? <span className="text-red-400">🔥 Fire +{eq.stats.fireDmg}</span> : null}
                          {eq.stats.waterDmg ? <span className="text-blue-400">💧 Water +{eq.stats.waterDmg}</span> : null}
                          {eq.stats.earthDmg ? <span className="text-emerald-400">🌿 Earth +{eq.stats.earthDmg}</span> : null}
                          {eq.stats.lightDmg ? <span className="text-yellow-400">☀️ Light +{eq.stats.lightDmg}</span> : null}
                          {eq.stats.darkDmg ? <span className="text-purple-400">🌙 Dark +{eq.stats.darkDmg}</span> : null}
                          {eq.stats.critChance ? <span className="text-amber-300">🎯 Crit +{eq.stats.critChance}%</span> : null}
                        </div>

                        {/* Passive Perk */}
                        {eq.passive && (
                          <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1 mt-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 w-fit">
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{eq.passive.name}: {eq.passive.description}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      disabled={item.sold}
                      onClick={() => handleBuy(item, idx)}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all active:scale-95 flex items-center gap-1 shadow-md whitespace-nowrap",
                        item.sold 
                          ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                          : gameState.gold >= item.price
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold shadow-amber-500/20"
                          : "bg-red-950/80 text-red-300 border border-red-500/40 hover:bg-red-900"
                      )}
                    >
                      {item.sold ? (
                        <span>SOLD</span>
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
          <div className="space-y-2.5">
            {gameState.inventory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-pixel text-xs border-2 border-dashed border-slate-800 rounded-2xl">
                Your inventory bag is currently empty. Win dungeon battles or open chests to collect loot!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {gameState.inventory.map((item) => {
                  const isEquipped = Object.values(gameState.equipment).some((e: any) => e?.id === item.id);
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
                        <ItemSprite item={item} size="sm" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {isEquipped && (
                              <span className="text-[8px] bg-blue-500/30 text-blue-300 border border-blue-400/50 px-1 py-0.2 rounded">
                                EQUIPPED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-amber-300/90 font-semibold">
                            Sell Value: +{sellVal} Gold
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

        {/* TAB 3: EQUIP HERO LOADOUT */}
        {activeTab === 'equip' && (
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" /> Active Hero Equipment Loadout
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['head', 'body', 'weapon'] as EquipmentSlot[]).map((slot) => {
                const eq = gameState.equipment[slot];
                return (
                  <div key={slot} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center flex flex-col items-center justify-between min-h-[140px]">
                    <div className="text-[10px] text-slate-400 font-pixel uppercase mb-1">
                      {slot === 'head' ? '🪖 HEAD' : slot === 'body' ? '🥋 BODY ARMOR' : '🗡️ WEAPON'}
                    </div>
                    {eq ? (
                      <div className="my-1 flex flex-col items-center">
                        <ItemSprite item={eq} size="md" />
                        <div className="text-xs font-bold text-white truncate w-full mt-1">{eq.name}</div>
                        <div className="text-[9px] text-amber-400 font-pixel uppercase">{eq.rarity}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 font-bold py-4">EMPTY SLOT</div>
                    )}

                    {eq ? (
                      <button
                        onClick={() => handleUnequipSlot(slot)}
                        className="w-full py-1 bg-slate-900 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Unequip
                      </button>
                    ) : (
                      <div className="h-6" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Inventory Quick-Equip list */}
            {gameState.inventory.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Backpack Items:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {gameState.inventory.map(item => (
                    <div key={item.id} className="p-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ItemSprite item={item} size="sm" />
                        <span className="text-xs text-white font-bold truncate">{item.name}</span>
                      </div>
                      <button
                        onClick={() => handleEquipFromLoadout(item)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] rounded-lg shadow"
                      >
                        EQUIP
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RUMORS & DUNGEON LORE */}
        {activeTab === 'rumors' && (
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400" /> Barnaby's Dungeon Intelligence & Weaknesses
              </h4>
              <button 
                onClick={triggerRumor}
                className="text-[10px] text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-1 rounded-lg hover:bg-amber-900 transition-all font-bold"
              >
                Hear Another Tip 💬
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-red-900/50">
                <span className="text-red-400 font-bold">🔥 Fire Bosses (Dragon, Imp):</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Vulnerable to Water (💧). Match blue gems for 1.5x damage.</p>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-blue-900/50">
                <span className="text-blue-400 font-bold">💧 Water/Nature (Elf, Slime):</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Vulnerable to Earth (🌿). Match emerald gems for 1.5x damage.</p>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-emerald-900/50">
                <span className="text-emerald-400 font-bold">🌿 Earth/Stone (Golem, Goblin, Minotaur):</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Vulnerable to Fire (🔥). Match red gems to melt heavy defenses.</p>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-purple-900/50">
                <span className="text-purple-400 font-bold">💀 Undead (Skeleton, Specter):</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Vulnerable to Fire (🔥) and Light (☀️) radiant strikes.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MYSTERY CHEST ROLL REVEAL MODAL */}
      <MysteryChestModal
        isOpen={isMysteryModalOpen}
        onClose={() => setIsMysteryModalOpen(false)}
        rolledItem={rolledMysteryItem}
        onEquip={handleEquipRolledItem}
        onKeepInBag={handleKeepRolledItemInBag}
      />

      {/* SELL CONFIRMATION MODAL */}
      {pendingSellItem && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border-2 border-amber-500 rounded-2xl p-5 max-w-sm w-full text-center space-y-3 shadow-[0_0_35px_rgba(245,158,11,0.5)]">
            <ItemSprite item={pendingSellItem} size="lg" className="mx-auto" />
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
      {/* DEAL TOAST BANNER */}
      <AnimatePresence>
        {dealToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-16 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
          >
            <div className="bg-slate-950/95 border-2 border-amber-400 rounded-2xl px-4 py-2.5 shadow-[0_0_30px_rgba(245,158,11,0.6)] flex items-center gap-3">
              <div className="p-1 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
                <ItemSprite item={dealToast.item} size="sm" />
              </div>
              <div>
                <div className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <span>{dealToast.type === 'buy' ? '🤝 ITEM HANDED OVER!' : '💰 ITEM SOLD & GOLD PAID!'}</span>
                  <span>✨</span>
                </div>
                <div className="text-xs font-black text-white">{dealToast.message}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

