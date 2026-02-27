import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CustomUnitSelect from '@/components/CustomUnitSelect';

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'units.x': 'x',
        'units.stack': 'Stack',
        'units.set': 'Set',
        'units.lvl': 'Lvl',
        'units.%': '%',
        'units.socket': 'Socket',
        'units.link': 'Link',
        'units.slot': 'Slot',
      };
      return map[key] || key;
    },
  }),
}));

describe('CustomUnitSelect', () => {
  it('renders canonical PoE units and allows change', () => {
    const onChange = jest.fn();
    render(<CustomUnitSelect value="x" onChange={onChange} />);

    expect(screen.getByRole('option', { name: 'Stack' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Socket' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'stack' } });
    expect(onChange).toHaveBeenCalledWith('stack');
  });

  it('includes legacy custom value and placeholder when provided', () => {
    render(<CustomUnitSelect value="cup" onChange={() => undefined} placeholder="Select unit" />);

    expect(screen.getByRole('option', { name: 'Select unit' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'cup' })).toBeInTheDocument();
  });
});
