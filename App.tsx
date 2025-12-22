
import React, { useState, useEffect } from 'react';
import { HouseholdMember, SessionContext, GeneratedRecipe, MealType, RecipeRecord } from './types';
import { generateRecipe } from './services/geminiService';
import Header from './components/Header';
import HouseholdSection from './components/HouseholdSection';
import PantrySection from './components/PantrySection';
import RecipeCard from './components/RecipeCard';
import HistorySection from './components/HistorySection';
import Footer from './components/Footer';
import { Language, translations } from './locales/translations';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  // --- Language State ---
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  // --- Core Application State ---
  const [household, setHousehold] = useState<HouseholdMember[]>([
    { id: 'father', name: 'Carlos', restrictions: ['Diabetes Type 2'], likes: ['Beef', 'BBQ'], dislikes: ['Cooked vegetables'] },
    { id: 'daughter', name: 'Bia', restrictions: ['Vegetarian', 'Peanut Allergy'], likes: ['Pasta', 'Mushrooms'], dislikes: ['Cilantro'] }
  ]);
  const [pantry, setPantry] = useState<string[]>(['Traditional Pasta', 'Tomato Sauce', 'Sugar', 'Zucchini', 'Eggs', 'Parmesan Cheese', 'Roasted Peanuts']);
  const [activeDiners, setActiveDiners] = useState<string[]>(['father', 'daughter']);
  const [mealType, setMealType] = useState<MealType>('main');
  
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [dishImage, setDishImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RecipeRecord[]>([]);

  // Load history on mount
  useEffect(() => {
    setHistory(storageService.getAll());
  }, []);

  /**
   * Refreshes history list from persistent storage.
   */
  const refreshHistory = () => {
    setHistory(storageService.getAll());
  };

  /**
   * Triggers the AI generation process.
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
        pantry_ingredients: pantry,
        requested_type: mealType
      };
      // Request recipe from Gemini API
      const result = await generateRecipe(household, context, lang);
      setRecipe(result);
    } catch (err: any) {
      setError(t.generate_error);
      console.error("Recipe generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      <Header lang={lang} setLang={setLang} />
      
      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {/* User and Restrictions Management */}
        <HouseholdSection 
          household={household} 
          setHousehold={setHousehold} 
          activeDiners={activeDiners} 
          setActiveDiners={setActiveDiners} 
          lang={lang}
        />
        
        {/* Ingredient Inventory */}
        <PantrySection 
          pantry={pantry} 
          setPantry={setPantry} 
          lang={lang}
        />

        {/* Meal Category Selection */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
            {t.meal_type_label}
          </h3>
          <div className="flex flex-wrap gap-4">
            {(['appetizer', 'main', 'dessert'] as MealType[]).map(type => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`px-8 py-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center gap-3 border-2 ${
                  mealType === type 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <i className={`fas ${
                  type === 'appetizer' ? 'fa-cheese' : type === 'main' ? 'fa-utensils' : 'fa-ice-cream'
                }`}></i>
                {t[type === 'main' ? 'main_course' : type as keyof typeof t] || type}
              </button>
            ))}
          </div>
        </section>

        {/* Main Action Call */}
        <div className="flex flex-col items-center gap-4 py-4">
          <button 
            disabled={isGenerating || activeDiners.length === 0}
            onClick={handleGenerateRecipe}
            className="w-full md:w-auto px-16 py-6 rounded-3xl text-xl font-black transition-all flex items-center justify-center gap-4 btn-primary shadow-2xl group"
          >
            {isGenerating ? (
              <><i className="fas fa-brain fa-spin"></i> {t.generating_btn}</>
            ) : (
              <><i className="fas fa-hat-chef group-hover:rotate-12 transition-transform"></i> {t.generate_btn}</>
            )}
          </button>
          {error && (
            <div className="bg-red-50 px-6 py-3 rounded-2xl border border-red-200 text-red-600 font-bold text-xs tracking-wider animate-bounce uppercase">
              {error}
            </div>
          )}
        </div>

        {/* Generated Result Display */}
        {recipe && (
          <RecipeCard 
            recipe={recipe} 
            dishImage={dishImage} 
            setDishImage={setDishImage} 
            lang={lang}
            onSaved={refreshHistory}
          />
        )}

        {/* Historical/Saved Recipes Browsing */}
        <HistorySection history={history} onUpdate={refreshHistory} lang={lang} />
      </main>

      <Footer lang={lang} />
    </div>
  );
};

export default App;
