import { NextRequest } from 'next/server';
import { getServerTranslator } from '@/lib/i18n-server';

describe('lib/i18n-server', () => {
  it('prefers explicit user language when supported', () => {
    const { t, lang } = getServerTranslator(undefined, 'pt-BR');
    expect(lang).toBe('pt-BR');
    expect(t('common.save')).toBe('Salvar');
  });

  it('falls back to english when preferred language is unsupported', () => {
    const { t, lang } = getServerTranslator(undefined, 'xx-YY');
    expect(lang).toBe('en');
    expect(t('common.save')).toBe('Save');
  });

  it('uses NextRequest accept-language exact match', () => {
    const req = new NextRequest('http://localhost', {
      headers: {
        'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });

    const { t, lang } = getServerTranslator(req);
    expect(lang).toBe('pt-BR');
    expect(t('common.cancel')).toBe('Cancelar');
  });

  it('uses prefix fallback match from generic Request', () => {
    const req = new Request('http://localhost', {
      headers: {
        'accept-language': 'pt;q=0.9,en;q=0.8',
      },
    });

    const { t, lang } = getServerTranslator(req as any);
    expect(lang).toBe('pt-BR');
    expect(t('nav.members')).toBe('Party');
  });

  it('supports generic Headers-like object and returns key when missing path', () => {
    const headerLike = {
      get: (name: string) => (name === 'accept-language' ? 'en-US,en;q=0.9' : null),
    };

    const { t, lang } = getServerTranslator(headerLike as any);
    expect(lang).toBe('en');
    expect(t('not.exists.path')).toBe('not.exists.path');
  });
});
