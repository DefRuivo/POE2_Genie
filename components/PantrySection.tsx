
import React, { useState } from 'react';

interface Props {
  pantry: string[];
  setPantry: React.Dispatch<React.SetStateAction<string[]>>;
}

const PantrySection: React.FC<Props> = ({ pantry, setPantry }) => {
  const [newIngredient, setNewIngredient] = useState('');

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
          Despensa & Geladeira (Pantry)
        </h2>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {pantry.map(item => (
            <span key={item} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
              {item}
              <button onClick={() => removeIngredient(item)} className="text-slate-400 hover:text-amber-600"><i className="fas fa-times"></i></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            placeholder="Ex: Abobrinha..." 
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none" 
            value={newIngredient} 
            onKeyPress={e => e.key === 'Enter' && addIngredient()}
            onChange={e => setNewIngredient(e.target.value)} 
          />
          <button onClick={addIngredient} className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-amber-100">Incluir</button>
        </div>
      </div>
    </section>
  );
};

export default PantrySection;
