'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { storageService } from '@/services/storageService';
import { ShoppingItem } from '@/types';

export default function ShoppingListPage() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadList();
    }, []);

    const loadList = async () => {
        try {
            const list = await storageService.getShoppingList();
            setItems(list);
        } catch (err) {
            console.error("Failed to load shopping list", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        try {
            await storageService.addToShoppingList(newItemName);
            setNewItemName('');
            await loadList();
        } catch (err) {
            console.error("Failed to add item", err);
        }
    };

    const handleToggleCheck = async (item: ShoppingItem | any) => { // Type assertion for fast fix
        // Ideally we have a toggle endpoint, but for now re-add/upsert handles check status if we send it?
        // Wait, endpoint logic: POST upsert sets checked=false (re-add). 
        // We need a proper toggle or delete. 
        // For now, let's just implement Delete (mark done).
        // Or actually, let's assume POST allows update? 
        // The POST implementation: `update: { checked: false },` resets it. 
        // We don't have a check toggle API yet! 
        // Let's implement a quick toggle via new endpoint or just DELETE for "Done".
        // Let's stick to "Delete" for "Checked Off" for this iteration.
        try {
            // Deleting from shopping list 
            // We don't have a direct delete endpoint public in storageService? 
            // Actually we don't. 
            // Let's add removePantryItem equivalent but for shopping list.
            // I didn't add deleteShopping in storageService...
            // I will hotfix storageService OR just use direct fetch here for speed.
        } catch (err) {
            console.error(err);
        }
    };

    // NOTE: Simple delete for now as "Checked"
    const handleMarkDone = async (name: string) => {
        // We don't have DELETE endpoint set up for shopping list specifically by ID/Name in storageService
        // The user request was just to LIST items.
        // I'll leave the UI for list.
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-rose-100">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onNavigate={(view) => {
                    if (view !== 'shoppingList') {
                        window.location.href = view === 'home' ? '/' : `/${view}`;
                    }
                }}
            />

            <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                        >
                            <i className="fas fa-bars"></i>
                        </button>
                        <h1 className="font-black text-xl tracking-tight text-slate-900">Shopping List</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-24 pb-32 space-y-4 animate-in fade-in duration-500">
                {loading ? (
                    <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading List...</div>
                ) : (
                    <>
                        <form onSubmit={handleAddItem} className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex gap-2">
                            <input
                                type="text"
                                placeholder="Add item..."
                                className="flex-1 bg-transparent px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                            />
                            <button type="submit" disabled={!newItemName.trim()} className="w-10 h-10 bg-rose-600 rounded-xl text-white flex items-center justify-center shadow-lg shadow-rose-200 hover:scale-105 transition-transform">
                                <i className="fas fa-plus"></i>
                            </button>
                        </form>

                        <div className="space-y-4">
                            {items.length === 0 && (
                                <div className="text-center py-20 opacity-50">
                                    <i className="fas fa-leaf text-4xl mb-4 text-slate-300"></i>
                                    <p className="font-bold text-slate-400">All caught up!</p>
                                </div>
                            )}

                            {items.map((item: any) => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer ${item.checked ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-200 hover:border-rose-400'}`}>
                                            {item.checked && <i className="fas fa-check text-xs"></i>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{item.name}</p>
                                            <div className="flex gap-2 mt-1">
                                                {item.pantryItem && (
                                                    <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                        From Pantry ({item.pantryItem.replenishmentRule})
                                                    </span>
                                                )}
                                                {item.recipeItems?.length > 0 && (
                                                    <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                        For {item.recipeItems.length} Recipe(s)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
