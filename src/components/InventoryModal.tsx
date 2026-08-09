import React, { useState } from 'react';
import { XCircle, Shield, Sword, Heart, Sparkles, Coins, ArrowRightLeft, Trash2, Package } from 'lucide-react';
import { Equipment, EquipmentSlot, GameState } from '../types';
import { getRarityColor, getRarityBadge, calculateTotalStats, getItemSellValue } from '../roguelike';
import { cn } from '../utils';
import { audio } from '../audio';

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

    audio.playSwapSound();
  };

  const handleSell = (itemToSell: Equipment) => {
    const goldEarned = getItemSellValue(itemToSell);

    setGameState(prev => ({
      ...prev,
      gold: prev.gold + goldEarned,
      inventory: prev.inventory.filter(i => i.id !== itemToSell.id),
    }));

    audio.playTone(550, 'sine', 0.1, 0.3);
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
                        <span className="text-2xl mb-0.5">{item.icon}</span>
                        <span className="font-extrabold text-xs text-white line-clamp-1 leading-tight">{item.name}</span>
                        
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
                        <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                          {item.icon}
                        </div>

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
                          onClick={() => handleSell(item)}
                          title="Sell for Gold"
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
      </div>
    </div>
  );
};
