import { NextRequest } from 'next/server';
import {
  createHideout,
  deleteHideout,
  getCurrentHideout,
  joinHideout,
  updateHideout,
} from '@/lib/api/hideouts-handlers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { generateKitchenCode } from '@/lib/kitchen-code';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    kitchen: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    kitchenMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/kitchen-code', () => ({
  generateKitchenCode: jest.fn(),
}));

const authedRequest = (url: string, init?: RequestInit) => new NextRequest(url, {
  ...init,
  headers: {
    ...(init?.headers || {}),
    cookie: 'auth_token=valid-token',
  },
});

describe('lib/api/hideouts-handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockResolvedValue({ userId: 'u1', kitchenId: 'k1', name: 'Hero' });
    (generateKitchenCode as jest.Mock).mockReturnValue('ABCD1234');
  });

  describe('createHideout', () => {
    it('returns 400 when name is missing', async () => {
      const req = authedRequest('http://localhost/api/hideouts', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await createHideout(req);
      expect(res.status).toBe(400);
    });

    it('returns 401 when token payload is invalid', async () => {
      (verifyToken as jest.Mock).mockResolvedValueOnce(null);
      const req = authedRequest('http://localhost/api/hideouts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Atlas Base' }),
      });

      const res = await createHideout(req);
      expect(res.status).toBe(401);
    });

    it('returns 404 when user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      const req = authedRequest('http://localhost/api/hideouts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Atlas Base' }),
      });

      const res = await createHideout(req);
      expect(res.status).toBe(404);
    });

    it('creates hideout and returns aliases', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'u1', name: 'Hero' });
      (prisma.kitchen.create as jest.Mock).mockResolvedValueOnce({
        id: 'k-new',
        name: 'Atlas Base',
        members: [{ id: 'm1', name: 'Hero' }],
      });

      const req = authedRequest('http://localhost/api/hideouts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Atlas Base' }),
      });

      const res = await createHideout(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.kitchen.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          name: 'Atlas Base',
          inviteCode: 'ABCD1234',
        }),
      }));
      expect(json.hideoutId).toBe('k-new');
      expect(json.kitchenId).toBe('k-new');
    });

    it('returns 500 on unexpected errors', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db error'));
      const req = authedRequest('http://localhost/api/hideouts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Atlas Base' }),
      });

      const res = await createHideout(req);
      expect(res.status).toBe(500);
    });
  });

  describe('getCurrentHideout', () => {
    it('returns 401 when payload does not include kitchenId', async () => {
      (verifyToken as jest.Mock).mockResolvedValueOnce({ userId: 'u1' });
      const req = authedRequest('http://localhost/api/hideouts');
      const res = await getCurrentHideout(req);
      expect(res.status).toBe(401);
    });

    it('returns 404 when hideout is missing', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockResolvedValueOnce(null);
      const req = authedRequest('http://localhost/api/hideouts');
      const res = await getCurrentHideout(req);
      expect(res.status).toBe(404);
    });

    it('returns hideout with aliases', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'k1', name: 'Atlas Base' });
      const req = authedRequest('http://localhost/api/hideouts');
      const res = await getCurrentHideout(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.hideoutId).toBe('k1');
      expect(json.kitchenId).toBe('k1');
    });

    it('returns 500 when query fails', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db')); 
      const req = authedRequest('http://localhost/api/hideouts');
      const res = await getCurrentHideout(req);
      expect(res.status).toBe(500);
    });
  });

  describe('joinHideout', () => {
    it('returns 400 when code is missing', async () => {
      const req = authedRequest('http://localhost/api/hideouts/join', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await joinHideout(req);
      expect(res.status).toBe(400);
    });

    it('returns 401 when auth token is missing', async () => {
      const req = new NextRequest('http://localhost/api/hideouts/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'ABCD1234' }),
      });
      const res = await joinHideout(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 when token is invalid', async () => {
      (verifyToken as jest.Mock).mockResolvedValueOnce(null);
      const req = authedRequest('http://localhost/api/hideouts/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'ABCD1234' }),
      });
      const res = await joinHideout(req);
      expect(res.status).toBe(401);
    });

    it('returns 404 when hideout code does not exist', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockResolvedValueOnce(null);
      const req = authedRequest('http://localhost/api/hideouts/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'ABCD1234' }),
      });
      const res = await joinHideout(req);
      expect(res.status).toBe(404);
    });

    it('returns 410 when hideout is deleted', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'k2',
        name: 'Deleted',
        deletedAt: new Date(),
      });
      const req = authedRequest('http://localhost/api/hideouts/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'ABCD1234' }),
      });
      const res = await joinHideout(req);
      expect(res.status).toBe(410);
    });

    it('returns already member when membership exists', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'k2', name: 'Atlas', deletedAt: null });
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'm-existing' });

      const req = authedRequest('http://localhost/api/hideouts/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'ABCD1234' }),
      });
      const res = await joinHideout(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.message).toBe('api.alreadyMember');
      expect(json.hideoutId).toBe('k2');
      expect(json.kitchenId).toBe('k2');
      expect(prisma.kitchenMember.create).not.toHaveBeenCalled();
    });

    it('creates membership with linked user data', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'k2', name: 'Atlas', deletedAt: null });
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'u1', name: 'Hero', email: 'hero@atlas.gg' });

      const req = authedRequest('http://localhost/api/hideouts/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'ABCD1234' }),
      });
      const res = await joinHideout(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.kitchenMember.create).toHaveBeenCalledWith({
        data: {
          kitchenId: 'k2',
          userId: 'u1',
          name: 'Hero',
          email: 'hero@atlas.gg',
          isGuest: true,
          role: 'MEMBER',
        },
      });
      expect(json.message).toBe('api.joinSuccess');
    });

    it('creates membership with fallback name when user record is missing', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'k2', name: 'Atlas', deletedAt: null });
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const req = authedRequest('http://localhost/api/hideouts/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'ABCD1234' }),
      });
      const res = await joinHideout(req);

      expect(res.status).toBe(200);
      expect(prisma.kitchenMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Member',
        }),
      });
    });

    it('returns 500 when join fails', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db'));
      const req = authedRequest('http://localhost/api/hideouts/join', {
        method: 'POST',
        body: JSON.stringify({ code: 'ABCD1234' }),
      });
      const res = await joinHideout(req);
      expect(res.status).toBe(500);
    });
  });

  describe('updateHideout', () => {
    it('returns 400 when name is missing', async () => {
      const req = authedRequest('http://localhost/api/hideouts/k1', {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      const res = await updateHideout(req, 'k1');
      expect(res.status).toBe(400);
    });

    it('returns 401 when unauthorized', async () => {
      (verifyToken as jest.Mock).mockResolvedValueOnce(null);
      const req = authedRequest('http://localhost/api/hideouts/k1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New' }),
      });
      const res = await updateHideout(req, 'k1');
      expect(res.status).toBe(401);
    });

    it('returns 403 when requester is not admin', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({ role: 'MEMBER' });
      const req = authedRequest('http://localhost/api/hideouts/k1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New' }),
      });
      const res = await updateHideout(req, 'k1');
      expect(res.status).toBe(403);
    });

    it('updates hideout when requester is admin', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({ role: 'ADMIN' });
      (prisma.kitchen.update as jest.Mock).mockResolvedValueOnce({ id: 'k1', name: 'New Name' });

      const req = authedRequest('http://localhost/api/hideouts/k1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      });
      const res = await updateHideout(req, 'k1');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.hideoutId).toBe('k1');
      expect(json.kitchenId).toBe('k1');
    });

    it('returns 500 when update fails', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db'));
      const req = authedRequest('http://localhost/api/hideouts/k1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New' }),
      });
      const res = await updateHideout(req, 'k1');
      expect(res.status).toBe(500);
    });
  });

  describe('deleteHideout', () => {
    it('returns 401 when unauthorized', async () => {
      (verifyToken as jest.Mock).mockResolvedValueOnce(null);
      const req = authedRequest('http://localhost/api/hideouts/k1', { method: 'DELETE' });
      const res = await deleteHideout(req, 'k1');
      expect(res.status).toBe(401);
    });

    it('returns 403 when requester is not admin', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({ role: 'MEMBER' });
      const req = authedRequest('http://localhost/api/hideouts/k1', { method: 'DELETE' });
      const res = await deleteHideout(req, 'k1');
      expect(res.status).toBe(403);
    });

    it('soft deletes hideout for admins', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({ role: 'ADMIN' });
      (prisma.kitchen.update as jest.Mock).mockResolvedValueOnce({ id: 'k1', name: 'Atlas Base' });

      const req = authedRequest('http://localhost/api/hideouts/k1', { method: 'DELETE' });
      const res = await deleteHideout(req, 'k1');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.kitchen.update).toHaveBeenCalledWith({
        where: { id: 'k1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(json.hideoutId).toBe('k1');
    });

    it('returns 500 when delete fails', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db'));
      const req = authedRequest('http://localhost/api/hideouts/k1', { method: 'DELETE' });
      const res = await deleteHideout(req, 'k1');
      expect(res.status).toBe(500);
    });
  });
});
