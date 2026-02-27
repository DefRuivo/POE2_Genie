import { NextRequest } from 'next/server';
import { getBuilds, saveBuild } from '@/app/api/recipes/route';
import { getBuilds as getBuildsHandler, saveBuild as saveBuildHandler } from '@/lib/api/builds-handlers';
import { withLegacyDeprecationHeaders } from '@/lib/api/deprecation';

jest.mock('@/lib/api/builds-handlers', () => ({
  getBuilds: jest.fn(),
  saveBuild: jest.fn(),
}));

jest.mock('@/lib/api/deprecation', () => ({
  withLegacyDeprecationHeaders: jest.fn((response: Response) => response),
}));

describe('app/api/recipes/route branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getBuildsHandler as jest.Mock).mockResolvedValue(new Response(JSON.stringify([])));
    (saveBuildHandler as jest.Mock).mockResolvedValue(new Response(JSON.stringify({ id: 'b1' })));
  });

  it('returns handler response directly when deprecation header is disabled', async () => {
    const req = new NextRequest('http://localhost/api/recipes');

    const getRes = await getBuilds(req, 'canonical', false);
    const saveRes = await saveBuild(new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({}),
    }), 'canonical', false);

    expect(getRes).toBeInstanceOf(Response);
    expect(saveRes).toBeInstanceOf(Response);
    expect(withLegacyDeprecationHeaders).not.toHaveBeenCalled();
  });

  it('uses legacy defaults when shape/header args are omitted', async () => {
    const req = new NextRequest('http://localhost/api/recipes');
    await getBuilds(req);
    await saveBuild(new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      body: JSON.stringify({}),
    }));

    expect(getBuildsHandler).toHaveBeenCalledWith(expect.any(NextRequest), 'legacy');
    expect(saveBuildHandler).toHaveBeenCalledWith(expect.any(NextRequest), 'legacy');
    expect(withLegacyDeprecationHeaders).toHaveBeenCalledTimes(2);
  });
});
