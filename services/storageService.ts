import {
  BuildItemStatus,
  BuildItem,
  BuildRecord,
  Hideout,
  KitchenMember,
  PantryItem,
  PartyMember,
  RecipeRecord,
  ShoppingItem,
  StashItem,
} from '../types';

const API_BASE = '/api';
const legacyServiceCounters = new Map<string, number>();

function trackLegacyServiceUsage(methodName: string) {
  const current = legacyServiceCounters.get(methodName) || 0;
  const next = current + 1;
  legacyServiceCounters.set(methodName, next);
  console.info('[Legacy Service Method]', { methodName, count: next });
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: `HTTP Error ${response.status}`, error: '' }));
    const details = errorData.error ? ` (${errorData.error})` : '';
    const error = new Error((errorData.message || 'Request failed') + details);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
}

export const storageService = {
  // --- Canonical: Builds ---
  getAllBuilds: async (lang?: string): Promise<BuildRecord[]> => {
    const query = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    const data = await apiRequest(`/builds${query}`);
    return data || [];
  },

  saveBuild: async (build: BuildRecord): Promise<BuildRecord> => {
    return apiRequest('/builds', {
      method: 'POST',
      body: JSON.stringify(build),
    });
  },

  getBuildById: async (id: string): Promise<BuildRecord | null> => {
    try {
      const data = await apiRequest(`/builds/${id}`);
      return data || null;
    } catch (error) {
      const typedError = error as Error & { status?: number };
      if (typedError.status === 404) return null;
      throw error;
    }
  },

  deleteBuild: async (id: string): Promise<void> => {
    await apiRequest(`/builds/${id}`, { method: 'DELETE' });
  },

  toggleBuildFavorite: async (id: string): Promise<void> => {
    await apiRequest(`/builds/${id}/favorite`, { method: 'PATCH' });
  },

  // --- Canonical: Party ---
  getPartyMembers: async (): Promise<PartyMember[]> => {
    const data = await apiRequest('/party-members');
    return data || [];
  },

  savePartyMember: async (member: PartyMember): Promise<void> => {
    await apiRequest('/party-members', {
      method: 'POST',
      body: JSON.stringify(member),
    });
  },

  deletePartyMember: async (id: string): Promise<void> => {
    await apiRequest(`/party-members/${id}`, { method: 'DELETE' });
  },

  // --- Canonical: Stash ---
  getStash: async (): Promise<StashItem[]> => {
    const data = await apiRequest('/stash');
    return data || [];
  },

  addStashItem: async (
    name: string,
    replenishmentRule?: string,
    inStock?: boolean,
    quantity?: string,
    unit?: string,
    unitDetails?: string,
  ): Promise<StashItem | null> => {
    return apiRequest('/stash', {
      method: 'POST',
      body: JSON.stringify({
        name,
        replenishmentRule,
        inStock,
        quantity,
        unit,
        unitDetails,
      }),
    });
  },

  editStashItem: async (
    currentName: string,
    updates: {
      name?: string;
      inStock?: boolean;
      replenishmentRule?: string;
      quantity?: string;
      unit?: string;
      unitDetails?: string;
    },
  ): Promise<void> => {
    await apiRequest(`/stash/${encodeURIComponent(currentName)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  removeStashItem: async (name: string): Promise<void> => {
    await apiRequest(`/stash/${encodeURIComponent(name)}`, { method: 'DELETE' });
  },

  toggleStashItemStock: async (name: string, inStock: boolean): Promise<void> => {
    await apiRequest(`/stash/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify({ inStock }),
    });
  },

  // --- Canonical: Checklist ---
  getBuildItems: async (
    options?: { status?: BuildItemStatus | 'all' },
  ): Promise<BuildItem[]> => {
    const status = options?.status;
    // Keep default request unchanged for compatibility (`pending`).
    const query = status && status !== 'pending'
      ? `?status=${encodeURIComponent(status)}`
      : '';
    const data = await apiRequest(`/checklist${query}`);
    return data || [];
  },

  addBuildItem: async (name: string): Promise<void> => {
    await apiRequest('/checklist', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  updateBuildItem: async (
    id: string,
    updates: { checked?: boolean; quantity?: string },
  ): Promise<void> => {
    await apiRequest(`/checklist/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteBuildItem: async (id: string): Promise<void> => {
    await apiRequest(`/checklist/${id}`, { method: 'DELETE' });
  },

  clearBuildItems: async (): Promise<void> => {
    await apiRequest('/checklist', { method: 'DELETE' });
  },

  // --- Canonical: Hideout Context ---
  getCurrentHideout: async (): Promise<Hideout> => {
    return apiRequest('/hideouts');
  },

  joinHideout: async (code: string): Promise<{ kitchenId: string; name: string }> => {
    return apiRequest('/hideouts/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  createHideout: async (name: string): Promise<void> => {
    await apiRequest('/hideouts', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  switchHideout: async (hideoutId: string): Promise<void> => {
    await apiRequest('/auth/switch-context', {
      method: 'POST',
      body: JSON.stringify({ kitchenId: hideoutId }),
    });
  },

  updateHideout: async (id: string, name: string): Promise<Hideout> => {
    const res = await fetch(`/api/hideouts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to update hideout');
    return res.json();
  },

  deleteHideout: async (id: string): Promise<Hideout> => {
    const res = await fetch(`/api/hideouts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete hideout');
    return res.json();
  },

  leaveHideout: async (membershipId: string): Promise<void> => {
    return storageService.deletePartyMember(membershipId);
  },

  getCurrentUser: async (): Promise<any> => {
    return apiRequest('/auth/me');
  },

  updateProfile: async (data: {
    name: string;
    surname: string;
    measurementSystem: string;
    password?: string;
    currentPassword?: string;
    language?: string;
  }): Promise<any> => {
    return apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
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
  },

  // --- Deprecated wrappers (compat) ---
  // @deprecated Use canonical Hideout/Party/Builds/Stash/Checklist methods above.
  getAllRecipes: async (lang?: string): Promise<RecipeRecord[]> => {
    trackLegacyServiceUsage('getAllRecipes');
    return storageService.getAllBuilds(lang);
  },

  saveRecipe: async (recipe: RecipeRecord): Promise<RecipeRecord> => {
    trackLegacyServiceUsage('saveRecipe');
    return storageService.saveBuild(recipe);
  },

  getRecipeById: async (id: string): Promise<RecipeRecord | null> => {
    trackLegacyServiceUsage('getRecipeById');
    return storageService.getBuildById(id);
  },

  deleteRecipe: async (id: string): Promise<void> => {
    trackLegacyServiceUsage('deleteRecipe');
    return storageService.deleteBuild(id);
  },

  toggleFavorite: async (id: string): Promise<void> => {
    trackLegacyServiceUsage('toggleFavorite');
    return storageService.toggleBuildFavorite(id);
  },

  getKitchenMembers: async (): Promise<KitchenMember[]> => {
    trackLegacyServiceUsage('getKitchenMembers');
    return storageService.getPartyMembers();
  },

  saveMember: async (member: KitchenMember): Promise<void> => {
    trackLegacyServiceUsage('saveMember');
    return storageService.savePartyMember(member);
  },

  deleteMember: async (id: string): Promise<void> => {
    trackLegacyServiceUsage('deleteMember');
    return storageService.deletePartyMember(id);
  },

  getPantry: async (): Promise<PantryItem[]> => {
    trackLegacyServiceUsage('getPantry');
    return storageService.getStash();
  },

  addPantryItem: async (
    name: string,
    replenishmentRule?: string,
    inStock?: boolean,
    quantity?: string,
    unit?: string,
    unitDetails?: string,
  ): Promise<PantryItem | null> => {
    trackLegacyServiceUsage('addPantryItem');
    return storageService.addStashItem(
      name,
      replenishmentRule,
      inStock,
      quantity,
      unit,
      unitDetails,
    );
  },

  togglePantryItemStock: async (name: string, inStock: boolean): Promise<void> => {
    trackLegacyServiceUsage('togglePantryItemStock');
    return storageService.toggleStashItemStock(name, inStock);
  },

  removePantryItem: async (name: string): Promise<void> => {
    trackLegacyServiceUsage('removePantryItem');
    return storageService.removeStashItem(name);
  },

  editPantryItem: async (
    currentName: string,
    updates: {
      name?: string;
      inStock?: boolean;
      replenishmentRule?: string;
      quantity?: string;
      unit?: string;
      unitDetails?: string;
    },
  ): Promise<void> => {
    trackLegacyServiceUsage('editPantryItem');
    return storageService.editStashItem(currentName, updates);
  },

  getShoppingList: async (
    options?: { status?: BuildItemStatus | 'all' },
  ): Promise<ShoppingItem[]> => {
    trackLegacyServiceUsage('getShoppingList');
    return storageService.getBuildItems(options);
  },

  addToShoppingList: async (name: string): Promise<void> => {
    trackLegacyServiceUsage('addToShoppingList');
    return storageService.addBuildItem(name);
  },

  updateShoppingItem: async (
    id: string,
    updates: { checked?: boolean; quantity?: string },
  ): Promise<void> => {
    trackLegacyServiceUsage('updateShoppingItem');
    return storageService.updateBuildItem(id, updates);
  },

  deleteShoppingItem: async (id: string): Promise<void> => {
    trackLegacyServiceUsage('deleteShoppingItem');
    return storageService.deleteBuildItem(id);
  },

  clearShoppingList: async (): Promise<void> => {
    trackLegacyServiceUsage('clearShoppingList');
    return storageService.clearBuildItems();
  },

  getCurrentKitchen: async (): Promise<Hideout> => {
    trackLegacyServiceUsage('getCurrentKitchen');
    return storageService.getCurrentHideout();
  },

  joinKitchen: async (code: string): Promise<{ kitchenId: string; name: string }> => {
    trackLegacyServiceUsage('joinKitchen');
    return storageService.joinHideout(code);
  },

  createKitchen: async (name: string): Promise<void> => {
    trackLegacyServiceUsage('createKitchen');
    return storageService.createHideout(name);
  },

  switchKitchen: async (kitchenId: string): Promise<void> => {
    trackLegacyServiceUsage('switchKitchen');
    return storageService.switchHideout(kitchenId);
  },

  updateKitchen: async (id: string, name: string): Promise<Hideout> => {
    trackLegacyServiceUsage('updateKitchen');
    return storageService.updateHideout(id, name);
  },

  deleteKitchen: async (id: string): Promise<Hideout> => {
    trackLegacyServiceUsage('deleteKitchen');
    return storageService.deleteHideout(id);
  },

  leaveKitchen: async (membershipId: string): Promise<void> => {
    trackLegacyServiceUsage('leaveKitchen');
    return storageService.leaveHideout(membershipId);
  },
};
