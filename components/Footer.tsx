
import React from 'react';

const Footer: React.FC = () => (
  <footer className="mt-32 py-16 border-t border-slate-200 text-center">
    <div className="max-w-4xl mx-auto px-6">
      <div className="inline-flex items-center gap-2 text-indigo-600 font-black tracking-tighter text-xl mb-4">
        <i className="fas fa-utensils"></i>
        Dinner?
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Culinária Inteligente & Segura</p>
    </div>
  </footer>
);

export default Footer;
