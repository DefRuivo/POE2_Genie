import { DELETE as clearChecklistCanonical, GET as getChecklistCanonical, POST as postChecklistCanonical } from '@/app/api/checklist/route';
import { DELETE as deleteChecklistCanonical, PUT as updateChecklistCanonical } from '@/app/api/checklist/[id]/route';
import { DELETE as clearBuildItemsLegacy, GET as getBuildItemsLegacy, POST as postBuildItemsLegacy } from '@/app/api/build-items/route';
import { DELETE as deleteBuildItemsLegacy, PUT as updateBuildItemsLegacy } from '@/app/api/build-items/[id]/route';
import { DELETE as clearShoppingLegacy, GET as getShoppingLegacy, POST as postShoppingLegacy } from '@/app/api/shopping-list/route';
import { DELETE as deleteShoppingLegacy, PUT as updateShoppingLegacy } from '@/app/api/shopping-list/[id]/route';

import { GET as getStashCanonical, POST as postStashCanonical } from '@/app/api/stash/route';
import { DELETE as deleteStashCanonical, PUT as updateStashCanonical } from '@/app/api/stash/[name]/route';
import { GET as getPantryLegacy, POST as postPantryLegacy } from '@/app/api/pantry/route';
import { DELETE as deletePantryLegacy, PUT as updatePantryLegacy } from '@/app/api/pantry/[name]/route';

const getChecklistMock = jest.fn();
const addChecklistItemMock = jest.fn();
const clearChecklistMock = jest.fn();
const updateChecklistItemByIdMock = jest.fn();
const deleteChecklistItemByIdMock = jest.fn();

const getStashMock = jest.fn();
const addStashItemMock = jest.fn();
const updateStashItemByNameMock = jest.fn();
const deleteStashItemByNameMock = jest.fn();

jest.mock('@/lib/api/checklist-handlers', () => ({
  getChecklist: (...args: unknown[]) => getChecklistMock(...args),
  addChecklistItem: (...args: unknown[]) => addChecklistItemMock(...args),
  clearChecklist: (...args: unknown[]) => clearChecklistMock(...args),
  updateChecklistItemById: (...args: unknown[]) => updateChecklistItemByIdMock(...args),
  deleteChecklistItemById: (...args: unknown[]) => deleteChecklistItemByIdMock(...args),
}));

jest.mock('@/lib/api/stash-handlers', () => ({
  getStash: (...args: unknown[]) => getStashMock(...args),
  addStashItem: (...args: unknown[]) => addStashItemMock(...args),
  updateStashItemByName: (...args: unknown[]) => updateStashItemByNameMock(...args),
  deleteStashItemByName: (...args: unknown[]) => deleteStashItemByNameMock(...args),
}));

describe('Stash/checklist canonical handlers and legacy aliases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getChecklistMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    addChecklistItemMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    clearChecklistMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    updateChecklistItemByIdMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    deleteChecklistItemByIdMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    getStashMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    addStashItemMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    updateStashItemByNameMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    deleteStashItemByNameMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
  });

  it('uses shared checklist handler for canonical and legacy routes', async () => {
    const req = new Request('http://localhost/api/checklist?status=all');
    const idProps = { params: Promise.resolve({ id: '123' }) };

    const canonicalResponses = [
      await getChecklistCanonical(req as never),
      await postChecklistCanonical(req as never),
      await clearChecklistCanonical(req as never),
      await updateChecklistCanonical(req as never, idProps),
      await deleteChecklistCanonical(req as never, idProps),
    ];

    const legacyResponses = [
      await getBuildItemsLegacy(req as never),
      await postBuildItemsLegacy(req as never),
      await clearBuildItemsLegacy(req as never),
      await updateBuildItemsLegacy(req as never, idProps),
      await deleteBuildItemsLegacy(req as never, idProps),
      await getShoppingLegacy(req as never),
      await postShoppingLegacy(req as never),
      await clearShoppingLegacy(req as never),
      await updateShoppingLegacy(req as never, idProps),
      await deleteShoppingLegacy(req as never, idProps),
    ];

    expect(getChecklistMock).toHaveBeenCalledTimes(3);
    expect(addChecklistItemMock).toHaveBeenCalledTimes(3);
    expect(clearChecklistMock).toHaveBeenCalledTimes(3);
    expect(updateChecklistItemByIdMock).toHaveBeenCalledTimes(3);
    expect(deleteChecklistItemByIdMock).toHaveBeenCalledTimes(3);

    canonicalResponses.forEach((response) => {
      expect(response.headers.get('Deprecation')).toBeNull();
    });
    legacyResponses.forEach((response) => {
      expect(response.headers.get('Deprecation')).toBe('true');
    });
  });

  it('uses shared stash handler for canonical and legacy routes', async () => {
    const req = new Request('http://localhost/api/stash');
    const nameProps = { params: Promise.resolve({ name: 'orb' }) };

    const canonicalResponses = [
      await getStashCanonical(req as never),
      await postStashCanonical(req as never),
      await updateStashCanonical(req as never, nameProps),
      await deleteStashCanonical(req as never, nameProps),
    ];

    const legacyResponses = [
      await getPantryLegacy(req as never),
      await postPantryLegacy(req as never),
      await updatePantryLegacy(req as never, nameProps),
      await deletePantryLegacy(req as never, nameProps),
    ];

    expect(getStashMock).toHaveBeenCalledTimes(2);
    expect(addStashItemMock).toHaveBeenCalledTimes(2);
    expect(updateStashItemByNameMock).toHaveBeenCalledTimes(2);
    expect(deleteStashItemByNameMock).toHaveBeenCalledTimes(2);

    canonicalResponses.forEach((response) => {
      expect(response.headers.get('Deprecation')).toBeNull();
    });
    legacyResponses.forEach((response) => {
      expect(response.headers.get('Deprecation')).toBe('true');
    });
  });
});
