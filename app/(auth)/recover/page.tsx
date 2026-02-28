'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function RecoverPage() {
    const { t, lang } = useTranslation();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        // Simulate API call
        try {
            const res = await fetch('/api/auth/recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, language: lang }),
            });
            const data = await res.json();
            setMessage(data.message);
            setStatus('success');
        } catch (e) {
            setMessage(t('common.error'));
            setStatus('idle'); // Or error state
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-md w-full poe-surface rounded-3xl shadow-xl p-10 border border-poe-borderStrong text-center">
                    <div className="w-16 h-16 poe-status-success rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-check text-2xl"></i>
                    </div>
                    <h2 className="text-2xl font-black poe-title mb-4">{t('auth.checkEmailTitle')}</h2>
                    <p className="text-poe-text2 mb-8">{message}</p>
                    <Link href="/login" className="block w-full py-4 poe-btn-primary poe-focus-ring rounded-xl font-bold transition-colors">
                        {t('auth.backToLogin')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full poe-surface rounded-3xl shadow-xl p-10 border border-poe-borderStrong">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black poe-title tracking-tight mb-2">{t('auth.recoverTitle')}</h1>
                    <p className="text-poe-text2 font-medium">{t('auth.recoverSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-poe-text2 uppercase tracking-widest mb-2">{t('auth.email')}</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl poe-input poe-focus-ring transition-colors font-medium"
                            placeholder={t('members.emailPlaceholder')}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full py-4 poe-btn-primary poe-focus-ring rounded-xl font-black shadow-lg shadow-black/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {status === 'loading' ? <i className="fas fa-circle-notch fa-spin"></i> : t('auth.sendInstructions')}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <Link href="/login" className="text-poe-text2 font-bold hover:text-poe-text1 text-sm">
                        &larr; {t('auth.backToLogin')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
