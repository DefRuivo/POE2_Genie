import React from 'react';
import { render, screen } from '@testing-library/react';
const { useTranslation: useRealTranslation } = jest.requireActual('@/hooks/useTranslation');

let mockLanguage: string | undefined = 'en';

jest.mock('@/components/Providers', () => ({
  useApp: () => ({
    language: mockLanguage,
  }),
}));

function HookConsumer({ translationKey }: { translationKey: string }) {
  const { t, lang } = useRealTranslation();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="value">{t(translationKey)}</span>
    </div>
  );
}

describe('useTranslation hook', () => {
  it('uses current language and resolves nested keys', () => {
    mockLanguage = 'en';
    render(<HookConsumer translationKey="common.loading" />);

    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('value')).not.toHaveTextContent('common.loading');
  });

  it('falls back to english when language is missing', () => {
    mockLanguage = undefined;
    render(<HookConsumer translationKey="common.loading" />);

    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('value')).toBeInTheDocument();
  });

  it('returns key itself when key path does not exist', () => {
    mockLanguage = 'pt-BR';
    render(<HookConsumer translationKey="missing.path.value" />);

    expect(screen.getByTestId('lang')).toHaveTextContent('pt-BR');
    expect(screen.getByTestId('value')).toHaveTextContent('missing.path.value');
  });
});
