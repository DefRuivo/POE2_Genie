import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from '@/components/UserMenu';
import { storageService } from '@/services/storageService';

const push = jest.fn();
const refresh = jest.fn();
const setLanguage = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

jest.mock('@/components/Providers', () => ({
  useApp: () => ({ setLanguage }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'auth.userNoKitchen': 'No Hideout',
        'nav.switchKitchen': 'Switch Hideout',
        'nav.newKitchen': 'New Hideout',
        'nav.searchKitchens': 'Search hideouts',
        'nav.myKitchens': 'My Hideouts',
        'nav.otherKitchens': 'Other Hideouts',
        'nav.language': 'Language',
        'nav.settings': 'Settings',
        'nav.logout': 'Logout',
      };
      return map[key] || key;
    },
    lang: 'en',
  }),
}));

jest.mock('@/services/storageService', () => ({
  storageService: {
    getCurrentUser: jest.fn(),
    switchHideout: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

const mockUser = {
  id: 'u1',
  name: 'Ranger',
  surname: 'Exile',
  email: 'ranger@poe.gg',
  measurementSystem: 'METRIC',
  currentKitchenId: 'k1',
  kitchenMemberships: [
    { id: 'm1', kitchenId: 'k1', role: 'ADMIN', kitchen: { name: 'Atlas HQ' } },
    { id: 'm2', kitchenId: 'k2', role: 'MEMBER', kitchen: { name: 'Sanctum' } },
  ],
};

describe('components/UserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storageService.getCurrentUser as jest.Mock).mockResolvedValue({ user: mockUser });
    (storageService.switchHideout as jest.Mock).mockResolvedValue({ success: true });
    (storageService.updateProfile as jest.Mock).mockResolvedValue({ success: true });
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
  });

  it('renders after user load and supports hideout search/switch', async () => {
    const user = userEvent.setup();

    render(<UserMenu />);

    await waitFor(() => {
      expect(screen.getByText('Ranger')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Ranger'));
    expect(screen.getByText('Switch Hideout')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search hideouts');
    await user.type(searchInput, 'zzz');
    expect(screen.getByText('No Hideout')).toBeInTheDocument();

    await user.clear(searchInput);
    await user.click(screen.getByRole('button', { name: 'Sanctum' }));

    await waitFor(() => {
      expect(storageService.switchHideout).toHaveBeenCalledWith('k2');
    });
  });

  it('updates language preference and routes to settings/logout', async () => {
    const user = userEvent.setup();

    render(<UserMenu />);

    await waitFor(() => {
      expect(screen.getByText('Ranger')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Ranger'));

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pt-BR' } });
    await waitFor(() => {
      expect(setLanguage).toHaveBeenCalledWith('pt-BR');
      expect(storageService.updateProfile).toHaveBeenCalledWith({
        name: 'Ranger',
        surname: 'Exile',
        measurementSystem: 'METRIC',
        language: 'pt-BR',
      });
    });

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(push).toHaveBeenCalledWith('/settings');

    // Re-open menu because settings click closes dropdown.
    if (!screen.queryByRole('button', { name: 'Logout' })) {
      await user.click(screen.getByText('Ranger'));
    }
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      expect(push).toHaveBeenCalledWith('/login');
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('covers my-hideout switch path and switch error branch', async () => {
    const user = userEvent.setup();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (storageService.switchHideout as jest.Mock).mockRejectedValueOnce(new Error('switch-failed'));

    render(<UserMenu />);
    await waitFor(() => expect(screen.getByText('Ranger')).toBeInTheDocument());

    await user.click(screen.getByText('Ranger'));
    await user.click(screen.getByRole('button', { name: 'New Hideout' }));
    expect(push).toHaveBeenCalledWith('/hideouts');

    await user.click(screen.getByText('Ranger'));
    await user.click(screen.getByRole('button', { name: 'Atlas HQ' }));
    await waitFor(() => {
      expect(storageService.switchHideout).toHaveBeenCalledWith('k1');
      expect(errorSpy).toHaveBeenCalledWith('Failed to switch hideout', expect.any(Error));
    });

    errorSpy.mockRestore();
  });

  it('logs error when logout request fails', async () => {
    const user = userEvent.setup();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('logout-failed'));

    render(<UserMenu />);
    await waitFor(() => expect(screen.getByText('Ranger')).toBeInTheDocument());

    await user.click(screen.getByText('Ranger'));
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
    });
    errorSpy.mockRestore();
  });

  it('shows empty state when user has no hideout memberships', async () => {
    const user = userEvent.setup();
    (storageService.getCurrentUser as jest.Mock).mockResolvedValueOnce({
      user: {
        ...mockUser,
        kitchenMemberships: undefined,
        currentKitchenId: 'none',
      },
    });

    render(<UserMenu />);
    await waitFor(() => expect(screen.getByText('Ranger')).toBeInTheDocument());
    await user.click(screen.getByText('Ranger'));

    expect(screen.getByText('No Hideout')).toBeInTheDocument();
  });

  it('returns null when user cannot be loaded and handles close on outside click', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (storageService.getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    const { container } = render(<UserMenu />);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
    expect(container.firstChild).toBeNull();

    // render again with user to cover click-outside path
    (storageService.getCurrentUser as jest.Mock).mockResolvedValueOnce({ user: mockUser });
    render(<UserMenu />);

    await waitFor(() => expect(screen.getByText('Ranger')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Ranger'));
    expect(screen.getByText('Switch Hideout')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText('Switch Hideout')).not.toBeInTheDocument();
    });

    errorSpy.mockRestore();
  });
});
