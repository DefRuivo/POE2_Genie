import { NextRequest } from 'next/server';
import {
  addStashItem,
  deleteStashItemByName,
  getStash,
  updateStashItemByName,
} from '@/lib/api/stash-handlers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    pantryItem: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    shoppingItem: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

describe('lib/api/stash-handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockResolvedValue({ kitchenId: 'k-1' });
    (prisma.pantryItem.findMany as jest.Mock).mockResolvedValue([]);
  });

  it('returns 401 when getStash unauthorized', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/stash');
    const res = await getStash(req);
    expect(res.status).toBe(401);
  });

  it('returns stash items for authenticated kitchen', async () => {
    (prisma.pantryItem.findMany as jest.Mock).mockResolvedValue([{ id: 'p1', name: 'Orb of Alteration' }]);
    const req = new NextRequest('http://localhost/api/stash');
    const res = await getStash(req);
    const json = await res.json();

    expect(prisma.pantryItem.findMany).toHaveBeenCalledWith({
      where: { kitchenId: 'k-1' },
      select: {
        id: true,
        name: true,
        inStock: true,
        replenishmentRule: true,
        quantity: true,
        unit: true,
        unitDetails: true,
        shoppingItemId: true,
      },
    });
    expect(json).toEqual([{ id: 'p1', name: 'Orb of Alteration' }]);
  });

  it('returns 500 when getStash fails', async () => {
    (prisma.pantryItem.findMany as jest.Mock).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/stash');
    const res = await getStash(req);
    expect(res.status).toBe(500);
  });

  it('returns 400 when addStashItem has no name', async () => {
    const req = new NextRequest('http://localhost/api/stash', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await addStashItem(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when addStashItem unauthorized', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/stash', {
      method: 'POST',
      body: JSON.stringify({ name: 'Orb of Alchemy' }),
    });
    const res = await addStashItem(req);
    expect(res.status).toBe(401);
  });

  it('adds stash item and links shopping item when ALWAYS and out of stock', async () => {
    const created = {
      id: 'p1',
      name: 'Orb of Fusing',
      replenishmentRule: 'ALWAYS',
      inStock: false,
    };
    const tx = {
      pantryItem: {
        upsert: jest.fn().mockResolvedValue(created),
        update: jest.fn().mockResolvedValue({ ...created, shoppingItemId: 's1' }),
      },
      shoppingItem: {
        upsert: jest.fn().mockResolvedValue({ id: 's1' }),
      },
    };
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(tx));

    const req = new NextRequest('http://localhost/api/stash', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Orb of Fusing',
        replenishmentRule: 'ALWAYS',
        inStock: false,
      }),
    });
    const res = await addStashItem(req);
    const json = await res.json();

    expect(tx.shoppingItem.upsert).toHaveBeenCalled();
    expect(tx.pantryItem.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { shoppingItemId: 's1' },
    });
    expect(json.id).toBe('p1');
  });

  it('adds stash item without shopping sync for non-ALWAYS rules', async () => {
    const created = {
      id: 'p2',
      name: 'Chaos Orb',
      replenishmentRule: 'NEVER',
      inStock: true,
    };
    const tx = {
      pantryItem: {
        upsert: jest.fn().mockResolvedValue(created),
        update: jest.fn(),
      },
      shoppingItem: {
        upsert: jest.fn(),
      },
    };
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(tx));

    const req = new NextRequest('http://localhost/api/stash', {
      method: 'POST',
      body: JSON.stringify({ name: 'Chaos Orb' }),
    });
    const res = await addStashItem(req);

    expect(res.status).toBe(200);
    expect(tx.shoppingItem.upsert).not.toHaveBeenCalled();
    expect(tx.pantryItem.update).not.toHaveBeenCalled();
  });

  it('returns 500 when addStashItem fails', async () => {
    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/stash', {
      method: 'POST',
      body: JSON.stringify({ name: 'Orb' }),
    });
    const res = await addStashItem(req);
    expect(res.status).toBe(500);
  });

  it('updates stash item and syncs shopping when ALWAYS + out of stock', async () => {
    const tx = {
      pantryItem: {
        update: jest.fn().mockResolvedValue({
          id: 'p3',
          name: 'Regret Orb',
          replenishmentRule: 'ALWAYS',
          inStock: false,
        }),
      },
      shoppingItem: {
        upsert: jest.fn().mockResolvedValue({ id: 's2' }),
      },
    };
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(tx));

    const req = new NextRequest('http://localhost/api/stash/Regret%20Orb', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Regret Orb',
        inStock: false,
        replenishmentRule: 'ALWAYS',
      }),
    });
    const res = await updateStashItemByName(req, { params: Promise.resolve({ name: 'Regret%20Orb' }) });

    expect(res.status).toBe(200);
    expect(tx.shoppingItem.upsert).toHaveBeenCalled();
    expect(tx.pantryItem.update).toHaveBeenCalledTimes(2);
  });

  it('updates stash item without shopping sync when in stock', async () => {
    const tx = {
      pantryItem: {
        update: jest.fn().mockResolvedValue({
          id: 'p4',
          name: 'Divine Orb',
          replenishmentRule: 'ALWAYS',
          inStock: true,
        }),
      },
      shoppingItem: {
        upsert: jest.fn(),
      },
    };
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(tx));

    const req = new NextRequest('http://localhost/api/stash/Divine%20Orb', {
      method: 'PUT',
      body: JSON.stringify({ inStock: true }),
    });
    const res = await updateStashItemByName(req, { params: Promise.resolve({ name: 'Divine%20Orb' }) });

    expect(res.status).toBe(200);
    expect(tx.shoppingItem.upsert).not.toHaveBeenCalled();
  });

  it('returns 401 when updateStashItemByName unauthorized', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/stash/a', {
      method: 'PUT',
      body: JSON.stringify({}),
    });
    const res = await updateStashItemByName(req, { params: Promise.resolve({ name: 'a' }) });
    expect(res.status).toBe(401);
  });

  it('returns 500 when updateStashItemByName fails', async () => {
    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/stash/a', {
      method: 'PUT',
      body: JSON.stringify({}),
    });
    const res = await updateStashItemByName(req, { params: Promise.resolve({ name: 'a' }) });
    expect(res.status).toBe(500);
  });

  it('deletes stash item by encoded name', async () => {
    (prisma.pantryItem.delete as jest.Mock).mockResolvedValue({ id: 'p5' });
    const req = new NextRequest('http://localhost/api/stash/Orb%20of%20Scouring', { method: 'DELETE' });
    const res = await deleteStashItemByName(req, { params: Promise.resolve({ name: 'Orb%20of%20Scouring' }) });
    const json = await res.json();

    expect(prisma.pantryItem.delete).toHaveBeenCalledWith({
      where: {
        name_kitchenId: {
          name: 'Orb of Scouring',
          kitchenId: 'k-1',
        },
      },
    });
    expect(json).toEqual({ success: true });
  });

  it('returns 401 when deleteStashItemByName unauthorized', async () => {
    (verifyToken as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/stash/a', { method: 'DELETE' });
    const res = await deleteStashItemByName(req, { params: Promise.resolve({ name: 'a' }) });
    expect(res.status).toBe(401);
  });

  it('returns 500 when deleteStashItemByName fails', async () => {
    (prisma.pantryItem.delete as jest.Mock).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/stash/a', { method: 'DELETE' });
    const res = await deleteStashItemByName(req, { params: Promise.resolve({ name: 'a' }) });
    expect(res.status).toBe(500);
  });
});
