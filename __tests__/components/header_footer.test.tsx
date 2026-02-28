import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const userMenuMock = jest.fn(() => <div data-testid="user-menu">UserMenu</div>);

jest.mock('@/components/UserMenu', () => ({
  UserMenu: (...args: unknown[]) => userMenuMock(...args),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Header and Footer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Header renders user menu and supports optional callbacks', () => {
    const onMenuClick = jest.fn();
    const onHomeClick = jest.fn();
    render(<Header onMenuClick={onMenuClick} onHomeClick={onHomeClick} />);

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    const brandHeading = screen.getByRole('heading', { name: /poe2 genie/i });
    const brandBlock = brandHeading.closest('div');
    const brandIcon = brandBlock?.querySelector('i.fa-wand-magic-sparkles');
    expect(brandIcon).toBeInTheDocument();
    expect(brandIcon).toHaveClass('text-poe-gold');
    expect(brandIcon?.parentElement).toHaveClass('bg-poe-bg0');
    fireEvent.click(screen.getByRole('button'));
    expect(onMenuClick).toHaveBeenCalledTimes(1);

    fireEvent.click(brandHeading);
    expect(onHomeClick).toHaveBeenCalledTimes(1);
  });

  it('Header renders without menu button when callback is not provided', () => {
    render(<Header />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('Footer renders slogan and external links', () => {
    render(<Footer />);
    expect(screen.getByText('common.slogan')).toBeInTheDocument();
    const footerBrand = screen.getByText('POE2 Genie').closest('div');
    const footerBrandIcon = footerBrand?.querySelector('i.fa-wand-magic-sparkles');
    expect(footerBrandIcon).toBeInTheDocument();
    expect(footerBrandIcon).toHaveClass('text-poe-gold');
    expect(footerBrandIcon?.parentElement).toHaveClass('bg-poe-bg0');
    expect(screen.getByLabelText('POE2 Genie on X')).toBeInTheDocument();
    expect(screen.getByLabelText('POE2 Genie on GitHub')).toBeInTheDocument();
  });
});
