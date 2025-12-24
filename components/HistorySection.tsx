
import React from 'react';
import { RecipeRecord } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  history: RecipeRecord[];
  onUpdate: () => void;
  onViewRecipe?: (recipe: RecipeRecord) => void;
}

const HistorySection: React.FC<Props> = ({ history, onUpdate, onViewRecipe }) => {

  const toggleFavorite = async (id: string) => {
    await storageService.toggleFavorite(id);
    onUpdate();
  };

  const removeRecipe = async (id: string) => {
    await storageService.deleteRecipe(id);
    onUpdate();
  };

  if (history.length === 0) return null;

  return (
    <section className="bg-slate-50 rounded-[2.5rem] p-8 md:p-10 border border-slate-200">
      <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
        <i className="fas fa-book-open text-rose-500"></i>
        Recipes
      </h2>

      {/* Grid: 1 col on mobile, max 2 cols on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {history.map(recipe => (
          <div
            key={recipe.id}
            className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            {/* Image Area */}
            <div
              className={`relative h-48 rounded-2xl overflow-hidden mb-5 cursor-pointer bg-slate-900 flex items-center justify-center`}
              onClick={() => onViewRecipe?.(recipe)}
            >
              <i className="fas fa-utensils text-slate-800 text-5xl"></i>

              {/* Favorite Button */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                className={`absolute top-4 right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${recipe.isFavorite ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white'}`}
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
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${recipe.meal_type === 'main' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    recipe.meal_type === 'dessert' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                  }`}>
                  {recipe.meal_type}
                </span>
                <span className="text-slate-400 text-xs font-bold flex items-center gap-1">
                  <i className="far fa-calendar-alt"></i>
                  {new Date(recipe.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-black text-slate-900 text-xl md:text-2xl tracking-tight leading-snug group-hover:text-rose-600 transition-colors">
                {recipe.recipe_title}
              </h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed font-medium">
                  {recipe.match_reasoning}
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-8 flex justify-between items-center pt-5 border-t border-slate-100 px-2">
              <button
                onClick={() => removeRecipe(recipe.id)}
                className="text-slate-400 hover:text-red-500 text-xs font-bold transition-colors flex items-center gap-2 px-2 py-1 hover:bg-red-50 rounded-lg"
              >
                <i className="fas fa-trash"></i> Delete
              </button>

              <button
                onClick={() => onViewRecipe?.(recipe)}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-100 hover:text-rose-700 transition-all border border-rose-100"
              >
                View Recipe <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HistorySection;
