import { RecipeRecord, HouseholdMember } from '../types';

/**
 * SERVICE: StorageService
 * Responsável pela persistência dos dados. 
 * Tenta se comunicar com a API do servidor (Next.js/Prisma).
 */

const API_BASE = '/api';

async function apiRequest(path: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Se for 404, o servidor de API pode não estar rodando (comum em previews estáticos)
      if (response.status === 404) {
        console.warn(`Endpoint ${path} não encontrado. Verifique se o backend está rodando.`);
        return null;
      }

      const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status}` }));
      throw new Error(errorData.message || 'Erro na requisição');
    }

    return await response.json();
  } catch (error) {
    console.error(`Falha na chamada API [${path}]:`, error);
    throw error;
  }
}

export const storageService = {
  // --- Recipes / History ---
  getAllRecipes: async (): Promise<RecipeRecord[]> => {
    const data = await apiRequest('/recipes');
    if (!data) return [];

    return data.map((r: any) => ({
      ...r,
      ingredients_from_pantry: typeof r.ingredients_from_pantry === 'string' ? JSON.parse(r.ingredients_from_pantry) : r.ingredients_from_pantry,
      shopping_list: typeof r.shopping_list === 'string' ? JSON.parse(r.shopping_list) : r.shopping_list,
      step_by_step: typeof r.step_by_step === 'string' ? JSON.parse(r.step_by_step) : r.step_by_step,
      createdAt: new Date(r.createdAt).getTime(),
    }));
  },

  saveRecipe: async (recipe: any): Promise<void> => {
    await apiRequest('/recipes', {
      method: 'POST',
      body: JSON.stringify({
        ...recipe,
        ingredients_from_pantry: JSON.stringify(recipe.ingredients_from_pantry),
        shopping_list: JSON.stringify(recipe.shopping_list),
        step_by_step: JSON.stringify(recipe.step_by_step),
      }),
    });
  },

  getRecipeById: async (id: string): Promise<RecipeRecord | null> => {
    const data = await apiRequest(`/recipes/${id}`);
    if (!data) return null;

    return {
      ...data,
      ingredients_from_pantry: typeof data.ingredients_from_pantry === 'string' ? JSON.parse(data.ingredients_from_pantry) : data.ingredients_from_pantry,
      shopping_list: typeof data.shopping_list === 'string' ? JSON.parse(data.shopping_list) : data.shopping_list,
      step_by_step: typeof data.step_by_step === 'string' ? JSON.parse(data.step_by_step) : data.step_by_step,
      createdAt: new Date(data.createdAt).getTime(),
    };
  },

  deleteRecipe: async (id: string): Promise<void> => {
    await apiRequest(`/recipes/${id}`, { method: 'DELETE' });
  },

  toggleFavorite: async (id: string): Promise<void> => {
    await apiRequest(`/recipes/${id}/favorite`, { method: 'PATCH' });
  },

  // --- Household ---
  getHousehold: async (): Promise<HouseholdMember[]> => {
    const data = await apiRequest('/household');
    if (!data) return [];

    return data.map((m: any) => ({
      ...m,
      restrictions: typeof m.restrictions === 'string' ? JSON.parse(m.restrictions) : m.restrictions,
      likes: typeof m.likes === 'string' ? JSON.parse(m.likes) : m.likes,
      dislikes: typeof m.dislikes === 'string' ? JSON.parse(m.dislikes) : m.dislikes,
    }));
  },

  saveMember: async (member: HouseholdMember): Promise<void> => {
    await apiRequest('/household', {
      method: 'POST',
      body: JSON.stringify({
        ...member,
        restrictions: JSON.stringify(member.restrictions),
        likes: JSON.stringify(member.likes),
        dislikes: JSON.stringify(member.dislikes),
      }),
    });
  },

  deleteMember: async (id: string): Promise<void> => {
    await apiRequest(`/household/${id}`, { method: 'DELETE' });
  },

  // --- Pantry ---
  getPantry: async (): Promise<string[]> => {
    const data = await apiRequest('/pantry');
    return data || [];
  },

  addPantryItem: async (name: string): Promise<void> => {
    await apiRequest('/pantry', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  removePantryItem: async (name: string): Promise<void> => {
    await apiRequest(`/pantry/${encodeURIComponent(name)}`, { method: 'DELETE' });
  },

  editPantryItem: async (oldName: string, newName: string): Promise<void> => {
    await apiRequest(`/pantry/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
    });
  },

  // --- Suggestions ---
  getTags: async (category: string): Promise<string[]> => {
    const data = await apiRequest(`/tags?category=${category}`);
    return data || [];
  },

  saveTag: async (category: string, tag: string): Promise<void> => {
    await apiRequest('/tags', {
      method: 'POST',
      body: JSON.stringify({ category, tag }),
    });
  }
};
