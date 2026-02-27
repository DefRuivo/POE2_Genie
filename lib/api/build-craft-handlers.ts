import { NextRequest, NextResponse } from 'next/server';
import { craftBuildWithAI } from '@/services/geminiService';
import {
  normalizeBuildSessionContext,
  serializeBuildPayload,
  type BuildResponseShape,
} from '@/lib/build-contract';
import { getServerTranslator } from '@/lib/i18n-server';

export async function craftBuild(
  req: NextRequest,
  shape: BuildResponseShape = 'canonical',
) {
  const { t } = getServerTranslator(req);

  try {
    const body = await req.json();
    const members = Array.isArray(body?.members)
      ? body.members
      : Array.isArray(body?.party_members)
        ? body.party_members
        : [];

    const rawContext = body?.context && typeof body.context === 'object' ? body.context : body;
    const normalizedContext = normalizeBuildSessionContext({
      ...rawContext,
      language: body?.language || rawContext?.language,
    });

    const result = await craftBuildWithAI(members, normalizedContext as any);
    return NextResponse.json(serializeBuildPayload(result, shape));
  } catch (error: any) {
    console.error('Error crafting build:', error);

    const isDomainMismatch = Number(error?.status) === 422 || error?.code === 'gemini.domain_mismatch';
    if (isDomainMismatch) {
      const localizedDomainMismatch = t('api.geminiDomainMismatch');
      const fallbackDomainMessage = t('generate.generateError');

      return NextResponse.json(
        {
          error: localizedDomainMismatch === 'api.geminiDomainMismatch'
            ? fallbackDomainMessage
            : localizedDomainMismatch,
          code: 'gemini.domain_mismatch',
          details: Array.isArray(error?.details) ? error.details : [],
        },
        { status: 422 },
      );
    }

    const isQuotaError = Number(error?.status) === 429 || error?.code === 'gemini.quota_exceeded';
    if (isQuotaError) {
      const parsedRetryAfter = Number(error?.retryAfterSeconds);
      const retryAfterSeconds = Number.isFinite(parsedRetryAfter)
        ? Math.max(1, Math.ceil(parsedRetryAfter))
        : null;

      console.warn('[Build API] Gemini quota exceeded', {
        code: error?.code,
        status: error?.status,
        retryAfterSeconds,
      });

      const headers = retryAfterSeconds
        ? { 'Retry-After': String(retryAfterSeconds) }
        : undefined;

      return NextResponse.json(
        {
          error: t('generate.generateError'),
          code: 'gemini.quota_exceeded',
          retryAfterSeconds,
        },
        {
          status: 429,
          headers,
        },
      );
    }

    return NextResponse.json(
      { error: t('api.internalError') },
      { status: 500 },
    );
  }
}
