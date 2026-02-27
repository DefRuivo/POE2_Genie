import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CreateBuildPage from '@/app/builds/create/page';
import BuildDetailsPage from '@/app/builds/[id]/page';
import EditBuildPage from '@/app/builds/[id]/edit/page';
import { storageService } from '@/services/storageService';

const pushMock = jest.fn();
const backMock = jest.fn();
const refreshMock = jest.fn();

jest.mock('@/services/storageService', () => ({
  storageService: {
    saveBuild: jest.fn(),
    getBuildById: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    back: backMock,
    refresh: refreshMock,
  }),
  useParams: () => ({ id: 'build-1' }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/components/BuildCard', () => ({
  __esModule: true,
  default: ({ recipe }: { recipe: { recipe_title: string } }) => (
    <div data-testid="build-card">{recipe.recipe_title}</div>
  ),
}));

jest.mock('@/components/BuildForm', () => ({
  __esModule: true,
  default: ({
    title,
    onSubmit,
    initialData,
  }: {
    title: string;
    onSubmit: (payload: any) => Promise<void>;
    initialData?: any;
  }) => (
    <div>
      <div data-testid="build-form-title">{title}</div>
      {initialData ? <div data-testid="build-form-initial">{initialData.recipe_title}</div> : null}
      <button
        onClick={() => onSubmit({ build_title: 'Submitted Build', build_steps: ['step'] })}
        type="button"
      >
        trigger-submit
      </button>
    </div>
  ),
}));

describe('Build pages', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (storageService.saveBuild as jest.Mock).mockResolvedValue({ id: 'saved-1' });
    (storageService.getBuildById as jest.Mock).mockResolvedValue({
      id: 'build-1',
      recipe_title: 'Arc Build',
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as jest.Mock;
    window.alert = jest.fn();
  });

  it('creates a build and navigates to details page', async () => {
    render(<CreateBuildPage />);
    fireEvent.click(screen.getByRole('button', { name: 'trigger-submit' }));

    await waitFor(() => {
      expect(storageService.saveBuild).toHaveBeenCalledWith(
        expect.objectContaining({
          build_title: 'Submitted Build',
          isFavorite: false,
          dishImage: '',
        }),
      );
      expect(pushMock).toHaveBeenCalledWith('/builds/saved-1');
    });
  });

  it('shows alert when create fails', async () => {
    (storageService.saveBuild as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    render(<CreateBuildPage />);
    fireEvent.click(screen.getByRole('button', { name: 'trigger-submit' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('common.error');
    });
  });

  it('renders details page not-found state and allows going back', async () => {
    (storageService.getBuildById as jest.Mock).mockResolvedValueOnce(null);
    render(<BuildDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('recipeDetails.notFound')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'recipeDetails.goBack' }));
    expect(backMock).toHaveBeenCalled();
  });

  it('renders details page with build card and navigates to builds list', async () => {
    render(<BuildDetailsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('build-card')).toBeInTheDocument();
      expect(screen.getByText('Arc Build')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /recipeDetails.backToRecipes/i }));
    expect(pushMock).toHaveBeenCalledWith('/builds');
  });

  it('edit page shows loading, not-found, and submits update', async () => {
    const { unmount } = render(<EditBuildPage />);

    await waitFor(() => {
      expect(screen.queryByText('common.loading')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('build-form-initial')).toHaveTextContent('Arc Build');

    fireEvent.click(screen.getByRole('button', { name: 'trigger-submit' }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/builds/build-1', expect.objectContaining({ method: 'PUT' }));
      expect(pushMock).toHaveBeenCalledWith('/builds/build-1');
    });

    unmount();
    (storageService.getBuildById as jest.Mock).mockResolvedValueOnce(null);
    render(<EditBuildPage />);
    await waitFor(() => {
      expect(screen.getByText('recipeDetails.notFound')).toBeInTheDocument();
    });
  });

  it('shows alert when edit update fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    render(<EditBuildPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'trigger-submit' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'trigger-submit' }));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('settings.updateError');
    });
  });
});
