"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '../components/Providers';
import RecipeCard from '../components/RecipeCard';
import Footer from '../components/Footer';
import { SessionContext, MealType, RecipeRecord, Difficulty } from '../types';
import { storageService } from '../services/storageService';
import Link from 'next/link';

export default function Home() {
  const {
    household,
    pantry,
    activeDiners, setActiveDiners,
    // mealType, setMealType, // Removed from useApp destructuring
    difficulty, setDifficulty,
    prepTime, setPrepTime
  } = useApp();

  const [recipe, setRecipe] = useState<RecipeRecord | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RecipeRecord[]>([]);
  const [observation, setObservation] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [mealType, setMealType] = useState<MealType>('main'); // Declared locally with default

  useEffect(() => {
    storageService.getAllRecipes()
      .then(setHistory)
      .catch(err => {
        if (err.message.includes('Unauthorized') || err.message.includes('401')) {
          // Redirect explicitly just in case Providers didn't catch it fast enough
          window.location.href = '/login';
        } else {
          console.error("Failed to load history", err);
        }
      });
  }, []);

  const refreshHistory = async () => {
    const data = await storageService.getAllRecipes();
    setHistory(data);
  };

  const handleGenerateRecipe = async () => {
    if (activeDiners.length === 0) {
      setError("Please select who is eating first! (Check 'Members')");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setRecipe(null);
    setShowGenerator(false); // Collapse to show result focus

    try {
      const context: SessionContext = {
        who_is_eating: activeDiners,
        pantry_ingredients: pantry.filter(i => i.inStock).map(i => i.name),
        requested_type: mealType,
        difficulty_preference: difficulty,
        prep_time_preference: prepTime,
        observation: observation
      };

      const result = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household, context, language: 'en' }),
      }).then(res => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      });

      const newRecord: RecipeRecord = {
        ...result,
        id: Date.now().toString(),
        isFavorite: false,
        createdAt: Date.now(),
        language: 'en'
      };

      await storageService.saveRecipe(newRecord);
      setRecipe(newRecord);
      refreshHistory();

    } catch (err: any) {
      setError("Failed to generate recipe. Please try again.");
      console.error(err);
      setShowGenerator(true); // Re-open on error
    } finally {
      setIsGenerating(false);
    }
  };

  // Stats
  const activeCount = household.length;
  const pantryCount = pantry.filter(i => i.inStock).length;
  const recipesCount = history.length;

  return (
    <div className="min-h-screen pb-10 bg-slate-50 selection:bg-rose-100">

      {/* Dashboard Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Good Evening, Chef! <span className="text-rose-500">👨‍🍳</span>
          </h1>
          <p className="text-slate-500 font-medium">Ready to cook something amazing today?</p>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Link href="/members" className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-center hover:bg-rose-50 transition-colors block">
              <div className="text-2xl font-black text-rose-600">{activeCount}</div>
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Members</div>
            </Link>
            <Link href="/pantry" className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center hover:bg-emerald-50 transition-colors block">
              <div className="text-2xl font-black text-emerald-600">{pantryCount}</div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Pantry Data</div>
            </Link>
            <Link href="/history" className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-center hover:bg-indigo-50 transition-colors block">
              <div className="text-2xl font-black text-indigo-600">{recipesCount}</div>
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Saved</div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-4 space-y-4">

        {/* Action Buttons */}
        {!recipe && !showGenerator && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowGenerator(true)}
              className="p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm hover:border-rose-500 hover:shadow-rose-100 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 text-xl mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-wand-magic-sparkles"></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-1">Generate Recipe</h3>
              <p className="text-sm text-slate-500 font-medium">Use AI to create a custom meal based on your pantry.</p>
            </button>

            <Link href="/pantry" className="p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-emerald-100 transition-all group text-left">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xl mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-carrot"></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-1">Pantry</h3>
              <p className="text-sm text-slate-500 font-medium">Update ingredients.</p>
            </Link>

            <Link href="/kitchens" className="p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-indigo-100 transition-all group text-left">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xl mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-utensils"></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-1">Kitchen Check</h3>
              <p className="text-sm text-slate-500 font-medium">Manage members & settings.</p>
            </Link>
          </div>
        )}

        {/* Generator Section */}
        {(showGenerator || isGenerating) && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Configure Meal</h2>
              {!isGenerating && <button onClick={() => setShowGenerator(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Cancel</button>}
            </div>

            {/* Who (Simplified Select) */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Who is eating?</label>
              <div className="flex flex-wrap gap-2">
                {household.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setActiveDiners(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${activeDiners.includes(m.id) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    {m.name}
                  </button>
                ))}
                {household.length === 0 && <Link href="/kitchens" className="text-sm text-rose-600 font-bold underline">Add members first</Link>}
              </div>
            </div>

            {/* Type & Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Meal Type</label>
                <div className="flex gap-2">
                  {['appetizer', 'main', 'dessert', 'snack'].map(t => (
                    <button
                      key={t}
                      onClick={() => setMealType(t as MealType)}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 uppercase ${mealType === t ? 'bg-rose-100 border-rose-500 text-rose-700' : 'bg-white border-slate-200 text-slate-400'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Difficulty</label>
                <div className="flex gap-2">
                  {['easy', 'intermediate', 'advanced'].map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d as Difficulty)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 uppercase ${difficulty === d ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Observation */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Any special requests?</label>
              <textarea
                value={observation}
                onChange={e => setObservation(e.target.value)}
                placeholder="e.g. I have 20 minutes, use the oven..."
                className="w-full h-24 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:border-rose-500 outline-none resize-none"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateRecipe}
              disabled={isGenerating}
              className="w-full py-5 bg-rose-600 rounded-2xl text-white font-black text-lg shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
            >
              {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
              {isGenerating ? 'Cooking Magic...' : 'Generate Recipe'}
            </button>

            {error && <p className="text-center text-red-500 font-bold text-sm">{error}</p>}
          </div>
        )}

        {/* Result */}
        {recipe && <RecipeCard recipe={recipe} onSaved={refreshHistory} />}

        {/* Recent History (If no result shown and not generating) */}
        {!recipe && !showGenerator && history.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-black text-slate-800 mb-6">Recent Creations</h3>
            <div className="space-y-4">
              {history.slice(0, 3).map(rec => (
                <Link href={`/history/${rec.id}`} key={rec.id} className="block bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex justify-between items-center group">
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{rec.recipe_title}</h4>
                    <p className="text-xs text-slate-500">{new Date(rec.createdAt).toLocaleDateString()} • {rec.meal_type}</p>
                  </div>
                  <i className="fas fa-chevron-right text-slate-300 group-hover:text-rose-400"></i>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
