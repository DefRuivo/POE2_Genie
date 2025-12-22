
import React from 'react';
import { Language, translations } from '../locales/translations';

interface Props {
  lang: Language;
  setLang: (lang: Language) => void;
}

const Header: React.FC<Props> = ({ lang, setLang }) => {
  const t = translations[lang];

  return (
    <header className="bg-slate-900 text-white shadow-xl p-6 sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        {/* Brand Section */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <i className="fas fa-utensils text-xl"></i>
          </div>
          <h1 className="text-2xl font-black tracking-tighter">{t.app_name}</h1>
        </div>

        {/* Controls Section */}
        <div className="flex items-center gap-6">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest hidden md:block">
            {t.app_subtitle}
          </p>
          
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button 
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${lang === 'en' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLang('pt')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${lang === 'pt' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              PT
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
