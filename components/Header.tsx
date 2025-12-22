
import React from 'react';

const Header: React.FC = () => (
  <header className="bg-slate-900 text-white shadow-xl p-6 sticky top-0 z-50 border-b border-slate-800">
    <div className="max-w-4xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <i className="fas fa-utensils text-xl"></i>
        </div>
        <h1 className="text-2xl font-black tracking-tighter">Dinner?</h1>
      </div>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-widest hidden md:block">Chef & Auditor Assistant</p>
    </div>
  </header>
);

export default Header;
