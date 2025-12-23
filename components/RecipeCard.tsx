

import React, { useState, useEffect } from 'react';
import { GeneratedRecipe, ImageSize, AspectRatio, RecipeRecord, Difficulty } from '../types';
import { Language, translations } from '../locales/translations';
import { storageService } from '../services/storageService';

interface Props {
  recipe: GeneratedRecipe | RecipeRecord;
  dishImage: string | null;
  setDishImage: React.Dispatch<React.SetStateAction<string | null>>;
  lang: Language;
  onSaved?: () => void;
}

const RecipeCard: React.FC<Props> = ({ recipe: initialRecipe, dishImage, setDishImage, lang, onSaved }) => {
  const t = translations[lang];
  const [recipe, setRecipe] = useState(initialRecipe);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaved, setIsSaved] = useState((initialRecipe as RecipeRecord).isFavorite || false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const isDev = process.env.NODE_ENV === 'development';
  const originalLanguage = (recipe as RecipeRecord).language || 'en';
  const showTranslate = originalLanguage !== lang;

  useEffect(() => {
    setRecipe(initialRecipe);
  }, [initialRecipe]);

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const data = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeName: recipe.recipe_title,
          size: ImageSize.S1K,
          ratio: AspectRatio.A1_1
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Image generation failed');
        return res.json();
      });
      setDishImage(data.imageUrl);
    } catch (err: any) {
      console.error("Image generation error:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      const translated = await fetch('/api/recipe/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe,
          targetLanguage: lang
        })
      }).then(res => res.json());

      // Preserve ID and other metadata, just update text fields
      setRecipe(prev => ({ ...prev, ...translated }));
    } catch (err) {
      console.error("Translation failed", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    const record: RecipeRecord = {
      ...recipe,
      id: (recipe as RecipeRecord).id || Date.now().toString(),
      isFavorite: false,
      createdAt: (recipe as RecipeRecord).createdAt || Date.now(),
      dishImage: dishImage,
      language: showTranslate ? lang : originalLanguage // Save as new language if translated? Or keep original? User said "generate translated". I'll assume we keep current state.
    };
    await storageService.saveRecipe(record);
    setIsSaved(true);
    if (onSaved) onSaved();
  };

  const handleShare = (platform: 'whatsapp' | 'telegram' | 'email' | 'copy') => {
    const list = recipe.shopping_list.join('\n- ');
    const text = `*${t.shopping_list_title} ${recipe.recipe_title}*\n\n- ${list}`;
    const encodedText = encodeURIComponent(text);

    switch (platform) {
      case 'whatsapp': window.open(`https://wa.me/?text=${encodedText}`, '_blank'); break;
      case 'telegram': window.open(`https://t.me/share/url?url=${encodedText}`, '_blank'); break;
      case 'email': window.location.href = `mailto:?subject=${recipe.recipe_title}&body=${encodedText}`; break;
      case 'copy':
        navigator.clipboard.writeText(text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
        break;
    }
    setShowShareMenu(false);
  };

  return (
    <article className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-700">
      {/* Dynamic Header Area */}
      <div className="relative min-h-[500px] bg-slate-900 flex flex-col items-center justify-end pb-16 pt-24 px-6 md:px-10">
        {dishImage && (
          <img
            src={dishImage}
            alt={recipe.recipe_title}
            className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-1000"
          />
        )}

        {/* Title and Info Overlay (Persistent) */}
        <div className="relative z-10 text-center space-y-6 max-w-3xl w-full mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="inline-flex px-3 py-1 bg-white/10 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
              {isGeneratingImage ? t.generating_photo : t.recipe_suggestion}
            </div>
            {/* Difficulty Badge */}
            <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 text-white ${recipe.difficulty === 'easy' ? 'bg-green-500/80' :
                recipe.difficulty === 'intermediate' ? 'bg-yellow-500/80' :
                  recipe.difficulty === 'chef' ? 'bg-slate-900 border-indigo-500/50' : 'bg-red-500/80'
              }`}>
              {recipe.difficulty === 'chef' ? <><i className="fas fa-hat-chef mr-1"></i> CHEF</> : recipe.difficulty}
            </div>
            {/* Translate Button */}
            {showTranslate && (
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="inline-flex px-3 py-1 bg-indigo-600/80 hover:bg-indigo-500 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 transition-colors"
              >
                {isTranslating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-language mr-2"></i>}
                {t.translate_to_portuguese || "Translate"}
              </button>
            )}
          </div>

          <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl">
            {recipe.recipe_title}
          </h3>

          {/* Improved readability for reasoning text */}
          <div className="bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
            <p className="text-slate-100 text-base md:text-lg font-medium leading-relaxed drop-shadow-md">
              {recipe.match_reasoning}
            </p>
          </div>

          <div className="pt-4 flex gap-4 justify-center flex-wrap">
            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
              className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all text-xs uppercase shadow-2xl flex items-center gap-3 group"
            >
              {isGeneratingImage ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-magic group-hover:rotate-12 transition-transform"></i>}
              {isGeneratingImage ? t.generating_photo : t.generate_photo}
            </button>
          </div>
        </div>

        {/* Persistent Dark Gradient for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/60 opacity-90 pointer-events-none -z-0"></div>

        <div className="absolute top-8 right-8 z-20">
          <button
            disabled={isSaved}
            onClick={handleSave}
            className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-2xl transition-all tracking-widest ${isSaved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {isSaved ? <><i className="fas fa-check mr-2"></i>Saved</> : t.save_recipe}
          </button>
        </div>
      </div>

      <div className="p-8 md:p-14">
        {isDev && (
          <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl mb-12">
            <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
              <i className="fas fa-terminal"></i> {t.auditor_log}
            </h4>
            <p className="text-slate-600 text-sm italic font-medium">"{recipe.analysis_log}"</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-5 space-y-12">
            <div>
              <h4 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
                <i className="fas fa-shopping-basket text-amber-500"></i>
                {t.from_pantry}
              </h4>
              <ul className="space-y-3">
                {recipe.ingredients_from_pantry.map((ing, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-sm font-bold">
                    <i className="fas fa-check-circle text-emerald-500"></i>
                    <span>{ing}</span>
                    {/* Visual cue that it's in pantry */}
                    <span className="ml-auto text-[10px] uppercase bg-white px-2 py-1 rounded-full text-emerald-600 border border-emerald-200">In Pantry</span>
                  </li>
                ))}
              </ul>
            </div>

            {recipe.shopping_list.length > 0 && (
              <div className="bg-orange-50/30 p-8 rounded-[2rem] border-2 border-dashed border-orange-200 relative">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-black text-orange-900 flex items-center gap-3">
                    <i className="fas fa-cart-plus"></i>
                    {t.to_buy}
                  </h4>

                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="w-10 h-10 bg-white border border-orange-200 text-orange-600 rounded-xl flex items-center justify-center hover:bg-orange-100 transition-all shadow-sm"
                    >
                      <i className="fas fa-share-alt"></i>
                    </button>

                    {showShareMenu && (
                      <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-30 animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-3 p-4 hover:bg-emerald-50 rounded-xl text-xs font-black text-slate-700 transition-colors">
                          <i className="fab fa-whatsapp text-emerald-500 text-lg"></i> {t.whatsapp}
                        </button>
                        <button onClick={() => handleShare('telegram')} className="w-full flex items-center gap-3 p-4 hover:bg-sky-50 rounded-xl text-xs font-black text-slate-700 transition-colors">
                          <i className="fab fa-telegram text-sky-500 text-lg"></i> {t.telegram}
                        </button>
                        <button onClick={() => handleShare('copy')} className="w-full flex items-center gap-3 p-4 hover:bg-indigo-50 rounded-xl text-xs font-black text-indigo-600 transition-colors">
                          <i className="fas fa-copy text-lg"></i> {copyFeedback ? t.copied : t.copy_clipboard}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-3">
                  {recipe.shopping_list.map((ing, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-orange-800 text-sm font-bold">
                      <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="md:col-span-7">
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-10">
              <i className="fas fa-list-ol text-indigo-500"></i>
              {t.step_by_step}
            </h4>
            <div className="space-y-12 relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
              {recipe.step_by_step.map((step, idx) => (
                <div key={idx} className="relative pl-14">
                  <div className="absolute left-0 w-8 h-8 bg-white border-4 border-indigo-500 rounded-full flex items-center justify-center font-black text-xs text-indigo-600 z-10 shadow-lg">{idx + 1}</div>
                  <p className="text-slate-700 text-lg leading-relaxed font-medium pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default RecipeCard;
