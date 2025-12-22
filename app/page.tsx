
"use client";

import React, { useState } from 'react';
import { HouseholdMember, SessionContext, GeneratedRecipe, ImageSize, AspectRatio } from '../types';
import { generateRecipe, generateDishImage } from '../services/geminiService';
import Header from '../components/Header';
import HouseholdSection from '../components/HouseholdSection';
import PantrySection from '../components/PantrySection';
import RecipeCard from '../components/RecipeCard';
import Footer from '../components/Footer';

export default function Home() {
  const [household, setHousehold] = useState<HouseholdMember[]>([
    { id: 'pai', name: 'Carlos', restrictions: ['Diabetes Tipo 2'], likes: ['Carne', 'Churrasco'], dislikes: ['Legumes cozidos'] },
    { id: 'filha', name: 'Bia', restrictions: ['Vegetariana', 'Alergia a Amendoim'], likes: ['Massas', 'Cogumelos'], dislikes: ['Coentro'] }
  ]);
  const [pantry, setPantry] = useState<string[]>(['Macarrão tradicional', 'Molho de tomate', 'Açúcar', 'Abobrinha', 'Ovos', 'Queijo Parmesão', 'Amendoim torrado']);
  const [activeDiners, setActiveDiners] = useState<string[]>(['pai', 'filha']);
  
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [dishImage, setDishImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateRecipe = async () => {
    if (activeDiners.length === 0) {
      setError("Selecione pelo menos um participante.");
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
      const result = await generateRecipe(household, context);
      setRecipe(result);
    } catch (err: any) {
      setError("Erro ao gerar sugestão. Verifique sua chave de API.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        <HouseholdSection 
          household={household} 
          setHousehold={setHousehold} 
          activeDiners={activeDiners} 
          setActiveDiners={setActiveDiners} 
        />
        
        <PantrySection 
          pantry={pantry} 
          setPantry={setPantry} 
        />

        <div className="flex flex-col items-center gap-4 py-4">
          <button 
            disabled={isGenerating || activeDiners.length === 0}
            onClick={handleGenerateRecipe}
            className={`w-full md:w-auto px-16 py-5 rounded-3xl text-xl font-black transition-all flex items-center justify-center gap-4 btn-primary`}
          >
            {isGenerating ? (
              <>
                <i className="fas fa-brain fa-spin"></i>
                AUDITANDO SEGURANÇA...
              </>
            ) : (
              <>
                <i className="fas fa-hat-chef"></i>
                O QUE VAMOS COMER?
              </>
            )}
          </button>
          {error && <p className="text-red-600 font-bold text-xs text-center bg-red-50 px-6 py-3 rounded-2xl border border-red-200 uppercase tracking-wider">{error}</p>}
        </div>

        {recipe && (
          <RecipeCard 
            recipe={recipe} 
            dishImage={dishImage} 
            setDishImage={setDishImage} 
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
