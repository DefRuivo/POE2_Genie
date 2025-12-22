import { RecipeRecord, HouseholdMember } from '../types';

/**
 * SERVICE: StorageService
 * Transitioned from Local IndexedDB (Dexie) to Backend API (MySQL).
 * This client-side service now communicates with the application's API layer.
 */

const API_BASE = '/api';

async function fetchApi(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API request failed' }));
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
}

export const storageService = {
  // --- Recipes / History ---
  getAllRecipes: async (): Promise<RecipeRecord[]> => {
    return fetchApi('/recipes');
  },

  saveRecipe: async (recipe: RecipeRecord): Promise<void> => {
    return fetchApi('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  },

  deleteRecipe: async (id: string): Promise<void> => {
    return fetchApi(`/recipes/${id}`, {
      method: 'DELETE',
    });
  },

  toggleFavorite: async (id: string): Promise<void> => {
    return fetchApi(`/recipes/${id}/favorite`, {
      method: 'PATCH',
    });
  },

  // --- Household ---
  getHousehold: async (): Promise<HouseholdMember[]> => {
    return fetchApi('/household');
  },

  saveMember: async (member: HouseholdMember): Promise<void> => {
    return fetchApi('/household', {
      method: 'POST',
      body: JSON.stringify(member),
    });
  },

  deleteMember: async (id: string): Promise<void> => {
    return fetchApi(`/household/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Pantry ---
  getPantry: async (): Promise<string[]> => {
    return fetchApi('/pantry');
  },

  addPantryItem: async (name: string): Promise<void> => {
    return fetchApi('/pantry', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  removePantryItem: async (name: string): Promise<void> => {
    return fetchApi(`/pantry/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },

  editPantryItem: async (oldName: string, newName: string): Promise<void> => {
    return fetchApi(`/pantry/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
    });
  },

  // --- Suggestions ---
  getTags: async (category: 'restrictions' | 'likes' | 'dislikes'): Promise<string[]> => {
    return fetchApi(`/tags?category=${category}`);
  },

  saveTag: async (category: 'restrictions' | 'likes' | 'dislikes', tag: string): Promise<void> => {
    return fetchApi('/tags', {
      method: 'POST',
      body: JSON.stringify({ category, tag }),
    });
  }
};
