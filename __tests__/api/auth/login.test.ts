import { POST } from '@/app/api/auth/login/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { comparePassword } from '@/lib/password';
import { signToken } from '@/lib/auth';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/password', () => ({
  comparePassword: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  signToken: jest.fn(),
}));

jest.mock('@/lib/i18n-server', () => ({
  getServerTranslator: jest.fn().mockReturnValue({
    t: (key: string) => {
      const map: Record<string, string> = {
        'auth.unverified': 'Account not verified',
        'auth.invalidCredentials': 'Invalid credentials',
        'auth.userNoKitchen': 'User has no hideout',
        'auth.missingCredentials': 'Missing credentials',
        'api.internalError': 'Internal server error',
      };
      return map[key] || key;
    },
    lang: 'en',
  }),
}));

describe('Login API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (comparePassword as jest.Mock).mockResolvedValue(true);
    (signToken as jest.Mock).mockResolvedValue('mock_token');
  });

  it('returns 400 when email/password is missing', async () => {
    const req = new NextRequest(new URL('http://localhost/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ email: 'a@a.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Missing credentials' });
  });

  it('returns 401 when user does not exist or has no password', async () => {
    const req = new NextRequest(new URL('http://localhost/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ email: 'missing@poe.gg', password: '123' }),
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    expect((await POST(req)).status).toBe(401);

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'u1', password: null });
    const resNoPassword = await POST(req);
    expect(resNoPassword.status).toBe(401);
  });

  it('returns 401 when password comparison fails', async () => {
    (comparePassword as jest.Mock).mockResolvedValueOnce(false);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u1',
      email: 'user@poe.gg',
      password: 'hash',
      emailVerified: new Date(),
      name: 'User',
      kitchenMemberships: [{ kitchenId: 'k1' }],
    });

    const req = new NextRequest(new URL('http://localhost/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ email: 'user@poe.gg', password: 'wrong' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Invalid credentials' });
  });

  it('returns 403 if user is not verified', async () => {
    const req = new NextRequest(new URL('http://localhost/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ email: 'unverified@example.com', password: 'password' }),
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'unverified@example.com',
      password: 'hashed_password',
      emailVerified: null,
      name: 'Unverified',
      kitchenMemberships: [{ kitchenId: 'k1' }],
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Account not verified');
    expect(data.code).toBe('auth.unverified');
  });

  it('returns 400 when verified user has no kitchen membership', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u2',
      email: 'verified@example.com',
      password: 'hash',
      emailVerified: new Date(),
      name: 'Verified',
      kitchenMemberships: [],
      selectedKitchenId: null,
    });

    const req = new NextRequest(new URL('http://localhost/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ email: 'verified@example.com', password: 'password' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'User has no hideout' });
  });

  it('logs in successfully and prefers selected kitchen when still a member', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'user-2',
      email: 'verified@example.com',
      password: 'hashed_password',
      emailVerified: new Date(),
      name: 'Verified',
      kitchenMemberships: [{ kitchenId: 'k1' }, { kitchenId: 'k2' }],
      selectedKitchenId: 'k2',
    });

    const req = new NextRequest(new URL('http://localhost/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ email: 'verified@example.com', password: 'password' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(signToken).toHaveBeenCalledWith(expect.objectContaining({
      kitchenId: 'k2',
      houseId: 'k2',
    }));
    expect(res.cookies.get('auth_token')?.value).toBe('mock_token');
  });

  it('falls back to first kitchen when selectedKitchenId is not a current membership', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'user-2',
      email: 'verified@example.com',
      password: 'hashed_password',
      emailVerified: new Date(),
      name: 'Verified',
      kitchenMemberships: [{ kitchenId: 'k1' }],
      selectedKitchenId: 'k999',
    });

    const req = new NextRequest(new URL('http://localhost/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ email: 'verified@example.com', password: 'password' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(signToken).toHaveBeenCalledWith(expect.objectContaining({
      kitchenId: 'k1',
      houseId: 'k1',
    }));
  });

  it('returns 500 on unexpected errors', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    const req = new NextRequest(new URL('http://localhost/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ email: 'verified@example.com', password: 'password' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal server error' });
  });
});
