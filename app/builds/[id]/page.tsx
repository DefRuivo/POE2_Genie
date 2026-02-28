"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storageService } from '@/services/storageService';
import { BuildRecord } from '@/types';
import BuildCard from '@/components/BuildCard';
import { useTranslation } from '@/hooks/useTranslation';

export default function BuildDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const [recipe, setRecipe] = useState<BuildRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            storageService.getBuildById(id as string).then(data => {
                if (data) {
                    setRecipe(data);
                }
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <i className="fas fa-circle-notch fa-spin text-4xl text-poe-sectionBuilds"></i>
            </div>
        );
    }

    if (!recipe) {
        return (
            <div className="text-center mt-20">
                <h2 className="text-2xl font-bold text-poe-text1">{t('recipeDetails.notFound')}</h2>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-6 py-2 poe-btn-primary poe-focus-ring rounded-xl"
                >
                    {t('recipeDetails.goBack')}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 mt-4 pb-10 space-y-4">
            <button
                onClick={() => router.push('/builds')}
                className="flex items-center gap-2 text-poe-text2 hover:text-poe-sectionBuilds font-bold transition-colors poe-focus-ring rounded-lg px-2 py-1"
            >
                <i className="fas fa-arrow-left"></i> {t('recipeDetails.backToRecipes')}
            </button>

            <BuildCard
                recipe={recipe}
                onSaved={async () => {
                    // In details view, onSaved might implicitly mean update? 
                    // Since it's already saved, maybe just re-fetch or no-op.
                    // But RecipeCard handles 'saved' state locally mostly for new recipes.
                    // For existing ones, it might just confirm 'Saved'.
                }}
            />
        </div>
    );
}
