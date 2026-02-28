'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { storageService } from '@/services/storageService';
import { Hideout, PartyMember } from '@/types';
import { TagInput } from '@/components/ui/TagInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';

import { useTranslation } from '@/hooks/useTranslation';
import { ICON_ACCENT_CLASS, ICON_MAP } from '@/lib/ui/icon-map';

export default function PartyPage() {
    const { t } = useTranslation();

    const [members, setMembers] = useState<PartyMember[]>([]);
    const [kitchen, setKitchen] = useState<Hideout | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberIsGuest, setNewMemberIsGuest] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [copied, setCopied] = useState(false);

    const [editingMember, setEditingMember] = useState<PartyMember | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [currentUserMember, setCurrentUserMember] = useState<PartyMember | null>(null);

    // Leave Hideout State
    const [leaveTargetId, setLeaveTargetId] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);

    // Controlled state for Tags
    const [likesTags, setLikesTags] = useState<string[]>([]);
    const [dislikesTags, setDislikesTags] = useState<string[]>([]);
    const [restrictionsTags, setRestrictionsTags] = useState<string[]>([]);

    const loadMembers = useCallback(async () => {
        try {
            const data = await storageService.getPartyMembers();
            setMembers(data);
            const kitchenData = await storageService.getCurrentHideout();
            setKitchen(kitchenData);

            // Identify current user member
            const userProfile = await storageService.getCurrentUser();
            if (userProfile?.user?.id) {
                // Find member record linked to this user for the *current* kitchen
                // Note: The members list is already for the current kitchen context
                const currentMember = data.find(m => m.userId === userProfile.user.id);
                setCurrentUserMember(currentMember || null);
            }
        } catch (err) {
            console.error("Failed to load members", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    // Calculate unique suggestions from existing members
    const { allLikes, allDislikes, allRestrictions } = useMemo(() => {
        const l = new Set<string>();
        const d = new Set<string>();
        const r = new Set<string>();
        members.forEach(m => {
            m.likes?.forEach(tag => l.add(tag));
            m.dislikes?.forEach(tag => d.add(tag));
            m.restrictions?.forEach(tag => r.add(tag));
        });
        return {
            allLikes: Array.from(l),
            allDislikes: Array.from(d),
            allRestrictions: Array.from(r)
        };
    }, [members]);

    const handleSaveMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberName.trim()) return;

        setIsAdding(true);
        try {
            const memberData: any = {
                name: newMemberName,
                email: newMemberEmail || undefined,
                isGuest: newMemberIsGuest,
                likes: likesTags,
                dislikes: dislikesTags,
                restrictions: restrictionsTags
            };

            if (editingMember) {
                memberData.id = editingMember.id;
            }

            await storageService.savePartyMember(memberData);

            // Reset
            setNewMemberName('');
            setNewMemberEmail('');
            setNewMemberIsGuest(true);
            setEditingMember(null);
            setLikesTags([]);
            setDislikesTags([]);
            setRestrictionsTags([]);

            await loadMembers();
        } catch (err: any) {
            console.error("Failed to save member", err);
            alert(err.message || t('common.error'));
        } finally {
            setIsAdding(false);
        }
    };

    const handleEditClick = (member: PartyMember) => {
        setEditingMember(member);
        setNewMemberName(member.name);
        setNewMemberEmail(member.email || '');
        setNewMemberIsGuest(member.isGuest !== undefined ? member.isGuest : true);
        setLikesTags(member.likes || []);
        setDislikesTags(member.dislikes || []);
        setRestrictionsTags(member.restrictions || []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingMember(null);
        setNewMemberName('');
        setNewMemberEmail('');
        setNewMemberIsGuest(true);
        setLikesTags([]);
        setDislikesTags([]);
        setRestrictionsTags([]);
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await storageService.deletePartyMember(confirmDeleteId);
            if (editingMember?.id === confirmDeleteId) handleCancelEdit();
            await loadMembers();
        } catch (err) {
            console.error("Failed to delete member", err);
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const handleShareCode = (platform: 'whatsapp' | 'telegram') => {
        if (!kitchen?.inviteCode) return;

        const text = `${t('members.shareCode')}: ${kitchen.inviteCode}`;
        const encodedText = encodeURIComponent(text);

        switch (platform) {
            case 'whatsapp': window.open(`https://wa.me/?text=${encodedText}`, '_blank'); break;
            case 'telegram': window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodedText}`, '_blank'); break;
        }
    };

    const confirmLeave = async () => {
        if (!leaveTargetId) return;
        setIsLeaving(true);
        try {
            await storageService.leaveHideout(leaveTargetId);

            // Auto-switch logic (Fetch fresh user data to get full membership list)
            const userProfile = await storageService.getCurrentUser();
            const allMemberships = userProfile?.user?.kitchenMemberships || [];

            // We just left one, so filter it out if API hasn't cleared it yet (unlikely if we just fetched)
            // Actually, `getCurrentUser` might be slightly stale or current token issues. 
            // Better to fetch fresh? `getCurrentUser` fetches `/auth/me`.
            const remaining = allMemberships.filter((m: any) => m.id !== leaveTargetId);

            if (remaining.length > 0) {
                // Sort: ADMIN first
                const nextKitchen = remaining.sort((a: any, b: any) => {
                    if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
                    if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
                    return 0;
                })[0];

                await storageService.switchHideout(nextKitchen.kitchenId);
                window.location.href = '/';
            } else {
                setMembers(prev => prev.filter(m => m.id !== leaveTargetId));
                window.location.reload();
            }
        } catch (err) {
            console.error("Failed to leave hideout", err);
            alert(t('common.error'));
        } finally {
            setLeaveTargetId(null);
            setIsLeaving(false);
        }
    };

    // Fail-safe: If loading or user not found, assume guest/hidden to prevent flash
    const canShowForm = !loading && currentUserMember && (!currentUserMember.isGuest || (currentUserMember.isGuest && editingMember?.id === currentUserMember.id));

    return (
        <>
            <main className="max-w-7xl mx-auto px-4 pt-6 pb-32 space-y-6 animate-in fade-in duration-500">
                <header className="flex items-start justify-between mb-8">
                    <div className="poe-section-marker poe-section-party flex-1 mr-4">
                        <div className="flex items-center gap-3 mb-2">
                            <i className={`${ICON_MAP.party} ${ICON_ACCENT_CLASS.party} text-xl`}></i>
                            <h1 className="text-3xl font-black poe-title tracking-tight">{t('members.title')}</h1>
                        </div>
                        <p className="poe-text-muted font-medium">{t('members.subtitle') || t('nav.members')}</p>
                    </div>
                </header>
                {kitchen?.inviteCode && currentUserMember && !currentUserMember.isGuest && (
                    <div className="poe-card poe-section-marker poe-section-hideouts rounded-3xl p-6 text-center space-y-2 mb-6 border border-poe-borderStrong">
                        <h3 className="text-xs font-black text-poe-sectionHideouts uppercase tracking-widest">{t('kitchens.inviteCode')}</h3>
                        <div
                            onClick={() => {
                                navigator.clipboard.writeText(kitchen.inviteCode || '');
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className="text-4xl font-black text-poe-text1 cursor-pointer hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-3"
                            title={t('members.clickToCopy')}
                        >
                            {kitchen.inviteCode}
                            <i className={`fas ${copied ? 'fa-check text-poe-success' : 'fa-copy text-poe-text2'} text-xl transition-all`}></i>
                        </div>
                        <p className="text-xs text-poe-text2 font-medium pb-2">{t('members.shareCode')}</p>

                        <div className="flex justify-center gap-3 pt-2">
                            <button
                                onClick={() => handleShareCode('whatsapp')}
                                className="px-4 py-2 poe-status-success rounded-xl text-xs font-bold flex items-center gap-2 transition-colors hover:brightness-110 poe-focus-ring"
                            >
                                <i className="fab fa-whatsapp text-lg"></i> WhatsApp
                            </button>
                            <button
                                onClick={() => handleShareCode('telegram')}
                                className="px-4 py-2 poe-status-info rounded-xl text-xs font-bold flex items-center gap-2 transition-colors hover:brightness-110 poe-focus-ring"
                            >
                                <i className="fab fa-telegram text-lg"></i> Telegram
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-20 text-poe-text2 font-bold animate-pulse">{t('common.loading')}</div>
                ) : (
                    <>
                        {/* Manage Member Form (Moved to Top) - Show if Admin OR if Guest matches Edited Member */}
                        {canShowForm ? (
                            <section className={`poe-card poe-section-marker poe-section-party p-4 rounded-3xl shadow-xl border transition-all ${editingMember ? 'border-poe-sectionParty ring-2 ring-poe-sectionParty' : 'border-poe-borderStrong'}`}>
                                <h2 className="font-bold text-lg text-poe-text1 mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 poe-accent-party-soft rounded-lg flex items-center justify-center text-sm">
                                            <i className={`fas ${editingMember ? 'fa-user-edit' : 'fa-user-plus'}`}></i>
                                        </span>
                                        {editingMember ? t('members.editMember') : t('members.addMember')}
                                    </div>
                                    {editingMember && (
                                        <button onClick={handleCancelEdit} className="text-xs font-bold text-poe-text2 hover:text-poe-text1 uppercase tracking-wider poe-focus-ring rounded-lg">
                                            {t('common.cancel')}
                                        </button>
                                    )}
                                </h2>
                                <form onSubmit={handleSaveMember} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Name Field */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-poe-text2 uppercase tracking-wider ml-1">{t('members.name')}</label>
                                            <input
                                                type="text"
                                                placeholder={t('members.namePlaceholder')}
                                                className="w-full poe-input poe-focus-ring rounded-xl px-4 py-3 font-bold transition-all placeholder:text-poe-text2 placeholder:font-medium"
                                                value={newMemberName}
                                                onChange={(e) => setNewMemberName(e.target.value)}
                                                name="name" // Added name attribute
                                                required
                                                maxLength={50}
                                            />
                                        </div>

                                        {/* Email Field */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-poe-text2 uppercase tracking-wider ml-1">{t('members.emailOptional')}</label>
                                            <input
                                                type="email"
                                                placeholder={t('members.emailPlaceholder')}
                                                className="w-full poe-input poe-focus-ring rounded-xl px-4 py-3 font-medium transition-all placeholder:text-poe-text2 placeholder:font-medium"
                                                name="email"
                                                value={newMemberEmail} // Controlled by state
                                                onChange={(e) => setNewMemberEmail(e.target.value)} // Update state
                                                maxLength={100}
                                            />
                                        </div>
                                    </div>

                                    {/* Preferences Fields - Stacked Vertical */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-poe-text2 uppercase tracking-wider ml-1">{t('members.likes')}</label>
                                            <TagInput
                                                key={`likes-${editingMember?.id || 'new'}`}
                                                tags={likesTags}
                                                setTags={setLikesTags}
                                                suggestions={allLikes}
                                                placeholder={t('members.likesPlaceholder')}
                                                icon="fa-heart"
                                                chipColorClass="poe-status-success"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-poe-text2 uppercase tracking-wider ml-1">{t('members.dislikes')}</label>
                                            <TagInput
                                                key={`dislikes-${editingMember?.id || 'new'}`}
                                                tags={dislikesTags}
                                                setTags={setDislikesTags}
                                                suggestions={allDislikes}
                                                placeholder={t('members.dislikesPlaceholder')}
                                                icon="fa-thumbs-down"
                                                chipColorClass="poe-card text-poe-text2 border border-poe-border"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-poe-text2 uppercase tracking-wider ml-1">{t('members.restrictions')}</label>
                                            <TagInput
                                                key={`restrictions-${editingMember?.id || 'new'}`}
                                                tags={restrictionsTags}
                                                setTags={setRestrictionsTags}
                                                suggestions={allRestrictions}
                                                placeholder={t('members.restrictionsPlaceholder')}
                                                icon="fa-ban"
                                                chipColorClass="poe-status-danger"
                                            />
                                            <p className="text-[10px] text-poe-text2 font-medium pl-1 mt-1">
                                                <i className="fas fa-info-circle mr-1"></i>
                                                {t('members.tagHelp')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-2 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-poe-text2 uppercase">{t('members.role')}:</span>
                                            {!currentUserMember?.isGuest ? (
                                                <>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            name="isGuest"
                                                            className="w-4 h-4 text-poe-sectionParty rounded border-poe-borderStrong"
                                                            checked={newMemberIsGuest} // Controlled by state
                                                            onChange={(e) => setNewMemberIsGuest(e.target.checked)} // Update state
                                                            disabled={editingMember?.role === 'ADMIN'}
                                                        />
                                                        <span className="text-sm font-medium text-poe-text1">{t('members.guest')}</span>
                                                    </label>
                                                    {/* Helper text for Admin */}
                                                    {editingMember?.role === 'ADMIN' && (
                                                        <span className="text-[10px] uppercase font-black poe-status-warning px-2 py-1 rounded ml-2">
                                                            {t('members.adminCannotBeGuest')}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-sm font-bold text-poe-text2 poe-card px-2 py-1 rounded">{t('members.guest')}</span>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!newMemberName.trim() || isAdding}
                                            className={`px-4 py-4 rounded-xl font-bold shadow-lg transition-all w-full md:w-auto poe-focus-ring ${editingMember ? 'poe-btn-secondary shadow-black/30' : 'poe-btn-primary shadow-black/30'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isAdding ? <i className="fas fa-spinner fa-spin"></i> : (editingMember ? t('common.save') : t('members.addMember'))}
                                        </button>
                                    </div>

                                    <p className="text-center text-xs text-poe-text2 font-medium">
                                        {editingMember ? t('members.saveBoxGuest') : t('members.saveBoxAdd')}
                                    </p>
                                </form>
                            </section>
                        ) : (
                            <div className="poe-status-info rounded-3xl p-6 text-center mb-6">
                                <p className="font-bold mb-2">{t('members.guestViewTitle')}</p>
                                <p className="text-xs">{t('members.guestViewDesc')}</p>
                            </div>
                        )}

                        {/* Member List */}
                        <section className="space-y-4">
                            <h2 className="text-sm font-black text-poe-text2 uppercase tracking-widest px-1">{t('members.whoIs')}</h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                {members.length === 0 && <div className="text-poe-text2 font-medium text-center py-4 poe-card rounded-3xl border border-poe-borderStrong italic col-span-full">{t('members.noMembers')}</div>}

                                {members.map((m) => (
                                    <div
                                        key={m.id}
                                        onClick={(!currentUserMember?.isGuest || currentUserMember?.id === m.id) ? () => handleEditClick(m) : undefined}
                                        className={`poe-card p-4 rounded-3xl shadow-sm border transition-all ${editingMember?.id === m.id ? 'border-poe-sectionParty' : 'border-poe-border'} ${(!currentUserMember?.isGuest || currentUserMember?.id === m.id) ? 'cursor-pointer group hover:border-poe-sectionParty' : 'opacity-50 cursor-not-allowed'}`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner font-black ${editingMember?.id === m.id ? 'poe-accent-party-soft' : 'poe-status-danger'}`}>
                                                    {m.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-xl text-poe-text1">{m.name}</h3>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${m.role === 'ADMIN' ? 'poe-status-warning' : m.isGuest ? 'poe-card text-poe-text2 border-poe-border' : 'poe-status-info'}`}>
                                                            {m.role === 'ADMIN' ? t('members.owner') : m.isGuest ? t('members.guest') : t('members.member')}
                                                        </span>
                                                    </div>
                                                    {m.email && (
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-poe-text2 mt-0.5">
                                                            <i className="fas fa-envelope text-[10px]"></i>
                                                            {m.email}
                                                            {!m.userId && <span className="poe-status-warning px-1.5 rounded ml-1">{t('members.pending')}</span>}
                                                            {m.userId && <span className="poe-status-info px-1.5 rounded ml-1">{t('members.linked')}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Hide Remove button for Guests */}
                                            {!currentUserMember?.isGuest && m.isGuest && m.role !== 'ADMIN' && (
                                                <button
                                                    onClick={(e) => handleDeleteClick(m.id, e)}
                                                    className="w-10 h-10 rounded-xl hover:bg-poe-surface2 text-poe-text2 hover:text-poe-danger flex items-center justify-center transition-colors"
                                                    title={t('members.remove')}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            )}

                                            {/* Leave Button for Current User (Non-Admin) */}
                                            {currentUserMember?.id === m.id && m.role !== 'ADMIN' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLeaveTargetId(m.id);
                                                    }}
                                                    className="w-10 h-10 rounded-xl hover:bg-poe-surface2 text-poe-text2 hover:text-poe-warning flex items-center justify-center transition-colors"
                                                    title={t('kitchens.leave') || "Leave Hideout"}
                                                >
                                                    <i className="fas fa-sign-out-alt"></i>
                                                </button>
                                            )}
                                        </div>

                                        {/* 3-Column Preferences Grid - Converted to Stack */}
                                        <div className="flex flex-col gap-3 border-t border-poe-border pt-4 mt-2">
                                            {/* Likes */}
                                            <div className="poe-card rounded-xl p-3 border border-poe-border">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-poe-success mb-2 flex items-center gap-1">
                                                    <i className="fas fa-heart"></i> {t('members.likes')}
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {m.likes?.length ? m.likes.map((l, i) => (
                                                        <span key={i} className="text-xs font-bold poe-status-success px-2 py-1 rounded-md inline-block w-fit">
                                                            {l}
                                                        </span>
                                                    )) : <span className="text-xs text-poe-text2 italic">{t('members.none')}</span>}
                                                </div>
                                            </div>

                                            {/* Dislikes */}
                                            <div className="poe-card rounded-xl p-3 border border-poe-border">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-poe-text2 mb-2 flex items-center gap-1">
                                                    <i className="fas fa-thumbs-down"></i> {t('members.dislikes')}
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {m.dislikes?.length ? m.dislikes.map((d, i) => (
                                                        <span key={i} className="text-xs font-bold poe-card text-poe-text1 border border-poe-border px-2 py-1 rounded-md inline-block w-fit">
                                                            {d}
                                                        </span>
                                                    )) : <span className="text-xs text-poe-text2 italic">{t('members.none')}</span>}
                                                </div>
                                            </div>

                                            {/* Restrictions */}
                                            <div className="poe-card rounded-xl p-3 border border-poe-border">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-poe-danger mb-2 flex items-center gap-1">
                                                    <i className="fas fa-ban"></i> {t('members.restrictions')}
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {m.restrictions?.length ? m.restrictions.map((r, i) => (
                                                        <span key={i} className="text-xs font-bold poe-status-danger px-2 py-1 rounded-md inline-block w-fit">
                                                            {r}
                                                        </span>
                                                    )) : <span className="text-xs text-poe-text2 italic">{t('members.safe')}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </main>

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
                title={t('members.removeConfirmTitle')}
                message={t('members.removeConfirmMsg')}
            />

            {/* Leave Confirmation Modal */}
            {leaveTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="poe-surface rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200 border border-poe-borderStrong">
                        <div className="w-12 h-12 poe-status-warning rounded-full flex items-center justify-center text-xl mx-auto">
                            <i className="fas fa-sign-out-alt"></i>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-poe-text1">{t('kitchens.leaveTitle') || 'Leave Hideout?'}</h3>
                            <p className="text-sm text-poe-text2">{t('kitchens.leaveConfirm') || 'Are you sure you want to leave this hideout?'}</p>
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
                                {t('kitchens.leave') || 'Leave Hideout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
