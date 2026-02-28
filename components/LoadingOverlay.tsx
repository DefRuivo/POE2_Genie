'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  isVisible: boolean;
}

export const LoadingOverlay: React.FC<Props> = ({ isVisible }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const steps = useMemo(() => [
    t('loading.step1'),
    t('loading.step2'),
    t('loading.step3'),
    t('loading.step4'),
    t('loading.step5'),
    t('loading.step6'),
    t('loading.step7')
  ], [t]);

  useEffect(() => {
    if (!isVisible) {
      setStep(0);
      return;
    }

    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isVisible, steps.length]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="poe-surface p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 text-center space-y-8 animate-in zoom-in-95 duration-300 border border-poe-borderStrong relative overflow-hidden">

        {/* Animated Background Blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-poe-gold rounded-full mix-blend-screen blur-3xl opacity-20 animate-pulse"></div>

        <div className="relative">
            {/* Animated Icon */}
            <div className="w-24 h-24 bg-poe-bronze rounded-full mx-auto flex items-center justify-center shadow-xl shadow-black/40 mb-6 animate-bounce relative border border-poe-borderStrong">
            <i className="fas fa-wand-magic-sparkles text-4xl text-poe-bg0"></i>
            <div className="absolute inset-0 border-4 border-poe-gold rounded-full animate-ping opacity-30"></div>
            </div>

            <h2 className="text-2xl font-black poe-title tracking-tight leading-tight">
            {t('loading.title')}
            </h2>

            <div className="mt-6 min-h-[3rem] flex items-center justify-center px-4">
            <p className="text-poe-warning font-bold text-lg animate-pulse leading-snug">
                {steps[step]}
            </p>
            </div>
        </div>

        <div className="bg-poe-surface2 p-4 rounded-xl border border-poe-borderStrong">
          <p className="text-xs font-bold text-poe-text2 uppercase tracking-widest flex items-center justify-center gap-2">
             <i className="fas fa-exclamation-triangle"></i> {t('loading.warning')}
          </p>
        </div>
      </div>
    </div>
  );
};
