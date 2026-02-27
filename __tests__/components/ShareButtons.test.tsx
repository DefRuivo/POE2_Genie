import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { ShareButtons } from '@/components/ShareButtons';

let forceMissingTranslation = false;

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (forceMissingTranslation) return '';
      const map: Record<string, string> = {
        'recipeCard.whatsapp': 'WhatsApp',
        'recipeCard.telegram': 'Telegram',
        'recipeCard.copyClipboard': 'Copy',
        'recipeCard.copied': 'Copied!',
      };
      return map[key] || key;
    },
  }),
}));

describe('components/ShareButtons', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    forceMissingTranslation = false;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders icon layout with encoded WhatsApp and Telegram links', () => {
    render(<ShareButtons text="Party invite" url="https://poe2genie.app/checklist" />);

    const whatsapp = screen.getByTitle('WhatsApp') as HTMLAnchorElement;
    const telegram = screen.getByTitle('Telegram') as HTMLAnchorElement;

    expect(whatsapp.href).toContain('https://wa.me/?text=');
    expect(whatsapp.href).toContain(encodeURIComponent('Party invite https://poe2genie.app/checklist'));
    expect(telegram.href).toContain('https://t.me/share/url');
    expect(telegram.href).toContain(encodeURIComponent('https://poe2genie.app/checklist'));
  });

  it('renders menu-items layout and copies text to clipboard', () => {
    render(<ShareButtons text="Share this build" layout="menu-items" />);

    expect(screen.getByRole('link', { name: /WhatsApp/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Telegram/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Copy/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Share this build');
    expect(screen.getByRole('button', { name: /Copied!/i })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
  });

  it('uses default url and translation fallbacks when i18n keys are missing', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://env.poe2genie.app';
    forceMissingTranslation = true;

    render(<ShareButtons text="Fallback share" layout="menu-items" />);

    const whatsapp = screen.getByRole('link', { name: /WhatsApp/i }) as HTMLAnchorElement;
    const telegram = screen.getByRole('link', { name: /Telegram/i }) as HTMLAnchorElement;
    expect(whatsapp.href).toContain(encodeURIComponent('https://env.poe2genie.app'));
    expect(telegram.href).toContain(encodeURIComponent('https://env.poe2genie.app'));

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });
});
