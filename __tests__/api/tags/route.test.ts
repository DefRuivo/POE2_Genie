import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tags/route';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    restriction: { findMany: jest.fn() },
    like: { findMany: jest.fn() },
    dislike: { findMany: jest.fn() },
    tagSuggestion: { upsert: jest.fn() },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

describe('/api/tags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockResolvedValue({ kitchenId: 'k1' });
  });

  it('GET returns empty list when q is missing', async () => {
    const req = new NextRequest('http://localhost/api/tags?category=restriction');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('GET returns restriction suggestions', async () => {
    (prisma.restriction.findMany as jest.Mock).mockResolvedValue([{ name: 'No Minions' }]);

    const req = new NextRequest('http://localhost/api/tags?category=restriction&q=min');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(['No Minions']);
  });

  it('GET returns like suggestions', async () => {
    (prisma.like.findMany as jest.Mock).mockResolvedValue([{ name: 'Mapper' }]);
    const req = new NextRequest('http://localhost/api/tags?category=like&q=map');
    const res = await GET(req);
    expect(await res.json()).toEqual(['Mapper']);
  });

  it('GET returns dislike suggestions', async () => {
    (prisma.dislike.findMany as jest.Mock).mockResolvedValue([{ name: 'Traps' }]);
    const req = new NextRequest('http://localhost/api/tags?category=dislike&q=trap');
    const res = await GET(req);
    expect(await res.json()).toEqual(['Traps']);
  });

  it('GET returns empty list for unknown category', async () => {
    const req = new NextRequest('http://localhost/api/tags?category=other&q=test');
    const res = await GET(req);
    expect(await res.json()).toEqual([]);
  });

  it('GET returns 500 on query errors', async () => {
    (prisma.restriction.findMany as jest.Mock).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/tags?category=restriction&q=tag');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('POST returns 400 when category or tag is missing', async () => {
    const req = new NextRequest('http://localhost/api/tags', {
      method: 'POST',
      body: JSON.stringify({ category: 'like' }),
      headers: { cookie: 'auth_token=token' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST returns 401 when unauthorized', async () => {
    (verifyToken as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/tags', {
      method: 'POST',
      body: JSON.stringify({ category: 'like', tag: 'Mapper' }),
      headers: { cookie: 'auth_token=token' },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST handles missing auth cookie by validating empty token', async () => {
    (verifyToken as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/tags', {
      method: 'POST',
      body: JSON.stringify({ category: 'like', tag: 'Mapper' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(verifyToken).toHaveBeenCalledWith('');
  });

  it('POST upserts tag suggestion for current kitchen', async () => {
    (prisma.tagSuggestion.upsert as jest.Mock).mockResolvedValue({ id: 's1' });

    const req = new NextRequest('http://localhost/api/tags', {
      method: 'POST',
      body: JSON.stringify({ category: 'like', tag: 'Mapper' }),
      headers: { cookie: 'auth_token=token' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(prisma.tagSuggestion.upsert).toHaveBeenCalledWith({
      where: {
        category_tag_kitchenId: {
          category: 'like',
          tag: 'Mapper',
          kitchenId: 'k1',
        },
      },
      update: {},
      create: {
        category: 'like',
        tag: 'Mapper',
        kitchenId: 'k1',
      },
    });
  });

  it('POST returns 500 on failures', async () => {
    (prisma.tagSuggestion.upsert as jest.Mock).mockRejectedValue(new Error('db'));
    const req = new NextRequest('http://localhost/api/tags', {
      method: 'POST',
      body: JSON.stringify({ category: 'like', tag: 'Mapper' }),
      headers: { cookie: 'auth_token=token' },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
