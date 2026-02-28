
'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { ICON_ACCENT_CLASS, ICON_MAP } from '@/lib/ui/icon-map';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-32 py-16 border-t border-poe-borderStrong text-center">
      <div className="max-w-4xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 text-poe-gold font-black tracking-tighter text-xl mb-4 poe-title">
          <span className="w-7 h-7 rounded-lg bg-poe-bg0 border border-poe-borderStrong shadow-[0_6px_12px_rgba(0,0,0,0.28)] inline-flex items-center justify-center">
            <i className={`${ICON_MAP.brand} ${ICON_ACCENT_CLASS.brand} text-sm`}></i>
          </span>
          POE2 Genie
        </div>
        <p className="text-poe-text2 text-xs font-bold uppercase tracking-[0.2em]">
          {t('common.slogan')}
        </p>

        <div className="mt-8 flex justify-center gap-6 text-poe-text2">
          <a href="https://x.com/POE2Genie" target="_blank" rel="noopener noreferrer" aria-label="POE2 Genie on X" className="poe-focus-ring rounded-lg">
            <i className="fab fa-x hover:text-poe-gold cursor-pointer transition-colors"></i>
          </a>
          <a href="https://github.com/DefRuivo/POE2_Genie" target="_blank" rel="noopener noreferrer" aria-label="POE2 Genie on GitHub" className="poe-focus-ring rounded-lg">
            <i className="fab fa-github hover:text-poe-gold cursor-pointer transition-colors"></i>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
