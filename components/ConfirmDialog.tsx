'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

export const ConfirmDialog: React.FC<Props> = ({ isOpen, onClose, onConfirm, title, message }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="poe-surface rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-poe-borderStrong animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-black poe-title mb-4">{title}</h3>
                <p className="text-poe-text2 mb-8 leading-relaxed font-medium">
                    {message}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-poe-text2 hover:bg-poe-surface2 border border-transparent hover:border-poe-border transition-colors poe-focus-ring"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-6 py-3 rounded-xl font-bold poe-btn-danger shadow-lg shadow-black/40 transition-colors poe-focus-ring"
                    >
                        {t('common.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};
