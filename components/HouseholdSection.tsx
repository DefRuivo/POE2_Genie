
import React, { useState } from 'react';
import { HouseholdMember } from '../types';

interface Props {
  household: HouseholdMember[];
  setHousehold: React.Dispatch<React.SetStateAction<HouseholdMember[]>>;
  activeDiners: string[];
  setActiveDiners: React.Dispatch<React.SetStateAction<string[]>>;
}

const HouseholdSection: React.FC<Props> = ({ household, setHousehold, activeDiners, setActiveDiners }) => {
  const [newMember, setNewMember] = useState({ name: '', restrictions: '', likes: '', dislikes: '' });

  const addMember = () => {
    if (!newMember.name) return;
    const member: HouseholdMember = {
      id: Date.now().toString(),
      name: newMember.name,
      restrictions: newMember.restrictions.split(',').map(s => s.trim()).filter(s => s),
      likes: newMember.likes.split(',').map(s => s.trim()).filter(s => s),
      dislikes: newMember.dislikes.split(',').map(s => s.trim()).filter(s => s),
    };
    setHousehold([...household, member]);
    setActiveDiners([...activeDiners, member.id]);
    setNewMember({ name: '', restrictions: '', likes: '', dislikes: '' });
  };

  const removeMember = (id: string) => {
    setHousehold(household.filter(m => m.id !== id));
    setActiveDiners(activeDiners.filter(d => d !== id));
  };

  const toggleDiner = (id: string) => {
    setActiveDiners(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <i className="fas fa-home text-indigo-500"></i>
          Membros da Casa (Household)
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {household.map(member => (
            <div key={member.id} className={`p-5 rounded-2xl border-2 transition-all ${activeDiners.includes(member.id) ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-white opacity-60'}`}>
              <div className="flex justify-between items-start mb-3">
                <button onClick={() => toggleDiner(member.id)} className="flex items-center gap-3 text-left group">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${activeDiners.includes(member.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                    {activeDiners.includes(member.id) && <i className="fas fa-check text-[10px] text-white"></i>}
                  </div>
                  <span className="font-extrabold text-slate-900 tracking-tight">{member.name}</span>
                </button>
                <button onClick={() => removeMember(member.id)} className="text-slate-300 hover:text-red-500 p-1 transition-colors">
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <p><span className="font-bold text-red-700">RESTRIÇÕES:</span> {member.restrictions.join(', ') || 'Nenhuma'}</p>
                <p><span className="font-bold text-emerald-700">GOSTA:</span> {member.likes.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input placeholder="Nome" className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
            <input placeholder="Restrições (vírgula)" className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" value={newMember.restrictions} onChange={e => setNewMember({...newMember, restrictions: e.target.value})} />
          </div>
          <button onClick={addMember} className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold">Adicionar Membro</button>
        </div>
      </div>
    </section>
  );
};

export default HouseholdSection;
