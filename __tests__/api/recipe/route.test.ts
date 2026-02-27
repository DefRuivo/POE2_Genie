import { NextRequest } from 'next/server';
import { POST } from '@/app/api/recipe/route';
import { craftBuildWithAI } from '@/services/geminiService';
import { verifyToken } from '@/lib/auth';
import { getServerTranslator } from '@/lib/i18n-server';

jest.mock('@/services/geminiService', () => ({
  craftBuildWithAI: jest.fn()
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn()
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    }
  }
}));

jest.mock('@/lib/i18n-server', () => ({
  getServerTranslator: jest.fn()
}));

describe('POST /api/recipe', () => {
  const makeRequest = (acceptLanguage = 'en') => new NextRequest('http://localhost/api/recipe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'accept-language': acceptLanguage },
    body: JSON.stringify({
      members: [{ id: 'm1' }],
      context: { requested_type: 'main' },
      language: acceptLanguage.startsWith('pt') ? 'pt-BR' : 'en'
    })
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (verifyToken as jest.Mock).mockResolvedValue(null);

    (getServerTranslator as jest.Mock).mockImplementation((req?: NextRequest) => {
      const acceptLanguage = req?.headers.get('accept-language') || 'en';
      const isPt = acceptLanguage.toLowerCase().includes('pt');

      const dict: Record<string, string> = isPt
        ? {
            'generate.generateError': 'Falha ao craftar build. Tente novamente.',
            'api.geminiDomainMismatch': 'O conteúdo gerado está fora do domínio de build do Path of Exile. Tente novamente.',
            'api.internalError': 'Erro interno do servidor'
          }
        : {
            'generate.generateError': 'Failed to craft build. Please try again.',
            'api.geminiDomainMismatch': 'Generated content is outside Path of Exile build domain. Please try again.',
            'api.internalError': 'Internal server error'
          };

      return {
        t: (key: string) => dict[key] || key,
        lang: isPt ? 'pt-BR' : 'en'
      };
    });
  });

  it('returns 429 with generic localized message and Retry-After header in English', async () => {
    (craftBuildWithAI as jest.Mock).mockRejectedValue({
      status: 429,
      code: 'gemini.quota_exceeded',
      retryAfterSeconds: 46
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const res = await POST(makeRequest('en'));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(res.headers.get('Deprecation')).toBe('true');
    expect(res.headers.get('Retry-After')).toBe('46');
    expect(data).toEqual({
      error: 'Failed to craft build. Please try again.',
      code: 'gemini.quota_exceeded',
      retryAfterSeconds: 46
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '[Build API] Gemini quota exceeded',
      expect.objectContaining({
        code: 'gemini.quota_exceeded',
        status: 429,
        retryAfterSeconds: 46
      })
    );

    warnSpy.mockRestore();
  });

  it('returns 429 with generic localized message in Portuguese', async () => {
    (craftBuildWithAI as jest.Mock).mockRejectedValue({
      status: 429,
      code: 'gemini.quota_exceeded',
      retryAfterSeconds: 30
    });

    const res = await POST(makeRequest('pt-BR'));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(res.headers.get('Deprecation')).toBe('true');
    expect(res.headers.get('Retry-After')).toBe('30');
    expect(data).toEqual({
      error: 'Falha ao craftar build. Tente novamente.',
      code: 'gemini.quota_exceeded',
      retryAfterSeconds: 30
    });
  });

  it('returns 500 localized internal error for non-quota failures', async () => {
    (craftBuildWithAI as jest.Mock).mockRejectedValue(new Error('boom'));

    const res = await POST(makeRequest('en'));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(res.headers.get('Deprecation')).toBe('true');
    expect(data).toEqual({ error: 'Internal server error' });
  });

  it('returns 422 localized domain mismatch when AI output remains culinary', async () => {
    (craftBuildWithAI as jest.Mock).mockRejectedValue({
      status: 422,
      code: 'gemini.domain_mismatch',
      details: ['recipe', 'chicken'],
    });

    const res = await POST(makeRequest('en'));
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(res.headers.get('Deprecation')).toBe('true');
    expect(data).toEqual({
      error: 'Generated content is outside Path of Exile build domain. Please try again.',
      code: 'gemini.domain_mismatch',
      details: ['recipe', 'chicken'],
    });
  });
});
