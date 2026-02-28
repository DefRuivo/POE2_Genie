"use client";

import React, { useEffect, useState, useCallback } from 'react';

import { storageService } from '../../services/storageService';
import { MeasurementSystem, Language } from '../../types';
import { useTranslation } from '@/hooks/useTranslation';
import { useApp } from '@/components/Providers';
import { PasswordFields } from '@/components/PasswordFields';
import { PasswordInput } from '@/components/PasswordInput';
import { ICON_ACCENT_CLASS, ICON_MAP } from '@/lib/ui/icon-map';

export default function SettingsPage() {
    const [, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const { t } = useTranslation();
    const { setLanguage: setGlobalLanguage, language: globalLanguage } = useApp();

    // Form State
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>('METRIC');
    const [language, setLanguage] = useState<Language>('en');
    const [password, setPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [isPasswordValid, setIsPasswordValid] = useState(true);
    const [formResetKey, setFormResetKey] = useState(0); // Default true because empty is valid for settings

    const loadUser = useCallback(async () => {
        try {
            const data = await storageService.getCurrentUser();
            if (data && data.user) {
                setUser(data.user);
                setName(data.user.name);
                setSurname(data.user.surname);
                setEmail(data.user.email);
                setMeasurementSystem(data.user.measurementSystem || 'METRIC');
                setLanguage(data.user.language || 'en');
                setGlobalLanguage(data.user.language || 'en'); // Sync global state
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [setGlobalLanguage]);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    // Sync from Global State -> Local Form State
    useEffect(() => {
        if (globalLanguage && globalLanguage !== language) {
            setLanguage(globalLanguage);
        }
    }, [globalLanguage, language]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);

        // Logic: 
        // 1. If password field is empty, isPasswordValid might be false (default from component if empty?), 
        //    BUT we want to allow saving if no password change is intended.
        //    However, our state `password` is updated.
        //    If `password` is NOT empty, we check `isPasswordValid`.
        //    If `password` IS empty, we proceed (no password update).

        if (password && !isPasswordValid) {
            // If password has content but is invalid (mismatch/short), blocking.
            // Rely on component to show error, but we also block here.
            setMessage({ type: 'error', text: t('settings.updateError') || 'Please fix the errors.' });
            setSaving(false);
            return;
        }

        try {
            const updates = {
                name,
                surname,
                measurementSystem,
                language,
                password: password || undefined,
                currentPassword: password ? currentPassword : undefined
            };

            await storageService.updateProfile(updates);
            setGlobalLanguage(language); // Update app state immediately

            setMessage({ type: 'success', text: t('settings.updateSuccess') });
            setPassword('');
            setCurrentPassword('');
            setFormResetKey(prev => prev + 1);

            // Reload to ensure sync
            loadUser();
        } catch (err: any) {
            if (err.message === 'Invalid current password') {
                setMessage({ type: 'error', text: t('settings.invalidCurrentPassword') });
            } else {
                setMessage({ type: 'error', text: err.message || t('settings.updateError') });
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <i className="fas fa-circle-notch fa-spin text-4xl text-poe-sectionSettings"></i>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 mt-8 pb-20 space-y-8">
            <header className="poe-section-marker poe-section-settings">
                <h1 className="text-3xl font-black poe-title tracking-tight mb-2 flex items-center gap-3">
                    <i className={`${ICON_MAP.settings} ${ICON_ACCENT_CLASS.settings}`}></i>
                    {t('settings.title')}
                </h1>
                <p className="poe-text-muted font-medium">{t('settings.subtitle')}</p>
            </header>


            {message && (
                <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${message.type === 'success' ? 'poe-status-success' : 'poe-status-danger'
                    }`}>
                    <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-lg`}></i>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Main Column: Profile & Security */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Personal Information */}
                    <section className="poe-card poe-section-marker poe-section-party p-6 rounded-[2rem] border border-poe-borderStrong shadow-sm space-y-6">
                        <h2 className="text-xl font-black poe-title flex items-center gap-3">
                            <i className="fas fa-user-circle text-poe-sectionParty"></i>
                            {t('settings.profile')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-poe-text2 uppercase tracking-wider">{t('settings.firstName')}</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl poe-input poe-focus-ring font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-poe-text2 uppercase tracking-wider">{t('settings.lastName')}</label>
                                <input
                                    type="text"
                                    value={surname}
                                    onChange={e => setSurname(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl poe-input poe-focus-ring font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-poe-text2 uppercase tracking-wider">{t('settings.email')}</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-3 rounded-xl bg-poe-surface1 border border-poe-border text-poe-text2 font-bold cursor-not-allowed"
                            />
                            <p className="text-[10px] text-poe-text2 font-bold">{t('settings.emailNote')}</p>
                        </div>
                    </section>

                    {/* Security */}
                    <section className="poe-card poe-section-marker poe-section-checklist p-6 rounded-[2rem] border border-poe-borderStrong shadow-sm space-y-6">
                        <h2 className="text-xl font-black poe-title flex items-center gap-3">
                            <i className="fas fa-lock text-poe-sectionChecklist"></i>
                            {t('settings.security')}
                        </h2>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-poe-text2 uppercase tracking-wider">{t('settings.currentPassword')}</label>
                            <PasswordInput
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="poe-input"
                            />
                            <p className="text-[10px] text-poe-text2 font-bold">{t('settings.currentPasswordNote')}</p>
                        </div>

                        <PasswordFields
                            key={formResetKey}
                            showLabels={true}
                            onChange={(isValid, val) => {
                                setPassword(val);
                                setIsPasswordValid(isValid);
                            }}
                        />
                    </section>
                </div>

                {/* Sidebar Column: Preferences */}
                <div className="space-y-8">
                    <section className="poe-card poe-section-marker poe-section-settings p-6 rounded-[2rem] border border-poe-borderStrong shadow-sm space-y-6">
                        <h2 className="text-xl font-black poe-title flex items-center gap-3">
                            <i className="fas fa-sliders-h text-poe-sectionSettings"></i>
                            {t('settings.preferences')}
                        </h2>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-poe-text2 uppercase tracking-wider">{t('settings.language')}</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLanguage('en');
                                        setGlobalLanguage('en');
                                    }}
                                    className={`flex-1 p-4 rounded-xl border transition-all font-black flex flex-col items-center gap-2 poe-focus-ring ${language === 'en'
                                        ? 'poe-accent-settings-soft'
                                        : 'poe-card border-poe-border text-poe-text2 hover:border-poe-borderStrong'
                                        }`}
                                >
                                    <span className="text-2xl">🇺🇸</span>
                                    English
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLanguage('pt-BR');
                                        setGlobalLanguage('pt-BR');
                                    }}
                                    className={`flex-1 p-4 rounded-xl border transition-all font-black flex flex-col items-center gap-2 poe-focus-ring ${language === 'pt-BR'
                                        ? 'poe-accent-settings-soft'
                                        : 'poe-card border-poe-border text-poe-text2 hover:border-poe-borderStrong'
                                        }`}
                                >
                                    <span className="text-2xl">🇧🇷</span>
                                    Português
                                </button>
                            </div>
                        </div>

                    </section>
                </div>

                <div className="col-span-full flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving || (password.length > 0 && (!isPasswordValid || currentPassword.length === 0))}
                        className="px-8 py-4 poe-btn-primary poe-focus-ring font-black rounded-2xl transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                        {saving && <i className="fas fa-circle-notch fa-spin"></i>}
                        {saving ? t('common.loading') : t('common.save')}
                    </button>
                </div>

            </form>
        </div>
    );
}
