import { GET as getBuildsCanonical, POST as postBuildsCanonical } from '@/app/api/builds/route';
import { DELETE as deleteBuildCanonical, GET as getBuildCanonical, PUT as putBuildCanonical } from '@/app/api/builds/[id]/route';
import { PATCH as patchFavoriteCanonical } from '@/app/api/builds/[id]/favorite/route';
import { POST as postTranslateCanonical } from '@/app/api/builds/[id]/translate/route';

import { GET as getRecipesLegacy, POST as postRecipesLegacy } from '@/app/api/recipes/route';
import { DELETE as deleteRecipeLegacy, GET as getRecipeLegacy, PUT as putRecipeLegacy } from '@/app/api/recipes/[id]/route';
import { PATCH as patchFavoriteLegacy } from '@/app/api/recipes/[id]/favorite/route';
import { POST as postTranslateLegacy } from '@/app/api/recipes/[id]/translate/route';

const getBuildsMock = jest.fn();
const saveBuildMock = jest.fn();
const getBuildByIdMock = jest.fn();
const updateBuildByIdMock = jest.fn();
const deleteBuildByIdMock = jest.fn();
const toggleBuildFavoriteMock = jest.fn();
const translateBuildByIdMock = jest.fn();

jest.mock('@/lib/api/builds-handlers', () => ({
  getBuilds: (...args: unknown[]) => getBuildsMock(...args),
  saveBuild: (...args: unknown[]) => saveBuildMock(...args),
  getBuildById: (...args: unknown[]) => getBuildByIdMock(...args),
  updateBuildById: (...args: unknown[]) => updateBuildByIdMock(...args),
  deleteBuildById: (...args: unknown[]) => deleteBuildByIdMock(...args),
  toggleBuildFavorite: (...args: unknown[]) => toggleBuildFavoriteMock(...args),
  translateBuildById: (...args: unknown[]) => translateBuildByIdMock(...args),
}));

describe('Builds canonical + legacy routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBuildsMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    saveBuildMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    getBuildByIdMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    updateBuildByIdMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    deleteBuildByIdMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    toggleBuildFavoriteMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    translateBuildByIdMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })));
  });

  it('uses canonical shape for /api/builds* routes', async () => {
    const req = new Request('http://localhost/api/builds');
    const reqById = new Request('http://localhost/api/builds/abc');
    const props = { params: Promise.resolve({ id: 'abc' }) };

    await getBuildsCanonical(req as never);
    await postBuildsCanonical(req as never);
    await getBuildCanonical(reqById, props);
    await putBuildCanonical(reqById as never, props);
    await deleteBuildCanonical(reqById, props);
    await patchFavoriteCanonical(reqById as never, props);
    await postTranslateCanonical(reqById as never, props);

    expect(getBuildsMock).toHaveBeenCalledWith(req, 'canonical');
    expect(saveBuildMock).toHaveBeenCalledWith(req, 'canonical');
    expect(getBuildByIdMock).toHaveBeenCalledWith(reqById, props, 'canonical');
    expect(updateBuildByIdMock).toHaveBeenCalledWith(reqById, props, 'canonical');
    expect(deleteBuildByIdMock).toHaveBeenCalledWith(reqById, props);
    expect(toggleBuildFavoriteMock).toHaveBeenCalledWith(reqById, props);
    expect(translateBuildByIdMock).toHaveBeenCalledWith(reqById, props, 'canonical');
  });

  it('uses legacy shape and deprecation headers for /api/recipes* routes', async () => {
    const req = new Request('http://localhost/api/recipes');
    const reqById = new Request('http://localhost/api/recipes/abc');
    const props = { params: Promise.resolve({ id: 'abc' }) };

    const listRes = await getRecipesLegacy(req as never);
    const postRes = await postRecipesLegacy(req as never);
    const getRes = await getRecipeLegacy(reqById, props);
    const putRes = await putRecipeLegacy(reqById as never, props);
    const deleteRes = await deleteRecipeLegacy(reqById, props);
    const favRes = await patchFavoriteLegacy(reqById as never, props);
    const trRes = await postTranslateLegacy(reqById as never, props);

    expect(getBuildsMock).toHaveBeenCalledWith(req, 'legacy');
    expect(saveBuildMock).toHaveBeenCalledWith(req, 'legacy');
    expect(getBuildByIdMock).toHaveBeenCalledWith(reqById, props, 'legacy');
    expect(updateBuildByIdMock).toHaveBeenCalledWith(reqById, props, 'legacy');
    expect(deleteBuildByIdMock).toHaveBeenCalledWith(reqById, props);
    expect(toggleBuildFavoriteMock).toHaveBeenCalledWith(reqById, props);
    expect(translateBuildByIdMock).toHaveBeenCalledWith(reqById, props, 'legacy');

    for (const res of [listRes, postRes, getRes, putRes, deleteRes, favRes, trRes]) {
      expect(res.headers.get('Deprecation')).toBe('true');
    }
  });
});
