import { NextRequest } from 'next/server';
import {
  deleteBuildById,
  getBuildById,
  updateBuildById,
} from '@/lib/api/builds-handlers';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  return getBuildById(request, props, 'canonical');
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  return updateBuildById(request, props, 'canonical');
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  return deleteBuildById(request, props);
}
