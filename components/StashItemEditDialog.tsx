'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { StashItem } from '../types';
import CustomUnitSelect from './CustomUnitSelect';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    item: StashItem | null;
    onSave: (updates: Partial<StashItem>) => void;
    onDelete: () => void;
}

const StashItemEditDialog: React.FC<Props> = ({ isOpen, onClose, item, onSave, onDelete }) => {
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('x');
    const [unitDetails, setUnitDetails] = useState('');
    const [inStock, setInStock] = useState(true);
    const [replenishmentRule, setReplenishmentRule] = useState<StashItem['replenishmentRule']>('ONE_SHOT');

    useEffect(() => {
        if (item) {
            setName(item.name);
            setQuantity(item.quantity || '');
            setUnit(item.unit || 'x');
            setUnitDetails(item.unitDetails || '');
            setInStock(item.inStock);
            setReplenishmentRule(item.replenishmentRule);
        }
    }, [item, isOpen]);

    if (!isOpen || !item) return null;

    const handleSave = () => {
        onSave({
            name,
            quantity,
            unit,
            unitDetails,
            inStock,
            replenishmentRule
        });
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="poe-surface rounded-3xl w-full max-w-lg mx-4 shadow-2xl border border-poe-borderStrong animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-poe-sectionStash to-poe-accent-bronze p-6 text-poe-bg0 flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <i className="fas fa-edit opacity-80"></i>
                        {t('common.edit')}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/15 hover:bg-black/25 transition-colors poe-focus-ring" aria-label="Close dialog">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">

                    {/* Name Input */}
                    <div>
                        <label className="block text-xs font-bold text-poe-text2 uppercase tracking-wider mb-2">{t('pantry.ingredient')}</label>
                        <input
                            className="w-full px-4 py-3 poe-input poe-focus-ring rounded-xl font-bold transition-all"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ex: Divine Orb, Lightning Gem..."
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Quantity */}
                        <div>
                            <label className="block text-xs font-bold text-poe-text2 uppercase tracking-wider mb-2">{t('recipeForm.qty')}</label>
                            <input
                                className="w-full px-4 py-3 poe-input poe-focus-ring rounded-xl font-bold transition-all"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="1, 0.5..."
                            />
                        </div>

                        {/* Unit */}
                        <div>
                            <label className="block text-xs font-bold text-poe-text2 uppercase tracking-wider mb-2">{t('recipeForm.unit')}</label>
                            <CustomUnitSelect
                                value={unit}
                                onChange={setUnit}
                                className="w-full"
                            />
                        </div>
                        {/* Replenishment Rule */}
                        <div className="col-span-2 space-y-3 pt-2 border-t border-poe-border">
                            <label className="block text-xs font-bold text-poe-text2 uppercase tracking-wider">{t('recipeCard.trackItem')}</label>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { value: 'ALWAYS', label: t('recipeCard.alwaysReplenish'), desc: t('recipeCard.alwaysReplenishDesc'), icon: 'fa-sync-alt', color: 'poe-status-info' },
                                    { value: 'ONE_SHOT', label: t('recipeCard.oneShot'), desc: t('recipeCard.oneShotDesc'), icon: 'fa-bullseye', color: 'poe-status-warning' },
                                    { value: 'NEVER', label: t('recipeCard.justTrack'), desc: t('recipeCard.justTrackDesc'), icon: 'fa-eye', color: 'text-poe-text2 bg-poe-surface2 border-poe-borderStrong' }
                                ].map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => setReplenishmentRule(option.value as any)}
                                        className={`relative p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 poe-focus-ring ${replenishmentRule === option.value ? `${option.color} border-current ring-1 ring-offset-1 ring-poe-borderStrong` : 'border-poe-border hover:border-poe-borderStrong hover:bg-poe-surface2'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${replenishmentRule === option.value ? 'bg-black/10' : 'bg-poe-surface2'} ${replenishmentRule === option.value ? '' : 'text-poe-text2'}`}>
                                            <i className={`fas ${option.icon}`}></i>
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${replenishmentRule === option.value ? '' : 'text-poe-text1'}`}>{option.label}</p>
                                            <p className={`text-xs ${replenishmentRule === option.value ? 'opacity-80' : 'text-poe-text2'}`}>{option.desc}</p>
                                        </div>
                                        {replenishmentRule === option.value && (
                                            <div className="absolute top-3 right-3 text-current">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stock Toggle */}
                    <div className="flex items-center justify-between poe-card p-4 rounded-xl border border-poe-borderStrong">
                        <span className="font-bold text-poe-text1">{t('pantry.inStockQuestion')}</span>
                        <button
                            onClick={() => setInStock(!inStock)}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors poe-focus-ring ${inStock ? 'bg-poe-success' : 'bg-poe-borderStrong'}`}
                        >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${inStock ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 bg-poe-surface1 border-t border-poe-border flex justify-between">
                    <button
                        onClick={onDelete}
                        className="px-6 py-3 rounded-xl font-bold text-poe-danger hover:bg-poe-surface2 transition-colors flex items-center gap-2 poe-focus-ring"
                    >
                        <i className="fas fa-trash"></i>
                        {t('common.delete')}
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-poe-text2 hover:bg-poe-surface2 transition-colors poe-focus-ring"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!name.trim()}
                            className="px-8 py-3 rounded-xl font-bold poe-btn-primary poe-focus-ring shadow-lg shadow-black/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </div>

            </div >
        </div >
    );
};

export default StashItemEditDialog;
