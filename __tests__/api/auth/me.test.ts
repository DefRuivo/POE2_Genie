import { GET, PUT } from '@/app/api/auth/me/route';
import { prisma } from '@/lib/prisma';
import { sendPasswordChangedEmail } from '@/lib/email-service';
import { verifyToken } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('@/lib/email-service', () => ({
    sendPasswordChangedEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_new_password'),
    compare: jest.fn().mockResolvedValue(true),
}));

describe('PUT /api/auth/me', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update password and send notification email', async () => {
        // Mock Auth
        (verifyToken as jest.Mock).mockResolvedValue({ userId: 'user-1' });

        const req = new NextRequest(new URL('http://localhost/api/auth/me'), {
            method: 'PUT',
            body: JSON.stringify({
                name: 'John',
                surname: 'Doe',
                password: 'new-password',
                currentPassword: 'current-password'
            }),
            headers: {
                cookie: 'auth_token=valid-token'
            }
        });

        // Mock DB findUnique for current password verification
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-1',
            password: 'hashed_old_password'
        });

        // Mock DB update
        (prisma.user.update as jest.Mock).mockResolvedValue({
            id: 'user-1',
            name: 'John',
            surname: 'Doe',
            email: 'john@example.com',
            language: 'pt-BR' // User has PT language
        });

        const res = await PUT(req);

        expect(res.status).toBe(200);
        
        // Verify update called with hashed password
        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'user-1' },
            data: expect.objectContaining({
                password: 'hashed_new_password'
            })
        }));

        // Verify email sent with language
        expect(sendPasswordChangedEmail).toHaveBeenCalledWith('john@example.com', 'John', 'pt-BR');
    });

    it('should NOT send email if password is not updated', async () => {
        // Mock Auth
        (verifyToken as jest.Mock).mockResolvedValue({ userId: 'user-1' });

        const req = new NextRequest(new URL('http://localhost/api/auth/me'), {
            method: 'PUT',
            body: JSON.stringify({
                name: 'John',
                surname: 'Doe',
                // No password handled
            }),
            headers: {
                cookie: 'auth_token=valid-token'
            }
        });

        // Mock DB
        (prisma.user.update as jest.Mock).mockResolvedValue({
            id: 'user-1',
            name: 'John',
            surname: 'Doe',
            email: 'john@example.com',
        });

        const res = await PUT(req);

        expect(res.status).toBe(200);
        expect(prisma.user.update).toHaveBeenCalled();
        expect(sendPasswordChangedEmail).not.toHaveBeenCalled();
    });

    it('GET should return 401 when auth token is invalid', async () => {
        (verifyToken as jest.Mock).mockResolvedValueOnce(null);

        const req = new NextRequest(new URL('http://localhost/api/auth/me'), {
            headers: { cookie: 'auth_token=invalid-token' }
        });

        const res = await GET(req);
        expect(res.status).toBe(401);
    });

    it('GET should return 404 when user is not found', async () => {
        (verifyToken as jest.Mock).mockResolvedValueOnce({ userId: 'missing', kitchenId: 'k1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

        const req = new NextRequest(new URL('http://localhost/api/auth/me'), {
            headers: { cookie: 'auth_token=valid-token' }
        });

        const res = await GET(req);
        expect(res.status).toBe(404);
    });

    it('GET should return user profile with currentKitchenId and memberships mapping', async () => {
        (verifyToken as jest.Mock).mockResolvedValueOnce({ userId: 'user-1', kitchenId: 'k1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
            id: 'user-1',
            name: 'John',
            surname: 'Doe',
            email: 'john@example.com',
            measurementSystem: 'METRIC',
            language: 'en',
            kitchenMemberships: [
                {
                    id: 'm1',
                    kitchenId: 'k1',
                    kitchen: { id: 'k1', name: 'Atlas' }
                }
            ]
        });

        const req = new NextRequest(new URL('http://localhost/api/auth/me'), {
            headers: { cookie: 'auth_token=valid-token' }
        });

        const res = await GET(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.user.currentKitchenId).toBe('k1');
        expect(json.user.currentHouseId).toBe('k1');
        expect(json.user.memberships).toHaveLength(1);
    });

    it('GET should return 500 when prisma fails', async () => {
        (verifyToken as jest.Mock).mockResolvedValueOnce({ userId: 'user-1', kitchenId: 'k1' });
        (prisma.user.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db'));

        const req = new NextRequest(new URL('http://localhost/api/auth/me'), {
            headers: { cookie: 'auth_token=valid-token' }
        });

        const res = await GET(req);
        expect(res.status).toBe(500);
    });

    it('PUT should return 400 when name or surname is missing', async () => {
        (verifyToken as jest.Mock).mockResolvedValueOnce({ userId: 'user-1' });
        const req = new NextRequest(new URL('http://localhost/api/auth/me'), {
            method: 'PUT',
            body: JSON.stringify({ name: 'John' }),
            headers: { cookie: 'auth_token=valid-token' }
        });

        const res = await PUT(req);
        expect(res.status).toBe(400);
    });

    it('PUT should return 400 when current password is missing while changing password', async () => {
        (verifyToken as jest.Mock).mockResolvedValueOnce({ userId: 'user-1' });
        const req = new NextRequest(new URL('http://localhost/api/auth/me'), {
            method: 'PUT',
            body: JSON.stringify({
                name: 'John',
                surname: 'Doe',
                password: 'new-pass'
            }),
            headers: { cookie: 'auth_token=valid-token' }
        });

        const res = await PUT(req);
        expect(res.status).toBe(400);
    });

    it('PUT should return 404 when user not found during password change', async () => {
        (verifyToken as jest.Mock).mockResolvedValueOnce({ userId: 'user-missing' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

        const req = new NextRequest(new URL('http://localhost/api/auth/me'), {
            method: 'PUT',
            body: JSON.stringify({
                name: 'John',
                surname: 'Doe',
                password: 'new-pass',
                currentPassword: 'old-pass'
            }),
            headers: { cookie: 'auth_token=valid-token' }
        });

        const res = await PUT(req);
        expect(res.status).toBe(404);
    });

    it('PUT should return 400 when current password is invalid', async () => {
        const bcrypt = require('bcryptjs');
        (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

        (verifyToken as jest.Mock).mockResolvedValueOnce({ userId: 'user-1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
            id: 'user-1',
            password: 'hashed_old_password'
        });

        const req = new NextRequest(new URL('http://localhost/api/auth/me'), {
            method: 'PUT',
            body: JSON.stringify({
                name: 'John',
                surname: 'Doe',
                password: 'new-pass',
                currentPassword: 'wrong-old'
            }),
            headers: { cookie: 'auth_token=valid-token' }
        });

        const res = await PUT(req);
        expect(res.status).toBe(400);
    });

    it('PUT should return 500 on unexpected errors', async () => {
        (verifyToken as jest.Mock).mockRejectedValueOnce(new Error('boom'));
        const req = new NextRequest(new URL('http://localhost/api/auth/me'), {
            method: 'PUT',
            body: JSON.stringify({ name: 'John', surname: 'Doe' }),
            headers: { cookie: 'auth_token=valid-token' }
        });

        const res = await PUT(req);
        expect(res.status).toBe(500);
    });
});
