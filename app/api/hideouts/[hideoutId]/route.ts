import { NextRequest } from 'next/server';
import { deleteHideout, updateHideout } from '@/lib/api/hideouts-handlers';

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ hideoutId: string }> }
) {
  const params = await props.params;
  return updateHideout(request, params.hideoutId);
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ hideoutId: string }> }
) {
  const params = await props.params;
  return deleteHideout(request, params.hideoutId);
}
