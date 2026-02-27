import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from '@/components/Providers';
import { storageService } from '@/services/storageService';

jest.mock('@/services/storageService', () => ({
  storageService: {
    getCurrentUser: jest.fn(),
    getStash: jest.fn(),
    getPartyMembers: jest.fn(),
  },
}));

const ContextProbe = () => {
  const app = useApp();

  return (
    <div>
      <span data-testid="lang">{app.language}</span>
      <span data-testid="measure">{app.measurementSystem}</span>
      <span data-testid="members">{app.members.length}</span>
      <span data-testid="stash">{app.pantry.length}</span>
      <span data-testid="cost">{app.costTier}</span>
      <span data-testid="difficulty">{app.difficulty}</span>
      <button
        type="button"
        onClick={() => app.setDifficulty('advanced')}
      >
        set-legacy-difficulty
      </button>
    </div>
  );
};

describe('components/Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (storageService.getCurrentUser as jest.Mock).mockResolvedValue({
      user: {
        language: 'en',
        measurementSystem: 'IMPERIAL',
      },
    });
    (storageService.getStash as jest.Mock).mockResolvedValue([
      { id: 's1', name: 'Orb', inStock: true, replenishmentRule: 'ONE_SHOT' },
    ]);
    (storageService.getPartyMembers as jest.Mock).mockResolvedValue([{ id: 'm1', name: 'A' }]);
  });

  it('loads initial user/stash/members from storage service', async () => {
    render(
      <AppProvider>
        <ContextProbe />
      </AppProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('lang')).toHaveTextContent('en');
      expect(screen.getByTestId('measure')).toHaveTextContent('IMPERIAL');
      expect(screen.getByTestId('members')).toHaveTextContent('1');
      expect(screen.getByTestId('stash')).toHaveTextContent('1');
      expect(storageService.getCurrentUser).toHaveBeenCalled();
      expect(storageService.getStash).toHaveBeenCalled();
      expect(storageService.getPartyMembers).toHaveBeenCalled();
    });
  });

  it('maps legacy difficulty setter to canonical cost tier', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <ContextProbe />
      </AppProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('difficulty')).toHaveTextContent('intermediate'));
    await user.click(screen.getByRole('button', { name: 'set-legacy-difficulty' }));

    expect(screen.getByTestId('difficulty')).toHaveTextContent('advanced');
    expect(screen.getByTestId('cost')).toHaveTextContent('expensive');
  });

  it('uses browser pt language when no explicit preference exists', async () => {
    (storageService.getCurrentUser as jest.Mock).mockResolvedValueOnce({ user: {} });

    const originalNavigatorLanguage = Object.getOwnPropertyDescriptor(window.navigator, 'language');
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: 'pt-BR',
    });

    render(
      <AppProvider>
        <ContextProbe />
      </AppProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('lang')).toHaveTextContent('pt-BR');
    });

    if (originalNavigatorLanguage) {
      Object.defineProperty(window.navigator, 'language', originalNavigatorLanguage);
    }
  });

  it('redirects to /login when initial loading fails with unauthorized', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    (storageService.getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('401 Unauthorized'));

    render(
      <AppProvider>
        <ContextProbe />
      </AppProvider>,
    );

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });

    errorSpy.mockRestore();
  });

  it('server-render fallback returns children with default context value shape', async () => {
    const originalWindow = (globalThis as any).window;

    // Force branch `typeof window === 'undefined'`.
    delete (globalThis as any).window;

    let element: React.ReactElement | null = null;
    await act(async () => {
      element = AppProvider({ children: <div data-testid="server-child">Child</div> }) as React.ReactElement;
    });

    expect(element).not.toBeNull();

    if (originalWindow) {
      (globalThis as any).window = originalWindow;
    }
  });
});
