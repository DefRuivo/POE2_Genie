import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChecklistPage from '@/app/checklist/page';
import { storageService } from '@/services/storageService';

jest.mock('@/services/storageService');

const translationMap: Record<string, string> = {
  'shopping.addItem': 'Add item...',
  'shopping.title': 'Checklist',
  'shopping.subtitle': 'Smart checklist for items needed by your builds.',
  'shopping.loading': 'Loading List...',
  'shopping.empty': 'All caught up!',
  'shopping.readOnly': 'Checklist is shared for the Hideout (Read Only)',
  'shopping.fromPantry': 'From Stash',
  'shopping.clearAll': 'Clear List',
  'shopping.searchPlaceholder': 'Search checklist...',
  'shopping.filterAll': 'All',
  'shopping.filterMyList': 'Manual',
  'shopping.filterRecipes': 'Builds',
  'shopping.allRecipes': 'All Builds',
  'shopping.noResults': 'No items found',
  'shopping.pendingTab': 'Pending',
  'shopping.completedTab': 'Completed',
  'shopping.pendingHelp': 'Items still needed for your builds.',
  'shopping.completedHelp': 'Items already acquired and marked.',
  'shopping.markAsBought': 'Mark as Completed',
  'shopping.reopenItem': 'Reopen to Pending',
  'shopping.statusPending': 'Pending',
  'shopping.statusCompleted': 'Completed',
  'shopping.emptyPending': 'No pending checklist items.',
  'shopping.emptyCompleted': 'No completed checklist items yet.',
  'shopping.clearConfirmTitle': 'Clear pending checklist?',
  'shopping.clearConfirmDesc': 'This removes only pending items.',
  'common.delete': 'Delete',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
};

let forceMissingTranslations = false;

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (forceMissingTranslations) return '';
      return translationMap[key] || key;
    },
    lang: 'en',
  }),
}));

