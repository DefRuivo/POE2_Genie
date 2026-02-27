import { NextRequest } from 'next/server';
import {
  addChecklistItem,
  clearChecklist,
  deleteChecklistItemById,
  getChecklist,
  updateChecklistItemById,
} from '@/lib/api/checklist-handlers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    shoppingItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
    pantryItem: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

describe('lib/api/checklist-handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockResolvedValue({ kitchenId: 'k-1' });
    (prisma.shoppingItem.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);
  });

  it('returns 401 when auth payload has no kitchenId', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/checklist');

    const res = await getChecklist(req);
    expect(res.status).toBe(401);
  });

  it('filters checklist status by pending/completed/all and invalid fallback to pending', async () => {
    await getChecklist(new NextRequest('http://localhost/api/checklist'));
    await getChecklist(new NextRequest('http://localhost/api/checklist?status=completed'));
    await getChecklist(new NextRequest('http://localhost/api/checklist?status=all'));
    await getChecklist(new NextRequest('http://localhost/api/checklist?status=invalid'));

    const calls = (prisma.shoppingItem.findMany as jest.Mock).mock.calls.map((c) => c[0].where);
    expect(calls[0]).toEqual({ kitchenId: 'k-1', checked: false });
    expect(calls[1]).toEqual({ kitchenId: 'k-1', checked: true });
    expect(calls[2]).toEqual({ kitchenId: 'k-1' });
    expect(calls[3]).toEqual({ kitchenId: 'k-1', checked: false });
  });

  it('returns 500 when getChecklist fails', async () => {
    (prisma.shoppingItem.findMany as jest.Mock).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/checklist');

    const res = await getChecklist(req);
    expect(res.status).toBe(500);
  });

  it('adds checklist item: unchecks existing checked item', async () => {
    (prisma.shoppingItem.findFirst as jest.Mock).mockResolvedValue({ id: 's1', checked: true });
    (prisma.shoppingItem.update as jest.Mock).mockResolvedValue({ id: 's1', checked: false });

    const req = new NextRequest('http://localhost/api/checklist', {
      method: 'POST',
      body: JSON.stringify({ name: 'Orb of Alchemy' }),
    });
    const res = await addChecklistItem(req);
    const json = await res.json();

    expect(prisma.shoppingItem.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { checked: false },
    });
    expect(json.checked).toBe(false);
  });

  it('adds checklist item: keeps existing unchecked item unchanged', async () => {
    (prisma.shoppingItem.findFirst as jest.Mock).mockResolvedValue({ id: 's2', checked: false });

    const req = new NextRequest('http://localhost/api/checklist', {
      method: 'POST',
      body: JSON.stringify({ name: 'Chaos Orb' }),
    });
    const res = await addChecklistItem(req);

    expect(res.status).toBe(200);
    expect(prisma.shoppingItem.update).not.toHaveBeenCalled();
    expect(prisma.shoppingItem.create).not.toHaveBeenCalled();
  });

  it('adds checklist item: creates new when not found', async () => {
    (prisma.shoppingItem.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.shoppingItem.create as jest.Mock).mockResolvedValue({ id: 's3', name: 'Divine Orb' });

    const req = new NextRequest('http://localhost/api/checklist', {
      method: 'POST',
      body: JSON.stringify({ name: 'Divine Orb' }),
    });
    const res = await addChecklistItem(req);
    const json = await res.json();

    expect(prisma.shoppingItem.create).toHaveBeenCalledWith({
      data: {
        name: 'Divine Orb',
        kitchenId: 'k-1',
        checked: false,
      },
    });
    expect(json.id).toBe('s3');
  });

  it('returns 401 when addChecklistItem unauthorized', async () => {
    (verifyToken as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/checklist', {
      method: 'POST',
      body: JSON.stringify({ name: 'Orb' }),
    });
    const res = await addChecklistItem(req);
    expect(res.status).toBe(401);
  });

  it('returns 500 when addChecklistItem fails', async () => {
    (prisma.shoppingItem.findFirst as jest.Mock).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/checklist', {
      method: 'POST',
      body: JSON.stringify({ name: 'Orb' }),
    });
    const res = await addChecklistItem(req);
    expect(res.status).toBe(500);
  });

  it('clears checklist by deleting or archiving according to linkage and checked status', async () => {
    (prisma.shoppingItem.findMany as jest.Mock).mockResolvedValue([
      { id: 'a', checked: false, _count: { recipeItems: 0 } },
      { id: 'b', checked: false, _count: { recipeItems: 2 } },
      { id: 'c', checked: true, _count: { recipeItems: 1 } },
    ]);

    const req = new NextRequest('http://localhost/api/checklist', { method: 'DELETE' });
    const res = await clearChecklist(req);
    const json = await res.json();

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.shoppingItem.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['a'] } },
    });
    expect(prisma.shoppingItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['b'] } },
      data: { checked: true },
    });
    expect(json).toEqual({
      message: 'Checklist cleared',
      deleted: 1,
      archived: 1,
    });
  });

  it('returns 401 when clearChecklist unauthorized', async () => {
    (verifyToken as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/checklist', { method: 'DELETE' });
    const res = await clearChecklist(req);
    expect(res.status).toBe(401);
  });

  it('returns 500 when clearChecklist fails', async () => {
    (prisma.shoppingItem.findMany as jest.Mock).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/checklist', { method: 'DELETE' });
    const res = await clearChecklist(req);
    expect(res.status).toBe(500);
  });

  it('updates checklist item and syncs to stash when checked=true', async () => {
    (prisma.shoppingItem.findUnique as jest.Mock).mockResolvedValue({
      kitchenId: 'k-1',
      name: 'Orb of Fusing',
    });
    (prisma.shoppingItem.update as jest.Mock).mockResolvedValue({ id: 'item-1', checked: true });

    const req = new NextRequest('http://localhost/api/checklist/item-1', {
      method: 'PUT',
      body: JSON.stringify({ checked: true }),
    });

    const res = await updateChecklistItemById(req, { params: Promise.resolve({ id: 'item-1' }) });
    expect(res.status).toBe(200);
    expect(prisma.pantryItem.upsert).toHaveBeenCalledWith({
      where: { name_kitchenId: { name: 'Orb of Fusing', kitchenId: 'k-1' } },
      update: { inStock: true },
      create: {
        name: 'Orb of Fusing',
        kitchenId: 'k-1',
        inStock: true,
        replenishmentRule: 'NEVER',
      },
    });
  });

  it('updates checklist item without stash sync when reopening (checked=false)', async () => {
    (prisma.shoppingItem.findUnique as jest.Mock).mockResolvedValue({
      kitchenId: 'k-1',
      name: 'Regret Orb',
    });
    (prisma.shoppingItem.update as jest.Mock).mockResolvedValue({ id: 'item-2', checked: false });

    const req = new NextRequest('http://localhost/api/checklist/item-2', {
      method: 'PUT',
      body: JSON.stringify({ checked: false }),
    });

    const res = await updateChecklistItemById(req, { params: Promise.resolve({ id: 'item-2' }) });
    expect(res.status).toBe(200);
    expect(prisma.pantryItem.upsert).not.toHaveBeenCalled();
  });

  it('returns 404 when checklist item not found or belongs to another kitchen', async () => {
    (prisma.shoppingItem.findUnique as jest.Mock).mockResolvedValue({ kitchenId: 'k-2' });
    const req = new NextRequest('http://localhost/api/checklist/item-3', {
      method: 'PUT',
      body: JSON.stringify({ checked: true }),
    });
    const res = await updateChecklistItemById(req, { params: Promise.resolve({ id: 'item-3' }) });
    expect(res.status).toBe(404);
  });

  it('returns 401 when updateChecklistItemById unauthorized', async () => {
    (verifyToken as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/checklist/item-4', {
      method: 'PUT',
      body: JSON.stringify({ checked: true }),
    });
    const res = await updateChecklistItemById(req, { params: Promise.resolve({ id: 'item-4' }) });
    expect(res.status).toBe(401);
  });

  it('returns 500 when updateChecklistItemById fails', async () => {
    (prisma.shoppingItem.findUnique as jest.Mock).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/checklist/item-5', {
      method: 'PUT',
      body: JSON.stringify({ checked: true }),
    });
    const res = await updateChecklistItemById(req, { params: Promise.resolve({ id: 'item-5' }) });
    expect(res.status).toBe(500);
  });

  it('deletes checklist item when it belongs to current kitchen', async () => {
    (prisma.shoppingItem.findUnique as jest.Mock).mockResolvedValue({ kitchenId: 'k-1' });
    (prisma.shoppingItem.delete as jest.Mock).mockResolvedValue({ id: 'item-del' });
    const req = new NextRequest('http://localhost/api/checklist/item-del', { method: 'DELETE' });

    const res = await deleteChecklistItemById(req, { params: Promise.resolve({ id: 'item-del' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.shoppingItem.delete).toHaveBeenCalledWith({ where: { id: 'item-del' } });
    expect(json).toEqual({ message: 'Checklist item deleted' });
  });

  it('returns 404 when deleting missing/foreign checklist item', async () => {
    (prisma.shoppingItem.findUnique as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/checklist/item-x', { method: 'DELETE' });
    const res = await deleteChecklistItemById(req, { params: Promise.resolve({ id: 'item-x' }) });
    expect(res.status).toBe(404);
  });

  it('returns 401 when deleteChecklistItemById unauthorized', async () => {
    (verifyToken as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/checklist/item-y', { method: 'DELETE' });
    const res = await deleteChecklistItemById(req, { params: Promise.resolve({ id: 'item-y' }) });
    expect(res.status).toBe(401);
  });

  it('returns 500 when deleteChecklistItemById fails', async () => {
    (prisma.shoppingItem.findUnique as jest.Mock).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/checklist/item-z', { method: 'DELETE' });
    const res = await deleteChecklistItemById(req, { params: Promise.resolve({ id: 'item-z' }) });
    expect(res.status).toBe(500);
  });
});
