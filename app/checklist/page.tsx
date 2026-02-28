'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { storageService } from '@/services/storageService';
import { BuildItem, BuildItemStatus } from '@/types';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useTranslation } from '@/hooks/useTranslation';

export default function ChecklistPage() {
    const { isGuest } = useCurrentMember();
    const { t, lang } = useTranslation();
    const isPtBr = String(lang || '').toLowerCase().startsWith('pt');
    const fallbackLabels = useMemo(
        () => ({
            pending: isPtBr ? 'Pendente' : 'Pending',
            completed: isPtBr ? 'Concluído' : 'Completed',
            reopen: isPtBr ? 'Reabrir' : 'Reopen',
            markAsBought: isPtBr ? 'Marcar como Concluído' : 'Mark as Completed',
            emptyCompleted: isPtBr ? 'Nenhum item concluído na checklist ainda.' : 'No completed checklist items yet.',
        }),
        [isPtBr],
    );

    const [items, setItems] = useState<BuildItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [loading, setLoading] = useState(true);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // UI State
    const [statusTab, setStatusTab] = useState<BuildItemStatus>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'recipe'>('all');
    const [selectedBuildId, setSelectedBuildId] = useState<string>('all');

    const pendingItems = useMemo(
        () => items.filter((item) => !item.checked),
        [items],
    );
    const completedItems = useMemo(
        () => items.filter((item) => item.checked),
        [items],
    );
    const activeItems = statusTab === 'pending' ? pendingItems : completedItems;
    const pendingCount = pendingItems.length;
    const completedCount = completedItems.length;

    // Get unique builds from active tab items.
    const uniqueBuilds = useMemo(
        () => Array.from(new Map(
            activeItems.flatMap((item) => item.recipeItems?.map((ri) => [ri.recipe.id, ri.recipe]) || []),
        ).values()),
        [activeItems],
    );

    useEffect(() => {
        loadList();
    }, []);

    useEffect(() => {
        setSelectedBuildId('all');
    }, [statusTab]);

    const loadList = async () => {
        try {
            const list = await storageService.getBuildItems({ status: 'all' });
            setItems(list);
        } catch (err) {
            console.error("Failed to load checklist items", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        try {
            await storageService.addBuildItem(newItemName);
            setNewItemName('');
            await loadList();
        } catch (err) {
            console.error("Failed to add item", err);
        }
    };

    const handleToggleCheck = async (item: BuildItem) => {
        try {
            // Optimistic update
            const newChecked = !item.checked;
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: newChecked } : i));

            await storageService.updateBuildItem(item.id, { checked: newChecked });
        } catch (err) {
            console.error(err);
            // Revert on error
            loadList();
        }
    };

    const handleRemove = async (id: string) => {
        try {
            setItems(prev => prev.filter(i => i.id !== id));
            await storageService.deleteBuildItem(id);
        } catch (err) {
            console.error(err);
            loadList();
        }
    };

    const handleClearList = async () => {
        try {
            // Optimistically remove pending items only from the local view.
            setItems((prev) => prev.filter((item) => item.checked));
            setShowClearConfirm(false);

            await storageService.clearBuildItems();
            await loadList(); // Reload to see if anything remained (e.g. failures or server logic)
        } catch (err) {
            console.error(err);
            loadList(); // Revert
            alert(t('common.error'));
        }
    };


    const filteredItems = activeItems.filter(item => {
        // Search
        if (searchQuery) {
            if (!item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        }

        // Source Filter
        if (sourceFilter === 'manual') {
            return (!item.recipeItems || item.recipeItems.length === 0);
        }
        if (sourceFilter === 'recipe') {
            if (selectedBuildId !== 'all') {
                return item.recipeItems?.some((ri: any) => ri.recipe.id === selectedBuildId);
            }
            return (item.recipeItems && item.recipeItems.length > 0);
        }

        return true;
    });



    return (
        <>
            <main className="max-w-7xl mx-auto px-4 pt-6 pb-32 space-y-6 animate-in fade-in duration-500">
                <header className="flex items-start justify-between mb-8">
                    <div className="poe-section-marker poe-section-checklist flex-1 mr-4">
                        <div className="flex items-center gap-3 mb-2">
                            <i className="fas fa-list-check text-poe-sectionChecklist text-xl"></i>
                            <h1 className="text-3xl font-black poe-title tracking-tight">{t('shopping.title')}</h1>
                        </div>
                        <p className="poe-text-muted font-medium">{t('shopping.subtitle') || t('nav.shopping')}</p>
                    </div>
                    {!isGuest && statusTab === 'pending' && pendingCount > 0 && (
                        <button
                            onClick={() => setShowClearConfirm(true)}
                            className="text-xs font-bold text-poe-danger hover:brightness-110 poe-status-danger px-4 py-2 rounded-xl transition-colors flex items-center gap-2 poe-focus-ring"
                        >
                            <i className="fas fa-trash-alt"></i>
                            {t('shopping.clearAll')}
                        </button>
                    )}
                </header>
                {loading ? (
                    <div className="text-center py-20 text-poe-text2 font-bold animate-pulse">{t('shopping.loading')}</div>
                ) : (
                    <>
                        <div className="space-y-4 mb-6">
                            <div className="flex p-1 poe-surface rounded-xl">
                                <button
                                    onClick={() => setStatusTab('pending')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all poe-focus-ring ${statusTab === 'pending' ? 'poe-accent-checklist-soft' : 'text-poe-text2 hover:text-poe-text1'}`}
                                >
                                    {t('shopping.pendingTab') || fallbackLabels.pending} ({pendingCount})
                                </button>
                                <button
                                    onClick={() => setStatusTab('completed')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all poe-focus-ring ${statusTab === 'completed' ? 'poe-accent-settings-soft' : 'text-poe-text2 hover:text-poe-text1'}`}
                                >
                                    {t('shopping.completedTab') || fallbackLabels.completed} ({completedCount})
                                </button>
                            </div>

                            <div className="text-xs font-semibold text-poe-text2 poe-card px-3 py-2 rounded-lg space-y-1">
                                <p>
                                    <span className="font-black text-poe-sectionChecklist mr-1">{t('shopping.statusPending') || fallbackLabels.pending}:</span>
                                    {t('shopping.pendingHelp') || 'Items still needed for your builds.'}
                                </p>
                                <p>
                                    <span className="font-black text-poe-sectionSettings mr-1">{t('shopping.statusCompleted') || fallbackLabels.completed}:</span>
                                    {t('shopping.completedHelp') || 'Items already acquired/checked.'}
                                </p>
                            </div>

                            {/* Search */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-poe-text2"></i>
                                    <input
                                        type="text"
                                        placeholder={t('shopping.searchPlaceholder') || 'Search checklist...'}
                                        className="w-full pl-10 pr-4 py-3 poe-input poe-focus-ring rounded-xl font-bold transition-colors"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex p-1 poe-surface rounded-xl">
                                <button
                                    onClick={() => setSourceFilter('all')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all poe-focus-ring ${sourceFilter === 'all' ? 'bg-poe-surface2 text-poe-text1 border border-poe-borderStrong' : 'text-poe-text2 hover:text-poe-text1'}`}
                                >
                                    {t('shopping.filterAll') || 'All'}
                                </button>
                                <button
                                    onClick={() => setSourceFilter('manual')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all poe-focus-ring ${sourceFilter === 'manual' ? 'bg-poe-surface2 text-poe-text1 border border-poe-borderStrong' : 'text-poe-text2 hover:text-poe-text1'}`}
                                >
                                    {t('shopping.filterMyList') || 'My Checklist'}
                                </button>
                                <button
                                    onClick={() => setSourceFilter('recipe')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all poe-focus-ring ${sourceFilter === 'recipe' ? 'bg-poe-surface2 text-poe-text1 border border-poe-borderStrong' : 'text-poe-text2 hover:text-poe-text1'}`}
                                >
                                    {t('shopping.filterRecipes') || 'Builds'}
                                </button>
                            </div>

                            {/* Specific Build Filter Dropdown */}
                            {sourceFilter === 'recipe' && uniqueBuilds.length > 0 && (
                                <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                                    <select
                                        value={selectedBuildId}
                                        onChange={(e) => setSelectedBuildId(e.target.value)}
                                        className="w-full p-2 poe-select poe-focus-ring rounded-xl text-sm font-bold"
                                    >
                                        <option value="all">{t('shopping.allRecipes') || 'All Builds'}</option>
                                        {uniqueBuilds.map((build: any) => (
                                            <option key={build.id} value={build.id}>
                                                {build.recipe_title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Add Item Form (Pending only + show on all/manual source filters) */}
                            {!isGuest && statusTab === 'pending' && (sourceFilter === 'all' || sourceFilter === 'manual') && (
                                <form onSubmit={handleAddItem} className="poe-card p-2 rounded-2xl shadow-sm border border-poe-borderStrong flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={t('shopping.addItem')}
                                        className="flex-1 poe-input poe-focus-ring px-4 font-bold rounded-xl"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                    />
                                    <button type="submit" disabled={!newItemName.trim()} className="w-10 h-10 poe-btn-primary poe-focus-ring rounded-xl flex items-center justify-center shadow-lg shadow-black/30 hover:scale-105 transition-transform">
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </form>
                            )}
                        </div>

                        {isGuest && (
                            <div className="text-center mb-4 p-4 poe-card rounded-2xl text-poe-text2 text-sm font-bold">
                                {t('shopping.readOnly')}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredItems.length === 0 && (
                                <div className="col-span-full text-center py-20 opacity-50">
                                    <i className="fas fa-gem text-4xl mb-4 text-poe-text2"></i>
                                    <p className="font-bold text-poe-text2">
                                        {activeItems.length === 0
                                            ? (statusTab === 'pending'
                                                ? (t('shopping.emptyPending') || t('shopping.empty'))
                                                : (t('shopping.emptyCompleted') || fallbackLabels.emptyCompleted))
                                            : (t('shopping.noResults') || 'No items found')}
                                    </p>
                                </div>
                            )}

                            {filteredItems.map((item: any) => (
                                <div key={item.id} className="poe-card p-4 rounded-2xl border border-poe-borderStrong shadow-sm flex flex-col gap-3 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {!isGuest && (
                                                <button
                                                    onClick={() => handleToggleCheck(item)}
                                                    title={item.checked ? (t('shopping.reopenItem') || fallbackLabels.reopen) : (t('shopping.markAsBought') || fallbackLabels.markAsBought)}
                                                    aria-label={item.checked ? (t('shopping.reopenItem') || fallbackLabels.reopen) : (t('shopping.markAsBought') || fallbackLabels.markAsBought)}
                                                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors cursor-pointer poe-focus-ring ${item.checked ? 'bg-poe-sectionSettings text-poe-bg0 border-poe-sectionSettings' : 'border-poe-border hover:border-poe-sectionChecklist'}`}
                                                >
                                                    {item.checked ? <i className="fas fa-rotate-left text-xs"></i> : <i className="fas fa-check text-xs"></i>}
                                                </button>
                                            )}
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <p className={`font-bold transition-all ${item.checked ? 'text-poe-text2 line-through' : 'text-poe-text1'}`}>{item.name}</p>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${item.checked ? 'poe-status-success' : 'poe-status-warning'}`}>
                                                        {item.checked
                                                            ? (t('shopping.statusCompleted') || fallbackLabels.completed)
                                                            : (t('shopping.statusPending') || fallbackLabels.pending)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {!isGuest && (
                                            <button
                                                onClick={() => handleRemove(item.id)}
                                                className="text-poe-text2 hover:text-poe-danger transition-colors opacity-0 group-hover:opacity-100 px-2 poe-focus-ring rounded-lg"
                                                title={t('common.delete')}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>

                                    {/* Item Badges/Context */}
                                    {(item.pantryItem || (item.recipeItems && item.recipeItems.length > 0)) && (
                                        <div className="flex flex-wrap gap-2 pl-10">
                                            {item.pantryItem && (
                                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full poe-accent-stash-soft">
                                                    <i className="fas fa-box-open mr-1"></i>
                                                    {t('shopping.fromPantry')}
                                                </span>
                                            )}
                                            {item.recipeItems?.map((ri: any) => (
                                                <a
                                                    key={ri.recipe.id}
                                                    href={`/builds/${ri.recipe.id}`}
                                                    className="text-[10px] lowercase font-bold px-2 py-0.5 rounded-full poe-accent-builds-soft hover:brightness-110 transition-colors"
                                                    title={ri.recipe.recipe_title}
                                                >
                                                    <i className="fas fa-scroll mr-1"></i>
                                                    {ri.recipe.recipe_title.length > 20 ? ri.recipe.recipe_title.substring(0, 20) + '...' : ri.recipe.recipe_title}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>

            {/* Clear Confirmation Dialog */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="poe-surface rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-poe-borderStrong">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 poe-status-danger rounded-full flex items-center justify-center mx-auto text-xl mb-4">
                                <i className="fas fa-trash-alt"></i>
                            </div>
                            <h3 className="text-xl font-black poe-title">{t('shopping.clearConfirmTitle')}</h3>
                            <p className="text-poe-text2 text-sm font-medium">{t('shopping.clearConfirmDesc')}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 py-3 text-poe-text1 font-bold poe-card hover:brightness-110 rounded-xl transition-colors poe-focus-ring"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleClearList}
                                className="flex-1 py-3 font-bold poe-btn-danger rounded-xl transition-colors shadow-lg shadow-black/30 poe-focus-ring"
                            >
                                {t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
