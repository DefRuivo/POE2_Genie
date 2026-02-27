import {
  approveMember,
  joinKitchen,
  refreshKitchenCode,
  rejectMember,
} from '@/app/actions';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { generateKitchenCode } from '@/lib/kitchen-code';
import { sendKitchenJoinRequestEmail } from '@/lib/email-service';
import { cookies } from 'next/headers';
import { KitchenRole, MembershipStatus } from '@prisma/client';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    kitchen: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    kitchenMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/kitchen-code', () => ({
  generateKitchenCode: jest.fn(),
}));

jest.mock('@/lib/email-service', () => ({
  sendKitchenJoinRequestEmail: jest.fn(),
}));

const setAuthCookie = (tokenValue?: string) => {
  (cookies as jest.Mock).mockResolvedValue({
    get: (name: string) => {
      if (name !== 'auth_token' || !tokenValue) return undefined;
      return { value: tokenValue };
    },
  });
};

describe('app/actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthCookie('token');
    (verifyToken as jest.Mock).mockResolvedValue({
      userId: 'u1',
      email: 'u1@poe.gg',
      name: 'Ranger',
      kitchenId: 'k1',
    });
    (sendKitchenJoinRequestEmail as jest.Mock).mockResolvedValue(undefined);
    (generateKitchenCode as jest.Mock).mockReturnValue('CODE1');
  });

  describe('joinKitchen', () => {
    it('returns Unauthorized when no current user', async () => {
      setAuthCookie(undefined);
      const res = await joinKitchen('CODE1');
      expect(res).toEqual({ error: 'Unauthorized' });
    });

    it('returns invalid invitation when hideout does not exist or is deleted', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockResolvedValueOnce(null);
      expect(await joinKitchen('CODE1')).toEqual({ error: 'Invalid invitation code' });

      (prisma.kitchen.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'k1', deletedAt: new Date() });
      expect(await joinKitchen('CODE1')).toEqual({ error: 'Invalid invitation code' });
    });

    it('returns proper message when membership already pending/approved/rejected', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockResolvedValue({ id: 'k1', name: 'Atlas', deletedAt: null });
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({ status: MembershipStatus.PENDING });
      expect(await joinKitchen('CODE1')).toEqual({ error: 'Join request already pending' });

      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({ status: MembershipStatus.APPROVED });
      expect(await joinKitchen('CODE1')).toEqual({ error: 'You are already a member of this hideout' });

      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce({ status: MembershipStatus.REJECTED });
      expect(await joinKitchen('CODE1')).toEqual({ error: 'Your request to join this hideout was previously rejected' });
    });

    it('creates pending membership and notifies admins', async () => {
      (prisma.kitchen.findUnique as jest.Mock).mockResolvedValue({ id: 'k1', name: 'Atlas', deletedAt: null });
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.kitchenMember.create as jest.Mock).mockResolvedValue({ id: 'm1' });
      (prisma.kitchenMember.findMany as jest.Mock).mockResolvedValue([
        { user: { email: 'admin1@poe.gg' } },
        { user: { email: null } },
        { user: { email: 'admin2@poe.gg' } },
      ]);

      const res = await joinKitchen('CODE1');
      expect(res).toEqual({ success: true, message: 'Join request sent' });
      expect(prisma.kitchenMember.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          kitchenId: 'k1',
          name: 'Ranger',
          email: 'u1@poe.gg',
          role: KitchenRole.MEMBER,
          status: MembershipStatus.PENDING,
        },
      });
      expect(sendKitchenJoinRequestEmail).toHaveBeenCalledTimes(2);
      expect(sendKitchenJoinRequestEmail).toHaveBeenCalledWith('admin1@poe.gg', 'Ranger', 'Atlas');
      expect(sendKitchenJoinRequestEmail).toHaveBeenCalledWith('admin2@poe.gg', 'Ranger', 'Atlas');
    });
  });

  describe('approveMember', () => {
    it('returns unauthorized when no current user', async () => {
      setAuthCookie(undefined);
      expect(await approveMember('m1')).toEqual({ error: 'Unauthorized' });
    });

    it('returns member not found when target is missing', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce(null);
      expect(await approveMember('m1')).toEqual({ error: 'Member not found' });
    });

    it('returns admin error when requester is not admin', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'm1', kitchenId: 'k1' })
        .mockResolvedValueOnce({ role: KitchenRole.MEMBER });

      expect(await approveMember('m1')).toEqual({ error: 'Only party leaders can approve members' });
    });

    it('approves member for admins', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'm1', kitchenId: 'k1' })
        .mockResolvedValueOnce({ role: KitchenRole.ADMIN });
      (prisma.kitchenMember.update as jest.Mock).mockResolvedValue({ id: 'm1' });

      expect(await approveMember('m1')).toEqual({ success: true });
      expect(prisma.kitchenMember.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { status: MembershipStatus.APPROVED },
      });
    });
  });

  describe('rejectMember', () => {
    it('returns unauthorized when no current user', async () => {
      setAuthCookie(undefined);
      expect(await rejectMember('m1')).toEqual({ error: 'Unauthorized' });
    });

    it('returns member not found when target is missing', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValueOnce(null);
      expect(await rejectMember('m1')).toEqual({ error: 'Member not found' });
    });

    it('returns admin error when requester is not admin', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'm1', kitchenId: 'k1' })
        .mockResolvedValueOnce({ role: KitchenRole.MEMBER });

      expect(await rejectMember('m1')).toEqual({ error: 'Only party leaders can reject members' });
    });

    it('rejects member for admins', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'm1', kitchenId: 'k1' })
        .mockResolvedValueOnce({ role: KitchenRole.ADMIN });
      (prisma.kitchenMember.update as jest.Mock).mockResolvedValue({ id: 'm1' });

      expect(await rejectMember('m1')).toEqual({ success: true });
      expect(prisma.kitchenMember.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { status: MembershipStatus.REJECTED },
      });
    });
  });

  describe('refreshKitchenCode', () => {
    it('returns unauthorized when no current user', async () => {
      setAuthCookie(undefined);
      expect(await refreshKitchenCode('k1')).toEqual({ error: 'Unauthorized' });
    });

    it('returns admin error when requester is not admin', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValue({ role: KitchenRole.MEMBER });
      expect(await refreshKitchenCode('k1')).toEqual({ error: 'Only party leaders can refresh the code' });
    });

    it('updates code on first attempt for admin', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValue({ role: KitchenRole.ADMIN });
      (prisma.kitchen.update as jest.Mock).mockResolvedValue({ id: 'k1' });

      const result = await refreshKitchenCode('k1');
      expect(result).toEqual({ success: true, newCode: 'CODE1' });
      expect(prisma.kitchen.update).toHaveBeenCalledWith({
        where: { id: 'k1' },
        data: { inviteCode: 'CODE1' },
      });
    });

    it('retries on unique conflict and eventually succeeds', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValue({ role: KitchenRole.ADMIN });
      (generateKitchenCode as jest.Mock)
        .mockReturnValueOnce('CODE1')
        .mockReturnValueOnce('CODE2');
      (prisma.kitchen.update as jest.Mock)
        .mockRejectedValueOnce({ code: 'P2002' })
        .mockResolvedValueOnce({ id: 'k1' });

      const result = await refreshKitchenCode('k1');
      expect(result).toEqual({ success: true, newCode: 'CODE2' });
      expect(prisma.kitchen.update).toHaveBeenCalledTimes(2);
    });

    it('returns user-friendly error after retry exhaustion', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValue({ role: KitchenRole.ADMIN });
      (prisma.kitchen.update as jest.Mock).mockRejectedValue({ code: 'P2002' });

      const result = await refreshKitchenCode('k1');
      expect(result).toEqual({ error: 'Failed to generate unique code, please try again.' });
    });

    it('throws non-unique errors', async () => {
      (prisma.kitchenMember.findUnique as jest.Mock).mockResolvedValue({ role: KitchenRole.ADMIN });
      (prisma.kitchen.update as jest.Mock).mockRejectedValue(new Error('fatal'));

      await expect(refreshKitchenCode('k1')).rejects.toThrow('fatal');
    });
  });
});
