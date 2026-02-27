import { NextRequest } from 'next/server';
import {
  deleteHideoutMember,
  getHideoutMembers,
  saveHideoutMember,
} from '@/lib/api/hideout-members-handlers';

export async function getPartyMembers(request: NextRequest) {
  return getHideoutMembers(request);
}

export async function savePartyMember(request: NextRequest) {
  return saveHideoutMember(request);
}

export async function deletePartyMember(request: NextRequest, id: string) {
  return deleteHideoutMember(request, id);
}
