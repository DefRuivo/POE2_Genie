import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';

const push = jest.fn();
const refresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'nav.home': 'Home',
        'nav.pantry': 'Stash',
        'nav.shopping': 'Checklist',
        'nav.recipes': 'Builds',
        'nav.members': 'Party',
        'nav.kitchens': 'Hideouts',
        'nav.settings': 'Settings',
        'nav.logout': 'Logout',
      };
      return map[key] || key;
    },
  }),
}));

describe('components/Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock | undefined) = jest.fn().mockResolvedValue({ ok: true });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
      writable: true,
    });
  });

  it('renders navigation and closes on backdrop and nav click', () => {
    const onClose = jest.fn();
    const onNavigate = jest.fn();
    render(<Sidebar isOpen onClose={onClose} onNavigate={onNavigate} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Checklist')).toBeInTheDocument();

    // Backdrop is first fixed div.
    const backdrop = document.querySelector('div.fixed.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as HTMLElement);

    fireEvent.click(screen.getByText('Builds'));

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onNavigate).toHaveBeenCalledWith('/builds');
  });

  it('logs out and navigates to login', async () => {
    const onClose = jest.fn();
    render(<Sidebar isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      expect(push).toHaveBeenCalledWith('/login');
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('handles logout failure path without crashing', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'));

    render(<Sidebar isOpen onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });

    errorSpy.mockRestore();
  });

  it('renders closed drawer state and close icon triggers onClose', () => {
    const onClose = jest.fn();
    render(<Sidebar isOpen={false} onClose={onClose} />);

    const backdrop = document.querySelector('div.fixed.inset-0');
    const drawer = document.querySelector('aside');
    expect(backdrop).toHaveClass('opacity-0');
    expect(drawer).toHaveClass('-translate-x-full');

    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
