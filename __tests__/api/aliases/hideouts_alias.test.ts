import { GET as getHideouts, POST as postHideouts } from '@/app/api/hideouts/route';
import { DELETE as deleteHideout, PUT as putHideout } from '@/app/api/hideouts/[hideoutId]/route';
import { POST as joinHideout } from '@/app/api/hideouts/join/route';

import { GET as getKitchens, POST as postKitchens } from '@/app/api/kitchens/route';
import { DELETE as deleteKitchen, PUT as putKitchen } from '@/app/api/kitchens/[kitchenId]/route';
import { POST as joinKitchen } from '@/app/api/kitchens/join/route';

const createHideoutMock = jest.fn();
const getCurrentHideoutMock = jest.fn();
const updateHideoutMock = jest.fn();
const deleteHideoutMock = jest.fn();
const joinHideoutMock = jest.fn();

jest.mock('@/lib/api/hideouts-handlers', () => ({
  createHideout: (...args: unknown[]) => createHideoutMock(...args),
  getCurrentHideout: (...args: unknown[]) => getCurrentHideoutMock(...args),
  updateHideout: (...args: unknown[]) => updateHideoutMock(...args),
  deleteHideout: (...args: unknown[]) => deleteHideoutMock(...args),
  joinHideout: (...args: unknown[]) => joinHideoutMock(...args),
}));

describe('Hideouts API aliases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards canonical and legacy root routes to hideout handlers', async () => {
    const req = new Request('http://localhost/api/hideouts');

    await getHideouts(req as never);
    await postHideouts(req as never);
    await getKitchens(req as never);
    await postKitchens(req as never);

    expect(getCurrentHideoutMock).toHaveBeenCalledTimes(2);
    expect(createHideoutMock).toHaveBeenCalledTimes(2);
  });

  it('forwards canonical and legacy ID routes to shared handlers', async () => {
    const req = new Request('http://localhost/api/hideouts/abc');
    const hideoutParams = { params: Promise.resolve({ hideoutId: 'abc' }) };
    const kitchenParams = { params: Promise.resolve({ kitchenId: 'abc' }) };

    await putHideout(req as never, hideoutParams);
    await deleteHideout(req as never, hideoutParams);
    await putKitchen(req as never, kitchenParams);
    await deleteKitchen(req as never, kitchenParams);

    expect(updateHideoutMock).toHaveBeenCalledTimes(2);
    expect(deleteHideoutMock).toHaveBeenCalledTimes(2);
    expect(updateHideoutMock).toHaveBeenNthCalledWith(1, req, 'abc');
    expect(updateHideoutMock).toHaveBeenNthCalledWith(2, req, 'abc');
    expect(deleteHideoutMock).toHaveBeenNthCalledWith(1, req, 'abc');
    expect(deleteHideoutMock).toHaveBeenNthCalledWith(2, req, 'abc');
  });

  it('forwards canonical and legacy join routes', async () => {
    const req = new Request('http://localhost/api/hideouts/join', { method: 'POST' });

    await joinHideout(req as never);
    await joinKitchen(req as never);

    expect(joinHideoutMock).toHaveBeenCalledTimes(2);
    expect(joinHideoutMock).toHaveBeenNthCalledWith(1, req);
    expect(joinHideoutMock).toHaveBeenNthCalledWith(2, req);
  });
});
