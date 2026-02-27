import { NextRequest } from 'next/server';
import { POST as recoverPost } from '@/app/api/auth/recover/route';
import { POST as switchContextPost } from '@/app/api/auth/switch-context/route';
import { POST as verifyPost } from '@/app/api/auth/verify/route';
import { GET as verifyTokenGet } from '@/app/api/auth/verify-token/route';
import { POST as logoutPost } from '@/app/api/auth/logout/route';
import { prisma } from '@/lib/prisma';
import { verifyToken, signToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email-service';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    kitchenMember: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
  signToken: jest.fn(),
}));

jest.mock('@/lib/email-service', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

describe('missing auth route coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockResolvedValue({ userId: 'u1', kitchenId: 'k1', email: 'a@a.com' });
    (signToken as jest.Mock).mockResolvedValue('new-token');
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);
  });

  describe('/api/auth/recover', () => {
    it('returns 400 when email is missing', async () => {
      const req = new NextRequest('http://localhost/api/auth/recover', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await recoverPost(req);
      expect(res.status).toBe(400);
    });

    it('returns generic success in pt-BR and does not send email when user missing', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/auth/recover', {
        method: 'POST',
        body: JSON.stringify({ email: 'x@y.com', language: 'pt-BR' }),
      });

      const res = await recoverPost(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.message).toContain('Se uma conta existir');
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('updates reset token and sends email using user language fallback chain', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u2',
        email: 'u2@x.com',
        name: 'U2',
        language: null,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'u2' });

      const req = new NextRequest('http://localhost/api/auth/recover', {
        method: 'POST',
        body: JSON.stringify({ email: 'u2@x.com', language: 'en' }),
      });

      const res = await recoverPost(req);
      expect(res.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'u2' },
        data: expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpires: expect.any(Date),
        }),
      }));
      expect(sendPasswordResetEmail).toHaveBeenCalledWith('u2@x.com', 'U2', expect.any(String), 'en');
    });

    it('returns 500 on errors', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('db'));
      const req = new NextRequest('http://localhost/api/auth/recover', {
        method: 'POST',
        body: JSON.stringify({ email: 'u2@x.com', language: 'en' }),
      });
      const res = await recoverPost(req);
      expect(res.status).toBe(500);
    });
  });

  describe('/api/auth/switch-context', () => {
    const authedReq = (body: any) =>
      ({
        text: jest.fn().mockResolvedValue(JSON.stringify(body)),
        cookies: {
          get: (name: string) => (name === 'auth_token' ? { value: 'token' } : undefined),
        },
      } as unknown as NextRequest);

    it('returns 400 for invalid json body', async () => {
      const req = {
        text: jest.fn().mockResolvedValue('{ bad json'),
        cookies: {
          get: (name: string) => (name === 'auth_token' ? { value: 'token' } : undefined),
        },
      } as unknown as NextRequest;
      const res = await switchContextPost(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when target hideout id is missing', async () => {
      const res = await switchContextPost(authedReq({}));
      expect(res.status).toBe(400);
    });

    it('returns 401 when token invalid', async () => {
      (verifyToken as jest.Mock).mockResolvedValueOnce(null);
      const res = await switchContextPost(authedReq({ kitchenId: 'k2' }));
      expect(res.status).toBe(401);
    });

    it('returns 403 when membership is invalid/deleted', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValue({ kitchen: { deletedAt: new Date() } });
      const res = await switchContextPost(authedReq({ kitchenId: 'k2' }));
      expect(res.status).toBe(403);
    });

    it('switches context using kitchenId and updates cookie token', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValue({
        id: 'm1',
        kitchenId: 'k2',
        kitchen: { deletedAt: null },
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'u1' });

      const res = await switchContextPost(authedReq({ houseId: 'k2' }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ success: true, kitchenId: 'k2' });
      expect(signToken).toHaveBeenCalledWith(expect.objectContaining({
        kitchenId: 'k2',
        houseId: 'k2',
      }));
      expect(res.cookies.get('auth_token')?.value).toBe('new-token');
    });

    it('returns 500 on unexpected error', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockRejectedValue(new Error('db'));
      const res = await switchContextPost(authedReq({ kitchenId: 'k2' }));
      expect(res.status).toBe(500);
    });
  });

  describe('/api/auth/verify', () => {
    it('returns 400 when token missing', async () => {
      const req = new NextRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await verifyPost(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when token is invalid', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'bad' }),
      });
      const res = await verifyPost(req);
      expect(res.status).toBe(400);
    });

    it('verifies user and clears token', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'u1',
        kitchenMemberships: [],
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'u1' });

      const req = new NextRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'ok' }),
      });

      const res = await verifyPost(req);
      expect(res.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          emailVerified: expect.any(Date),
          verificationToken: null,
        },
      });
    });

    it('returns 500 on errors', async () => {
      (prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('db'));
      const req = new NextRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'ok' }),
      });
      const res = await verifyPost(req);
      expect(res.status).toBe(500);
    });
  });

  describe('/api/auth/verify-token', () => {
    it('returns 400 when token missing', async () => {
      const req = new NextRequest('http://localhost/api/auth/verify-token');
      const res = await verifyTokenGet(req);
      expect(res.status).toBe(400);
    });

    it('returns 404 when token is unknown', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/auth/verify-token?token=abc');
      const res = await verifyTokenGet(req);
      expect(res.status).toBe(404);
    });

    it('returns 410 when token is expired', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'u1',
        passwordResetExpires: new Date(Date.now() - 1000),
      });
      const req = new NextRequest('http://localhost/api/auth/verify-token?token=abc');
      const res = await verifyTokenGet(req);
      expect(res.status).toBe(410);
    });

    it('returns valid=true for valid non-expired token', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'u1',
        passwordResetExpires: new Date(Date.now() + 1000 * 60),
      });
      const req = new NextRequest('http://localhost/api/auth/verify-token?token=abc');
      const res = await verifyTokenGet(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ valid: true });
    });

    it('returns 500 on unexpected errors', async () => {
      (prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('db'));
      const req = new NextRequest('http://localhost/api/auth/verify-token?token=abc');
      const res = await verifyTokenGet(req);
      expect(res.status).toBe(500);
    });
  });

  describe('/api/auth/logout', () => {
    it('expires auth_token cookie', async () => {
      const res = await logoutPost();
      expect(res.status).toBe(200);
      expect(res.cookies.get('auth_token')?.value).toBe('');
    });
  });
});
