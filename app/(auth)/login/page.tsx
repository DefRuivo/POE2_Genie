'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function LoginPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 'auth.unverified') {
                    throw new Error(t('auth.unverifiedError'));
                }
                throw new Error(data.error || t('common.error'));
            }

            // Force a hard refresh to update server components/middleware state if needed,
            // or just push to home. Simple push is usually enough if middleware checks cookies.
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full poe-surface rounded-3xl shadow-xl p-10 border border-poe-borderStrong">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl poe-accent-party-soft mb-6 shadow-lg shadow-black/20">
                        <i className="fas fa-shield-halved text-2xl"></i>
                    </div>
                    <h1 className="text-3xl font-black poe-title tracking-tight mb-2">{t('auth.loginTitle')}</h1>
                    <p className="text-poe-text2 font-medium">{t('auth.loginSubtitle')}</p>
                </div>

                {error && (
                    <div className="poe-status-danger p-4 rounded-xl mb-6 text-sm font-bold">
                        {error}
                        {error === t('auth.unverifiedError') && (
                            <div className="mt-3 pt-3 border-t border-poe-danger">
                                {resendStatus === 'sent' ? (
                                    <div className="text-poe-success flex items-center gap-2">
                                        <i className="fas fa-check-circle"></i>
                                        {t('auth.verificationResent')}
                                    </div>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            setResendStatus('sending');
                                            try {
                                                const res = await fetch('/api/auth/resend-verification', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ email }),
                                                });
                                                if (res.ok) {
                                                    setResendStatus('sent');
                                                } else {
                                                    setResendStatus('error');
                                                }
                                            } catch (e) {
                                                setResendStatus('error');
                                            }
                                        }}
                                        disabled={resendStatus === 'sending'}
                                        className="text-xs uppercase tracking-wider font-black text-poe-danger underline hover:no-underline disabled:opacity-50 disabled:no-underline flex items-center gap-2 poe-focus-ring rounded-lg"
                                        type="button"
                                    >
                                        {resendStatus === 'sending' && <i className="fas fa-circle-notch fa-spin"></i>}
                                        {resendStatus === 'error' ? t('auth.resendError') : t('auth.resendVerification')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

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

                    <div>
                        <label className="block text-xs font-black text-poe-text2 uppercase tracking-widest mb-2">{t('auth.password')}</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl poe-input poe-focus-ring transition-colors font-medium"
                            placeholder="••••••••"
                        />
                        <div className="text-right mt-2">
                            <Link href="/recover" className="text-sm font-bold text-poe-sectionSettings hover:text-poe-info">
                                {t('auth.forgotPassword')}
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 poe-btn-primary poe-focus-ring rounded-xl font-black shadow-lg shadow-black/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <i className="fas fa-circle-notch fa-spin"></i> : t('auth.loginBtn')}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-poe-text2 font-medium">
                        {t('auth.noAccount')}{' '}
                        <Link href="/register" className="text-poe-sectionBuilds font-black hover:underline">
                            {t('auth.signupBtn')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
