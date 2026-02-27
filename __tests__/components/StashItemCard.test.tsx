import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import StashItemCard from '@/components/StashItemCard';

describe('components/StashItemCard', () => {
  const baseItem = {
    id: 'i1',
    name: 'Orb of Alchemy',
    inStock: true,
    replenishmentRule: 'ONE_SHOT' as const,
    quantity: '3',
    unit: 'x',
    unitDetails: 'stack',
  };

  it('renders item details and supports click/toggle for non-guest', () => {
    const onClick = jest.fn();
    const onToggleStock = jest.fn();

    render(
      <StashItemCard
        item={baseItem}
        onClick={onClick}
        onToggleStock={onToggleStock}
        isGuest={false}
      />,
    );

    expect(screen.getByText('Orb of Alchemy')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Orb of Alchemy'));
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button'));
    expect(onToggleStock).toHaveBeenCalledTimes(1);
  });

  it('uses out-of-stock rendering and hides toggle for guest', () => {
    const onClick = jest.fn();
    const onToggleStock = jest.fn();

    render(
      <StashItemCard
        item={{ ...baseItem, inStock: false, replenishmentRule: 'ALWAYS' }}
        onClick={onClick}
        onToggleStock={onToggleStock}
        isGuest
      />,
    );

    expect(screen.getByText('Orb of Alchemy')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Orb of Alchemy'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
