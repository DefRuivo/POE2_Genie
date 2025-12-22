
import React, { useState } from 'react';
import { GeneratedRecipe, ImageSize, AspectRatio } from '../types';
import { generateDishImage } from '../services/geminiService';
import { Language, translations } from '../locales/translations';

interface Props {
  recipe: GeneratedRecipe;
  dishImage: string | null;
  setDishImage: React.Dispatch<React.SetStateAction<string | null>>;
  lang: Language;
}

const RecipeCard: React.FC<Props> = ({ recipe, dishImage, setDishImage, lang }) => {
  const t = translations[lang];
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imgSize, setImgSize] = useState<ImageSize>(ImageSize.S1K);
  const [imgRatio, setImgRatio] = useState<AspectRatio>(AspectRatio.A1_1);

  /**
   * Triggers the AI Image generation process for the current recipe.
   */
  const handleGenerateImage = async () => {
    // Check if the user has an API key selected if running in AI Studio environment.
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }

    setIsGeneratingImage(true);
    try {
      const img = await generateDishImage(recipe.recipe_title, imgSize, imgRatio);
      setDishImage(img);
    } catch (err: any) {
      console.error("Failed to generate image:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <article className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-700">
      {/* Visual Header Section */}
      <div className="relative min-h-[350px] bg-slate-900 overflow-hidden flex flex-col items-center justify-center">
        {dishImage ? (
          <img src={dishImage} alt={recipe.recipe_title} className="w-full h-[450px] object-cover opacity-90 transition-opacity duration-1000" />
        ) : (
          <div className="p-10 text-center space-y-6 z-10">
            <div className="inline-flex px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
              {t.recipe_suggestion}
            </div>
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">{recipe.recipe_title}</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">{recipe.match_reasoning}</p>
            
            <div className="pt-6 flex flex-wrap gap-4 items-center justify-center">
              <button 
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black hover:bg-indigo-50 transition-all text-xs uppercase shadow-xl flex items-center gap-2"
              >
                {isGeneratingImage ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-camera-retro"></i>}
                {isGeneratingImage ? t.generating_photo : t.generate_photo}
              </button>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
      </div>

      <div className="p-8 md:p-14">
        {/* Safety Badges and Tags */}
        <div className="flex flex-wrap gap-4 mb-10">
          {recipe.safety_badge && (
            <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-200">
              <i className="fas fa-shield-check"></i>
              {t.safety_ok}
            </span>
          )}
          <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            <i className="fas fa-bolt mr-1"></i>
            {t.intelligent_chef}
          </span>
        </div>

        {/* AI Decision Reasoning log */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl mb-12">
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-1 flex items-center gap-2 text-indigo-500">
            <i className="fas fa-brain"></i>
            {t.auditor_log}
          </h4>
          <p className="text-slate-600 text-sm italic font-medium">"{recipe.analysis_log}"</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          {/* Ingredients Breakdown */}
          <div className="md:col-span-5 space-y-10">
            <div className="space-y-4">
              <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <i className="fas fa-shopping-basket text-amber-500"></i>
                {t.from_pantry}
              </h4>
              <ul className="space-y-3">
                {recipe.ingredients_from_pantry.map((ing, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-sm font-semibold">
                    <i className="fas fa-check text-emerald-500"></i> {ing}
                  </li>
                ))}
              </ul>
            </div>

            {recipe.shopping_list.length > 0 && (
              <div className="bg-orange-50/50 p-8 rounded-[2rem] border-2 border-dashed border-orange-200">
                <h4 className="text-lg font-black text-orange-900 flex items-center gap-3 mb-4">
                  <i className="fas fa-cart-plus"></i>
                  {t.to_buy}
                </h4>
                <ul className="space-y-3">
                  {recipe.shopping_list.map((ing, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-orange-800 text-sm font-bold">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      {ing}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-[10px] text-orange-400 font-bold uppercase tracking-widest">{t.essential_only}</p>
              </div>
            )}
          </div>

          {/* Cooking Instructions */}
          <div className="md:col-span-7">
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-10">
              <i className="fas fa-list-ol text-indigo-500"></i>
              {t.step_by_step}
            </h4>
            <div className="space-y-10 relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
              {recipe.step_by_step.map((step, idx) => (
                <div key={idx} className="relative pl-12">
                  <div className="absolute left-0 w-8 h-8 bg-white border-4 border-indigo-500 rounded-full flex items-center justify-center font-black text-xs text-indigo-600 z-10 shadow-sm">{idx + 1}</div>
                  <p className="text-slate-700 text-base leading-relaxed font-medium pt-1">{step}</p>
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
