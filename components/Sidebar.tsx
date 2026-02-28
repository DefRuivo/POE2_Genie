
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { ICON_ACCENT_CLASS, ICON_MAP, type IconKey } from '@/lib/ui/icon-map';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

const Sidebar: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const NavItem = ({
    href,
    iconKey,
    label,
    accentClass,
  }: {
    href: string;
    iconKey: IconKey;
    label: string;
    accentClass: string;
  }) => (
    <Link
      href={href}
      onClick={(e) => {
        if (onNavigate) {
          e.preventDefault();
          onNavigate(href);
        }
        onClose();
      }}
      className="poe-nav-link w-full flex items-center gap-4 px-4 py-3 font-bold transition-all group"
    >
      <span className={`w-1.5 h-7 rounded-full ${accentClass}`}></span>
      <span className="w-8 h-8 rounded-lg flex items-center justify-center border border-poe-border bg-poe-surface2 shadow-inner group-hover:scale-105 transition-transform">
        <i className={`${ICON_MAP[iconKey]} ${ICON_ACCENT_CLASS[iconKey]} text-sm`}></i>
      </span>
      {label}
    </Link>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/65 backdrop-blur-sm z-[60] transition-opacity duration-300 xl:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className={`fixed top-0 left-0 bottom-0 w-80 poe-surface shadow-2xl z-[70] transition-transform duration-500 transform xl:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-poe-bg0 rounded-xl flex items-center justify-center shadow-lg border border-poe-borderStrong">
                <i className={`${ICON_MAP.brand} ${ICON_ACCENT_CLASS.brand}`}></i>
              </div>
              <span className="font-black text-xl tracking-tighter poe-title">POE2 Genie</span>
            </div>
            <button onClick={onClose} className="p-2 text-poe-text2 hover:text-poe-gold poe-focus-ring rounded-lg xl:hidden" aria-label="Close navigation">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
            <NavItem href="/" iconKey="home" label={t('nav.home')} accentClass="bg-poe-gold" />
            <NavItem href="/stash" iconKey="stash" label={t('nav.pantry')} accentClass="bg-poe-sectionStash" />
            <NavItem href="/checklist" iconKey="checklist" label={t('nav.shopping')} accentClass="bg-poe-sectionChecklist" />
            <NavItem href="/builds" iconKey="builds" label={t('nav.recipes')} accentClass="bg-poe-sectionBuilds" />
            <NavItem href="/party" iconKey="party" label={t('nav.members')} accentClass="bg-poe-sectionParty" />
            <NavItem href="/hideouts" iconKey="hideouts" label={t('nav.kitchens')} accentClass="bg-poe-sectionHideouts" />
            <NavItem href="/settings" iconKey="settings" label={t('nav.settings')} accentClass="bg-poe-sectionSettings" />
          </nav>

          <div className="border-t border-poe-border pt-4 mt-2">
            <button
              onClick={handleLogout}
              className="poe-nav-link w-full flex items-center gap-4 px-4 py-3 text-poe-danger font-bold hover:border-poe-danger group"
            >
              <span className="w-1.5 h-7 rounded-full bg-poe-danger"></span>
              <i className="fas fa-sign-out-alt w-6 group-hover:scale-110 transition-transform"></i>
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
