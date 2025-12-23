"use client";

import React, { useState } from 'react';
import { useApp } from '../components/Providers';
import RecipeCard from '../components/RecipeCard';
import HistorySection from '../components/HistorySection';
import Footer from '../components/Footer';
import { SessionContext, GeneratedRecipe, MealType, RecipeRecord } from '../types';
import { storageService } from '../services/storageService';

export default function Home() {
  const {
    lang,
    household,
    pantry,
    activeDiners, setActiveDiners,
    mealType, setMealType,
    difficulty, setDifficulty,
    prepTime, setPrepTime
  } = useApp();

  // Local UI state
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [dishImage, setDishImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RecipeRecord[]>([]);
  const [observation, setObservation] = useState('');

  // Load history (also on History page, but good to have recent here)
  React.useEffect(() => {
    storageService.getAllRecipes().then(setHistory);
  }, []);

  const refreshHistory = async () => {
    const data = await storageService.getAllRecipes();
    setHistory(data);
  };

  const handleGenerateRecipe = async () => {
    if (activeDiners.length === 0) {
      // Basic validation if user hasn't selected diners
      setError("Please select who is eating in the Household tab first!"); // TODO: Translation
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
        requested_type: mealType,
        difficulty_preference: difficulty,
        prep_time_preference: prepTime,
        observation: observation
      };
      const result = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household, context, language: lang }),
      }).then(res => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      });
      setRecipe(result);
    } catch (err: any) {
      setError("Failed to generate recipe. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to toggle active diner
  const toggleDiner = (id: string) => {
    if (activeDiners.includes(id)) {
      setActiveDiners(prev => prev.filter(d => d !== id));
    } else {
      setActiveDiners(prev => [...prev, id]);
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-indigo-100">
      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">

        {/* Quick Diner Selection (Simplified) */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Who is eating?
            </h3>
            <a href="/household" className="text-indigo-600 font-bold text-sm hover:underline">Manage Household &rarr;</a>
          </div>

          <div className="flex flex-wrap gap-3">
            {household.map(member => (
              <button
                key={member.id}
                onClick={() => toggleDiner(member.id)}
                className={`px-4 py-2 rounded-xl font-bold transition-all border-2 ${activeDiners.includes(member.id)
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'
                  }`}
              >
                {activeDiners.includes(member.id) && <i className="fas fa-check mr-2"></i>}
                {member.name}
              </button>
            ))}
            {household.length === 0 && (
              <p className="text-slate-400 italic">No members found. Add them in Household.</p>
            )}
          </div>
        </section>

        {/* Meal Type Selection */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
            Type of Meal
          </h3>
          <div className="flex flex-wrap gap-4">
            {(['appetizer', 'main', 'dessert'] as MealType[]).map(type => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`px-8 py-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center gap-3 border-2 ${mealType === type
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
              >
                <i className={`fas ${type === 'appetizer' ? 'fa-cheese' : type === 'main' ? 'fa-hamburger' : 'fa-ice-cream'
                  }`}></i>
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* Preferences & Observations */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
                Difficulty Level
              </h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Fácil', value: 'easy', icon: 'fa-smile' },
                  { label: 'Difícil', value: 'advanced', icon: 'fa-fire' },
                  { label: 'Chef Mode', value: 'chef', icon: 'fa-hat-chef' }
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setDifficulty(level.value as any)}
                    className={`px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all flex items-center gap-2 border-2 ${difficulty === level.value
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    <i className={`fas ${level.icon}`}></i>
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
                Extra Observations
              </h3>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ex: Tenho 2 horas, quero usar o forno, sem fritura..."
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 text-slate-700 font-medium resize-none h-32"
              />
            </div>
          </div>
        </section>

        {/* Main Action Button */}
        <div className="flex flex-col items-center gap-4 py-4">
          <button
            disabled={isGenerating || activeDiners.length === 0}
            onClick={handleGenerateRecipe}
            className="w-full md:w-auto px-16 py-6 rounded-3xl text-xl font-black transition-all flex items-center justify-center gap-4 btn-primary group"
          >
            {isGenerating ? (
              <><i className="fas fa-brain fa-spin"></i> Generating...</>
            ) : (
              <><i className="fas fa-hat-chef group-hover:rotate-12 transition-transform"></i> Generate Chef Recipe</>
            )}
          </button>
          {error && (
            <div className="bg-red-50 px-6 py-3 rounded-2xl border border-red-200 text-red-600 font-bold text-xs tracking-wider animate-bounce uppercase">
              {error}
            </div>
          )}
        </div>

        {/* Recipe Result display */}
        {recipe && (
          <RecipeCard
            recipe={recipe}
            dishImage={dishImage}
            setDishImage={setDishImage}
            lang={lang}
            onSaved={refreshHistory}
          />
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}
