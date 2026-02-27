const signMock = jest.fn();
const jwtVerifyMock = jest.fn();

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: signMock,
  })),
  jwtVerify: jwtVerifyMock,
}));

describe('lib/auth', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('signToken builds JWT and returns signed token', async () => {
    signMock.mockResolvedValue('signed-token');
    const { signToken } = await import('@/lib/auth');

    const token = await signToken({ userId: 'u1' });

    expect(token).toBe('signed-token');
    expect(signMock).toHaveBeenCalledWith(expect.anything());
  });

  it('verifyToken returns payload when jwtVerify succeeds', async () => {
    jwtVerifyMock.mockResolvedValue({ payload: { userId: 'u1', kitchenId: 'k1' } });
    const { verifyToken } = await import('@/lib/auth');

    const payload = await verifyToken('valid-token');

    expect(jwtVerifyMock).toHaveBeenCalledWith('valid-token', expect.anything(), {
      algorithms: ['HS256'],
    });
    expect(payload).toEqual({ userId: 'u1', kitchenId: 'k1' });
  });

  it('verifyToken returns null when jwtVerify throws', async () => {
    jwtVerifyMock.mockRejectedValue(new Error('invalid'));
    const { verifyToken } = await import('@/lib/auth');

    const payload = await verifyToken('bad-token');

    expect(payload).toBeNull();
  });

  it('uses JWT_SECRET when present (truthy env branch)', async () => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'custom-jwt-secret';
    signMock.mockResolvedValue('signed-token-with-custom-secret');

    const { signToken } = await import('@/lib/auth');
    const token = await signToken({ userId: 'u2' });

    expect(token).toBe('signed-token-with-custom-secret');
    expect(signMock).toHaveBeenCalled();

    process.env.JWT_SECRET = previousSecret;
  });
});
