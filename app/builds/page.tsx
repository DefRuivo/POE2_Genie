"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BuildArchiveSection from '@/components/BuildArchiveSection';

import { storageService } from '@/services/storageService';
import { BuildRecord } from '@/types';

import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useTranslation } from '@/hooks/useTranslation';

export default function BuildsPage() {
    const router = useRouter();
    const { t, lang } = useTranslation();
    const { isGuest } = useCurrentMember();
    const [history, setHistory] = useState<BuildRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        storageService.getAllBuilds(lang).then(setHistory);
    }, [lang]);

    const refreshHistory = async () => {
        const data = await storageService.getAllBuilds(lang);
        setHistory(data);
    };

    const filteredHistory = history.filter(recipe => {
        const term = searchTerm.toLowerCase();
        const buildTitle = String(recipe.build_title || recipe.recipe_title || '');
        const gearGems = Array.isArray(recipe.gear_gems) ? recipe.gear_gems : recipe.ingredients_from_pantry;
        const buildItems = Array.isArray(recipe.build_items) ? recipe.build_items : recipe.shopping_list;
        const titleMatch = buildTitle.toLowerCase().includes(term);
        const ingredientsMatch = Array.isArray(gearGems) &&
            gearGems.some((ing: any) => {
                const name = typeof ing === 'string' ? ing : (ing?.name || '');
                return name.toLowerCase().includes(term);
            });

        const shoppingMatch = Array.isArray(buildItems) &&
            buildItems.some((ing: any) => {
                const name = typeof ing === 'string' ? ing : (ing?.name || '');
                return name.toLowerCase().includes(term);
            });

        return titleMatch || ingredientsMatch || shoppingMatch;
    });

    return (
        <main className="max-w-7xl mx-auto px-4 pt-6 pb-32 space-y-6 animate-in fade-in duration-500">

            {/* Standard Page Header */}
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('recipes.title')}</h1>
                <p className="text-slate-500 font-medium">{t('recipes.subtitle')}</p>
            </header>

            {/* Search Bar */}
            <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                    type="text"
                    placeholder={t('recipes.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                />
            </div>

            <div className="flex justify-end gap-4">
                {!isGuest && (
                    <button
                        onClick={() => router.push('/builds/craft')}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-xl font-bold transition-colors"
                    >
                        <i className="fas fa-wand-magic-sparkles"></i> {t('actions.generateTitle')}
                    </button>
                )}
                <button
                    onClick={() => router.push('/builds/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl font-bold transition-colors"
                >
                    <i className="fas fa-plus"></i> {t('recipes.createCustom')}
                </button>
            </div>

            {filteredHistory.length > 0 ? (
                <BuildArchiveSection
                    history={filteredHistory}
                    onUpdate={refreshHistory}
                    onViewRecipe={(recipe) => router.push(`/builds/${recipe.id}`)}
                    isGuest={isGuest}
                />
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-rose-500">
                        <i className="fas fa-search"></i>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">{t('recipes.noResults')}</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">
                        {searchTerm ? t('recipes.noResultsSearch').replace('{term}', searchTerm) : t('recipes.empty')}
                    </p>
                    {!searchTerm && !isGuest && (
                        <button
                            onClick={() => router.push('/builds/craft')}
                            className="mt-6 px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors"
                        >
                            {t('actions.generateTitle')}
                        </button>
                    )}
                </div>
            )}
        </main>
    );
}
