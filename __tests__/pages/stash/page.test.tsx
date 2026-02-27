import React from 'react';
import { render, screen } from '@testing-library/react';
import StashPage from '@/app/stash/page';

const setPantryMock = jest.fn();

jest.mock('@/components/StashSection', () => ({
  __esModule: true,
  default: ({ pantry }: { pantry: Array<{ name: string }> }) => (
    <div data-testid="stash-section">{pantry.map((item) => item.name).join(',')}</div>
  ),
}));

jest.mock('@/components/Providers', () => ({
  useApp: () => ({
    pantry: [{ id: 'p1', name: 'Orb of Fusing' }],
    setPantry: setPantryMock,
  }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('StashPage', () => {
  it('renders stash title/subtitle and passes pantry to StashSection', () => {
    render(<StashPage />);

    expect(screen.getByText('pantry.title')).toBeInTheDocument();
    expect(screen.getByText('pantry.subtitle')).toBeInTheDocument();
    expect(screen.getByTestId('stash-section')).toHaveTextContent('Orb of Fusing');
  });
});
