'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { PasswordFields } from '@/components/PasswordFields';

function RegisterForm() {
    const searchParams = useSearchParams();
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
    });

    const [password, setPassword] = useState('');
    const [isPasswordValid, setIsPasswordValid] = useState(false);

    // Populate email from URL if present
    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setFormData(prev => ({ ...prev, email: emailParam }));
        }
    }, [searchParams]);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasswordValid) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    surname: formData.surname,
                    email: formData.email,
                    password: password
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t('common.error'));
            }

            // Show success message
            setRegisteredEmail(formData.email);
            setSuccess(true);
            setFormData({ name: '', surname: '', email: '' });
            setPassword('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-10">
                <div className="max-w-md w-full poe-surface rounded-3xl shadow-xl p-10 border border-poe-borderStrong text-center">
                    <div className="mb-6">
                        <div className="w-20 h-20 poe-status-success rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-poe-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black poe-title mb-2">{t('auth.checkEmailTitle')}</h1>
                        <p className="text-poe-text2">
                            {t('auth.checkEmailSent').replace('{email}', registeredEmail)}
                        </p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-poe-text2">
                            {t('auth.checkEmailSpam')}
                        </p>
                        <Link href="/login" className="block w-full py-3 poe-card hover:brightness-110 text-poe-text1 rounded-xl font-bold transition-colors poe-focus-ring">
                            {t('auth.backToLogin')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="max-w-md w-full poe-surface rounded-3xl shadow-xl p-10 border border-poe-borderStrong">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black poe-title tracking-tight mb-2">{t('auth.registerTitle')}</h1>
                    <p className="text-poe-text2 font-medium">{t('auth.registerSubtitle')}</p>
                </div>

                {error && (
                    <div className="poe-status-danger p-4 rounded-xl mb-6 text-sm font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-poe-text2 uppercase tracking-widest mb-2">{t('auth.firstName')}</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl poe-input poe-focus-ring transition-colors font-medium"
                                placeholder={t('members.namePlaceholder')}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-poe-text2 uppercase tracking-widest mb-2">{t('auth.lastName')}</label>
                            <input
                                type="text"
                                required
                                value={formData.surname}
                                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl poe-input poe-focus-ring transition-colors font-medium"
                                placeholder={t('members.namePlaceholder').replace("Grandma", "Doe")}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-poe-text2 uppercase tracking-widest mb-2">{t('auth.email')}</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl poe-input poe-focus-ring transition-colors font-medium"
                            placeholder={t('members.emailPlaceholder')}
                        />
                    </div>

                    <PasswordFields
                        disabled={loading}
                        passwordLabel={t('auth.password')}
                        confirmPasswordLabel={t('auth.confirmPassword')}
                        onChange={(isValid, val) => {
                            setIsPasswordValid(isValid);
                            setPassword(val);
                        }}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 poe-btn-primary poe-focus-ring rounded-xl font-black shadow-lg shadow-black/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <i className="fas fa-circle-notch fa-spin"></i> : t('auth.signupBtn')}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-poe-text2 font-medium">
                        {t('auth.hasAccount')}{' '}
                        <Link href="/login" className="text-poe-sectionBuilds font-black hover:underline">
                            {t('auth.loginBtn')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <i className="fas fa-circle-notch fa-spin text-4xl text-poe-sectionBuilds"></i>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
