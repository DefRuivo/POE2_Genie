import { NextRequest } from 'next/server';
import { GET as getShoppingList } from '@/app/api/shopping-list/route';
import { GET as getChecklist } from '@/app/api/checklist/route';
import { GET as getBuildItems } from '@/app/api/build-items/route';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    shoppingItem: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

describe('GET /api/shopping-list status filter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockResolvedValue({ kitchenId: 'k1' });
    (prisma.shoppingItem.findMany as jest.Mock).mockResolvedValue([]);
  });

  it('defaults to pending items when status is omitted', async () => {
    const req = new NextRequest('http://localhost/api/shopping-list');

    await getShoppingList(req);

    expect(prisma.shoppingItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { kitchenId: 'k1', checked: false },
    }));
  });

  it('returns only completed items when status=completed', async () => {
    const req = new NextRequest('http://localhost/api/shopping-list?status=completed');

    await getShoppingList(req);

    expect(prisma.shoppingItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { kitchenId: 'k1', checked: true },
    }));
  });

  it('returns both statuses when status=all', async () => {
    const req = new NextRequest('http://localhost/api/shopping-list?status=all');

    await getShoppingList(req);

    const callArgs = (prisma.shoppingItem.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where).toEqual({ kitchenId: 'k1' });
  });

  it('applies the same filtering through the /api/build-items alias', async () => {
    const req = new NextRequest('http://localhost/api/build-items?status=completed');

    await getBuildItems(req);

    expect(prisma.shoppingItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { kitchenId: 'k1', checked: true },
    }));
  });

  it('applies the same filtering through the /api/checklist canonical route', async () => {
    const req = new NextRequest('http://localhost/api/checklist?status=completed');

    await getChecklist(req);

    expect(prisma.shoppingItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { kitchenId: 'k1', checked: true },
    }));
  });
});
