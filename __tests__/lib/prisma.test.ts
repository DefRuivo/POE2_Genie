const prismaClientCtor = jest.fn((options) => ({ __kind: 'prisma-client', options }));
const prismaAdapterCtor = jest.fn((config) => ({ __kind: 'mariadb-adapter', config }));

jest.mock('@prisma/client', () => ({
  PrismaClient: prismaClientCtor,
}));

jest.mock('@prisma/adapter-mariadb', () => ({
  PrismaMariaDb: prismaAdapterCtor,
}));

describe('lib/prisma', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete (globalThis as any).prisma;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('reuses global prisma instance when available', async () => {
    const existing = { existing: true };
    (globalThis as any).prisma = existing;

    const mod = await import('@/lib/prisma');

    expect(mod.prisma).toBe(existing);
    expect(prismaClientCtor).not.toHaveBeenCalled();
  });

  it('uses placeholder adapter when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'test';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const mod = await import('@/lib/prisma');

    expect(mod.prisma).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith('DATABASE_URL not set - using placeholder adapter for build');
    expect(prismaAdapterCtor).toHaveBeenCalledWith(expect.objectContaining({
      host: 'localhost',
      port: 3306,
      user: 'placeholder',
      password: 'placeholder',
      database: 'placeholder',
      connectionLimit: 1,
    }));
    expect(prismaClientCtor).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('parses DATABASE_URL and initializes adapter with extracted fields', async () => {
    process.env.DATABASE_URL = 'mysql://user%40atlas:pass%21@mysql:3307/poe2';
    process.env.NODE_ENV = 'development';
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await import('@/lib/prisma');

    expect(prismaAdapterCtor).toHaveBeenCalledWith(expect.objectContaining({
      host: 'mysql',
      port: 3307,
      user: 'user@atlas',
      password: 'pass!',
      database: 'poe2',
      connectionLimit: 5,
      idleTimeout: 60,
      acquireTimeout: 30000,
      connectTimeout: 20000,
      allowPublicKeyRetrieval: true,
    }));

    expect(prismaClientCtor).toHaveBeenCalledWith(expect.objectContaining({
      adapter: expect.any(Object),
      log: ['query', 'error', 'warn'],
    }));

    expect(logSpy).toHaveBeenCalledWith('Prisma initializing MariaDB adapter to mysql:3307/poe2...');
    expect((globalThis as any).prisma).toBeDefined();

    logSpy.mockRestore();
  });

  it('falls back to placeholder adapter when URL parsing fails', async () => {
    process.env.DATABASE_URL = 'not-a-valid-url';
    process.env.NODE_ENV = 'test';
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await import('@/lib/prisma');

    expect(errSpy).toHaveBeenCalledWith(
      'Failed to initialize Prisma Client with Adapter:',
      expect.anything(),
    );
    expect(prismaAdapterCtor).toHaveBeenCalledWith(expect.objectContaining({
      host: 'localhost',
      port: 3306,
      user: 'placeholder',
      password: 'placeholder',
      database: 'placeholder',
      connectionLimit: 1,
    }));

    errSpy.mockRestore();
  });
});
