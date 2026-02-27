'use client';

import React, { useState, useMemo } from 'react';
import { StashItem } from '../types';
import { storageService } from '../services/storageService';
import { ConfirmDialog } from './ConfirmDialog';
import CustomUnitSelect from './CustomUnitSelect';
import StashItemEditDialog from './StashItemEditDialog';
import StashItemCard from './StashItemCard';
import { parseAllPoeClipboardItems, parseFirstPoeClipboardItem } from '@/lib/poe-item-parser';

import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useTranslation } from '@/hooks/useTranslation';

const EMPTY_STASH: StashItem[] = [];
const NOOP_SET_STASH: React.Dispatch<React.SetStateAction<StashItem[]>> = () => undefined;

interface Props {
  stash?: StashItem[];
  setStash?: React.Dispatch<React.SetStateAction<StashItem[]>>;
  pantry?: StashItem[];
  setPantry?: React.Dispatch<React.SetStateAction<StashItem[]>>;
}

const StashSection: React.FC<Props> = ({
  stash,
  setStash,
  pantry: legacyPantry,
  setPantry: legacySetPantry,
}) => {
  const pantry = stash ?? legacyPantry ?? EMPTY_STASH;
  const setPantry: React.Dispatch<React.SetStateAction<StashItem[]>> =
    setStash || legacySetPantry || NOOP_SET_STASH;
  const { isGuest } = useCurrentMember();
  const { t } = useTranslation();
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('x');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRule, setFilterRule] = useState('ALL');

  // Edit Dialog State
  const [editingItem, setEditingItem] = useState<StashItem | null>(null);

  // Confim Dialog State
  const [itemToDelete, setItemToDelete] = useState<StashItem | null>(null);

  // FILTERED LIST
  const filteredPantry = useMemo(() => {
    return pantry.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterRule === 'ALL' || item.replenishmentRule === filterRule;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [pantry, searchQuery, filterRule]);

  const addItemOptimistically = async (name: string, quantity: string, unit: string, errorContext: string) => {
    const tempId = Date.now().toString();
    const tempItem: StashItem = {
      id: tempId,
      name,
      inStock: true,
      replenishmentRule: 'ONE_SHOT',
      quantity,
      unit,
    };
    setPantry(prev => [...prev, tempItem]);

    try {
      const created = await storageService.addStashItem(
        name,
        undefined,
        undefined,
        quantity,
        unit,
      );
      if (created) {
        setPantry(prev => prev.map(i => i.id === tempId ? created : i));
      }
    } catch (error) {
      console.error(errorContext, error);
    }
  };

  // ACTIONS
  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    setPasteError(null);
    setPasteNotice(null);
    await addItemOptimistically(newItemName, newItemQuantity, newItemUnit, "Failed to add item");
    setNewItemName('');
    setNewItemQuantity('1');
    setNewItemUnit('x');
  };

  const handlePasteImport = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;

    e.preventDefault();
    setPasteError(null);
    setPasteNotice(null);

    const parsed = parseFirstPoeClipboardItem(pasted);
    if (!parsed) {
      setPasteError(t('pantry.pasteInvalidFormat'));
      return;
    }

    const parsedAll = parseAllPoeClipboardItems(pasted);
    if (parsedAll.length > 1) {
      setPasteNotice(t('pantry.pasteOnlyFirstItemNotice'));
    }

    await addItemOptimistically(parsed.name, parsed.quantity, parsed.unit, "Failed to import pasted item");
    setNewItemName('');
    setNewItemQuantity('1');
    setNewItemUnit('x');
  };

  const handleToggleStock = async (item: StashItem) => {
    const newState = !item.inStock;
    // Optimistic
    setPantry(prev => prev.map(i => i.id === item.id ? { ...i, inStock: newState } : i));

    try {
      await storageService.editStashItem(item.name, { inStock: newState });
    } catch (error) {
      console.error("Failed to toggle stock", error);
      setPantry(prev => prev.map(i => i.id === item.id ? { ...i, inStock: !newState } : i));
    }
  };

  const openEdit = (item: StashItem) => {
    setEditingItem(item);
  };

  const handleSaveEdit = async (updates: Partial<StashItem>) => {
    if (!editingItem) return;

    // Optimistic Update
    setPantry(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...updates } : i));

    try {
      await storageService.editStashItem(editingItem.name, updates);
    } catch (error) {
      console.error("Failed to edit item", error);
      // Revert? For now keeping it simple as optimistic usually works unless offline
    }
  };

  const handleDeleteFromDialog = () => {
    if (editingItem) {
      setItemToDelete(editingItem);
      setEditingItem(null);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setPantry(prev => prev.filter(i => i.id !== itemToDelete.id));
    try {
      await storageService.removeStashItem(itemToDelete.name);
    } catch (error) {
      console.error("Failed to delete", error);
      // Ideally revert optimistic update here, but for now simple log
    }
    setItemToDelete(null);
  };

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header & Add */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">


        {/* Add New Bar */}
        {!isGuest && (
          <div className="flex gap-2 flex-col md:flex-row">
            <div className="flex-1 flex gap-2">
              <input
                placeholder={t('pantry.placeholder')}
                className="flex-[2] px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                value={newItemName}
                onKeyPress={e => e.key === 'Enter' && handleAdd()}
                onPaste={handlePasteImport}
                onChange={e => setNewItemName(e.target.value)}
              />
              <input
                placeholder={t('recipeForm.qty')}
                className="w-20 px-3 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                value={newItemQuantity}
                onKeyPress={e => e.key === 'Enter' && handleAdd()}
                onChange={e => setNewItemQuantity(e.target.value)}
              />
              <CustomUnitSelect
                value={newItemUnit}
                onChange={setNewItemUnit}
                className="w-32"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newItemName.trim()}
              className={`px-6 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${!newItemName.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600'
                }`}
            >
              <i className="fas fa-plus mr-2 md:hidden"></i>
              {t('pantry.include')}
            </button>
          </div>
        )}
        {!isGuest && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">{t('pantry.pasteHint')}</p>
            {pasteNotice && <p className="text-xs font-semibold text-amber-700">{pasteNotice}</p>}
            {pasteError && <p className="text-xs font-semibold text-rose-600">{pasteError}</p>}
          </div>
        )}
      </div>

      {/* Search & List */}
      <div className="p-0">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
            <input
              type="text"
              placeholder={t('pantry.search')}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-slate-200 text-slate-600 font-bold"
            value={filterRule}
            onChange={e => setFilterRule(e.target.value)}
          >
            <option value="ALL">{t('shopping.filterAll')}</option>
            <option value="ALWAYS">{t('recipeCard.alwaysReplenish')}</option>
            <option value="ONE_SHOT">{t('recipeCard.oneShot')}</option>
            <option value="NEVER">{t('recipeCard.justTrack')}</option>
          </select>
        </div>

        <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
          {filteredPantry.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <i className="fas fa-box-open text-4xl mb-3 opacity-20"></i>
              <p>{t('pantry.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPantry.map(item => (
                <StashItemCard
                  key={item.id}
                  item={item}
                  onClick={() => openEdit(item)}
                  onToggleStock={(e) => {
                    e.stopPropagation();
                    handleToggleStock(item);
                  }}
                  isGuest={isGuest}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!itemToDelete}
        title={t('pantry.removeTitle')}
        message={t('pantry.removeMsg').replace('{item}', itemToDelete?.name || '')}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
      />

      <StashItemEditDialog
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleSaveEdit}
        onDelete={handleDeleteFromDialog}
      />
    </section>
  );
};

export default StashSection;
