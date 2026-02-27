import { storageService } from '../../services/storageService';

// Mock global fetch
global.fetch = jest.fn();

describe('storageService', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    it('getAllRecipes should return data when API call is successful', async () => {
        const mockRecipes = [{ id: '1', title: 'Pasta' }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockRecipes,
        });

        const result = await storageService.getAllRecipes();
        expect(result).toEqual(mockRecipes);
        expect(global.fetch).toHaveBeenCalledWith('/api/builds', expect.any(Object));
    });

    it('getAllRecipes should return empty array when API returns null', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => null,
        });

        const result = await storageService.getAllRecipes();
        expect(result).toEqual([]);
    });

    it('saveRecipe should make a POST request', async () => {
        const newRecipe = { title: 'New Recipe' };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        await storageService.saveRecipe(newRecipe);

        expect(global.fetch).toHaveBeenCalledWith('/api/builds', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(newRecipe),
        }));
    });

    it('deleteRecipe should make DELETE request', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        await storageService.deleteRecipe('1');

        expect(global.fetch).toHaveBeenCalledWith('/api/builds/1', expect.objectContaining({
            method: 'DELETE'
        }));
    });

    it('toggleFavorite should make PATCH request', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        await storageService.toggleFavorite('1');

        expect(global.fetch).toHaveBeenCalledWith('/api/builds/1/favorite', expect.objectContaining({
            method: 'PATCH'
        }));
    });

    it('getKitchenMembers should return members', async () => {
        const mockMembers = [{ id: 'm1', name: 'Mom' }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockMembers,
        });

        const result = await storageService.getKitchenMembers();
        expect(result).toEqual(mockMembers);
    });

    it('saveMember should POST new member', async () => {
        const member = { name: 'Dad', dietary_restrictions: [] } as any;
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

        await storageService.saveMember(member);
        expect(global.fetch).toHaveBeenCalledWith('/api/party-members', expect.objectContaining({
            method: 'POST'
        }));
    });

    it('deleteMember should DELETE member', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await storageService.deleteMember('1');
        expect(global.fetch).toHaveBeenCalledWith('/api/party-members/1', expect.objectContaining({
            method: 'DELETE'
        }));
    });

    it('addPantryItem should POST new item', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await storageService.addPantryItem('Rice');
        expect(global.fetch).toHaveBeenCalledWith('/api/stash', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ name: 'Rice' })
        }));
    });

    it('removePantryItem should DELETE item', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await storageService.removePantryItem('Rice');
        expect(global.fetch).toHaveBeenCalledWith('/api/stash/Rice', expect.objectContaining({
            method: 'DELETE'
        }));
    });

    it('editPantryItem should PUT item updates', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await storageService.editPantryItem('Rice', { inStock: true });
        expect(global.fetch).toHaveBeenCalledWith('/api/stash/Rice', expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ inStock: true })
        }));
    });

    it('getShoppingList should return items', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
        await storageService.getShoppingList();
        expect(global.fetch).toHaveBeenCalledWith('/api/checklist', expect.any(Object));
    });

    it('getBuildItems should support status filter "all"', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
        await storageService.getBuildItems({ status: 'all' });
        expect(global.fetch).toHaveBeenCalledWith('/api/checklist?status=all', expect.any(Object));
    });

    it('getShoppingList wrapper should support status filter "completed"', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
        await storageService.getShoppingList({ status: 'completed' });
        expect(global.fetch).toHaveBeenCalledWith('/api/checklist?status=completed', expect.any(Object));
    });

    it('addToShoppingList should POST item', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await storageService.addToShoppingList('Milk');
        expect(global.fetch).toHaveBeenCalledWith('/api/checklist', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ name: 'Milk' })
        }));
    });

    it('updateShoppingItem should PUT updates', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await storageService.updateShoppingItem('1', { checked: true });
        expect(global.fetch).toHaveBeenCalledWith('/api/checklist/1', expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ checked: true })
        }));
    });

    it('deleteShoppingItem should DELETE item', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await storageService.deleteShoppingItem('1');
        expect(global.fetch).toHaveBeenCalledWith('/api/checklist/1', expect.objectContaining({
            method: 'DELETE'
        }));
    });

    it('getTags should fetch tags by category', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ['Tag1'] });
        await storageService.getTags('category');
        expect(global.fetch).toHaveBeenCalledWith('/api/tags?category=category', expect.any(Object));
    });

    it('canonical methods return empty arrays when payload is null', async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => null }) // getPartyMembers
            .mockResolvedValueOnce({ ok: true, json: async () => null }) // getStash
            .mockResolvedValueOnce({ ok: true, json: async () => null }) // getBuildItems
            .mockResolvedValueOnce({ ok: true, json: async () => null }); // getTags

        await expect(storageService.getPartyMembers()).resolves.toEqual([]);
        await expect(storageService.getStash()).resolves.toEqual([]);
        await expect(storageService.getBuildItems({ status: 'completed' })).resolves.toEqual([]);
        await expect(storageService.getTags('missing')).resolves.toEqual([]);
    });

    it('getAllBuilds canonical supports language query string', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });

        await storageService.getAllBuilds('pt-BR');
        expect(global.fetch).toHaveBeenCalledWith('/api/builds?lang=pt-BR', expect.any(Object));
    });

    it('saveTag should POST new tag', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await storageService.saveTag('cat', 'tag');
        expect(global.fetch).toHaveBeenCalledWith('/api/tags', expect.objectContaining({
            method: 'POST'
        }));
    });

    it('createKitchen should POST new kitchen', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await storageService.createKitchen('My Kitchen');
        expect(global.fetch).toHaveBeenCalledWith('/api/hideouts', expect.objectContaining({
            method: 'POST'
        }));
    });

    it('getCurrentUser should fetch auth/me', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await storageService.getCurrentUser();
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', expect.any(Object));
    });

    it('switchKitchen should POST context switch', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await storageService.switchKitchen('k1');
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/switch-context', expect.objectContaining({
            method: 'POST'
        }));
    });

    it('getPantry should return items', async () => {
        const mockPantry = [{ id: '1', name: 'Salt' }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPantry,
        });

        const result = await storageService.getPantry();
        expect(result).toEqual(mockPantry);
        expect(global.fetch).toHaveBeenCalledWith('/api/stash', expect.any(Object));
    });

    it('updateProfile should make PUT request', async () => {
        const profileData = { name: 'John', surname: 'Doe', measurementSystem: 'metric' };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        await storageService.updateProfile(profileData);

        expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(profileData)
        }));
    });

    it('apiRequest includes backend error details when provided', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ message: 'Request failed', error: 'validation' }),
        });

        await expect(storageService.getAllBuilds()).rejects.toThrow('Request failed (validation)');
    });
});
