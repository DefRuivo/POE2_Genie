import { NextRequest } from 'next/server';
import {
  deleteHideoutMember,
  getHideoutMembers,
  saveHideoutMember,
} from '@/lib/api/hideout-members-handlers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email-service';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    kitchenMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    kitchen: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/email-service', () => ({
  sendInvitationEmail: jest.fn(),
}));

const authedRequest = (url: string, init?: RequestInit) => new NextRequest(url, {
  ...init,
  headers: {
    ...(init?.headers || {}),
    cookie: 'auth_token=valid-token',
  },
});

describe('lib/api/hideout-members-handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockResolvedValue({
      kitchenId: 'k1',
      userId: 'u1',
      name: 'Inviter',
    });
    (prisma.kitchen.findUnique as jest.Mock).mockResolvedValue({
      id: 'k1',
      name: 'Atlas',
      inviteCode: 'CODE123',
    });
    (sendInvitationEmail as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getHideoutMembers', () => {
    it('returns 401 when payload has no kitchenId', async () => {
      (verifyToken as jest.Mock).mockResolvedValueOnce(null);
      const req = authedRequest('http://localhost/api/hideout-members');
      const res = await getHideoutMembers(req);
      expect(res.status).toBe(401);
    });

    it('maps relational tags to arrays and aliases', async () => {
      (prisma.kitchenMember.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'm1',
          kitchenId: 'k1',
          name: 'Member A',
          restrictions: [{ name: 'No Minions' }],
          likes: [{ name: 'Mapper' }],
          dislikes: [{ name: 'Totems' }],
        },
      ]);

      const req = authedRequest('http://localhost/api/hideout-members');
      const res = await getHideoutMembers(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual([
        expect.objectContaining({
          id: 'm1',
          hideoutId: 'k1',
          kitchenId: 'k1',
          restrictions: ['No Minions'],
          likes: ['Mapper'],
          dislikes: ['Totems'],
        }),
      ]);
    });

    it('returns 500 when query fails', async () => {
      (prisma.kitchenMember.findMany as jest.Mock).mockRejectedValueOnce(new Error('db'));
      const req = authedRequest('http://localhost/api/hideout-members');
      const res = await getHideoutMembers(req);
      expect(res.status).toBe(500);
    });
  });

  describe('saveHideoutMember', () => {
    it('returns 401 when unauthorized', async () => {
      (verifyToken as jest.Mock).mockResolvedValueOnce(null);
      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });
      const res = await saveHideoutMember(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 when name is missing or too long', async () => {
      const reqMissing = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com' }),
      });
      const resMissing = await saveHideoutMember(reqMissing);
      expect(resMissing.status).toBe(400);

      const reqLong = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({ name: 'x'.repeat(51) }),
      });
      const resLong = await saveHideoutMember(reqLong);
      expect(resLong.status).toBe(400);
    });

    it('returns 400 when email is too long', async () => {
      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Tester',
          email: `${'x'.repeat(101)}@mail.com`,
        }),
      });
      const res = await saveHideoutMember(req);
      expect(res.status).toBe(400);
    });

    it('creates member without email and defaults guest when not linked', async () => {
      (prisma.kitchenMember.create as jest.Mock).mockResolvedValueOnce({
        id: 'm-new',
        kitchenId: 'k1',
        name: 'Tester',
        restrictions: [{ name: 'No Aura' }],
        likes: [{ name: 'Bow' }],
        dislikes: [{ name: 'Melee' }],
      });

      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Tester',
          restrictions: ['No Aura'],
          likes: ['Bow'],
          dislikes: ['Melee'],
        }),
      });

      const res = await saveHideoutMember(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.kitchenMember.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          kitchenId: 'k1',
          name: 'Tester',
          isGuest: true,
        }),
      }));
      expect(json.hideoutId).toBe('k1');
      expect(json.likes).toEqual(['Bow']);
    });

    it('creates member with linked existing user and sends invite', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'u2',
        email: 'friend@poe.gg',
      });
      (prisma.kitchenMember.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (prisma.kitchenMember.create as jest.Mock).mockResolvedValueOnce({
        id: 'm-link',
        kitchenId: 'k1',
        name: 'Friend',
        restrictions: [],
        likes: [],
        dislikes: [],
      });

      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Friend',
          email: 'friend@poe.gg',
        }),
      });

      const res = await saveHideoutMember(req);
      expect(res.status).toBe(200);
      expect(sendInvitationEmail).toHaveBeenCalledWith(
        'friend@poe.gg',
        'Inviter',
        'Atlas',
        'CODE123',
        true,
      );
      expect(prisma.kitchenMember.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u2',
          isGuest: false,
        }),
      }));
    });

    it('sends invite for unknown email and keeps guest by default', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.kitchenMember.create as jest.Mock).mockResolvedValueOnce({
        id: 'm-guest',
        kitchenId: 'k1',
        name: 'Guest',
        restrictions: [],
        likes: [],
        dislikes: [],
      });

      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({ name: 'Guest', email: 'unknown@poe.gg' }),
      });

      const res = await saveHideoutMember(req);
      expect(res.status).toBe(200);
      expect(sendInvitationEmail).toHaveBeenCalledWith(
        'unknown@poe.gg',
        'Inviter',
        'Atlas',
        'CODE123',
        false,
      );
    });

    it('does not fail member creation when invite email sending fails', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (sendInvitationEmail as jest.Mock).mockRejectedValueOnce(new Error('smtp down'));
      (prisma.kitchenMember.create as jest.Mock).mockResolvedValueOnce({
        id: 'm-guest',
        kitchenId: 'k1',
        name: 'Guest',
        restrictions: [],
        likes: [],
        dislikes: [],
      });

      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({ name: 'Guest', email: 'unknown@poe.gg' }),
      });

      const res = await saveHideoutMember(req);
      expect(res.status).toBe(200);
      expect(prisma.kitchenMember.create).toHaveBeenCalled();
    });

    it('returns 409 when linked user already exists in hideout (create path)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'u2' });
      (prisma.kitchenMember.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'collision' });

      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({ name: 'Friend', email: 'friend@poe.gg' }),
      });

      const res = await saveHideoutMember(req);
      expect(res.status).toBe(409);
      expect(prisma.kitchenMember.create).not.toHaveBeenCalled();
    });

    it('returns 404 when editing non-existing member', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({ id: 'member-1', name: 'Edited' }),
      });

      const res = await saveHideoutMember(req);
      expect(res.status).toBe(404);
    });

    it('returns 403 when editing member from another hideout', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({ kitchenId: 'other' });

      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({ id: 'member-1', name: 'Edited' }),
      });

      const res = await saveHideoutMember(req);
      expect(res.status).toBe(403);
    });

    it('returns 409 when linked user collides on edit path', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'u2' });
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({ kitchenId: 'k1' });
      (prisma.kitchenMember.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'collision' });

      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({
          id: 'member-1',
          name: 'Edited',
          email: 'friend@poe.gg',
        }),
      });

      const res = await saveHideoutMember(req);
      expect(res.status).toBe(409);
    });

    it('updates member and links user when needed', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'u2' });
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({ kitchenId: 'k1' });
      (prisma.kitchenMember.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (prisma.kitchenMember.update as jest.Mock)
        .mockResolvedValueOnce({
          id: 'member-1',
          kitchenId: 'k1',
          name: 'Edited',
          restrictions: [{ name: 'No Totem' }],
          likes: [{ name: 'Caster' }],
          dislikes: [{ name: 'Traps' }],
        })
        .mockResolvedValueOnce({
          id: 'member-1',
          kitchenId: 'k1',
          name: 'Edited',
          restrictions: [{ name: 'No Totem' }],
          likes: [{ name: 'Caster' }],
          dislikes: [{ name: 'Traps' }],
        });

      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({
          id: 'member-1',
          name: 'Edited',
          email: 'friend@poe.gg',
          restrictions: ['No Totem'],
          likes: ['Caster'],
          dislikes: ['Traps'],
          isGuest: false,
        }),
      });

      const res = await saveHideoutMember(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.kitchenMember.update).toHaveBeenNthCalledWith(1, expect.objectContaining({
        where: { id: 'member-1' },
        data: expect.objectContaining({
          name: 'Edited',
          isGuest: false,
        }),
      }));
      expect(prisma.kitchenMember.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'member-1' },
        data: { userId: 'u2' },
      });
      expect(json.likes).toEqual(['Caster']);
    });

    it('returns 500 when save fails', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db')); 
      const req = authedRequest('http://localhost/api/hideout-members', {
        method: 'POST',
        body: JSON.stringify({ name: 'Error' }),
      });
      const res = await saveHideoutMember(req);
      expect(res.status).toBe(500);
    });
  });

  describe('deleteHideoutMember', () => {
    it('returns 401 when unauthorized', async () => {
      (verifyToken as jest.Mock).mockResolvedValueOnce(null);
      const req = authedRequest('http://localhost/api/hideout-members/m1', { method: 'DELETE' });
      const res = await deleteHideoutMember(req, 'm1');
      expect(res.status).toBe(401);
    });

    it('returns 404 when member does not exist', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce(null);
      const req = authedRequest('http://localhost/api/hideout-members/m1', { method: 'DELETE' });
      const res = await deleteHideoutMember(req, 'm1');
      expect(res.status).toBe(404);
    });

    it('allows self deletion', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'm1',
        userId: 'u1',
        kitchenId: 'k1',
      });

      const req = authedRequest('http://localhost/api/hideout-members/m1', { method: 'DELETE' });
      const res = await deleteHideoutMember(req, 'm1');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(prisma.kitchenMember.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
      expect(json).toEqual({ success: true });
    });

    it('allows admin deletion of other member', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'm2', userId: 'u2', kitchenId: 'k1' })
        .mockResolvedValueOnce({ id: 'req', role: 'ADMIN' });

      const req = authedRequest('http://localhost/api/hideout-members/m2', { method: 'DELETE' });
      const res = await deleteHideoutMember(req, 'm2');

      expect(res.status).toBe(200);
      expect(prisma.kitchenMember.delete).toHaveBeenCalledWith({ where: { id: 'm2' } });
    });

    it('returns 403 when requester is neither self nor admin', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'm2', userId: 'u2', kitchenId: 'k1' })
        .mockResolvedValueOnce({ id: 'req', role: 'MEMBER' });

      const req = authedRequest('http://localhost/api/hideout-members/m2', { method: 'DELETE' });
      const res = await deleteHideoutMember(req, 'm2');
      expect(res.status).toBe(403);
      expect(prisma.kitchenMember.delete).not.toHaveBeenCalled();
    });

    it('returns 500 on unexpected errors', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db'));
      const req = authedRequest('http://localhost/api/hideout-members/m2', { method: 'DELETE' });
      const res = await deleteHideoutMember(req, 'm2');
      expect(res.status).toBe(500);
    });
  });
});
