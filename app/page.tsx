
"use client";

import React, { useState } from 'react';
import { HouseholdMember, SessionContext, GeneratedRecipe } from '../types';
import { generateRecipe } from '../services/geminiService';
import Header from '../components/Header';
import HouseholdSection from '../components/HouseholdSection';
import PantrySection from '../components/PantrySection';
import RecipeCard from '../components/RecipeCard';
import Footer from '../components/Footer';
import { Language, translations } from '../locales/translations';

export default function Home() {
  // --- Language State ---
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  // --- Core Application State ---
  const [household, setHousehold] = useState<HouseholdMember[]>([
    { id: 'pai', name: 'Carlos', restrictions: ['Diabetes Type 2'], likes: ['Beef', 'BBQ'], dislikes: ['Cooked vegetables'] },
    { id: 'filha', name: 'Bia', restrictions: ['Vegetarian', 'Peanut Allergy'], likes: ['Pasta', 'Mushrooms'], dislikes: ['Cilantro'] }
  ]);
  const [pantry, setPantry] = useState<string[]>(['Traditional Pasta', 'Tomato Sauce', 'Sugar', 'Zucchini', 'Eggs', 'Parmesan Cheese', 'Roasted Peanuts']);
  const [activeDiners, setActiveDiners] = useState<string[]>(['pai', 'filha']);
  
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [dishImage, setDishImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Orchestrates the recipe generation flow.
   * Calls the Gemini API with the full household profile and current pantry context.
   */
  const handleGenerateRecipe = async () => {
    if (activeDiners.length === 0) {
      setError(t.select_diners_error);
      return;
    }
    setIsGenerating(true);
    setError(null);
    setRecipe(null);
    setDishImage(null);

    try {
      const context: SessionContext = {
        who_is_eating: activeDiners,
        pantry_ingredients: pantry
      };
      // Pass the current language to ensure localized AI response.
      const result = await generateRecipe(household, context, lang);
      setRecipe(result);
    } catch (err: any) {
      setError(t.generate_error);
      console.error("AI Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header lang={lang} setLang={setLang} />
      
      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {/* User Profile Configuration */}
        <HouseholdSection 
          household={household} 
          setHousehold={setHousehold} 
          activeDiners={activeDiners} 
          setActiveDiners={setActiveDiners} 
          lang={lang}
        />
        
        {/* Current Inventory Management */}
        <PantrySection 
          pantry={pantry} 
          setPantry={setPantry} 
          lang={lang}
        />

        {/* Action Trigger */}
        <div className="flex flex-col items-center gap-4 py-4">
          <button 
            disabled={isGenerating || activeDiners.length === 0}
            onClick={handleGenerateRecipe}
            className={`w-full md:w-auto px-16 py-5 rounded-3xl text-xl font-black transition-all flex items-center justify-center gap-4 btn-primary group`}
          >
            {isGenerating ? (
              <>
                <i className="fas fa-brain fa-spin"></i>
                {t.generating_btn}
              </>
            ) : (
              <>
                <i className="fas fa-hat-chef group-hover:rotate-12 transition-transform"></i>
                {t.generate_btn}
              </>
            )}
          </button>
          {error && (
            <div className="bg-red-50 px-6 py-3 rounded-2xl border border-red-200 text-red-600 font-bold text-xs uppercase tracking-wider animate-bounce">
              {error}
            </div>
          )}
        </div>

        {/* Output Area */}
        {recipe && (
          <RecipeCard 
            recipe={recipe} 
            dishImage={dishImage} 
            setDishImage={setDishImage} 
            lang={lang}
          />
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}
