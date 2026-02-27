"use client";

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/Providers';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { BuildArchetype, BuildCostTier, BuildRecord, BuildSessionContext } from '@/types';
import { storageService } from '@/services/storageService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function CraftBuildPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const {
        members,
        pantry,
        activeDiners, setActiveDiners,
        costTier, setCostTier,
        prepTime,
        language
    } = useApp();

    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [observation, setObservation] = useState('');
    const [buildArchetype, setBuildArchetype] = useState<BuildArchetype>('league_starter');
    const initializedRef = useRef(false);

    // Enforce role access: Mercenaries cannot craft builds
    const { isGuest, loading: memberLoading } = useCurrentMember();

    useEffect(() => {
        if (!memberLoading && isGuest) {
            router.push('/');
        }
    }, [isGuest, memberLoading, router]);

    useEffect(() => {
        // Default to Admin if no one is selected (and members are loaded)
        // We use a ref to ensure this only happens once per page load (Auto-selection)
        if (members.length > 0 && !initializedRef.current) {
            // Only auto-select if nothing is currently selected
            if (activeDiners.length === 0) {
                // Try to find ADMIN first, otherwise fallback to first member or stay empty
                const admin = members.find(m => m.role === 'ADMIN');
                if (admin) {
                    setActiveDiners([admin.id]);
                } else if (members.length > 0) {
                    // Fallback: If no Admin found (e.g. data issue), select the first member
                    setActiveDiners([members[0].id]);
                }
            }
            initializedRef.current = true;
        }
    }, [members, activeDiners, setActiveDiners]);

    const handleCraftBuild = async () => {
        if (activeDiners.length === 0) {
            setError(t('generate.selectDinersError'));
            return;
        }
        setIsGenerating(true);
        setError(null);

        try {
            const context: BuildSessionContext = {
                party_member_ids: activeDiners,
                stash_gear_gems: pantry.filter(i => i.inStock).map(i => i.name),
                requested_archetype: buildArchetype,
                cost_tier_preference: costTier,
                setup_time_preference: prepTime,
                build_notes: observation
            };

            const response = await fetch('/api/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members, context, language: language || 'en' }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const apiErrorCode = typeof errorData?.code === 'string' ? errorData.code : null;
                const apiErrorMessage = apiErrorCode === 'gemini.quota_exceeded'
                    ? t('generate.generateError')
                    : (typeof errorData?.error === 'string' ? errorData.error : null);

                const apiError = new Error(apiErrorMessage || t('generate.generateError'));
                (apiError as any).status = response.status;
                (apiError as any).code = apiErrorCode;
                (apiError as any).retryAfterSeconds = errorData?.retryAfterSeconds;

                throw apiError;
            }

            const result = await response.json();

            const newRecord: BuildRecord = {
                ...result,
                id: Date.now().toString(),
                isFavorite: false,
                createdAt: Date.now(),
                language: language || 'en'
            };

            const savedRecipe = await storageService.saveBuild(newRecord);

            // Redirect to the new build
            router.push(`/builds/${savedRecipe.id}`);

        } catch (err: any) {
            setError(err?.message || t('generate.generateError'));
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-rose-100 pb-20">
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
                        <i className="fas fa-arrow-left text-xl"></i>
                    </Link>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {t('generate.title')}
                    </h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 mt-6 space-y-6">

                {/* Who (Simplified Select) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t('generate.whoIsEating')}</label>
                    <div className="flex flex-wrap gap-2">
                        {members.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setActiveDiners(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${activeDiners.includes(m.id) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >
                                {m.name}
                            </button>
                        ))}
                        {members.length === 0 && <Link href="/party" className="text-sm text-rose-600 font-bold underline">{t('generate.addMembersFirst')}</Link>}
                    </div>
                </div>

                {/* Archetype & Cost Tier */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t('generate.mealType')}</label>
                        <div className="flex gap-2 flex-wrap">
                            {['league_starter', 'mapper', 'bossing', 'hybrid'].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setBuildArchetype(val as BuildArchetype)}
                                    className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border-2 uppercase ${buildArchetype === val ? 'bg-rose-100 border-rose-500 text-rose-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    {val === 'league_starter'
                                        ? t('recipeForm.leagueStarter')
                                        : val === 'mapper'
                                            ? t('recipeForm.mapper')
                                            : val === 'bossing'
                                                ? t('recipeForm.bossing')
                                                : t('recipeForm.hybrid')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t('generate.costs')}</label>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { value: 'cheap', label: t('recipeForm.cheap'), tooltip: t('recipeForm.costTooltipCheap') },
                                { value: 'medium', label: t('recipeForm.medium'), tooltip: t('recipeForm.costTooltipMedium') },
                                { value: 'expensive', label: t('recipeForm.expensive'), tooltip: t('recipeForm.costTooltipExpensive') },
                                { value: 'mirror_of_kalandra', label: t('recipeForm.mirrorOfKalandra'), tooltip: t('recipeForm.costTooltipMirrorOfKalandra') },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    title={option.tooltip}
                                    onClick={() => setCostTier(option.value as BuildCostTier)}
                                    className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border-2 uppercase ${costTier === option.value ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Observation */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{t('generate.specialRequests')}</label>
                    <textarea
                        value={observation}
                        onChange={e => setObservation(e.target.value)}
                        placeholder={t('generate.specialRequestsPlaceholder')}
                        className="w-full h-32 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:border-rose-500 outline-none resize-none"
                    />
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleCraftBuild}
                    disabled={isGenerating}
                    className="w-full py-6 bg-rose-600 rounded-3xl text-white font-black text-xl shadow-xl shadow-rose-200 hover:bg-rose-700 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                    {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                    {isGenerating ? t('generate.generating') : t('generate.generateBtn')}
                </button>

                <div className="text-center">
                    <span className="text-slate-400 font-medium text-sm"> {t('generate.or')} </span>
                    <Link href="/builds/create" className="block mt-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-600 font-bold hover:border-slate-300 hover:bg-slate-50 transition-all">
                        <i className="fas fa-pen-to-square mr-2"></i> {t('generate.createManually')}
                    </Link>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-center border border-red-100">{error}</div>}
            </main>

            <LoadingOverlay isVisible={isGenerating} />
        </div>
    );
}
