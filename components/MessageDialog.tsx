'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success';
}

export const MessageDialog: React.FC<Props> = ({ isOpen, onClose, title, message, type = 'info' }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'error': return 'fa-circle-xmark text-poe-danger';
            case 'success': return 'fa-circle-check text-poe-success';
            default: return 'fa-circle-info text-poe-info';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div
                className="poe-surface rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-poe-borderStrong animate-in zoom-in-95 duration-300 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative background element */}
                <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 ${type === 'error' ? 'bg-poe-danger' : 'bg-poe-info'}`}></div>

                <div className="text-center">
                    <div className={`w-20 h-20 rounded-3xl mb-6 mx-auto flex items-center justify-center text-4xl shadow-sm border ${
                        type === 'error'
                            ? 'poe-status-danger'
                            : type === 'success'
                                ? 'poe-status-success'
                                : 'poe-status-info'
                        }`}>
                        <i className={`fas ${getIcon()}`}></i>
                    </div>

                    <h3 className="text-2xl font-black poe-title mb-3 tracking-tight">{title}</h3>
                    <p className="text-poe-text2 mb-8 leading-relaxed font-medium">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 poe-focus-ring ${
                            type === 'error' ? 'poe-btn-danger shadow-black/40' : 'poe-btn-primary shadow-black/40'
                        }`}
                    >
                        {t('common.ok') || 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
};