describe('ChecklistPage status tabs', () => {
  const mockItems = [
    { id: 'i1', name: 'Orb of Fusing', checked: false, recipeItems: [] },
    { id: 'i2', name: 'Divine Orb', checked: true, recipeItems: [] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    forceMissingTranslations = false;
    (storageService.getBuildItems as jest.Mock).mockResolvedValue(mockItems);
    (storageService.updateBuildItem as jest.Mock).mockResolvedValue(undefined);
    (storageService.deleteBuildItem as jest.Mock).mockResolvedValue(undefined);
    (storageService.addBuildItem as jest.Mock).mockResolvedValue(undefined);
    (storageService.clearBuildItems as jest.Mock).mockResolvedValue(undefined);
    (storageService.getCurrentUser as jest.Mock).mockResolvedValue({
      user: { id: 'u1' },
    });
    (storageService.getKitchenMembers as jest.Mock).mockResolvedValue([
      {
        id: 'm1',
        userId: 'u1',
        kitchenId: 'k1',
        name: 'User One',
        isGuest: false,
      },
    ]);
  });

  it('shows Pending by default and switches to Completed tab', async () => {
    render(<ChecklistPage />);

    await waitFor(() =>
      expect(storageService.getBuildItems).toHaveBeenCalledWith({ status: 'all' }),
    );

    expect(await screen.findByRole('button', { name: /^Pending\s*\(1\)$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Completed\s*\(1\)$/i })).toBeInTheDocument();
    expect(screen.getByText('Orb of Fusing')).toBeInTheDocument();
    expect(screen.queryByText('Divine Orb')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Completed\s*\(1\)$/i }));
    expect(screen.getByText('Divine Orb')).toBeInTheDocument();
    expect(screen.queryByText('Orb of Fusing')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Add item...')).not.toBeInTheDocument();
  });

  it('marks pending item as completed and reopens completed item', async () => {
    render(<ChecklistPage />);

    await waitFor(() => expect(screen.getByText('Orb of Fusing')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/Mark as/i));
    expect(storageService.updateBuildItem).toHaveBeenCalledWith('i1', { checked: true });

    fireEvent.click(screen.getByRole('button', { name: /^Completed\s*\(/i }));
    fireEvent.click(screen.getAllByLabelText(/Reopen/i)[0]);
    expect(storageService.updateBuildItem).toHaveBeenLastCalledWith(expect.any(String), { checked: false });
  });

  it('allows deleting item from Completed tab', async () => {
    render(<ChecklistPage />);
    await waitFor(() => expect(screen.getByText('Orb of Fusing')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^Completed\s*\(/i }));
    fireEvent.click(screen.getByTitle('Delete'));

    expect(storageService.deleteBuildItem).toHaveBeenCalledWith('i2');
  });

  it('shows guest read-only mode and hides add/clear controls', async () => {
    (storageService.getKitchenMembers as jest.Mock).mockResolvedValue([
      {
        id: 'm1',
        userId: 'u1',
        kitchenId: 'k1',
        name: 'Guest User',
        isGuest: true,
      },
    ]);

    render(<ChecklistPage />);

    await waitFor(() => {
      expect(screen.getByText(/Read Only/i)).toBeInTheDocument();
    });

    expect(screen.queryByPlaceholderText('Add item...')).not.toBeInTheDocument();
    expect(screen.queryByText('Clear List')).not.toBeInTheDocument();
  });

  it('supports manual/recipe filters, build selector, clear-list success and add-item flow', async () => {
    (storageService.getBuildItems as jest.Mock).mockResolvedValue([
      { id: 'm1', name: 'Chaos Orb', checked: false, recipeItems: [] },
      {
        id: 'r1',
        name: 'Tabula Rasa',
        checked: false,
        recipeItems: [{ recipe: { id: 'b1', recipe_title: 'Arc Build' } }],
      },
      {
        id: 'r2',
        name: 'Goldrim',
        checked: false,
        recipeItems: [{ recipe: { id: 'b2', recipe_title: 'RF Build with very long title for truncation' } }],
      },
    ]);

    render(<ChecklistPage />);
    await waitFor(() => expect(screen.getByText('Chaos Orb')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Manual/i }));
    expect(screen.getByText('Chaos Orb')).toBeInTheDocument();
    expect(screen.queryByText('Tabula Rasa')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Builds/i }));
    expect(screen.getByText('Tabula Rasa')).toBeInTheDocument();
    expect(screen.getByText('Goldrim')).toBeInTheDocument();
    expect(screen.getByText(/RF Build with very l\.\.\./i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b2' } });
    expect(screen.queryByText('Tabula Rasa')).not.toBeInTheDocument();
    expect(screen.getByText('Goldrim')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    const addInput = screen.getByPlaceholderText('Add item...');
    fireEvent.change(addInput, { target: { value: 'Divine Orb' } });
    fireEvent.submit(addInput.closest('form') as HTMLFormElement);
    await waitFor(() => {
      expect(storageService.addBuildItem).toHaveBeenCalledWith('Divine Orb');
    });

    fireEvent.click(screen.getByRole('button', { name: /Clear List/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => {
      expect(storageService.clearBuildItems).toHaveBeenCalled();
    });
  });

  it('falls back to hardcoded labels when translations are missing', async () => {
    forceMissingTranslations = true;
    (storageService.getBuildItems as jest.Mock).mockResolvedValue([
      {
        id: 'f1',
        name: 'Fallback Item',
        checked: false,
        pantryItem: { id: 'p1' },
        recipeItems: [{ recipe: { id: 'b9', recipe_title: 'Very Long Build Name For Fallback Branch Hit' } }],
      },
      { id: 'f2', name: 'Done Item', checked: true, recipeItems: [] },
    ]);

    render(<ChecklistPage />);
    await waitFor(() => expect(screen.getByText('Pending (1)')).toBeInTheDocument());

    expect(screen.getByText('Completed (1)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search checklist...')).toBeInTheDocument();
    expect(screen.getByText('My Checklist')).toBeInTheDocument();
    expect(screen.getByText('Items still needed for your builds.')).toBeInTheDocument();
    expect(screen.getByText('Items already acquired/checked.')).toBeInTheDocument();
    expect(screen.getByText(/Very Long Build Name\.\.\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Completed\s*\(/i }));
    expect(screen.getByLabelText('Reopen')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Pending\s*\(/i }));
    fireEvent.change(screen.getByPlaceholderText('Search checklist...'), { target: { value: 'zzz-not-found' } });
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('does not add empty item, supports search filter, and closes clear dialog on cancel', async () => {
    (storageService.getBuildItems as jest.Mock).mockResolvedValue([
      { id: 'm1', name: 'Chaos Orb', checked: false, recipeItems: [] },
      { id: 'm2', name: 'Divine Orb', checked: false, recipeItems: [] },
    ]);

    render(<ChecklistPage />);
    await waitFor(() => expect(screen.getByText('Chaos Orb')).toBeInTheDocument());

    const addInput = screen.getByPlaceholderText('Add item...');
    fireEvent.change(addInput, { target: { value: '   ' } });
    fireEvent.submit(addInput.closest('form') as HTMLFormElement);
    expect(storageService.addBuildItem).not.toHaveBeenCalled();

    const searchInput = screen.getByPlaceholderText('Search checklist...');
    fireEvent.change(searchInput, { target: { value: 'divine' } });
    expect(screen.getByText('Divine Orb')).toBeInTheDocument();
    expect(screen.queryByText('Chaos Orb')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Clear List/i }));
    expect(screen.getByText('Clear pending checklist?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Clear pending checklist?')).not.toBeInTheDocument();
  });

  it('handles load/toggle/remove/clear/add errors and surfaces fallback behaviors', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    // loadList fails first mount
    (storageService.getBuildItems as jest.Mock).mockRejectedValueOnce(new Error('load fail'));
    const first = render(<ChecklistPage />);
    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    first.unmount();

    // rerender with valid data for interaction branches
    (storageService.getBuildItems as jest.Mock).mockResolvedValue(mockItems);
    const { unmount } = render(<ChecklistPage />);
    await waitFor(() => expect(screen.getByText('Orb of Fusing')).toBeInTheDocument());

    (storageService.updateBuildItem as jest.Mock).mockRejectedValueOnce(new Error('toggle fail'));
    fireEvent.click(screen.getByLabelText(/Mark as/i));
    await waitFor(() => expect(errorSpy).toHaveBeenCalled());

    (storageService.deleteBuildItem as jest.Mock).mockRejectedValueOnce(new Error('delete fail'));
    fireEvent.click(screen.getByRole('button', { name: /^Completed\s*\(/i }));
    fireEvent.click(screen.getByTitle('Delete'));
    await waitFor(() => expect(errorSpy).toHaveBeenCalled());

    (storageService.clearBuildItems as jest.Mock).mockRejectedValueOnce(new Error('clear fail'));
    fireEvent.click(screen.getByRole('button', { name: /^Pending\s*\(/i }));
    fireEvent.click(screen.getByRole('button', { name: /Clear List/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });

    (storageService.addBuildItem as jest.Mock).mockRejectedValueOnce(new Error('add fail'));
    const addInput = screen.getByPlaceholderText('Add item...');
    fireEvent.change(addInput, { target: { value: 'Orb of Regret' } });
    fireEvent.submit(addInput.closest('form') as HTMLFormElement);
    await waitFor(() => expect(errorSpy).toHaveBeenCalled());

    unmount();
    alertSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
