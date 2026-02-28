'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { StashItem } from '../types';

interface Props {
    item: StashItem;
    onClick: () => void;
    onToggleStock: (e: React.MouseEvent) => void;
    isGuest?: boolean;
}

const StashItemCard: React.FC<Props> = ({ item, onClick, onToggleStock, isGuest }) => {
    const { t } = useTranslation();
    const unitKey = `units.${item.unit}`;
    const translatedUnit = t(unitKey);
    const unitLabel = translatedUnit === unitKey ? item.unit : translatedUnit;

    return (
        <div
            onClick={!isGuest ? onClick : undefined}
            className={`group relative poe-card rounded-2xl p-4 border transition-all duration-200 flex flex-col gap-2
        ${!isGuest ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-poe-sectionStash' : ''}
        ${item.inStock ? 'border-poe-borderStrong' : 'border-poe-border bg-poe-surface1 opacity-80'}
        `}
        >
            {/* Status Indicator Dot */}
            <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${item.inStock ? 'bg-poe-success shadow-[0_0_8px_rgba(142,207,142,0.5)]' : 'bg-poe-borderStrong'}`}></div>

            {/* Content */}
            <div className="pr-6">
                <h3 className={`font-bold text-lg leading-tight text-poe-text1 ${!item.inStock && 'text-poe-text2 line-through decoration-poe-text2 decoration-2'}`}>
                    {item.name}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-sm font-medium text-poe-sectionStash">
                    {item.quantity && (
                        <span>{item.quantity}</span>
                    )}
                    <span>{item.quantity ? unitLabel : ''}</span>
                    {item.unitDetails && (
                        <span className="text-poe-text2 font-normal ml-1">({item.unitDetails})</span>
                    )}
                </div>
            </div>

            {/* Quick Actions (Hover/Mobile) - replacing the old switch with a simpler overlay or action */}
            {/* Actually, keeping the toggle on the card is nice for quick interactions without opening the modal */}
            <div className="mt-2 pt-3 border-t border-poe-border flex justify-between items-center">

                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${item.inStock ? 'text-poe-success' : 'text-poe-text2'}`}>
                        {item.inStock ? t('pantry.inStock') : t('pantry.outOfStock')}
                    </span>
                    {/* Replenishment Badge */}
                    {item.replenishmentRule === 'ALWAYS' && (
                        <i className="fas fa-sync-alt text-poe-info text-xs" title={t('recipeCard.alwaysReplenish')}></i>
                    )}
                    {item.replenishmentRule === 'ONE_SHOT' && (
                        <i className="fas fa-bullseye text-poe-warning text-xs" title={t('recipeCard.oneShot')}></i>
                    )}
                </div>

                {!isGuest && (
                    <button
                        onClick={onToggleStock}
                        className={`p-2 rounded-full transition-colors hover:bg-poe-surface2 poe-focus-ring ${item.inStock ? 'text-poe-success' : 'text-poe-text2'}`}
                        title="Toggle Stock"
                    >
                        <i className={`fas fa-toggle-${item.inStock ? 'on' : 'off'} text-xl`}></i>
                    </button>
                )}
            </div>
        </div>
    );
};

export default StashItemCard;
