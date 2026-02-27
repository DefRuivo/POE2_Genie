import { DELETE as deleteKitchenMember } from '@/app/api/kitchen-members/[id]/route';
import { GET as getKitchenMembers, POST as postKitchenMember } from '@/app/api/kitchen-members/route';
import { DELETE as deleteHideoutMember } from '@/app/api/hideout-members/[id]/route';
import { GET as getHideoutMembers, POST as postHideoutMember } from '@/app/api/hideout-members/route';
import { DELETE as deletePartyMemberRoute } from '@/app/api/party-members/[id]/route';
import { GET as getPartyMembersRoute, POST as postPartyMemberRoute } from '@/app/api/party-members/route';

const getPartyMembersMock = jest.fn();
const savePartyMemberMock = jest.fn();
const deletePartyMemberMock = jest.fn();

jest.mock('@/lib/api/party-members-handlers', () => ({
  getPartyMembers: (...args: unknown[]) => getPartyMembersMock(...args),
  savePartyMember: (...args: unknown[]) => savePartyMemberMock(...args),
  deletePartyMember: (...args: unknown[]) => deletePartyMemberMock(...args),
}));

describe('Party members aliases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards canonical and legacy member routes to party handlers', async () => {
    const req = new Request('http://localhost/api/party-members');
    const props = { params: Promise.resolve({ id: 'abc' }) };

    await getPartyMembersRoute(req as never);
    await postPartyMemberRoute(req as never);
    await deletePartyMemberRoute(req as never, props);

    await getHideoutMembers(req as never);
    await postHideoutMember(req as never);
    await deleteHideoutMember(req as never, props);

    await getKitchenMembers(req as never);
    await postKitchenMember(req as never);
    await deleteKitchenMember(req as never, props);

    expect(getPartyMembersMock).toHaveBeenCalledTimes(3);
    expect(savePartyMemberMock).toHaveBeenCalledTimes(3);
    expect(deletePartyMemberMock).toHaveBeenCalledTimes(3);
  });
});
