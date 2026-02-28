
'use client';

import React, { useState, useEffect } from 'react';
import { BuildRecord } from '../types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { storageService } from '../services/storageService';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useTranslation } from '@/hooks/useTranslation';
import { ShareButtons } from './ShareButtons';
import { normalizeBuildCostTier } from '@/lib/build-contract';

import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Props {
  build?: BuildRecord;
  recipe?: BuildRecord;
  onSaved?: () => void;
}

const BuildCard: React.FC<Props> = ({ build, recipe: legacyRecipe, onSaved }) => {
  const { t, lang } = useTranslation();
  const { member, isGuest } = useCurrentMember();
  const router = useRouter();
  const initialRecipe = (build || legacyRecipe) as BuildRecord;
  const [recipe, setRecipe] = useState<BuildRecord>(initialRecipe);
  const [originalRecipe, setOriginalRecipe] = useState<BuildRecord | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [hasTranslated, setHasTranslated] = useState(false);
  // Initial favorite state comes from the record itself now
  const [isFavorite, setIsFavorite] = useState(initialRecipe.isFavorite);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // State for adding to stash with replenishment logic
  const [itemToAdd, setItemToAdd] = useState<string | null>(null);

  const shareMenuRef = React.useRef<HTMLDivElement>(null);

  const isDev = process.env.NODE_ENV === 'development';
  const displayTitle = recipe.build_title || recipe.recipe_title;
  const displayReasoning = recipe.build_reasoning || recipe.match_reasoning;
  const normalizedCostTier = normalizeBuildCostTier(
    recipe.build_cost_tier || recipe.build_complexity || recipe.difficulty,
  );
  const displaySetupMinutes = recipe.setup_time_minutes ?? recipe.prep_time_minutes;
  const displaySetupTime = recipe.setup_time || recipe.prep_time;
  const gearGems = Array.isArray(recipe.gear_gems) ? recipe.gear_gems : recipe.ingredients_from_pantry;
  const buildItems = Array.isArray(recipe.build_items) ? recipe.build_items : recipe.shopping_list;
  const buildSteps = Array.isArray(recipe.build_steps) ? recipe.build_steps : recipe.step_by_step;

  useEffect(() => {
    setRecipe(initialRecipe);
    setHasTranslated(false);
    setOriginalRecipe(null);
  }, [initialRecipe]);

  const handleTranslate = async () => {
    if (hasTranslated && originalRecipe) {
      // Revert
      setRecipe(originalRecipe);
      setHasTranslated(false);
      return;
    }

    if (isTranslating) return;
    setIsTranslating(true);

    try {
      const res = await fetch(`/api/builds/${recipe.id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLanguage: lang })
      });

      if (!res.ok) throw new Error('Translation failed');
      const translatedData = await res.json();

      // Check if we received a new ID (persistence logic)
      if (translatedData.id && translatedData.id !== recipe.id) {
        // Redirect to the new build
        router.push(`/builds/${translatedData.id}`);
        return;
      }

      setOriginalRecipe(recipe);
      setRecipe({ ...recipe, ...translatedData });
      setHasTranslated(true);
    } catch (err) {
      console.error(err);
      alert(t('common.error'));
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      await storageService.toggleBuildFavorite(recipe.id);
      const newStatus = !isFavorite;
      setIsFavorite(newStatus);

      // Update local recipe state too so if we translate/save image it has correct status
      setRecipe(prev => ({ ...prev, isFavorite: newStatus }));

      if (onSaved) onSaved(); // Refreshes history list in parent
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await storageService.deleteBuild(recipe.id);
      router.push('/builds');
    } catch (err) {
      console.error("Failed to delete build", err);
      alert(t('common.error'));
    }
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  const confirmAddToStash = async (rule: string) => {
    if (!itemToAdd) return;
    try {
      // Add to stash as tracked item (inStock=false since we still need to acquire it)
      await storageService.addStashItem(itemToAdd, rule, false);
      setItemToAdd(null);
    } catch (err) {
      console.error("Error adding to stash:", err);
    }
  };

  return (
    <article className="poe-card rounded-[2.5rem] shadow-2xl border border-poe-borderStrong overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-700">
      {/* Dynamic Header Area */}
      <div className="relative bg-poe-bg1 flex flex-col p-4 md:p-14 h-auto min-h-[400px] justify-center">

        {/* Persistent Dark Gradient for Readability */}
        <div className="absolute inset-0 opacity-90 pointer-events-none z-1" style={{ background: 'linear-gradient(to top, rgba(15, 14, 13, 0.96) 0%, rgba(15, 14, 13, 0.45) 45%, rgba(15, 14, 13, 0.68) 100%)' }}></div>

        {/* Background Image */}
        {recipe.image_base64 && (
          <Image
            src={recipe.image_base64}
            alt={displayTitle}
            data-testid="recipe-bg-image"
            fill
            className="object-cover z-0"
          />
        )}

        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-10">

          {/* Top Bar: Badges & Actions */}
          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="inline-flex px-3 py-1 bg-white/10 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                {t('recipeCard.todaysSuggestion')}
              </div>
              <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 text-white ${
                normalizedCostTier === 'medium'
                  ? 'bg-poe-warning'
                  : normalizedCostTier === 'mirror_of_kalandra'
                    ? 'bg-poe-surface1 border-poe-sectionBuilds'
                    : normalizedCostTier === 'cheap'
                      ? 'bg-poe-success'
                      : 'bg-poe-danger'
              }`}>
                {normalizedCostTier === 'mirror_of_kalandra'
                  ? <><i className="fas fa-crown mr-1"></i> {t('recipeForm.mirrorOfKalandra')}</>
                  : normalizedCostTier === 'cheap'
                    ? t('recipeForm.cheap')
                    : normalizedCostTier === 'medium'
                      ? t('recipeForm.medium')
                      : t('recipeForm.expensive')}
              </div>
              <div className="inline-flex px-3 py-1 bg-white/10 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                <i className="fas fa-clock mr-1"></i> {displaySetupMinutes ? `${displaySetupMinutes} min` : displaySetupTime}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {member?.role === 'ADMIN' && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-10 h-10 rounded-xl poe-card border border-poe-danger text-poe-danger flex items-center justify-center hover:bg-poe-surface2 transition-colors shadow-lg poe-focus-ring"
                  title={t('recipes.delete')}
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              )}
              {!isGuest && (
                <Link
                  href={`/builds/${recipe.id}/edit`}
                  className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-2xl transition-all tracking-widest poe-card text-poe-text1 hover:bg-poe-surface2 border border-poe-borderStrong poe-focus-ring"
                >
                  <i className="fas fa-edit mr-2"></i> {t('recipeCard.edit')}
                </Link>
              )}
              {/* Translate Button */}
              {((recipe.language && recipe.language !== lang) || hasTranslated) && (
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg transition-all tracking-widest poe-accent-settings-soft hover:brightness-110 poe-focus-ring"
                >
                  {isTranslating ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i> {t('recipeCard.translating')}</>
                  ) : hasTranslated ? (
                    <><i className="fas fa-undo mr-2"></i> {t('recipeCard.showOriginal')}</>
                  ) : (
                    <><i className="fas fa-language mr-2"></i> {t('recipeCard.translate')}</>
                  )}
                </button>
              )}
              <button
                onClick={toggleFavorite}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-2xl transition-all tracking-widest poe-focus-ring ${isFavorite ? 'poe-btn-danger' : 'poe-btn-secondary'}`}
              >
                {isFavorite ? (
                  <><i className="fas fa-heart-broken mr-2"></i>{t('recipeCard.unfavorite')}</>
                ) : (
                  <><i className="fas fa-heart mr-2"></i>{t('recipeCard.favorite')}</>
                )}
              </button>
            </div>
          </div>

          {/* Main Title & Description */}
          <div className="text-center space-y-4">
            <h3 className="text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl">
              {displayTitle}
            </h3>

            <div className="bg-poe-surface1 p-4 md:p-10 rounded-3xl border border-poe-borderStrong max-w-3xl mx-auto shadow-xl">
              <p className="text-poe-text1 text-lg md:text-xl font-medium leading-relaxed">
                {displayReasoning}
              </p>
            </div>
          </div>

        </div>
      </div>

      <div className="p-4 md:p-14">
        {isDev && (
          <div className="poe-card border border-poe-border p-4 rounded-3xl mb-12">
            <h4 className="font-black text-poe-text2 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
              <i className="fas fa-terminal"></i> Auditor Log (Dev Only)
            </h4>
            <p className="text-poe-text2 text-sm italic font-medium">{recipe.analysis_log}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4 space-y-12">
            <div>
              <h4 className="text-xl font-black text-poe-text1 flex items-center gap-3 mb-6">
                <i className="fas fa-shopping-basket text-poe-sectionStash"></i>
                {t('recipeCard.fromPantry')}
              </h4>
              <ul className="space-y-3">
                {(gearGems || []).map((rawIng, idx) => {
                  const ing = (() => {
                    let item = typeof rawIng === 'string' ? (() => {
                      try {
                        const parsed = JSON.parse(rawIng);
                        return typeof parsed === 'object' ? parsed : { name: rawIng };
                      } catch (e) { return { name: rawIng }; }
                    })() : rawIng;

                    // Deep parse if name is still JSON
                    if (item && typeof item.name === 'string' && item.name.startsWith('{')) {
                      try {
                        const parsedName = JSON.parse(item.name);
                        item = {
                          ...item,
                          name: parsedName.name || item.name,
                          quantity: item.quantity || parsedName.quantity || '',
                          unit: item.unit || parsedName.unit || ''
                        };
                      } catch (e) { }
                    }
                    return item;
                  })();

                  return (
                    <li key={idx} className="flex items-center gap-3 poe-status-success p-4 rounded-2xl text-sm font-bold group hover:brightness-110 transition-colors">
                      <i className="fas fa-check-circle text-poe-success"></i>
                      <div className="flex flex-col text-left">
                        {(ing.quantity || ing.unit) && (
                          <span className="text-[10px] uppercase tracking-tighter leading-none mb-0.5 opacity-80">
                            {ing.quantity} {ing.unit}
                          </span>
                        )}
                        <span className="leading-tight">{ing.name}</span>
                      </div>
                      <span className="ml-auto text-[8px] font-black uppercase poe-card px-2 py-1 rounded-full text-poe-success border border-poe-success shadow-sm opacity-60 group-hover:opacity-100 transition-opacity">{t('recipeCard.pantry')}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {(buildItems || []).length > 0 && (
              <div className="poe-card p-4 rounded-[2rem] border-2 border-dashed border-poe-sectionStash relative">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-black text-poe-sectionStash flex items-center gap-3">
                    <i className="fas fa-cart-plus"></i>
                    {t('recipeCard.toBuy')}
                  </h4>

                  <div className="flex gap-2 relative" ref={shareMenuRef}>
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="w-10 h-10 poe-card border border-poe-sectionStash text-poe-sectionStash rounded-xl flex items-center justify-center hover:bg-poe-surface2 transition-all shadow-sm poe-focus-ring"
                    >
                      <i className="fas fa-share-alt"></i>
                    </button>

                    {showShareMenu && (
                      <div className="absolute right-0 mt-2 w-52 poe-surface border border-poe-border shadow-2xl rounded-2xl p-2 z-30 animate-in fade-in zoom-in-95 duration-200">
                        <ShareButtons
                          layout="menu-items"
                          text={`*${t('recipeCard.shoppingListFor').replace('{title}', displayTitle)}*\n\n- ${(buildItems || []).map(item => `${item.quantity} ${item.unit} ${item.name}`).join('\n- ')}`}
                          url={`${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')}/builds/${recipe.id}`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-2">
                  {(buildItems || []).map((rawIng, idx) => {
                    const ing = (() => {
                      let item = typeof rawIng === 'string' ? (() => {
                        try {
                          const parsed = JSON.parse(rawIng);
                          return typeof parsed === 'object' ? parsed : { name: rawIng };
                        } catch (e) { return { name: rawIng }; }
                      })() : rawIng;

                      // Deep parse if name is still JSON
                      if (item && typeof item.name === 'string' && item.name.startsWith('{')) {
                        try {
                          const parsedName = JSON.parse(item.name);
                          item = {
                            ...item,
                            name: parsedName.name || item.name,
                            quantity: item.quantity || parsedName.quantity || '',
                            unit: item.unit || parsedName.unit || ''
                          };
                        } catch (e) { }
                      }
                      return item;
                    })();

                    return (
                      <li key={idx} className="flex items-center justify-between text-poe-text1 text-sm font-bold poe-card py-2 px-3 rounded-xl border border-poe-border shadow-sm hover:shadow-md hover:bg-poe-surface2 transition-all group/item">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {!isGuest && (
                            <button
                              onClick={() => setItemToAdd(ing.name)}
                              className="w-10 h-10 rounded-xl poe-btn-primary flex items-center justify-center shrink-0 shadow-lg shadow-black/30 hover:scale-110 active:scale-95 transition-all outline-none poe-focus-ring"
                              title={t('recipeCard.addToShoppingList')}
                            >
                              <i className="fas fa-cart-shopping text-xs"></i>
                            </button>
                          )}
                          <div className="flex flex-col min-w-0">
                            {(ing.quantity || ing.unit) && (
                              <span className="text-[10px] text-poe-sectionStash uppercase tracking-tighter leading-none mb-0.5">
                                {ing.quantity} {ing.unit}
                              </span>
                            )}
                            <span className="leading-tight pr-2">
                              {ing.name}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <h4 className="text-xl font-black text-poe-text1 flex items-center gap-3 mb-8 lg:mb-10">
              <i className="fas fa-list-ol text-poe-sectionBuilds"></i>
              {t('recipeCard.stepByStep')}
            </h4>
            <div className="space-y-12 relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-poe-border"></div>
              {(buildSteps || []).map((stepData, idx) => {
                const stepText = typeof stepData === 'string' ? stepData : (stepData as any)?.text || '';
                return (
                  <div key={idx} className="relative pl-14">
                    <div className="absolute left-0 w-8 h-8 poe-card border-4 border-poe-sectionBuilds rounded-full flex items-center justify-center font-black text-xs text-poe-sectionBuilds z-10 shadow-lg">{idx + 1}</div>
                    <p className="text-poe-text1 text-lg leading-relaxed font-medium pt-0.5">{stepText}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      {itemToAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="poe-surface rounded-3xl p-4 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-poe-borderStrong">
            <div>
              <h3 className="text-xl font-black text-poe-text1">{t('recipeCard.addToListTitle').replace('{item}', itemToAdd)}</h3>
              <p className="text-poe-text2 text-xs font-medium mt-1 uppercase tracking-wide">{t('recipeCard.trackItem')}</p>
            </div>

            <div className="grid gap-3">
              <button onClick={() => confirmAddToStash('ALWAYS')} className="p-4 rounded-xl poe-status-info font-bold hover:brightness-110 flex items-center gap-3 transition-all poe-focus-ring">
                <div className="w-8 h-8 rounded-full poe-status-info flex items-center justify-center text-poe-info"><i className="fas fa-sync"></i></div>
                <div className="text-left">
                  <div className="text-sm">{t('recipeCard.alwaysReplenish')}</div>
                  <div className="text-[10px] opacity-70">{t('recipeCard.alwaysReplenishDesc')}</div>
                </div>
              </button>
              <button onClick={() => confirmAddToStash('ONE_SHOT')} className="p-4 rounded-xl poe-status-success font-bold hover:brightness-110 flex items-center gap-3 transition-all poe-focus-ring">
                <div className="w-8 h-8 rounded-full poe-status-success flex items-center justify-center text-poe-success"><i className="fas fa-check"></i></div>
                <div className="text-left">
                  <div className="text-sm">{t('recipeCard.oneShot')}</div>
                  <div className="text-[10px] opacity-70">{t('recipeCard.oneShotDesc')}</div>
                </div>
              </button>
              <button onClick={() => confirmAddToStash('NEVER')} className="p-4 rounded-xl poe-card text-poe-text1 font-bold hover:bg-poe-surface2 flex items-center gap-3 transition-all border border-poe-border poe-focus-ring">
                <div className="w-8 h-8 rounded-full bg-poe-surface2 flex items-center justify-center text-poe-text2"><i className="fas fa-ban"></i></div>
                <div className="text-left">
                  <div className="text-sm">{t('recipeCard.justTrack')}</div>
                  <div className="text-[10px] opacity-70">{t('recipeCard.justTrackDesc')}</div>
                </div>
              </button>
            </div>

            <button onClick={() => setItemToAdd(null)} className="w-full py-3 text-poe-text2 font-bold hover:text-poe-text1 text-sm uppercase tracking-wide poe-focus-ring rounded-lg">{t('recipeCard.cancel')}</button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t('recipes.deleteTitle')}
        message={t('recipes.deleteDesc')}
      />
    </article >
  );
};

export default BuildCard;
