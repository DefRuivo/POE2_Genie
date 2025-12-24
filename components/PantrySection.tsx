import React, { useState } from 'react';
import { translations } from '../locales/translations';

interface Props {
  pantry: string[];
  setPantry: React.Dispatch<React.SetStateAction<string[]>>;
}

const PantrySection: React.FC<Props> = ({ pantry, setPantry }) => {
  const t = translations;
  const [newIngredient, setNewIngredient] = useState('');

  /**
   * Adds a new item to the global pantry list.
   */
  const addIngredient = () => {
    if (!newIngredient) return;
    setPantry([...pantry, newIngredient]);
    setNewIngredient('');
  };

  const removeIngredient = (ing: string) => {
    setPantry(pantry.filter(i => i !== ing));
  };

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <i className="fas fa-box-open text-amber-500"></i>
          {t.pantry_title}
        </h2>
        <p className="text-sm text-slate-500 mt-1">{t.pantry_subtitle}</p>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {pantry.map(item => (
            <span key={item} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 transition-all group">
              {item}
              <button onClick={() => removeIngredient(item)} className="text-slate-400 hover:text-amber-600 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder={t.ingredient_placeholder}
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-500"
            value={newIngredient}
            onKeyPress={e => e.key === 'Enter' && addIngredient()}
            onChange={e => setNewIngredient(e.target.value)}
          />
          <button onClick={addIngredient} className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95">
            {t.include}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PantrySection;
