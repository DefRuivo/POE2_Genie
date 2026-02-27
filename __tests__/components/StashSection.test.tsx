import React from 'react';
import { readFileSync } from 'fs';
import path from 'path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StashSection from '@/components/StashSection';
import { storageService } from '@/services/storageService';
import { useCurrentMember } from '@/hooks/useCurrentMember';

jest.mock('@/services/storageService', () => ({
  storageService: {
    addStashItem: jest.fn(),
    editStashItem: jest.fn(),
    removeStashItem: jest.fn(),
  },
}));

jest.mock('@/hooks/useCurrentMember', () => ({
  useCurrentMember: jest.fn(),
}));

jest.mock('@/components/CustomUnitSelect', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select data-testid="custom-unit-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="x">x</option>
      <option value="stack">stack</option>
    </select>
  ),
}));

jest.mock('@/components/StashItemCard', () => ({
  __esModule: true,
  default: ({ item, onClick, onToggleStock, isGuest }: any) => (
    <div data-testid={`stash-card-${item.id}`}>
      <span>{item.name}</span>
      <span>{item.inStock ? 'in-stock' : 'out-of-stock'}</span>
      <button onClick={onClick} type="button">open-{item.id}</button>
      {!isGuest && <button onClick={onToggleStock} type="button">toggle-{item.id}</button>}
    </div>
  ),
}));

jest.mock('@/components/ConfirmDialog', () => ({
  ConfirmDialog: ({ isOpen, onConfirm, onClose, title }: any) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <span>{title}</span>
        <button type="button" onClick={onConfirm}>confirm-delete</button>
        <button type="button" onClick={onClose}>cancel-delete</button>
      </div>
    ) : null,
}));

jest.mock('@/components/StashItemEditDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onSave, onDelete, onClose, item }: any) =>
    isOpen ? (
      <div data-testid="edit-dialog">
        <span>{item?.name}</span>
        <button type="button" onClick={() => onSave({ name: 'Edited Name', inStock: false })}>save-edit</button>
        <button type="button" onClick={onDelete}>delete-edit</button>
        <button type="button" onClick={onClose}>close-edit</button>
      </div>
    ) : null,
}));

function readExample(filename: string): string {
  return readFileSync(path.join(process.cwd(), 'item_examples', filename), 'utf-8');
}

