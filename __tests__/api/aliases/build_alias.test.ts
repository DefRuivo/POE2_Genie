import { POST } from '@/app/api/build/route';

const craftBuildMock = jest.fn();

jest.mock('@/lib/api/build-craft-handlers', () => ({
  craftBuild: (...args: unknown[]) => craftBuildMock(...args),
}));

describe('Build craft alias', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards /api/build POST to craftBuild handler', async () => {
    const req = new Request('http://localhost/api/build', { method: 'POST' });
    await POST(req as never);
    expect(craftBuildMock).toHaveBeenCalledWith(req, 'canonical');
  });
});
