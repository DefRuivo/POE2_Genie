import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import StashItemEditDialog from '@/components/StashItemEditDialog';

jest.mock('@/components/CustomUnitSelect', () => ({
  __esModule: true,
  default: ({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) => (
    <select
      data-testid="unit-select"
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="x">x</option>
      <option value="stack">stack</option>
    </select>
  ),
}));

describe('components/StashItemEditDialog', () => {
  const item = {
    id: 'i1',
    name: 'Orb of Alchemy',
    inStock: true,
    replenishmentRule: 'ONE_SHOT' as const,
    quantity: '3',
    unit: 'x',
    unitDetails: 'old',
  };

  it('returns null when closed or item is null', () => {
    const { container, rerender } = render(
      <StashItemEditDialog isOpen={false} item={item} onClose={jest.fn()} onSave={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <StashItemEditDialog isOpen item={null} onClose={jest.fn()} onSave={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('loads item data, updates fields and saves on click/enter', () => {
    const onClose = jest.fn();
    const onSave = jest.fn();

    render(
      <StashItemEditDialog isOpen item={item} onClose={onClose} onSave={onSave} onDelete={jest.fn()} />,
    );

    const nameInput = screen.getByDisplayValue('Orb of Alchemy');
    const qtyInput = screen.getByDisplayValue('3');

    fireEvent.change(nameInput, { target: { value: 'Divine Orb' } });
    fireEvent.change(qtyInput, { target: { value: '5' } });
    fireEvent.change(screen.getByTestId('unit-select'), { target: { value: 'stack' } });

    // Toggle inStock
    const toggleButton = document.querySelector('button.bg-emerald-500') as HTMLElement;
    fireEvent.click(toggleButton);

    // Enter key path
    fireEvent.keyDown(nameInput, { key: 'Enter' });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Divine Orb',
      quantity: '5',
      unit: 'stack',
      inStock: false,
    }));
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers delete and cancel actions', () => {
    const onClose = jest.fn();
    const onDelete = jest.fn();

    render(
      <StashItemEditDialog isOpen item={item} onClose={onClose} onSave={jest.fn()} onDelete={onDelete} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();

    // Change replenishment option branch
    fireEvent.click(screen.getByText('Always Replenish'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  });
});
