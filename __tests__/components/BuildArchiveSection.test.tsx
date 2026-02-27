import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import BuildArchiveSection from '@/components/BuildArchiveSection';
import { storageService } from '@/services/storageService';

jest.mock('@/services/storageService', () => ({
  storageService: {
    toggleBuildFavorite: jest.fn(),
    deleteBuild: jest.fn(),
  },
}));

describe('BuildArchiveSection', () => {
  const onUpdate = jest.fn();
  const onViewRecipe = jest.fn();

  const history = [
    {
      id: 'r1',
      recipe_title: 'League One',
      meal_type: 'main',
      prep_time: '10m',
      match_reasoning: 'Fallback reason',
      createdAt: Date.now(),
      isFavorite: false,
      translations: [
        { id: 'tr-pt', language: 'pt-BR', recipe_title: 'Liga Um' },
        { id: 'tr-en', language: 'en', build_title: 'League One EN' },
      ],
    },
    {
      id: 'r2',
      build_title: 'Mapper Build',
      build_archetype: 'appetizer',
      setup_time_minutes: 30,
      build_reasoning: 'Fast maps',
      createdAt: Date.now(),
      isFavorite: true,
      translations: [],
    },
    {
      id: 'r3',
      build_title: 'Boss Build',
      build_archetype: 'dessert',
      setup_time: '45m',
      build_reasoning: 'Bossing focus',
      createdAt: Date.now(),
      isFavorite: false,
      translations: [],
    },
    {
      id: 'r4',
      build_title: 'Hybrid Build',
      meal_type: 'snack',
      setup_time: '20m',
      build_reasoning: 'Hybrid fallback',
      createdAt: Date.now(),
      isFavorite: false,
      translations: [],
    },
  ] as any[];

  beforeEach(() => {
    jest.clearAllMocks();
    (storageService.toggleBuildFavorite as jest.Mock).mockResolvedValue(undefined);
    (storageService.deleteBuild as jest.Mock).mockResolvedValue(undefined);
  });

  it('returns null for empty history', () => {
    const { container } = render(<BuildArchiveSection history={[]} onUpdate={onUpdate} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders archetype labels, supports view/favorite and translation badges', async () => {
    render(<BuildArchiveSection history={history as any} onUpdate={onUpdate} onViewRecipe={onViewRecipe} />);

    expect(screen.getByText('League Starter')).toBeInTheDocument();
    expect(screen.getByText('Mapper')).toBeInTheDocument();
    expect(screen.getByText('Bossing')).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
    expect(screen.getByText('Fallback reason')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('45m')).toBeInTheDocument();

    fireEvent.click(screen.getByText('League One'));
    expect(onViewRecipe).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }));

    const heartButtons = document.querySelectorAll('button .fa-heart');
    fireEvent.click(heartButtons[0].closest('button') as HTMLButtonElement);
    await waitFor(() => {
      expect(storageService.toggleBuildFavorite).toHaveBeenCalledWith('r1');
      expect(onUpdate).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByTitle('Liga Um'));
  });

  it('supports delete modal confirm/cancel and hides delete action for guests', async () => {
    const { rerender } = render(
      <BuildArchiveSection history={history as any} onUpdate={onUpdate} onViewRecipe={onViewRecipe} />,
    );

    fireEvent.click(screen.getAllByText('Delete')[0]);
    expect(screen.getByText('Delete Build?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete Build?')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Delete')[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' }).slice(-1)[0]);
    await waitFor(() => {
      expect(storageService.deleteBuild).toHaveBeenCalledWith('r1');
      expect(onUpdate).toHaveBeenCalled();
    });

    rerender(<BuildArchiveSection history={history as any} onUpdate={onUpdate} onViewRecipe={onViewRecipe} isGuest />);
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.getAllByText('View Build').length).toBeGreaterThan(0);
  });
});
