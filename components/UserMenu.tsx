'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { storageService } from '@/services/storageService';
import { useApp } from './Providers';
import { Language } from '@/types';

export const UserMenu: React.FC = () => {
    const router = useRouter();
    const { t, lang } = useTranslation();
    const { setLanguage } = useApp();
    const [user, setUser] = useState<any>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredKitchens = user?.kitchenMemberships?.filter((m: any) =>
        m.kitchen.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        loadUser();

        const handleHideoutsUpdated = () => loadUser();
        window.addEventListener('hideouts-updated', handleHideoutsUpdated);
        window.addEventListener('kitchens-updated', handleHideoutsUpdated);

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('hideouts-updated', handleHideoutsUpdated);
            window.removeEventListener('kitchens-updated', handleHideoutsUpdated);
        };
    }, []);

    const loadUser = async () => {
        try {
            const u = await storageService.getCurrentUser();
            if (u && u.user) setUser(u.user);
        } catch (err) {
            console.error("Failed to load user info", err);
        }
    };

    const handleSwitchKitchen = async (kitchenId: string) => {
        try {
            await storageService.switchHideout(kitchenId);
            window.location.reload();
        } catch (err) {
            console.error("Failed to switch hideout", err);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger */}
            <div
                className="flex items-center gap-3 cursor-pointer p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:bg-poe-surface2 hover:border-poe-border poe-focus-ring"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
                <div className="w-9 h-9 rounded-full bg-poe-surface2 text-poe-gold flex items-center justify-center font-bold shadow-sm border border-poe-border">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-poe-text1 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-poe-text2 font-medium truncate max-w-[100px]">
                        {user.kitchenMemberships?.find((m: any) => m.kitchenId === user.currentKitchenId)?.kitchen?.name || t('auth.userNoKitchen')}
                    </p>
                </div>
                <i className={`fas fa-chevron-down text-[10px] text-poe-text2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ml-1`}></i>
            </div>

            {/* Dropdown */}
            {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 poe-surface rounded-2xl shadow-xl border border-poe-borderStrong overflow-hidden animate-in fade-in slide-in-from-top-2 zoom-in-95 z-50">
                    {/* User Info Header (Mobile/Extra) */}
                    <div className="p-4 bg-poe-surface2 border-b border-poe-border block sm:hidden">
                        <p className="font-bold text-poe-text1">{user.name} {user.surname}</p>
                        <p className="text-xs text-poe-text2">{user.email}</p>
                    </div>

                    {/* Kitchen Switcher */}
                    <div className="p-3 bg-poe-surface1 border-b border-poe-border">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-poe-text2 uppercase tracking-widest">{t('nav.switchKitchen')}</span>
                            <button
                                onClick={() => { setIsDropdownOpen(false); router.push('/hideouts'); }}
                                className="text-[10px] font-bold px-2 py-1 rounded-lg poe-btn-secondary poe-focus-ring"
                            >
                                <i className="fas fa-plus mr-1"></i>
                                {t('nav.newKitchen')}
                            </button>
                        </div>
                        {/* Search Input */}
                        <div className="relative">
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-poe-text2 text-xs"></i>
                            <input
                                type="text"
                                placeholder={t('nav.searchKitchens')}
                                className="w-full poe-input poe-focus-ring rounded-xl py-1.5 pl-8 pr-3 text-xs font-bold transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {filteredKitchens?.length === 0 ? (
                            <div className="p-4 text-center text-xs text-poe-text2 font-medium italic">
                                {t('auth.userNoKitchen')}
                            </div>
                        ) : (
                            <>
                                {/* Grouping Logic */}
                                {(() => {
                                    const myKitchens = filteredKitchens?.filter((m: any) => m.role === 'ADMIN')
                                        .sort((a: any, b: any) => a.kitchen.name.localeCompare(b.kitchen.name)) || [];
                                    const otherKitchens = filteredKitchens?.filter((m: any) => m.role !== 'ADMIN')
                                        .sort((a: any, b: any) => a.kitchen.name.localeCompare(b.kitchen.name)) || [];

                                    return (
                                        <>
                                            {/* My Kitchens */}
                                            {myKitchens.length > 0 && (
                                                <div className="px-3 py-2">
                                                    <p className="text-[10px] font-black text-poe-text2 uppercase tracking-widest pl-1 mb-1">
                                                        {t('nav.myKitchens') || 'My Hideouts'}
                                                    </p>
                                                    {myKitchens.map((m: any) => (
                                                        <button
                                                            key={m.id}
                                                            onClick={() => handleSwitchKitchen(m.kitchenId)}
                                                            className={`w-full text-left px-3 py-2.5 text-sm font-bold rounded-xl transition-colors border flex items-center justify-between poe-focus-ring ${m.kitchenId === user.currentKitchenId ? 'text-poe-gold bg-poe-surface2 border-poe-gold' : 'text-poe-text2 border-transparent hover:bg-poe-surface2 hover:border-poe-border'}`}
                                                        >
                                                            <span className="truncate mr-2">{m.kitchen.name}</span>
                                                            {m.kitchenId === user.currentKitchenId && <i className="fas fa-check text-poe-gold text-xs"></i>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Divider if both exist */}
                                            {myKitchens.length > 0 && otherKitchens.length > 0 && (
                                                <div className="h-px bg-poe-border mx-4 my-1"></div>
                                            )}

                                            {/* Other Kitchens */}
                                            {otherKitchens.length > 0 && (
                                                <div className="px-3 py-2">
                                                    <p className="text-[10px] font-black text-poe-text2 uppercase tracking-widest pl-1 mb-1">
                                                        {t('nav.otherKitchens') || 'Other Hideouts'}
                                                    </p>
                                                    {otherKitchens.map((m: any) => (
                                                        <button
                                                            key={m.id}
                                                            onClick={() => handleSwitchKitchen(m.kitchenId)}
                                                            className={`w-full text-left px-3 py-2.5 text-sm font-bold rounded-xl transition-colors border flex items-center justify-between poe-focus-ring ${m.kitchenId === user.currentKitchenId ? 'text-poe-gold bg-poe-surface2 border-poe-gold' : 'text-poe-text2 border-transparent hover:bg-poe-surface2 hover:border-poe-border'}`}
                                                        >
                                                            <span className="truncate mr-2">{m.kitchen.name}</span>
                                                            {m.kitchenId === user.currentKitchenId && <i className="fas fa-check text-poe-gold text-xs"></i>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </>
                        )}
                    </div>

                    <div className="h-px bg-poe-border my-0"></div>

                    {/* Actions */}
                    <div className="p-2 space-y-1">
                        {/* Language Selector */}
                        <div className="px-4 py-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-poe-text2">{t('nav.language') || 'Language'}</span>
                            <select
                                value={lang}
                                onChange={(e) => {
                                    const newLang = e.target.value as Language;
                                    setLanguage(newLang);
                                    if (user) {
                                        const { name, surname, measurementSystem } = user;
                                        storageService.updateProfile({ name, surname, measurementSystem, language: newLang }).catch(console.error);
                                    }
                                }}
                                className="poe-select poe-focus-ring rounded-lg text-xs font-bold py-1 pl-2 pr-6 transition-colors cursor-pointer appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23b8a78f' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                            >
                                <option value="en">🇺🇸 English</option>
                                <option value="pt-BR">🇧🇷 Português</option>
                            </select>
                        </div>

                        <button
                            onClick={() => { setIsDropdownOpen(false); router.push('/settings'); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-poe-text2 font-bold hover:bg-poe-surface2 transition-colors text-sm poe-focus-ring"
                        >
                            <i className="fas fa-cog w-4 text-center text-poe-text2"></i>
                            {t('nav.settings')}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-poe-danger font-bold hover:bg-poe-surface2 transition-colors text-sm poe-focus-ring"
                        >
                            <i className="fas fa-sign-out-alt w-4 text-center"></i>
                            {t('nav.logout')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
