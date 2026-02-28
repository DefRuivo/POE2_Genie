'use client';

import React, { useState, useEffect } from 'react';

import { storageService } from '@/services/storageService';
import { useTranslation } from '@/hooks/useTranslation';
import { ShareButtons } from '@/components/ShareButtons';
import { CodeInput } from '@/components/ui/CodeInput';
import { MessageDialog } from '@/components/MessageDialog';
import { ICON_ACCENT_CLASS, ICON_MAP } from '@/lib/ui/icon-map';

export default function HideoutsPage() {
    const { t } = useTranslation();

    const [user, setUser] = useState<any>(null);
    const [newKitchenName, setNewKitchenName] = useState('');
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [errorDialog, setErrorDialog] = useState({ isOpen: false, message: '', title: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const u = await storageService.getCurrentUser();
            if (u && u.user) setUser(u.user);
        } catch (err) {
            console.error("Failed to load user", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKitchen = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKitchenName.trim()) return;

        try {
            await storageService.createHideout(newKitchenName);
            setNewKitchenName('');
            await loadData(); // Reload list
        } catch (err) {
            console.error("Failed to create hideout", err);
        } finally {
            window.dispatchEvent(new Event('hideouts-updated'));
            window.dispatchEvent(new Event('kitchens-updated'));
        }
    };

    const handleSwitchKitchen = async (kitchenId: string) => {
        try {
            await storageService.switchHideout(kitchenId);
            window.location.href = '/';
        } catch (err) {
            console.error("Failed to switch hideout", err);
        }
    };

    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Leave Hideout State
    const [leaveTargetId, setLeaveTargetId] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [editingKitchenId, setEditingKitchenId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const getMembershipRoleLabel = (membership: { role?: string; isGuest?: boolean }) => {
        if (membership.role === 'ADMIN') return t('members.admin');
        if (membership.isGuest) return t('members.guest');
        return t('members.member');
    };

    const handleEditStart = (kitchen: any) => {
        setEditingKitchenId(kitchen.id);
        setEditName(kitchen.name);
    };

    const handleEditSave = async (kitchenId: string) => {
        try {
            await storageService.updateHideout(kitchenId, editName);
            setEditingKitchenId(null);
            await loadData();
            window.dispatchEvent(new Event('hideouts-updated'));
            window.dispatchEvent(new Event('kitchens-updated'));
        } catch (err) {
            console.error("Failed to update hideout", err);
            setErrorMessage(t('common.error') || "Failed to update hideout");
            setTimeout(() => setErrorMessage(null), 3000);
        }
    };

    const handleDeleteClick = (kitchenId: string) => {
        setDeleteTargetId(kitchenId);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        setIsDeleting(true);
        try {
            await storageService.deleteHideout(deleteTargetId);
            await loadData();
            window.dispatchEvent(new Event('hideouts-updated'));
            window.dispatchEvent(new Event('kitchens-updated'));
            if (user?.currentKitchenId === deleteTargetId) {
                window.location.reload();
            }
            setDeleteTargetId(null);
        } catch (err) {
            console.error("Failed to delete hideout", err);
            setErrorMessage(t('common.error') || "Failed to delete hideout");
            setTimeout(() => setErrorMessage(null), 3000);
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmLeave = async () => {
        if (!leaveTargetId) return;
        setIsLeaving(true);
        try {
            await storageService.leaveHideout(leaveTargetId);

            // Auto-switch logic
            // We need updated memberships. Since query is stale, we filter locally from `user.kitchenMemberships`
            const remaining = user?.kitchenMemberships?.filter((m: any) => m.id !== leaveTargetId) || [];

            if (remaining.length > 0) {
                // Sort: ADMIN first, then others. Assuming existing order is chronological or ID based.
                const nextKitchen = remaining.sort((a: any, b: any) => {
                    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
                    if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
                    return 0;
                })[0];

                await storageService.switchHideout(nextKitchen.kitchenId);
                window.location.href = '/';
            } else {
                // No kitchens left
                await loadData();
                window.location.reload();
            }

            setLeaveTargetId(null);
        } catch (err) {
            console.error("Failed to leave hideout", err);
            setErrorMessage(t('common.error') || "Failed to leave hideout");
            setTimeout(() => setErrorMessage(null), 3000);
        } finally {
            setIsLeaving(false);
        }
    };

    const handleJoinKitchen = async () => {
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
                message: t(err.message) || err.message
            });
        } finally {
            setJoining(false);
        }
    };

    return (
        <>

            {/* Error Toast */}
            {errorMessage && (
                <div className="fixed top-4 right-4 z-50 poe-status-danger px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-2">
                    <i className="fas fa-exclamation-circle"></i>
                    {errorMessage}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="poe-surface rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200 border border-poe-borderStrong">
                        <div className="w-12 h-12 poe-status-danger rounded-full flex items-center justify-center text-xl mx-auto">
                            <i className="fas fa-trash-alt"></i>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-poe-text1">{t('kitchens.deleteTitle')}</h3>
                            <p className="text-sm text-poe-text2">{t('kitchens.deleteConfirm')}</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteTargetId(null)}
                                className="flex-1 px-4 py-2 poe-card hover:brightness-110 text-poe-text1 rounded-xl font-bold transition-colors poe-focus-ring"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 poe-btn-danger poe-focus-ring rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting && <i className="fas fa-spinner fa-spin"></i>}
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Confirmation Modal */}
            {leaveTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="poe-surface rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200 border border-poe-borderStrong">
                        <div className="w-12 h-12 poe-status-warning rounded-full flex items-center justify-center text-xl mx-auto">
                            <i className="fas fa-sign-out-alt"></i>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-poe-text1">{t('kitchens.leaveTitle')}</h3>
                            <p className="text-sm text-poe-text2">{t('kitchens.leaveConfirm')}</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setLeaveTargetId(null)}
                                className="flex-1 px-4 py-2 poe-card hover:brightness-110 text-poe-text1 rounded-xl font-bold transition-colors poe-focus-ring"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmLeave}
                                disabled={isLeaving}
                                className="flex-1 px-4 py-2 poe-btn-primary poe-focus-ring rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLeaving && <i className="fas fa-spinner fa-spin"></i>}
                                {t('kitchens.leave')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 pt-6 pb-32 space-y-6 animate-in fade-in duration-500">
                <header className="flex items-start justify-between mb-8">
                    <div className="poe-section-marker poe-section-hideouts flex-1 mr-4">
                         <div className="flex items-center gap-3 mb-2">
                            <i className={`${ICON_MAP.hideouts} ${ICON_ACCENT_CLASS.hideouts} text-xl`}></i>
                            <h1 className="text-3xl font-black poe-title tracking-tight">{t('kitchens.title')}</h1>
                        </div>
                        <p className="text-poe-text2 font-medium">{t('kitchens.subtitle') || t('nav.kitchens')}</p>
                    </div>
                </header>
                {loading ? (
                    <div className="text-center py-20 text-poe-text2 font-bold animate-pulse">{t('kitchens.loading')}</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                            {/* Create New Kitchen */}
                            <section className="poe-card poe-section-marker poe-section-hideouts p-6 rounded-3xl shadow-xl border border-poe-borderStrong flex flex-col h-full">
                                <h2 className="font-bold text-lg text-poe-text1 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 poe-accent-stash-soft rounded-lg flex items-center justify-center text-sm"><i className="fas fa-plus"></i></span>
                                    {t('kitchens.createTitle')}
                                </h2>
                                <form onSubmit={handleCreateKitchen} className="flex flex-col gap-4 mt-auto">
                                    <input
                                        type="text"
                                        placeholder={t('kitchens.createPlaceholder')}
                                        className="w-full poe-input poe-focus-ring rounded-xl px-4 py-3 font-bold transition-all placeholder:text-poe-text2 placeholder:font-medium"
                                        value={newKitchenName}
                                        onChange={(e) => setNewKitchenName(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newKitchenName.trim()}
                                        className="w-full px-6 py-4 poe-btn-primary poe-focus-ring rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/30 transition-all font-black uppercase tracking-wide"
                                    >
                                        {t('kitchens.create')}
                                    </button>
                                </form>
                            </section>

                            {/* Join Kitchen */}
                            <section className="poe-card poe-section-marker poe-section-hideouts p-6 rounded-3xl shadow-xl border border-poe-borderStrong flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">
                                <h2 className="font-bold text-lg text-poe-text1 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 poe-accent-settings-soft rounded-lg flex items-center justify-center text-sm"><i className={`${ICON_MAP.invite} ${ICON_ACCENT_CLASS.invite}`}></i></span>
                                    {t('actions.haveCode')}
                                </h2>
                                <div className="flex flex-col gap-4 mt-auto">
                                    <div className="w-full">
                                        <CodeInput
                                            onChange={setJoinCode}
                                            disabled={joining}
                                        />
                                    </div>
                                    <button
                                        onClick={handleJoinKitchen}
                                        disabled={joining || joinCode.length !== 6}
                                        className="w-full px-8 py-4 poe-btn-primary poe-focus-ring rounded-xl font-black uppercase tracking-wide shadow-lg shadow-black/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {joining ? <i className="fas fa-spinner fa-spin"></i> : t('actions.joinCode')}
                                    </button>
                                </div>
                            </section>
                        </div>

                        {/* Current Membership List */}
                        <section className="space-y-4">
                            <h2 className="text-sm font-black text-poe-text2 uppercase tracking-widest px-1">{t('kitchens.yourKitchens')}</h2>
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
                                {user?.kitchenMemberships?.filter((m: any) => !m.kitchen.deletedAt).map((m: any) => (
                                    <div key={m.id} className={`poe-card p-6 rounded-3xl shadow-sm border flex flex-col gap-6 transition-all ${m.kitchenId === user.currentKitchenId ? 'border-poe-sectionHideouts ring-2 ring-poe-sectionHideouts' : 'border-poe-border hover:border-poe-borderStrong'}`}>

                                        {/* Row 1: Header (Icon + Info + Actions) */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner flex-shrink-0 ${m.kitchenId === user.currentKitchenId ? 'poe-accent-stash-soft' : 'poe-card text-poe-text2 border border-poe-border'}`}>
                                                    <i className="fas fa-shield-halved"></i>
                                                </div>
                                                <div className="flex-1">
                                                    {editingKitchenId === m.kitchen.id ? (
                                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                                            <input
                                                                className="poe-input poe-focus-ring border rounded-xl px-3 py-2 font-bold text-base w-full transition-colors"
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleEditSave(m.kitchen.id);
                                                                    if (e.key === 'Escape') setEditingKitchenId(null);
                                                                }}
                                                            />
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleEditSave(m.kitchen.id)} className="px-3 py-1 poe-status-success rounded-lg text-xs font-bold transition-colors poe-focus-ring hover:brightness-110">
                                                                    <i className="fas fa-check mr-1"></i> {t('common.save')}
                                                                </button>
                                                                <button onClick={() => setEditingKitchenId(null)} className="px-3 py-1 poe-card text-poe-text2 hover:brightness-110 rounded-lg text-xs font-bold transition-colors poe-focus-ring">
                                                                    <i className="fas fa-times mr-1"></i> {t('common.cancel')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <h3 className="font-bold text-lg text-poe-text1 leading-tight">{m.kitchen.name}</h3>
                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                {m.kitchenId === user.currentKitchenId && <span className="inline-block px-2 py-0.5 poe-accent-stash-soft text-[10px] uppercase font-bold rounded-full tracking-wide">{t('kitchens.active')}</span>}
                                                                <span className="px-2 py-0.5 poe-card text-poe-text2 border border-poe-border text-[10px] uppercase font-bold rounded-full tracking-wide">
                                                                    {getMembershipRoleLabel(m)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions (Switch, Edit, Delete) - Grouped to right */}
                                            <div className="flex items-center gap-2">
                                                {m.role === 'ADMIN' && !editingKitchenId && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditStart(m.kitchen)}
                                                            className="w-10 h-10 flex items-center justify-center poe-card border border-poe-border rounded-xl text-poe-text2 hover:text-poe-text1 transition-colors poe-focus-ring"
                                                            title={t('common.edit') === 'common.edit' ? 'Edit Kitchen' : `${t('common.edit')} ${t('nav.kitchens')}`}
                                                        >
                                                            <i className="fas fa-pen"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(m.kitchen.id)}
                                                            className="w-10 h-10 flex items-center justify-center poe-card border border-poe-border rounded-xl text-poe-text2 hover:text-poe-danger hover:border-poe-danger transition-colors poe-focus-ring"
                                                            title={t('common.delete') === 'common.delete' ? 'Delete Kitchen' : `${t('common.delete')} ${t('nav.kitchens')}`}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </>
                                                )}
                                                {m.kitchenId !== user.currentKitchenId && !editingKitchenId && (
                                                    <button
                                                        onClick={() => handleSwitchKitchen(m.kitchenId)}
                                                        className="px-4 py-2.5 poe-btn-primary poe-focus-ring rounded-xl font-bold text-sm transition-colors whitespace-nowrap"
                                                    >
                                                        {t('kitchens.switch')}
                                                    </button>
                                                )}
                                            </div>
                                            {m.role !== 'ADMIN' && !editingKitchenId && (
                                                <button
                                                    onClick={() => setLeaveTargetId(m.id)}
                                                    className="w-10 h-10 flex items-center justify-center poe-card border border-poe-border rounded-xl text-poe-text2 hover:text-poe-danger hover:border-poe-danger transition-colors poe-focus-ring"
                                                    title={t('kitchens.leave') || "Leave Hideout"}
                                                >
                                                    <i className="fas fa-sign-out-alt"></i>
                                                </button>
                                            )}
                                        </div>

                                        {/* Row 2: Invite Code (Full Width or block) */}
                                        {/* Hide for guests */}
                                        {!m.isGuest && (
                                            <div className="w-full poe-card border border-poe-border rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-poe-text2 uppercase tracking-wider leading-none mb-1">{t('kitchens.inviteCode')}</span>
                                                    <span className="font-mono font-bold text-poe-text1 tracking-wider text-base select-all">{m.kitchen.inviteCode || 'N/A'}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(m.kitchen.inviteCode);
                                                            setCopiedId(m.id);
                                                            setTimeout(() => setCopiedId(null), 2000);
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center poe-card border border-poe-border rounded-lg text-poe-text2 hover:text-poe-text1 hover:border-poe-borderStrong transition-all shadow-sm active:scale-95 poe-focus-ring"
                                                        title={t('members.clickToCopy')}
                                                    >
                                                        <i className={`fas ${copiedId === m.id ? 'fa-check text-poe-success' : 'fa-copy'}`}></i>
                                                    </button>

                                                    {/* Social Share Buttons */}
                                                    <ShareButtons
                                                        text={`${t('members.shareCode')} ${m.kitchen.inviteCode}`}
                                                    />

                                                    {m.role === 'ADMIN' && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(t('kitchens.regenerateConfirm'))) return;
                                                                const { refreshKitchenCode } = await import('@/app/actions');
                                                                const result = await refreshKitchenCode(m.kitchenId);
                                                                if (result.success) {
                                                                    await loadData();
                                                                } else {
                                                                    console.error(result.error);
                                                                }
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center poe-card border border-poe-border rounded-lg text-poe-text2 hover:text-poe-sectionHideouts hover:border-poe-sectionHideouts transition-colors shadow-sm poe-focus-ring"
                                                            title={t('kitchens.regenerateConfirm')}
                                                        >
                                                            <i className="fas fa-sync-alt"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Member Management Shortcut (Active Kitchen Only) */}
                                        {m.kitchenId === user.currentKitchenId && (
                                            <div className="flex justify-end pt-2 border-t border-poe-border">
                                                <a
                                                    href="/party"
                                                    className="flex items-center gap-2 text-poe-sectionParty hover:brightness-110 text-sm font-bold transition-colors group"
                                                >
                                                    <span className="group-hover:underline">{t('nav.members')}</span>
                                                    <i className="fas fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>


                    </>
                )}
            </main>
            <MessageDialog
                isOpen={errorDialog.isOpen}
                onClose={() => setErrorDialog({ ...errorDialog, isOpen: false })}
                title={errorDialog.title}
                message={errorDialog.message}
                type="error"
            />
        </>
    );
}
