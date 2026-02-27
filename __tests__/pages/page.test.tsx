
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from '../../app/page';
import { storageService } from '../../services/storageService';

jest.mock('next/link', () => {
    const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
        return <a href={href}>{children}</a>;
    };
    MockLink.displayName = 'MockLink';
    return MockLink;
});

jest.mock('../../components/ui/CodeInput', () => ({
    CodeInput: ({ onChange, disabled }: { onChange: (v: string) => void; disabled?: boolean }) => (
        <input
            data-testid="code-input"
            disabled={disabled}
            onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        />
    ),
}));

// Mock Providers
jest.mock('../../components/Providers', () => ({
    useApp: () => ({
        members: [{ id: '1' }],
        pantry: [{ id: 'p1', inStock: true }, { id: 'p2', inStock: false }],
        language: 'en'
    })
}));

jest.mock('../../services/storageService', () => ({
    storageService: {
        getAllBuilds: jest.fn(),
        getCurrentHideout: jest.fn(),
        getCurrentKitchen: jest.fn(),
        getBuildItems: jest.fn(),
        getCurrentUser: jest.fn().mockResolvedValue({ user: { id: 'u1' } }),
        getKitchenMembers: jest.fn().mockResolvedValue([{ userId: 'u1', isGuest: false }]),
        switchHideout: jest.fn(),
        joinHideout: jest.fn(),
        switchKitchen: jest.fn(),
        joinKitchen: jest.fn()
    }
}));

jest.mock('../../hooks/useCurrentMember', () => ({
    useCurrentMember: () => ({
        isGuest: false,
        loading: false,
    }),
}));

describe('HomePage', () => {
    const mockRecipes = [
        { id: '1', recipe_title: 'Recent Recipe', createdAt: Date.now(), meal_type: 'dinner' }
    ];
    const mockShopping = [
        { id: 's1', name: 'Item 1', checked: false },
        { id: 's2', name: 'Item 2', checked: true }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (storageService.getAllBuilds as jest.Mock).mockResolvedValue(mockRecipes);
        (storageService.getCurrentHideout as jest.Mock).mockResolvedValue({ id: 'k1', name: 'Test Kitchen' });
        (storageService.getBuildItems as jest.Mock).mockResolvedValue(mockShopping);
    });

    it('renders dashboard stats correctly', async () => {
        render(<Home />);

        expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();

        await waitFor(() => {
            // Member count '1'
            // Shopping count '1'
            // We expect at least one '1' for members and one '1' for shopping.
            // Using a more specific query if possible, but getAllByText('1') is what we had.
            const ones = screen.queryAllByText('1');
            expect(ones.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('fetches and displays recent history', async () => {
        render(<Home />);

        await waitFor(() => {
            // Be specific to avoid matching "Recent Recipe"
            expect(screen.getByText('Recent Builds')).toBeInTheDocument();
            expect(screen.getByText('Recent Recipe')).toBeInTheDocument();
        });
    });

    it('logs error on fetch failure', async () => {
        const error = new Error('Network Error');
        (storageService.getAllBuilds as jest.Mock).mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<Home />);
        await waitFor(() => expect(storageService.getAllBuilds).toHaveBeenCalled());

        expect(consoleSpy).toHaveBeenCalledWith("Failed to load data", error);
        consoleSpy.mockRestore();
    });

    it('joins hideout successfully with valid code', async () => {
        (storageService.joinHideout as jest.Mock).mockResolvedValueOnce({ kitchenId: 'k99' });
        (storageService.switchHideout as jest.Mock).mockResolvedValueOnce(undefined);

        render(<Home />);
        await waitFor(() => expect(screen.getByTestId('code-input')).toBeInTheDocument());

        fireEvent.change(screen.getByTestId('code-input'), { target: { value: 'ABC123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Join Hideout' }));

        await waitFor(() => {
            expect(storageService.joinHideout).toHaveBeenCalledWith('ABC123');
            expect(storageService.switchHideout).toHaveBeenCalledWith('k99');
        });
    });

    it('shows dialog when join fails or response has no kitchenId', async () => {
        render(<Home />);
        await waitFor(() => expect(screen.getByTestId('code-input')).toBeInTheDocument());
        fireEvent.change(screen.getByTestId('code-input'), { target: { value: 'ABC123' } });

        (storageService.joinHideout as jest.Mock).mockResolvedValueOnce({});
        fireEvent.click(screen.getByRole('button', { name: 'Join Hideout' }));
        await waitFor(() => {
            expect(screen.getByText('common.error')).toBeInTheDocument();
        });

        (storageService.joinHideout as jest.Mock).mockRejectedValueOnce(new Error('actions.failedJoin'));
        fireEvent.click(screen.getByRole('button', { name: 'Join Hideout' }));
        await waitFor(() => {
            expect(screen.getByText('Failed to join hideout. Please check the code.')).toBeInTheDocument();
        });
    });

    it('does not render recent section when history is empty', async () => {
        (storageService.getAllBuilds as jest.Mock).mockResolvedValueOnce([]);
        render(<Home />);

        await waitFor(() => {
            expect(screen.queryByText('Recent Builds')).not.toBeInTheDocument();
        });
    });
});
