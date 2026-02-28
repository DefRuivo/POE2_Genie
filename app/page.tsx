"use client";

import { useState, useEffect } from 'react';
import { useApp } from '../components/Providers';
import { BuildItem, BuildRecord, Hideout } from '../types';
import { storageService } from '../services/storageService';
import Link from 'next/link';
import { CodeInput } from '../components/ui/CodeInput';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useTranslation } from '@/hooks/useTranslation';
import { MessageDialog } from '../components/MessageDialog';
import { ICON_ACCENT_CLASS, ICON_MAP } from '@/lib/ui/icon-map';

export default function Home() {
  const { isGuest } = useCurrentMember();
  const { members } = useApp();
  const { t } = useTranslation();

  const [history, setHistory] = useState<BuildRecord[]>([]);
  const [kitchen, setKitchen] = useState<Hideout | null>(null);
  const [shoppingList, setShoppingList] = useState<BuildItem[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, message: '', title: '' });

  useEffect(() => {
    Promise.all([
      storageService.getAllBuilds(),
      storageService.getCurrentHideout(),
      storageService.getBuildItems()
    ])
      .then(([recipes, kitchenData, shoppingData]) => {
        setHistory(recipes);
        setKitchen(kitchenData);
        setShoppingList(shoppingData);
      })
      .catch(err => {
        if (err.message.includes('Unauthorized') || err.message.includes('401')) {
          // Redirect explicitly just in case Providers didn't catch it fast enough
          window.location.href = '/login';
        } else {
          console.error("Failed to load data", err);
        }
      });
  }, []);

  // Stats
  const activeCount = members.length;
  const shoppingCount = shoppingList.filter(i => !i.checked).length;
  const recipesCount = history.length;

  return (
    <div className="poe-shell min-h-screen pb-10">

      {/* Dashboard Header */}
      <header className="max-w-7xl mx-auto px-4">
        <div className="poe-section-marker poe-section-hideouts mt-2 md:mt-3">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1 flex items-center gap-2.5 poe-title">
            {t('home.welcome')}, Exile! <span className="text-poe-gold text-xl md:text-2xl">⚔️</span>
            {kitchen && (
              <span className="text-[10px] poe-chip px-2.5 py-1 rounded-full uppercase tracking-widest font-bold shadow-sm animate-in fade-in slide-in-from-left-4">
                <i className={`${ICON_MAP.hideouts} ${ICON_ACCENT_CLASS.hideouts} mr-2`}></i>
                {kitchen.name}
              </span>
            )}
          </h1>
          <p className="poe-text-muted font-medium text-sm">{t('actions.generateDesc')}</p>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <Link href="/party" className="poe-section-marker poe-section-party p-3 text-center hover:border-poe-sectionParty transition-colors block">
              <div className="text-xl font-black text-poe-sectionParty leading-none">{activeCount}</div>
              <div className="text-[10px] font-bold text-poe-text2 uppercase tracking-wider mt-1">{t('nav.members')}</div>
            </Link>
            <Link href="/checklist" className="poe-section-marker poe-section-checklist p-3 text-center hover:border-poe-sectionChecklist transition-colors block">
              <div className="text-xl font-black text-poe-sectionChecklist leading-none">{shoppingCount}</div>
              <div className="text-[10px] font-bold text-poe-text2 uppercase tracking-wider mt-1">{t('nav.shopping')}</div>
            </Link>
            <Link href="/builds" className="poe-section-marker poe-section-builds p-3 text-center hover:border-poe-sectionBuilds transition-colors block">
              <div className="text-xl font-black text-poe-sectionBuilds leading-none">{recipesCount}</div>
              <div className="text-[10px] font-bold text-poe-text2 uppercase tracking-wider mt-1">{t('nav.recipes')}</div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-3 space-y-4">

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!isGuest && (
            <Link
              href="/builds/craft"
              className="p-4 poe-card rounded-3xl border-2 border-poe-borderStrong hover:border-poe-sectionBuilds transition-all group text-left block"
            >
              <div className="w-12 h-12 bg-poe-surface2 border border-poe-borderStrong rounded-full flex items-center justify-center text-poe-sectionBuilds text-xl mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-wand-magic-sparkles"></i>
              </div>
              <h3 className="text-xl font-black poe-title mb-1">{t('actions.generateTitle')}</h3>
              <p className="text-sm poe-text-muted font-medium">{t('actions.generateDesc')}</p>
            </Link>
          )}

          <Link href="/stash" className="p-4 poe-card rounded-3xl border-2 border-poe-borderStrong hover:border-poe-sectionStash transition-all group text-left">
            <div className="w-12 h-12 bg-poe-surface2 border border-poe-borderStrong rounded-full flex items-center justify-center text-poe-sectionStash text-xl mb-4 group-hover:scale-110 transition-transform">
              <i className={`${ICON_MAP.stash} ${ICON_ACCENT_CLASS.stash}`}></i>
            </div>
            <h3 className="text-xl font-black poe-title mb-1">{t('actions.pantryTitle')}</h3>
            <p className="text-sm poe-text-muted font-medium">{t('actions.pantryDesc')}</p>
          </Link>

          <Link href="/hideouts" className="p-4 poe-card rounded-3xl border-2 border-poe-borderStrong hover:border-poe-sectionHideouts transition-all group text-left">
            <div className="w-12 h-12 bg-poe-surface2 border border-poe-borderStrong rounded-full flex items-center justify-center text-poe-sectionHideouts text-xl mb-4 group-hover:scale-110 transition-transform">
              <i className={`${ICON_MAP.hideouts} ${ICON_ACCENT_CLASS.hideouts}`}></i>
            </div>
            <h3 className="text-xl font-black poe-title mb-1">{t('actions.kitchenTitle')}</h3>
            <p className="text-sm poe-text-muted font-medium">{t('actions.kitchenDesc')}</p>
          </Link>
        </div>

        {/* Join Hideout Section */}
        <div className="poe-card poe-section-marker poe-section-hideouts rounded-3xl border-2 border-poe-borderStrong p-6">
          <h3 className="text-xl font-black poe-title mb-4 flex items-center gap-2">
            <i className={`${ICON_MAP.invite} ${ICON_ACCENT_CLASS.invite}`}></i>
            {t('actions.haveCode')}
          </h3>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <CodeInput
                onChange={setJoinCode}
                disabled={joining}
              />
            </div>
            <button
              onClick={async () => {
                if (joinCode.length !== 6) return;
                setJoining(true);
                try {
                  const res = await storageService.joinHideout(joinCode);
                  if (!res || !res.kitchenId) {
                    throw new Error(t('actions.failedJoin'));
                  }
                  // Automatically switch context
                  await storageService.switchHideout(res.kitchenId);
                  // Refresh page to load new context
                  window.location.reload();
                } catch (err: any) {
                  setErrorDialog({
                    isOpen: true,
                    title: t('common.error'),
                    message: t(err.message)
                  });
                } finally {
                  setJoining(false);
                }
              }}
              disabled={joining || joinCode.length !== 6}
              className="w-full md:w-auto poe-btn-primary poe-focus-ring px-8 py-4 rounded-xl font-black uppercase tracking-wide shadow-lg shadow-black/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {joining ? <i className="fas fa-spinner fa-spin"></i> : t('actions.joinCode')}
            </button>
          </div>
        </div>

        {/* Recent History */}
        {history.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-black poe-title mb-6">{t('actions.recent')}</h3>
            <div className="space-y-4">
              {history.slice(0, 3).map(rec => (
                <Link href={`/builds/${rec.id}`} key={rec.id} className="block poe-card p-4 rounded-2xl border border-poe-borderStrong hover:border-poe-sectionBuilds transition-all flex justify-between items-center group">
                  <div>
                    <h4 className="font-bold text-poe-text1 group-hover:text-poe-sectionBuilds transition-colors">{rec.recipe_title}</h4>
                    <p className="text-xs text-poe-text2">{new Date(rec.createdAt).toLocaleDateString()} • {rec.meal_type}</p>
                  </div>
                  <i className="fas fa-chevron-right text-poe-text2 group-hover:text-poe-sectionBuilds"></i>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>
      <MessageDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog({ ...errorDialog, isOpen: false })}
        title={errorDialog.title}
        message={errorDialog.message}
        type="error"
      />
    </div>
  );
}
