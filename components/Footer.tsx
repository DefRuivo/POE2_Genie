
'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-32 py-16 border-t border-slate-200 text-center">
      <div className="max-w-4xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 text-rose-600 font-black tracking-tighter text-xl mb-4">
          <i className="fas fa-shield-halved"></i>
          POE2 Genie
        </div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
          {t('common.slogan')}
        </p>

        <div className="mt-8 flex justify-center gap-6 text-slate-300">
          <a href="https://x.com/POE2Genie" target="_blank" rel="noopener noreferrer" aria-label="POE2 Genie on X">
            <i className="fab fa-x hover:text-rose-400 cursor-pointer transition-colors"></i>
          </a>
          <a href="https://github.com/DefRuivo/POE2_Genie" target="_blank" rel="noopener noreferrer" aria-label="POE2 Genie on GitHub">
            <i className="fab fa-github hover:text-rose-400 cursor-pointer transition-colors"></i>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
