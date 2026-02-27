"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    BuildCostTier,
    Difficulty,
    Language,
    MealType,
    PartyMember,
    PrepTimePreference,
    StashItem,
} from '../types';
import { storageService } from '../services/storageService';
import { normalizeBuildCostTier, toLegacyDifficulty } from '@/lib/build-contract';


interface AppContextType {
    members: PartyMember[];
    setMembers: React.Dispatch<React.SetStateAction<PartyMember[]>>;
    pantry: StashItem[];
    setPantry: React.Dispatch<React.SetStateAction<StashItem[]>>;
    activeDiners: string[];
    setActiveDiners: React.Dispatch<React.SetStateAction<string[]>>;
    mealType: MealType;
    setMealType: React.Dispatch<React.SetStateAction<MealType>>;
    costTier: BuildCostTier;
    setCostTier: React.Dispatch<React.SetStateAction<BuildCostTier>>;
    /** @deprecated Use costTier/setCostTier. */
    difficulty: Difficulty;
    /** @deprecated Use setCostTier. */
    setDifficulty: React.Dispatch<React.SetStateAction<Difficulty>>;
    prepTime: PrepTimePreference;
    setPrepTime: React.Dispatch<React.SetStateAction<PrepTimePreference>>;
    language: Language;
    setLanguage: React.Dispatch<React.SetStateAction<Language>>;
    measurementSystem: 'METRIC' | 'IMPERIAL';
    setMeasurementSystem: React.Dispatch<React.SetStateAction<'METRIC' | 'IMPERIAL'>>;
}

const noopSetter = <T,>(_value: React.SetStateAction<T>) => undefined;

const defaultAppContext: AppContextType = {
    members: [],
    setMembers: noopSetter as React.Dispatch<React.SetStateAction<PartyMember[]>>,
    pantry: [],
    setPantry: noopSetter as React.Dispatch<React.SetStateAction<StashItem[]>>,
    activeDiners: [],
    setActiveDiners: noopSetter as React.Dispatch<React.SetStateAction<string[]>>,
    mealType: 'main',
    setMealType: noopSetter as React.Dispatch<React.SetStateAction<MealType>>,
    costTier: 'medium',
    setCostTier: noopSetter as React.Dispatch<React.SetStateAction<BuildCostTier>>,
    difficulty: 'intermediate',
    setDifficulty: noopSetter as React.Dispatch<React.SetStateAction<Difficulty>>,
    prepTime: 'quick',
    setPrepTime: noopSetter as React.Dispatch<React.SetStateAction<PrepTimePreference>>,
    language: 'en',
    setLanguage: noopSetter as React.Dispatch<React.SetStateAction<Language>>,
    measurementSystem: 'METRIC',
    setMeasurementSystem: noopSetter as React.Dispatch<React.SetStateAction<'METRIC' | 'IMPERIAL'>>,
};

const AppContext = createContext<AppContextType>(defaultAppContext);

function AppProviderClient({ children }: { children: React.ReactNode }) {
    // Initial state (Empty - Load from DB)
    const [members, setMembers] = useState<PartyMember[]>([]);

    const [pantry, setPantry] = useState<StashItem[]>([]);
    const [activeDiners, setActiveDiners] = useState<string[]>([]);
    const [mealType, setMealType] = useState<MealType>('main');
    const [costTier, setCostTier] = useState<BuildCostTier>('medium');
    const [prepTime, setPrepTime] = useState<PrepTimePreference>('quick');
    const [measurementSystem, setMeasurementSystem] = useState<'METRIC' | 'IMPERIAL'>('METRIC');

    const [language, setLanguage] = useState<Language>('en');
    const difficulty = toLegacyDifficulty(costTier) as Difficulty;

    const setDifficulty: React.Dispatch<React.SetStateAction<Difficulty>> = (value) => {
        setCostTier((previousCostTier) => {
            const previousLegacyDifficulty = toLegacyDifficulty(previousCostTier) as Difficulty;
            const nextLegacyDifficulty = typeof value === 'function'
                ? (value as (prevState: Difficulty) => Difficulty)(previousLegacyDifficulty)
                : value;
            return normalizeBuildCostTier(nextLegacyDifficulty);
        });
    };

    // Detect browser language on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('user_language_preference')) {
            const browserLang = navigator.language;
            if (browserLang.toLowerCase().startsWith('pt')) {
                setLanguage('pt-BR');
            }
        }
    }, []);

    // Load initial data from storageService if available (optional enhancement)
    useEffect(() => {
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

        // Skip fetching data on auth pages, but we can still check local storage or existing session later
        if (pathname === '/login' || pathname === '/register' || pathname === '/recover' || pathname === '/verify-email' || pathname === '/reset-password') {
            return;
        }

        async function loadData() {
            try {
                // Load User Preferences first (Language)
                const storedUser = await storageService.getCurrentUser();
                if (storedUser && storedUser.user && storedUser.user.language) {
                    setLanguage(storedUser.user.language as Language);
                }
                if (storedUser && storedUser.user && storedUser.user.measurementSystem) {
                    setMeasurementSystem(storedUser.user.measurementSystem as 'METRIC' | 'IMPERIAL');
                }

                const storedPantry = await storageService.getStash();
                if (storedPantry && storedPantry.length > 0) {
                    setPantry(storedPantry);
                }

                const storedMembers = await storageService.getPartyMembers();
                if (storedMembers && storedMembers.length > 0) {
                    setMembers(storedMembers);
                }
            } catch (e: any) {
                // If unauthorized, just ignore (user likely session expired or not logged in yet)
                if (e.message.includes('Unauthorized') || e.message.includes('401')) {
                    // Redirect to login if potentially valid session but unauthorized (expired)
                    // Use window.location to ensure full refresh and clear state if needed.
                    if (typeof window !== 'undefined') {
                        window.location.assign('/login');
                    }
                } else {
                    console.error("Failed to load initial data", e);
                }
            }
        }
        loadData();
    }, []);

    return (
        <AppContext.Provider value={{
            members, setMembers,
            pantry, setPantry,
            activeDiners, setActiveDiners,
            mealType, setMealType,
            costTier, setCostTier,
            difficulty, setDifficulty,
            prepTime, setPrepTime,

            language, setLanguage,
            measurementSystem, setMeasurementSystem
        }}>

            {children}
        </AppContext.Provider>
    );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    // Avoid stateful client hooks during static prerender.
    if (typeof window === 'undefined') {
        return (
            <AppContext.Provider value={defaultAppContext}>
                {children}
            </AppContext.Provider>
        );
    }

    return <AppProviderClient>{children}</AppProviderClient>;
}

export function useApp() {
    return useContext(AppContext);
}
