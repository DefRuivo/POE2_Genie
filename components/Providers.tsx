"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { HouseholdMember, MealType, Difficulty, PrepTimePreference } from '../types';
import { storageService } from '../services/storageService';


interface AppContextType {
    household: HouseholdMember[];
    setHousehold: React.Dispatch<React.SetStateAction<HouseholdMember[]>>;
    pantry: string[];
    setPantry: React.Dispatch<React.SetStateAction<string[]>>;
    activeDiners: string[];
    setActiveDiners: React.Dispatch<React.SetStateAction<string[]>>;
    mealType: MealType;
    setMealType: React.Dispatch<React.SetStateAction<MealType>>;
    difficulty: Difficulty;
    setDifficulty: React.Dispatch<React.SetStateAction<Difficulty>>;
    prepTime: PrepTimePreference;
    setPrepTime: React.Dispatch<React.SetStateAction<PrepTimePreference>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    // Initial state (Empty - Load from DB)
    const [household, setHousehold] = useState<HouseholdMember[]>([]);

    const [pantry, setPantry] = useState<string[]>([]);
    const [activeDiners, setActiveDiners] = useState<string[]>([]);
    const [mealType, setMealType] = useState<MealType>('main');
    const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
    const [prepTime, setPrepTime] = useState<PrepTimePreference>('quick');

    // Load initial data from storageService if available (optional enhancement)
    useEffect(() => {
        // Skip fetching on auth pages
        if (pathname === '/login' || pathname === '/register' || pathname === '/recover') {
            return;
        }

        async function loadData() {
            try {
                const storedPantry = await storageService.getPantry();
                if (storedPantry && storedPantry.length > 0) {
                    setPantry(storedPantry);
                }

                const storedHousehold = await storageService.getHousehold();
                if (storedHousehold && storedHousehold.length > 0) {
                    setHousehold(storedHousehold);
                }
            } catch (e: any) {
                // If unauthorized, just ignore (user likely session expired or not logged in yet)
                if (e.message.includes('Unauthorized') || e.message.includes('401')) {
                    // Redirect to login if potentially valid session but unauthorized (expired)
                    // Use window.location to ensure full refresh and clear state if needed, or router.push
                    router.push('/login');
                } else {
                    console.error("Failed to load initial data", e);
                }
            }
        }
        loadData();
    }, [pathname]);

    return (
        <AppContext.Provider value={{
            household, setHousehold,
            pantry, setPantry,
            activeDiners, setActiveDiners,
            mealType, setMealType,
            difficulty, setDifficulty,
            prepTime, setPrepTime
        }}>

            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
