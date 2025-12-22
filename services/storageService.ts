
import { RecipeRecord, HouseholdMember } from '../types';
import { db } from './db';

/**
 * SERVICE: StorageService
 * Manages persistence using Dexie (IndexedDB).
 * This acts as our local database to avoid 404 errors from server-side endpoints
 * while fulfilling the requirement for a structured database.
 */

export const storageService = {
  // --- Recipes / History ---
  getAllRecipes: async (): Promise<RecipeRecord[]> => {
    try {
      return await db.recipes.orderBy('createdAt').reverse().toArray();
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }
  },

  saveRecipe: async (recipe: RecipeRecord): Promise<void> => {
    try {
      await db.recipes.put(recipe);
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw error;
    }
  },

  deleteRecipe: async (id: string): Promise<void> => {
    try {
      await db.recipes.delete(id);
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  },

  toggleFavorite: async (id: string): Promise<void> => {
    try {
      const recipe = await db.recipes.get(id);
      if (recipe) {
        await db.recipes.update(id, { isFavorite: !recipe.isFavorite });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  },

  // --- Household ---
  getHousehold: async (): Promise<HouseholdMember[]> => {
    try {
      return await db.household.toArray();
    } catch (error) {
      console.error('Error fetching household:', error);
      return [];
    }
  },

  saveMember: async (member: HouseholdMember): Promise<void> => {
    try {
      await db.household.put(member);
    } catch (error) {
      console.error('Error saving member:', error);
      throw error;
    }
  },

  deleteMember: async (id: string): Promise<void> => {
    try {
      await db.household.delete(id);
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  },

  // --- Pantry ---
  getPantry: async (): Promise<string[]> => {
    try {
      const items = await db.pantry.toArray();
      return items.map(i => i.name);
    } catch (error) {
      console.error('Error fetching pantry:', error);
      return [];
    }
  },

  addPantryItem: async (name: string): Promise<void> => {
    try {
      await db.pantry.put({ name });
    } catch (error) {
      console.error('Error adding pantry item:', error);
    }
  },

  removePantryItem: async (name: string): Promise<void> => {
    try {
      // Find by name since it's the unique index in Dexie store
      const item = await db.pantry.where('name').equals(name).first();
      if (item && item.id) {
        await db.pantry.delete(item.id);
      }
    } catch (error) {
      console.error('Error removing pantry item:', error);
    }
  },

  editPantryItem: async (oldName: string, newName: string): Promise<void> => {
    try {
      const item = await db.pantry.where('name').equals(oldName).first();
      if (item && item.id) {
        await db.pantry.update(item.id, { name: newName });
      }
    } catch (error) {
      console.error('Error editing pantry item:', error);
    }
  },

  // --- Suggestions ---
  getTags: async (category: 'restrictions' | 'likes' | 'dislikes'): Promise<string[]> => {
    try {
      const suggestions = await db.suggestions.where('category').equals(category).toArray();
      return suggestions.map(s => s.tag);
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  },

  saveTag: async (category: 'restrictions' | 'likes' | 'dislikes', tag: string): Promise<void> => {
    try {
      const existing = await db.suggestions.where({ category, tag }).first();
      if (!existing) {
        await db.suggestions.add({ category, tag });
      }
    } catch (error) {
      console.error('Error saving tag:', error);
    }
  }
};
