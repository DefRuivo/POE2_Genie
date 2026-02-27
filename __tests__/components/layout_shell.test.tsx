import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LayoutWrapper from '@/components/LayoutWrapper';
const sidebarMock = jest.fn(
  ({ isOpen, onNavigate }: { isOpen: boolean; onNavigate: (path: string) => void }) => (
    <div data-testid="sidebar">
      <span>{String(isOpen)}</span>
      <button onClick={() => onNavigate('/party')} type="button">
        sidebar-navigate
      </button>
    </div>
  ),
);
const headerMock = jest.fn(({ onMenuClick, onHomeClick }: { onMenuClick: () => void; onHomeClick: () => void }) => (
  <div data-testid="layout-header">
    <button onClick={onMenuClick} type="button">
      open-menu
    </button>
    <button onClick={onHomeClick} type="button">
      go-home
    </button>
  </div>
));
const footerMock = jest.fn(() => <div data-testid="layout-footer">Footer</div>);

jest.mock('@/components/Sidebar', () => ({
  __esModule: true,
  default: (...args: unknown[]) => sidebarMock(...args),
}));

jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: (...args: unknown[]) => headerMock(...args),
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: (...args: unknown[]) => footerMock(...args),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Header/Footer/LayoutWrapper', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    window.history.pushState({}, '', '/builds');
  });

  it('LayoutWrapper shows shell on non-auth pages and handles navigation', () => {
    render(
      <LayoutWrapper>
        <div>Child Content</div>
      </LayoutWrapper>,
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('layout-header')).toBeInTheDocument();
    expect(screen.getByTestId('layout-footer')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();

    // Open menu updates sidebar state to open.
    fireEvent.click(screen.getByRole('button', { name: 'open-menu' }));
    const lastSidebarCall = sidebarMock.mock.calls[sidebarMock.mock.calls.length - 1]?.[0];
    expect(lastSidebarCall?.isOpen).toBe(true);

    // Trigger navigate callbacks (no crash path).
    fireEvent.click(screen.getByRole('button', { name: 'go-home' }));
    fireEvent.click(screen.getByRole('button', { name: 'sidebar-navigate' }));
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('LayoutWrapper hides shell on auth pages', () => {
    window.history.pushState({}, '', '/login');

    render(
      <LayoutWrapper>
        <div>Auth Child</div>
      </LayoutWrapper>,
    );

    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('layout-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('layout-footer')).not.toBeInTheDocument();
    expect(screen.getByText('Auth Child')).toBeInTheDocument();
  });
});
