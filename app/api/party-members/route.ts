import { NextRequest } from 'next/server';
import { getPartyMembers, savePartyMember } from '@/lib/api/party-members-handlers';

export async function GET(request: NextRequest) {
  return getPartyMembers(request);
}

export async function POST(request: NextRequest) {
  return savePartyMember(request);
}