describe('components/StashSection', () => {
  const setup = (props?: Partial<React.ComponentProps<typeof StashSection>>) => {
    const Wrapper = () => {
      const [stash, setStash] = React.useState<any[]>(props?.stash || []);
      return <StashSection stash={stash} setStash={setStash} />;
    };
    return render(<Wrapper />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCurrentMember as jest.Mock).mockReturnValue({ isGuest: false });
    (storageService.addStashItem as jest.Mock).mockResolvedValue({
      id: 'real-1',
      name: 'Divine Orb',
      inStock: true,
      replenishmentRule: 'ONE_SHOT',
      quantity: '2',
      unit: 'x',
    });
    (storageService.editStashItem as jest.Mock).mockResolvedValue({});
    (storageService.removeStashItem as jest.Mock).mockResolvedValue({});
  });

  it('adds stash item and replaces optimistic temp entry', async () => {
    setup();

    fireEvent.change(screen.getByPlaceholderText('pantry.placeholder'), { target: { value: 'Divine Orb' } });
    fireEvent.change(screen.getByPlaceholderText('Qty'), { target: { value: '2' } });
    fireEvent.change(screen.getByTestId('custom-unit-select'), { target: { value: 'stack' } });
    fireEvent.click(screen.getByRole('button', { name: 'pantry.include' }));

    await waitFor(() => {
      expect(storageService.addStashItem).toHaveBeenCalledWith('Divine Orb', undefined, undefined, '2', 'stack');
      expect(screen.getByText('Divine Orb')).toBeInTheDocument();
    });
  });

  it('handles add failure branch gracefully', async () => {
    (storageService.addStashItem as jest.Mock).mockRejectedValueOnce(new Error('network'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    setup();
    fireEvent.change(screen.getByPlaceholderText('pantry.placeholder'), { target: { value: 'Chaos Orb' } });
    fireEvent.click(screen.getByRole('button', { name: 'pantry.include' }));

    await waitFor(() => {
      expect(storageService.addStashItem).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });

    errorSpy.mockRestore();
  });

  it('imports item from Ctrl+V paste and adds it to stash', async () => {
    setup();

    fireEvent.paste(screen.getByPlaceholderText('pantry.placeholder'), {
      clipboardData: {
        getData: () => readExample('support_gem.md'),
      },
    });

    await waitFor(() => {
      expect(storageService.addStashItem).toHaveBeenCalledWith('Zenith II', undefined, undefined, '1', 'x');
    });
    expect(screen.queryByText('pantry.pasteInvalidFormat')).not.toBeInTheDocument();
  });

  it('shows clear error and skips add when pasted clipboard is not a PoE item', () => {
    setup();

    fireEvent.paste(screen.getByPlaceholderText('pantry.placeholder'), {
      clipboardData: {
        getData: () => 'random clipboard text',
      },
    });

    expect(storageService.addStashItem).not.toHaveBeenCalled();
    expect(screen.getByText('pantry.pasteInvalidFormat')).toBeInTheDocument();
  });

  it('imports only the first item when clipboard has multiple PoE items', async () => {
    setup();

    const multiClipboard = [
      readExample('support_gem.md'),
      readExample('skill_gem.md'),
    ].join('\n\n');

    fireEvent.paste(screen.getByPlaceholderText('pantry.placeholder'), {
      clipboardData: {
        getData: () => multiClipboard,
      },
    });

    await waitFor(() => {
      expect(storageService.addStashItem).toHaveBeenCalledWith('Zenith II', undefined, undefined, '1', 'x');
    });
    expect(screen.getByText('pantry.pasteOnlyFirstItemNotice')).toBeInTheDocument();
  });

  it('toggles stock and reverts optimistic update on failure', async () => {
    (storageService.editStashItem as jest.Mock).mockRejectedValueOnce(new Error('db'));

    setup({
      stash: [{
        id: 's1',
        name: 'Orb of Fusing',
        inStock: true,
        replenishmentRule: 'ONE_SHOT',
        quantity: '1',
        unit: 'x',
      }],
    });

    fireEvent.click(screen.getByRole('button', { name: 'toggle-s1' }));

    await waitFor(() => {
      expect(storageService.editStashItem).toHaveBeenCalledWith('Orb of Fusing', { inStock: false });
      // Reverted back to in-stock after failure
      expect(screen.getByText('in-stock')).toBeInTheDocument();
    });
  });

  it('opens edit dialog, saves edits, and deletes through confirm dialog', async () => {
    setup({
      stash: [{
        id: 's1',
        name: 'Orb of Regret',
        inStock: true,
        replenishmentRule: 'ONE_SHOT',
        quantity: '1',
        unit: 'x',
      }],
    });

    fireEvent.click(screen.getByRole('button', { name: 'open-s1' }));
    expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'save-edit' }));
    await waitFor(() => {
      expect(storageService.editStashItem).toHaveBeenCalledWith('Orb of Regret', {
        name: 'Edited Name',
        inStock: false,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'open-s1' }));
    fireEvent.click(screen.getByRole('button', { name: 'delete-edit' }));

    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'confirm-delete' }));

    await waitFor(() => {
      expect(storageService.removeStashItem).toHaveBeenCalledWith('Edited Name');
    });
  });

  it('hides add controls for guest users', () => {
    (useCurrentMember as jest.Mock).mockReturnValue({ isGuest: true });

    setup();

    expect(screen.queryByPlaceholderText('pantry.placeholder')).not.toBeInTheDocument();
    expect(screen.getByText('No gear/gems found.')).toBeInTheDocument();
  });

  it('supports legacy pantry props, filters, and Enter key add path', async () => {
    const Wrapper = () => {
      const [pantry, setPantry] = React.useState<any[]>([
        {
          id: 'a',
          name: 'Chaos Orb',
          inStock: true,
          replenishmentRule: 'ALWAYS',
          quantity: '5',
          unit: 'x',
        },
        {
          id: 'b',
          name: 'Blessed Orb',
          inStock: true,
          replenishmentRule: 'ONE_SHOT',
          quantity: '1',
          unit: 'x',
        },
      ]);
      return <StashSection pantry={pantry} setPantry={setPantry} />;
    };

    render(<Wrapper />);

    fireEvent.change(screen.getByPlaceholderText('Search stash...'), { target: { value: 'chaos' } });
    expect(screen.getByText('Chaos Orb')).toBeInTheDocument();
    expect(screen.queryByText('Blessed Orb')).not.toBeInTheDocument();

    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'ONE_SHOT' } });
    expect(screen.queryByText('Chaos Orb')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('pantry.placeholder'), { target: { value: 'Vaal Orb' } });
    fireEvent.keyPress(screen.getByPlaceholderText('pantry.placeholder'), { key: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(storageService.addStashItem).toHaveBeenCalledWith('Vaal Orb', undefined, undefined, '1', 'x');
    });
  });

  it('handles empty add guard and no-op state fallback when no props are passed', async () => {
    render(<StashSection />);

    fireEvent.click(screen.getByRole('button', { name: 'pantry.include' }));
    expect(storageService.addStashItem).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('pantry.placeholder'), { target: { value: 'Regal Orb' } });
    fireEvent.click(screen.getByRole('button', { name: 'pantry.include' }));

    await waitFor(() => {
      expect(storageService.addStashItem).toHaveBeenCalledWith('Regal Orb', undefined, undefined, '1', 'x');
    });
  });

  it('logs errors for edit and delete failures and supports dialog close actions', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (storageService.editStashItem as jest.Mock)
      .mockRejectedValueOnce(new Error('edit-fail'))
      .mockRejectedValueOnce(new Error('toggle-fail'));
    (storageService.removeStashItem as jest.Mock).mockRejectedValueOnce(new Error('delete-fail'));

    setup({
      stash: [{
        id: 's9',
        name: 'Annulment Orb',
        inStock: true,
        replenishmentRule: 'ONE_SHOT',
        quantity: '1',
        unit: 'x',
      }],
    });

    fireEvent.click(screen.getByRole('button', { name: 'open-s9' }));
    fireEvent.click(screen.getByRole('button', { name: 'save-edit' }));
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Failed to edit item', expect.any(Error));
    });

    fireEvent.click(screen.getByRole('button', { name: 'toggle-s9' }));
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Failed to toggle stock', expect.any(Error));
    });

    fireEvent.click(screen.getByRole('button', { name: 'close-edit' }));
    expect(screen.queryByTestId('edit-dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'open-s9' }));
    fireEvent.click(screen.getByRole('button', { name: 'delete-edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'cancel-delete' }));
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'open-s9' }));
    fireEvent.click(screen.getByRole('button', { name: 'delete-edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'confirm-delete' }));
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Failed to delete', expect.any(Error));
    });

    errorSpy.mockRestore();
  });
});
