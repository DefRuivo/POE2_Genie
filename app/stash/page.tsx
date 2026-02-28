"use client";


import StashSection from '@/components/StashSection';
import { useApp } from '@/components/Providers';
import { useTranslation } from '@/hooks/useTranslation';
import { ICON_ACCENT_CLASS, ICON_MAP } from '@/lib/ui/icon-map';

export default function StashPage() {
    const { t } = useTranslation();
    const { pantry, setPantry } = useApp();

    return (
        <main className="max-w-7xl mx-auto px-4 pt-6 pb-32 space-y-6 animate-in fade-in duration-500">
            <header className="mb-8 poe-section-marker poe-section-stash">
                <h1 className="text-3xl font-black poe-title tracking-tight flex items-center gap-3">
                    <i className={`${ICON_MAP.stash} ${ICON_ACCENT_CLASS.stash}`}></i>
                    {t('pantry.title')}
                </h1>
                <p className="poe-text-muted font-medium">{t('pantry.subtitle')}</p>
            </header>
            
            <StashSection
                pantry={pantry}
                setPantry={setPantry}
            />
        </main>
    );

}
