
import React, { useState } from 'react';
import { HouseholdMember } from '../types';
import { Language, translations } from '../locales/translations';

interface Props {
  household: HouseholdMember[];
  setHousehold: React.Dispatch<React.SetStateAction<HouseholdMember[]>>;
  activeDiners: string[];
  setActiveDiners: React.Dispatch<React.SetStateAction<string[]>>;
  lang: Language;
}

import { TagInput } from './TagInput';

interface Props {
  household: HouseholdMember[];
  setHousehold: React.Dispatch<React.SetStateAction<HouseholdMember[]>>;
  activeDiners: string[];
  setActiveDiners: React.Dispatch<React.SetStateAction<string[]>>;
  lang: Language;
}

const HouseholdSection: React.FC<Props> = ({ household, setHousehold, activeDiners, setActiveDiners, lang }) => {
  const t = translations[lang];
  const [newMember, setNewMember] = useState<{
    name: string;
    restrictions: string[];
    likes: string[];
    dislikes: string[];
  }>({ name: '', restrictions: [], likes: [], dislikes: [] });

  /**
   * Adds a new member to the household state and selects them for the current session.
   */
  const addMember = () => {
    if (!newMember.name) return;
    const member: HouseholdMember = {
      id: Date.now().toString(),
      name: newMember.name,
      restrictions: newMember.restrictions,
      likes: newMember.likes,
      dislikes: newMember.dislikes,
    };
    setHousehold([...household, member]);
    setActiveDiners([...activeDiners, member.id]);
    setNewMember({ name: '', restrictions: [], likes: [], dislikes: [] });
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
          {t.household_title}
        </h2>
        <p className="text-sm text-slate-500 mt-1">{t.household_subtitle}</p>
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
                <p><span className="font-bold text-red-700">{t.allergies_label}:</span> {member.restrictions.join(', ') || 'N/A'}</p>
                <p><span className="font-bold text-emerald-700">{t.likes_label}:</span> {member.likes.join(', ')}</p>
                <p><span className="font-bold text-slate-500">{t.dislikes_label}:</span> {member.dislikes.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form to add a new household profile */}
        <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.new_member}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              placeholder={t.name_placeholder}
              className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white focus:border-indigo-500 transition-colors"
              value={newMember.name}
              onChange={e => setNewMember({ ...newMember, name: e.target.value })}
            />
            <TagInput
              tags={newMember.restrictions}
              onChange={(tags) => setNewMember({ ...newMember, restrictions: tags })}
              placeholder={t.restrictions_placeholder}
              category="restriction"
            />
            <TagInput
              tags={newMember.likes}
              onChange={(tags) => setNewMember({ ...newMember, likes: tags })}
              placeholder={t.likes_placeholder}
              category="like"
            />
            <TagInput
              tags={newMember.dislikes}
              onChange={(tags) => setNewMember({ ...newMember, dislikes: tags })}
              placeholder={t.dislikes_placeholder}
              category="dislike"
            />
          </div>
          <button onClick={addMember} className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg">
            {t.add_member}
          </button>
        </div>
      </div>
    </section>
  );
};

export default HouseholdSection;
