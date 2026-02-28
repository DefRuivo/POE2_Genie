
'use client';

import React from 'react';
import { BuildRecord } from '../types';
import { storageService } from '../services/storageService';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  history: BuildRecord[];
  onUpdate: () => void;
  onViewRecipe?: (recipe: BuildRecord) => void;
  isGuest?: boolean;
}

const BuildArchiveSection: React.FC<Props> = ({ history, onUpdate, onViewRecipe, isGuest }) => {
  const { t } = useTranslation();

  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);

  const toggleFavorite = async (id: string) => {
    await storageService.toggleBuildFavorite(id);
    onUpdate();
  };

  const requestDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await storageService.deleteBuild(itemToDelete);
      setItemToDelete(null);
      onUpdate();
    }
  };

  if (history.length === 0) return null;

  const resolveArchetype = (record: BuildRecord) => {
    const raw = String(record.build_archetype || record.meal_type || '').toLowerCase().trim();
    if (raw === 'league_starter' || raw === 'main' || raw === 'main course' || raw === 'maincourse') {
      return 'league_starter';
    }
    if (raw === 'mapper' || raw === 'appetizer' || raw === 'starter') {
      return 'mapper';
    }
    if (raw === 'bossing' || raw === 'dessert') {
      return 'bossing';
    }
    if (raw === 'hybrid' || raw === 'snack') {
      return 'hybrid';
    }
    return raw;
  };

  return (
    <section className="poe-card poe-section-marker poe-section-builds rounded-[2.5rem] p-8 md:p-10 border border-poe-borderStrong">
      <h2 className="text-2xl font-black poe-title mb-8 flex items-center gap-3">
        <i className="fas fa-book-open text-poe-sectionBuilds"></i>
        {t('nav.recipes')}
      </h2>

      {/* Grid: 1 col on mobile, 3 cols on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {history.map(recipe => (
          <div
            key={recipe.id}
            className="poe-card rounded-[2rem] p-5 shadow-sm border border-poe-borderStrong flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            {/* Image Area */}
            <div
              className={`relative h-48 rounded-2xl overflow-hidden mb-5 cursor-pointer bg-poe-bg1 flex items-center justify-center border border-poe-border`}
              onClick={() => onViewRecipe?.(recipe)}
            >
              <i className="fas fa-scroll text-poe-borderStrong text-5xl"></i>

              {/* Favorite Button */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                className={`absolute top-4 right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all poe-focus-ring ${recipe.isFavorite ? 'poe-btn-danger' : 'poe-card text-poe-text2 hover:text-poe-sectionBuilds'}`}
              >
                <i className={`fas fa-heart ${recipe.isFavorite ? '' : 'far'} text-lg`}></i>
              </button>
            </div>

            {/* Content Area */}
            <div
              className="flex-1 cursor-pointer space-y-3 px-2"
              onClick={() => onViewRecipe?.(recipe)}
            >
              {/* Metadata Badges */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${resolveArchetype(recipe) === 'league_starter'
                    ? 'poe-accent-builds-soft'
                    : resolveArchetype(recipe) === 'mapper'
                      ? 'poe-accent-settings-soft'
                      : resolveArchetype(recipe) === 'bossing'
                        ? 'poe-status-danger'
                        : 'poe-card text-poe-text2 border-poe-border'
                    }`}>
                    {(() => {
                        const type = resolveArchetype(recipe);
                        if (type === 'league_starter') return t('recipeForm.leagueStarter');
                        if (type === 'mapper') return t('recipeForm.mapper');
                        if (type === 'bossing') return t('recipeForm.bossing');
                        if (type === 'hybrid') return t('recipeForm.hybrid');
                        return recipe.meal_type || recipe.build_archetype;
                    })()}
                  </span>
                  <span className="text-poe-text2 text-xs font-bold flex items-center gap-1">
                    <i className="far fa-calendar-alt"></i>
                    {new Date(recipe.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-poe-text2 text-xs font-bold flex items-center gap-1.5 poe-card px-2 py-1 rounded-md border border-poe-border w-fit">
                    <i className="far fa-clock text-poe-text2"></i>
                    {(recipe.setup_time_minutes ?? recipe.prep_time_minutes) ? `${recipe.setup_time_minutes ?? recipe.prep_time_minutes} min` : (recipe.setup_time || recipe.prep_time)}
                  </span>

                  {/* Available Translations Badges */}
                  {recipe.translations && recipe.translations.length > 0 && (
                    <div className="flex gap-1">
                      {recipe.translations.map(t => (
                        <span 
                          key={t.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/builds/${t.id}`;
                          }}
                          className="w-10 h-6 flex items-center justify-center poe-card rounded text-[9px] font-bold text-poe-text2 border border-poe-border hover:text-poe-sectionBuilds hover:border-poe-sectionBuilds cursor-pointer uppercase poe-focus-ring"
                          title={t.build_title || t.recipe_title}
                        >
                          {t.language === 'pt-BR' ? 'PT' : 'EN'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <h3 className="font-black text-poe-text1 text-xl md:text-2xl tracking-tight leading-snug group-hover:text-poe-sectionBuilds transition-colors">
                {recipe.build_title || recipe.recipe_title}
              </h3>

              <div className="p-4 poe-card rounded-2xl border border-poe-border">
                <p className="text-poe-text2 text-sm line-clamp-3 leading-relaxed font-medium">
                  {recipe.build_reasoning || recipe.match_reasoning}
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-8 flex justify-between items-center pt-5 border-t border-poe-border px-2">
              {!isGuest && (
                <button
                  onClick={() => requestDelete(recipe.id)}
                  className="text-poe-text2 hover:text-poe-danger text-xs font-bold transition-colors flex items-center gap-2 px-2 py-1 hover:bg-poe-surface2 rounded-lg poe-focus-ring"
                >
                  <i className="fas fa-trash"></i> {t('common.delete')}
                </button>
              )}
              {isGuest && <div></div>} {/* Spacer if delete hidden */}

              <button
                onClick={() => onViewRecipe?.(recipe)}
                className="flex items-center gap-2 px-5 py-2.5 poe-accent-builds-soft rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all poe-focus-ring"
              >
                {t('recipes.view')} <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="poe-surface rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-poe-borderStrong">
            <div className="text-center">
              <div className="w-16 h-16 poe-status-danger rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-poe-text1">{t('recipes.deleteTitle')}</h3>
              <p className="text-poe-text2 text-sm font-medium mt-2">
                {t('recipes.deleteDesc')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="py-3 px-4 poe-card text-poe-text1 font-bold rounded-xl hover:brightness-110 transition-colors poe-focus-ring"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="py-3 px-4 poe-btn-danger font-bold rounded-xl transition-colors shadow-lg shadow-black/30 poe-focus-ring"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default BuildArchiveSection;
