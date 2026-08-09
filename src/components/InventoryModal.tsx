import React, { useState } from 'react';
import { XCircle, Shield, Sword, Heart, Sparkles, Coins, ArrowRightLeft, Trash2, Package, AlertTriangle, Check, X } from 'lucide-react';
import { Equipment, EquipmentSlot, GameState } from '../types';
import { getRarityColor, getRarityBadge, calculateTotalStats, getItemSellValue } from '../roguelike';
import { cn } from '../utils';
import { audio } from '../audio';
import { MerchantSprite, MERCHANT_TAUNTS } from './MerchantSprite';
import { ItemSprite } from './ItemSprite';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  gameState,
  setGameState,
}) => {
  const [slotFilter, setSlotFilter] = useState<'all' | EquipmentSlot>('all');
  const [merchantMsg, setMerchantMsg] = useState<string>(
    "Ah, welcome to your bag! Got any shiny loot you want to sell to old Barnaby?"
  );
  const [merchantMood, setMerchantMood] = useState<'idle' | 'happy' | 'taunt' | 'surprised'>('idle');
  const [pendingSellItem, setPendingSellItem] = useState<Equipment | null>(null);

  if (!isOpen) return null;

  const currentStats = calculateTotalStats(gameState.stats, gameState.equipment);

  const handleEquip = (itemToEquip: Equipment) => {
    setGameState(prev => {
      const slot = itemToEquip.slot;
      const currentlyEquipped = prev.equipment[slot];

      // Remove the item to equip from inventory
      const newInventory = prev.inventory.filter(i => i.id !== itemToEquip.id);

      // If there was an item equipped, put it back into inventory
      if (currentlyEquipped) {
        newInventory.push(currentlyEquipped);
      }

      const updatedEquipment = {
        ...prev.equipment,
        [slot]: itemToEquip,
      };

      // Recalculate max HP to safely scale player current HP
      const updatedStats = calculateTotalStats(prev.stats, updatedEquipment);
      const newPlayerMaxHp = updatedStats.maxHp;
      const newPlayerHp = Math.min(newPlayerMaxHp, Math.max(1, Math.round((prev.playerHp / Math.max(1, prev.playerMaxHp)) * newPlayerMaxHp)));

      return {
        ...prev,
        equipment: updatedEquipment,
        inventory: newInventory,
        playerMaxHp: newPlayerMaxHp,
        playerHp: newPlayerHp,
      };
    });

    setMerchantMsg(`Equipped ${itemToEquip.name}! Fits like a glove on a hero!`);
    setMerchantMood('happy');
    audio.playSwapSound();
  };

  const handleUnequip = (slot: EquipmentSlot) => {
    const itemToUnequip = gameState.equipment[slot];
    if (!itemToUnequip) return;

    setGameState(prev => {
      const updatedEquipment = {
        ...prev.equipment,
        [slot]: null,
      };

      const newInventory = [...prev.inventory, itemToUnequip];

      const updatedStats = calculateTotalStats(prev.stats, updatedEquipment);
      const newPlayerMaxHp = updatedStats.maxHp;
      const newPlayerHp = Math.min(newPlayerMaxHp, Math.max(1, prev.playerHp));

      return {
        ...prev,
        equipment: updatedEquipment,
        inventory: newInventory,
        playerMaxHp: newPlayerMaxHp,
        playerHp: newPlayerHp,
      };
    });

    setMerchantMsg(`Unequipped ${itemToUnequip.name}. Fighting light, are we?`);
    setMerchantMood('surprised');
    audio.playSwapSound();
  };

  const initiateSell = (itemToSell: Equipment) => {
    const goldEarned = getItemSellValue(itemToSell);
    setPendingSellItem(itemToSell);
    const taunts = MERCHANT_TAUNTS.sellHover(itemToSell.name, goldEarned);
    setMerchantMsg(taunts[Math.floor(Math.random() * taunts.length)]);
    setMerchantMood('taunt');
  };

  const confirmSell = () => {
    if (!pendingSellItem) return;
    const goldEarned = getItemSellValue(pendingSellItem);
    const itemToSell = pendingSellItem;

    setGameState(prev => {
      // 1. Remove from inventory
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
        gold: prev.gold + goldEarned,
        inventory: newInventory,
        equipment: newEquipment,
        playerMaxHp: newPlayerMaxHp,
        playerHp: Math.min(newPlayerMaxHp, prev.playerHp)
      };
    });

    const confirmLines = MERCHANT_TAUNTS.sellConfirm;
    setMerchantMsg(confirmLines[Math.floor(Math.random() * confirmLines.length)]);
    setMerchantMood('happy');
    setPendingSellItem(null);

    audio.playTone(550, 'sine', 0.1, 0.3);
    setTimeout(() => audio.playTone(750, 'triangle', 0.12, 0.25), 60);
  };

  const cancelSell = () => {
    setPendingSellItem(null);
    setMerchantMsg("Hah! Smart choice. Keep your finest weapons for the dark beasts ahead!");
    setMerchantMood('idle');
  };

  const handleMerchantPoke = () => {
    const pokes = MERCHANT_TAUNTS.poke;
    setMerchantMsg(pokes[Math.floor(Math.random() * pokes.length)]);
    setMerchantMood('taunt');
    audio.playTone(400, 'triangle', 0.08, 0.2);
  };

  const filteredInventory = gameState.inventory.filter(item => {
    if (slotFilter === 'all') return true;
    return item.slot === slotFilter;
  });

  const slots: { slot: EquipmentSlot; label: string; placeholderIcon: string }[] = [
    { slot: 'head', label: 'HEAD', placeholderIcon: '🪖' },
    { slot: 'body', label: 'BODY', placeholderIcon: '👕' },
    { slot: 'weapon', label: 'WEAPON', placeholderIcon: '🗡️' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl max-h-[92vh] bg-slate-950 border border-slate-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">EQUIPMENT & INVENTORY</h2>
              <p className="text-xs text-slate-400">Equip, swap, and manage your hero's loadout</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <XCircle className="w-7 h-7" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Interactive 3D Merchant Banner */}
          <MerchantSprite
            message={merchantMsg}
            mood={merchantMood}
            onTap={handleMerchantPoke}
          />

          {/* Hero Total Stats Overview */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-4 text-xs font-extrabold text-white">
              <span className="flex items-center gap-1 text-red-400">
                <Sword className="w-4 h-4" /> {currentStats.attack} ATK
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <Shield className="w-4 h-4" /> {currentStats.defense} DEF
              </span>
              <span className="flex items-center gap-1 text-pink-400">
                <Heart className="w-4 h-4" /> {currentStats.maxHp} HP
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              {currentStats.fireDmg > 0 && <span className="text-red-400">🔥 +{currentStats.fireDmg}</span>}
              {currentStats.waterDmg > 0 && <span className="text-blue-400">💧 +{currentStats.waterDmg}</span>}
              {currentStats.earthDmg > 0 && <span className="text-emerald-400">🌿 +{currentStats.earthDmg}</span>}
              <span className="flex items-center gap-1 text-yellow-400 bg-yellow-950/60 border border-yellow-500/30 px-2 py-0.5 rounded-lg">
                <Coins className="w-3.5 h-3.5" /> {gameState.gold}G
              </span>
            </div>
          </div>

          {/* Currently Equipped Gear Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Equipped Loadout</span>
              <span className="text-[10px] text-slate-500">Tap item to unequip or swap</span>
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {slots.map(({ slot, label, placeholderIcon }) => {
                const item = gameState.equipment[slot];
                return (
                  <div
                    key={slot}
                    className={cn(
                      'p-2.5 rounded-2xl border flex flex-col justify-between min-h-[125px] transition-all relative group',
                      item ? getRarityColor(item.rarity) : 'border-dashed border-slate-800 bg-slate-900/40 text-slate-600'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {label}
                      </span>
                      {item && (
                        <span className={cn('text-[8px] font-bold px-1 rounded border uppercase', getRarityBadge(item.rarity))}>
                          {item.rarity}
                        </span>
                      )}
                    </div>

                    {item ? (
                      <div className="my-1.5 flex flex-col items-center text-center">
                        <ItemSprite item={item} size="md" />
                        <span className="font-extrabold text-xs text-white line-clamp-1 leading-tight mt-1">{item.name}</span>
                        
                        {/* Compact Stats */}
                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-white/80 mt-1">
                          {item.stats.attack ? <span className="text-red-300">+{item.stats.attack}A</span> : null}
                          {item.stats.defense ? <span className="text-blue-300">+{item.stats.defense}D</span> : null}
                          {item.stats.maxHp ? <span className="text-pink-300">+{item.stats.maxHp}H</span> : null}
                        </div>
                      </div>
                    ) : (
                      <div className="my-auto flex flex-col items-center justify-center text-slate-700">
                        <span className="text-2xl opacity-40">{placeholderIcon}</span>
                        <span className="text-[10px] font-bold mt-1 text-slate-600">EMPTY</span>
                      </div>
                    )}

                    {item && (
                      <button
                        onClick={() => handleUnequip(slot)}
                        className="w-full py-1 rounded-xl bg-slate-900/80 hover:bg-red-950 hover:text-red-300 border border-slate-700 hover:border-red-500 text-[10px] font-bold text-slate-300 transition-colors flex items-center justify-center gap-1 mt-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Unequip
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Owned Inventory (Bag) Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Inventory Bag ({gameState.inventory.length})
              </h3>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[10px] font-bold">
                {(['all', 'head', 'body', 'weapon'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setSlotFilter(f)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg capitalize transition-colors',
                      slotFilter === f ? 'bg-amber-500 text-black font-extrabold' : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center text-slate-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">No items in your bag</p>
                <p className="text-[10px] text-slate-600">Defeat enemies or visit the Merchant Shop to find gear!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {filteredInventory.map(item => {
                  const currentlyEquippedInSlot = gameState.equipment[item.slot];
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'p-3 rounded-2xl border flex flex-col gap-2.5 transition-all',
                        getRarityColor(item.rarity)
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ItemSprite item={item} size="md" />

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-white truncate max-w-[140px]">{item.name}</span>
                            <span className={cn('text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0', getRarityBadge(item.rarity))}>
                              {item.rarity}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase font-semibold shrink-0">[{item.slot}]</span>
                          </div>

                          {/* Stats */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/80 font-semibold mt-0.5">
                            {item.stats.attack ? <span className="text-red-300">ATK +{item.stats.attack}</span> : null}
                            {item.stats.defense ? <span className="text-blue-300">DEF +{item.stats.defense}</span> : null}
                            {item.stats.maxHp ? <span className="text-pink-300">HP +{item.stats.maxHp}</span> : null}
                            {item.stats.fireDmg ? <span className="text-red-400">🔥+{item.stats.fireDmg}</span> : null}
                            {item.stats.waterDmg ? <span className="text-blue-400">💧+{item.stats.waterDmg}</span> : null}
                            {item.stats.earthDmg ? <span className="text-emerald-400">🌿+{item.stats.earthDmg}</span> : null}
                          </div>

                          {/* Passive */}
                          {item.passive && (
                            <div className="text-[9px] text-amber-300 font-semibold flex items-start gap-1 mt-0.5 min-w-0">
                              <Sparkles className="w-3 h-3 text-amber-400 shrink-0 mt-[1px]" />
                              <span className="min-w-0 break-words">{item.passive.description}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 w-full">
                        {/* Equip Button */}
                        <button
                          onClick={() => handleEquip(item)}
                          className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          EQUIP
                        </button>

                        {/* Sell Button */}
                        <button
                          onClick={() => initiateSell(item)}
                          title="Sell to Barnaby for Gold"
                          className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-yellow-950 text-yellow-400 border border-slate-700 hover:border-yellow-500 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <Coins className="w-3 h-3" />+{getItemSellValue(item)}G
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Barnaby Sell Confirmation Modal Overlay */}
        {pendingSellItem && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-950 border-2 border-amber-500 rounded-2xl p-4 max-w-sm w-full text-center space-y-3 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
              <ItemSprite item={pendingSellItem} size="lg" className="mx-auto" />
              <div>
                <h4 className="text-amber-300 font-extrabold text-sm uppercase">Sell Confirmation</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Are you sure you want to sell <span className="text-white font-bold">{pendingSellItem.name}</span> for <span className="text-yellow-400 font-black">{getItemSellValue(pendingSellItem)}G</span>?
                </p>
              </div>

              <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 italic">
                "{merchantMsg}"
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={cancelSell}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <X className="w-4 h-4" /> Keep Item
                </button>
                <button
                  onClick={confirmSell}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" /> Confirm Sell
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
