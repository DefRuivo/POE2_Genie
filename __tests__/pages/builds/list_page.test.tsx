import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import BuildsPage from '@/app/builds/page';
import { storageService } from '@/services/storageService';

const pushMock = jest.fn();
let guestMode = false;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/hooks/useCurrentMember', () => ({
  useCurrentMember: () => ({ isGuest: guestMode, loading: false }),
}));

jest.mock('@/services/storageService', () => ({
  storageService: {
    getAllBuilds: jest.fn(),
  },
}));

jest.mock('@/components/BuildArchiveSection', () => ({
  __esModule: true,
  default: ({
    history,
    onUpdate,
    onViewRecipe,
    isGuest,
  }: {
    history: any[];
    onUpdate: () => Promise<void>;
    onViewRecipe: (item: any) => void;
    isGuest: boolean;
  }) => (
    <div data-testid="archive">
      <div data-testid="guest-flag">{isGuest ? 'guest' : 'member'}</div>
      {history.map((h) => (
        <div key={h.id}>{h.recipe_title || h.build_title}</div>
      ))}
      <button type="button" onClick={() => onViewRecipe(history[0])}>
        view-first
      </button>
      <button type="button" onClick={() => onUpdate()}>
        refresh-history
      </button>
    </div>
  ),
}));

describe('BuildsPage extra coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    guestMode = false;
    (storageService.getAllBuilds as jest.Mock).mockResolvedValue([
      {
        id: 'b1',
        recipe_title: 'Arc Build',
        ingredients_from_pantry: ['Orb of Alteration'],
        shopping_list: [{ name: 'Tabula Rasa' }],
      },
      {
        id: 'b2',
        build_title: 'RF Build',
        gear_gems: [{ name: 'Fire Trap' }],
        build_items: ['Ruby Flask'],
      },
    ]);
  });

  it('loads builds, filters by search term, and routes from action buttons', async () => {
    render(<BuildsPage />);
    await waitFor(() => expect(screen.getByText('Arc Build')).toBeInTheDocument());

    const search = screen.getByPlaceholderText('Search by title or gear/gem...');
    fireEvent.change(search, { target: { value: 'tabula' } });
    expect(screen.getByText('Arc Build')).toBeInTheDocument();
    expect(screen.queryByText('RF Build')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Craft Build/i }));
    fireEvent.click(screen.getByRole('button', { name: /recipes\.createCustom|Create Custom Build/i }));
    expect(pushMock).toHaveBeenCalledWith('/builds/craft');
    expect(pushMock).toHaveBeenCalledWith('/builds/create');
  });

  it('uses archive callbacks for view + refresh', async () => {
    render(<BuildsPage />);
    await waitFor(() => expect(screen.getByTestId('archive')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'view-first' }));
    expect(pushMock).toHaveBeenCalledWith('/builds/b1');

    fireEvent.click(screen.getByRole('button', { name: 'refresh-history' }));
    await waitFor(() => {
      expect(storageService.getAllBuilds).toHaveBeenCalledTimes(2);
    });
  });

  it('hides craft CTA for guest and still allows create', async () => {
    guestMode = true;
    render(<BuildsPage />);
    await waitFor(() => expect(screen.getByTestId('guest-flag')).toHaveTextContent('guest'));

    expect(screen.queryByRole('button', { name: /Craft Build/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /recipes\.createCustom|Create Custom Build/i }));
    expect(pushMock).toHaveBeenCalledWith('/builds/create');
  });

  it('renders empty state variants and no-results text', async () => {
    (storageService.getAllBuilds as jest.Mock).mockResolvedValueOnce([]);
    render(<BuildsPage />);
    await waitFor(() => expect(screen.getByText('No builds found')).toBeInTheDocument());
    expect(screen.getAllByRole('button', { name: /Craft Build/i }).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText('Search by title or gear/gem...'), { target: { value: 'xyz' } });
    expect(screen.getByText('No results for "xyz". Try another keyword!')).toBeInTheDocument();
  });
});
