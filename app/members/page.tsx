'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { storageService } from '@/services/storageService';
import { KitchenMember } from '@/types';

export default function MembersPage() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [members, setMembers] = useState<KitchenMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMemberName, setNewMemberName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            const data = await storageService.getKitchenMembers();
            setMembers(data);
        } catch (err) {
            console.error("Failed to load members", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberName.trim()) return;

        setIsAdding(true);
        try {
            // Note: The backend logic for "adding a member" might need to be clarified.
            // Currently saveMember in storageService uses POST /kitchen-members.
            // We'll assume for now we just add a "guest" or placeholder member, 
            // as full email invitation flow might not be fully implemented in the UI yet.
            // Based on previous code, we just sent a name.

            // We need to construct a KitchenMember object, but the ID and kitchenId are handled by backend?
            // storageService.saveMember takes a KitchenMember. 
            // Let's check api/kitchen-members POST implementation.
            // If it accepts partial data or if we should use a specific "add guest" endpoint.
            // The API route (from memory) created a member.

            // Temporary workaround if strict typing prevents partial:
            // CASTING to any to pass just name if the API handles it, 
            // OR create a client-side object.

            // Let's try to match the interface as best as possible.
            const formData = new FormData(e.target as HTMLFormElement);
            const likes = (formData.get('likes') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [];
            const dislikes = (formData.get('dislikes') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [];
            const restrictions = (formData.get('restrictions') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [];

            const newMember: any = {
                name: newMemberName,
                isGuest: true,
                likes,
                dislikes,
                restrictions
            };

            await storageService.saveMember(newMember);
            setNewMemberName('');
            (e.target as HTMLFormElement).reset(); // Clear form inputs
            await loadMembers();
        } catch (err) {
            console.error("Failed to add member", err);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await storageService.deleteMember(id);
            await loadMembers();
        } catch (err) {
            console.error("Failed to delete member", err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-rose-100">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onNavigate={(view) => {
                    if (view !== 'members') {
                        window.location.href = view === 'home' ? '/' : `/${view}`;
                    }
                }}
            />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                        >
                            <i className="fas fa-bars"></i>
                        </button>
                        <h1 className="font-black text-xl tracking-tight text-slate-900">Kitchen Members</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-24 pb-32 space-y-8 animate-in fade-in duration-500">
                {loading ? (
                    <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading Members...</div>
                ) : (
                    <>
                        {/* Member List */}
                        <section className="space-y-4">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Who is in this kitchen?</h2>
                            <div className="grid gap-4">
                                {members.length === 0 && <div className="text-slate-500 font-medium text-center py-8 bg-white rounded-3xl border border-slate-100 italic">No members found.</div>}

                                {members.map((m) => (
                                    <div key={m.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl shadow-inner font-black">
                                                {m.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg text-slate-900">{m.name}</h3>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase tracking-wide border border-slate-200">{m.isGuest ? 'Guest' : 'Member'}</span>
                                                </div>

                                                {/* Preferences Tags */}
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {m.restrictions?.map((r, i) => (
                                                        <span key={`r-${i}`} className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md font-bold flex items-center gap-1">
                                                            <i className="fas fa-ban text-[8px]"></i> {r}
                                                        </span>
                                                    ))}
                                                    {m.likes?.map((l, i) => (
                                                        <span key={`l-${i}`} className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md font-bold flex items-center gap-1">
                                                            <i className="fas fa-heart text-[8px]"></i> {l}
                                                        </span>
                                                    ))}
                                                    {m.dislikes?.map((d, i) => (
                                                        <span key={`d-${i}`} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-md font-bold flex items-center gap-1">
                                                            <i className="fas fa-thumbs-down text-[8px]"></i> {d}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {m.isGuest && (
                                            <button
                                                onClick={() => handleDeleteMember(m.id)}
                                                className="w-10 h-10 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-colors"
                                                title="Remove member"
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Add Member */}
                        <section className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mt-8">
                            <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm"><i className="fas fa-user-plus"></i></span>
                                Add Guest / Member
                            </h2>
                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Guest Name (e.g. Grandma)"
                                        className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300 placeholder:font-medium"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMemberName.trim() || isAdding}
                                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all"
                                    >
                                        {isAdding ? <i className="fas fa-spinner fa-spin"></i> : 'Add Member'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Likes (comma separated)"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                                        name="likes"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Dislikes (comma separated)"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                                        name="dislikes"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Restrictions (comma separated)"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                                        name="restrictions"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 font-medium px-1">Tip: Add preferences to help the AI chef personalize recipes!</p>
                            </form>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
