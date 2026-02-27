import { storageService } from '@/services/storageService';

global.fetch = jest.fn();

describe('storageService additional coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getBuildById returns null on 404 and throws on other errors', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ message: 'Not Found' }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ message: 'Fail' }) });

    await expect(storageService.getBuildById('id-1')).resolves.toBeNull();
    await expect(storageService.getBuildById('id-1')).rejects.toThrow('Fail');
  });

  it('toggleStashItemStock, clearBuildItems and leaveHideout delegate to correct endpoints', async () => {
    await storageService.toggleStashItemStock('Orb of Fusing', false);
    await storageService.clearBuildItems();
    await storageService.leaveHideout('member-1');

    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/stash/Orb%20of%20Fusing', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ inStock: false }),
    }));
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/checklist', expect.objectContaining({ method: 'DELETE' }));
    expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/party-members/member-1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('updateHideout and deleteHideout throw when response is not ok', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    await expect(storageService.updateHideout('k1', 'New')).rejects.toThrow('Failed to update hideout');
    await expect(storageService.deleteHideout('k1')).rejects.toThrow('Failed to delete hideout');
  });

  it('updateHideout and deleteHideout return json payload on success', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'k1', name: 'New' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'k1', deleted: true }) });

    await expect(storageService.updateHideout('k1', 'New')).resolves.toEqual({ id: 'k1', name: 'New' });
    await expect(storageService.deleteHideout('k1')).resolves.toEqual({ id: 'k1', deleted: true });
  });

  it('tracks and delegates legacy wrappers for kitchen/checklist methods', async () => {
    await storageService.clearShoppingList();
    await storageService.getCurrentKitchen();
    await storageService.joinKitchen('ABCD');
    await storageService.updateKitchen('k1', 'Atlas');
    await storageService.deleteKitchen('k1');
    await storageService.leaveKitchen('member-2');

    expect(global.fetch).toHaveBeenCalledWith('/api/checklist', expect.objectContaining({ method: 'DELETE' }));
    expect(global.fetch).toHaveBeenCalledWith('/api/hideouts', expect.any(Object));
    expect(global.fetch).toHaveBeenCalledWith('/api/hideouts/join', expect.objectContaining({ method: 'POST' }));
    expect(global.fetch).toHaveBeenCalledWith('/api/hideouts/k1', expect.objectContaining({ method: 'PUT' }));
    expect(global.fetch).toHaveBeenCalledWith('/api/hideouts/k1', expect.objectContaining({ method: 'DELETE' }));
    expect(global.fetch).toHaveBeenCalledWith('/api/party-members/member-2', expect.objectContaining({ method: 'DELETE' }));
  });

  it('delegates legacy recipe lookup and pantry stock toggle wrappers', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => null })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await expect(storageService.getRecipeById('legacy-build')).resolves.toBeNull();
    await storageService.togglePantryItemStock('Chaos Orb', true);

    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/builds/legacy-build', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/stash/Chaos%20Orb', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ inStock: true }),
    }));
  });

  it('apiRequest fallback handles non-json error payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('invalid-json');
      },
    });

    await expect(storageService.getAllBuilds()).rejects.toThrow('HTTP Error 500');
  });
});
