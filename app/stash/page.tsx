"use client";


import StashSection from '@/components/StashSection';
import { useApp } from '@/components/Providers';
import { useTranslation } from '@/hooks/useTranslation';

export default function StashPage() {
    const { t } = useTranslation();
    const { pantry, setPantry } = useApp();

    return (
        <main className="max-w-7xl mx-auto px-4 pt-6 pb-32 space-y-6 animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('pantry.title')}</h1>
                <p className="text-slate-500 font-medium">{t('pantry.subtitle')}</p>
            </header>
            
            <StashSection
                pantry={pantry}
                setPantry={setPantry}
            />
        </main>
    );

}
