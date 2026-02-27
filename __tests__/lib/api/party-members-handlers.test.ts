import { NextRequest } from 'next/server';
import {
  deletePartyMember,
  getPartyMembers,
  savePartyMember,
} from '@/lib/api/party-members-handlers';
import {
  deleteHideoutMember,
  getHideoutMembers,
  saveHideoutMember,
} from '@/lib/api/hideout-members-handlers';

jest.mock('@/lib/api/hideout-members-handlers', () => ({
  getHideoutMembers: jest.fn(),
  saveHideoutMember: jest.fn(),
  deleteHideoutMember: jest.fn(),
}));

describe('lib/api/party-members-handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getHideoutMembers as jest.Mock).mockResolvedValue(new Response('{}'));
    (saveHideoutMember as jest.Mock).mockResolvedValue(new Response('{}'));
    (deleteHideoutMember as jest.Mock).mockResolvedValue(new Response('{}'));
  });

  it('delegates getPartyMembers to getHideoutMembers', async () => {
    const req = new NextRequest('http://localhost/api/party-members');
    await getPartyMembers(req);
    expect(getHideoutMembers).toHaveBeenCalledWith(req);
  });

  it('delegates savePartyMember to saveHideoutMember', async () => {
    const req = new NextRequest('http://localhost/api/party-members', {
      method: 'POST',
      body: JSON.stringify({ name: 'Tester' }),
    });
    await savePartyMember(req);
    expect(saveHideoutMember).toHaveBeenCalledWith(req);
  });

  it('delegates deletePartyMember to deleteHideoutMember', async () => {
    const req = new NextRequest('http://localhost/api/party-members/m1', {
      method: 'DELETE',
    });
    await deletePartyMember(req, 'm1');
    expect(deleteHideoutMember).toHaveBeenCalledWith(req, 'm1');
  });
});
