
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import KitchensPage from '@/app/hideouts/page';
import { storageService } from '@/services/storageService';
import { useTranslation } from '@/hooks/useTranslation';
import { refreshKitchenCode } from '@/app/actions';

// Mock dependencies
jest.mock('@/services/storageService', () => ({
    storageService: {
        getCurrentUser: jest.fn(),
        createHideout: jest.fn(),
        switchHideout: jest.fn(),
        deleteHideout: jest.fn(),
        updateHideout: jest.fn(),
        leaveHideout: jest.fn(),
        joinHideout: jest.fn(),
        createKitchen: jest.fn(),
        switchKitchen: jest.fn(),
        deleteKitchen: jest.fn(),
        updateKitchen: jest.fn(),
    }
}));

jest.mock('@/hooks/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    })
}));

jest.mock('@/components/Sidebar', () => {
    return function MockSidebar() {
        return <div data-testid="sidebar">Sidebar</div>;
    };
});

jest.mock('@/components/ShareButtons', () => {
    return {
        ShareButtons: () => <div data-testid="share-buttons">ShareButtons</div>
    };
});

jest.mock('@/components/ui/CodeInput', () => ({
    CodeInput: ({ onChange, disabled }: { onChange: (code: string) => void; disabled?: boolean }) => (
        <input
            data-testid="code-input"
            disabled={disabled}
            onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        />
    ),
}));

jest.mock('@/app/actions', () => ({
    refreshKitchenCode: jest.fn(),
}));

describe('KitchensPage', () => {
    const mockUser = {
        id: 'user1',
        currentKitchenId: 'kitchen1',
        kitchenMemberships: [
            {
                id: 'mem1',
                kitchenId: 'kitchen1',
                role: 'ADMIN',
                isGuest: false,
                kitchen: {
                    id: 'kitchen1',
                    name: 'Admin Kitchen',
                    inviteCode: 'ADMIN-CODE'
                }
            },
            {
                id: 'mem2',
                kitchenId: 'kitchen2',
                role: 'MEMBER',
                isGuest: true,
                kitchen: {
                    id: 'kitchen2',
                    name: 'Guest Kitchen',
                    inviteCode: 'GUEST-CODE'
                }
            }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (storageService.getCurrentUser as jest.Mock).mockResolvedValue({ user: mockUser });
        (storageService.createHideout as jest.Mock).mockResolvedValue({ id: 'kitchen3' });
        (storageService.switchHideout as jest.Mock).mockResolvedValue(undefined);
        (storageService.deleteHideout as jest.Mock).mockResolvedValue(undefined);
        (storageService.updateHideout as jest.Mock).mockResolvedValue(undefined);
        (storageService.leaveHideout as jest.Mock).mockResolvedValue(undefined);
        (storageService.joinHideout as jest.Mock).mockResolvedValue({ kitchenId: 'kitchen2' });
        window.alert = jest.fn();
        window.confirm = jest.fn(() => true);
    });

    it('renders kitchen list successfully', async () => {
        render(<KitchensPage />);

        await waitFor(() => {
            expect(screen.getByText('Admin Kitchen')).toBeInTheDocument();
            expect(screen.getByText('Guest Kitchen')).toBeInTheDocument();
        });
    });

    it('shows invite code for non-guest (Admin) kitchens', async () => {
        render(<KitchensPage />);

        await waitFor(() => {
            expect(screen.getByText('ADMIN-CODE')).toBeInTheDocument();
        });
    });

    it('DOES NOT show invite code for guest kitchens', async () => {
        render(<KitchensPage />);

        await waitFor(() => {
            // Should verify Guest Kitchen exists
            expect(screen.getByText('Guest Kitchen')).toBeInTheDocument();
            // But its code should NOT be there
            expect(screen.queryByText('GUEST-CODE')).not.toBeInTheDocument();
        });
    });

    it('allows creating a new kitchen', async () => {
        render(<KitchensPage />);

        // Wait for loading to finish
        await waitFor(() => expect(screen.queryByText('kitchens.loading')).not.toBeInTheDocument());

        const input = screen.getByPlaceholderText('kitchens.createPlaceholder');
        const button = screen.getByText('kitchens.create');

        fireEvent.change(input, { target: { value: 'New Kitchen' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(storageService.createHideout).toHaveBeenCalledWith('New Kitchen');
        });
    });

    it('shows warning about data loss when deleting', async () => {
        render(<KitchensPage />);

        await waitFor(() => screen.queryByText('kitchens.loading') === null);

        // Find delete button for Admin Kitchen
        const deleteButtons = await waitFor(() => screen.getAllByTitle('Delete Kitchen'));
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('kitchens.deleteConfirm')).toBeInTheDocument();
        });
    });

    it('switches context to another hideout', async () => {
        render(<KitchensPage />);
        await waitFor(() => expect(screen.getByText('Guest Kitchen')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'kitchens.switch' }));
        await waitFor(() => {
            expect(storageService.switchHideout).toHaveBeenCalledWith('kitchen2');
        });
    });

    it('edits hideout name and handles update failure', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        render(<KitchensPage />);
        await waitFor(() => expect(screen.getByText('Admin Kitchen')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Edit Kitchen'));
        const editInput = screen.getByDisplayValue('Admin Kitchen');
        fireEvent.change(editInput, { target: { value: 'Renamed Hideout' } });
        fireEvent.keyDown(editInput, { key: 'Enter' });
        await waitFor(() => {
            expect(storageService.updateHideout).toHaveBeenCalledWith('kitchen1', 'Renamed Hideout');
        });
        await waitFor(() => {
            expect(screen.getByTitle('Edit Kitchen')).toBeInTheDocument();
        });

        (storageService.updateHideout as jest.Mock).mockRejectedValueOnce(new Error('update failed'));
        fireEvent.click(screen.getByTitle('Edit Kitchen'));
        const failingInput = screen.getByDisplayValue('Admin Kitchen');
        fireEvent.change(failingInput, { target: { value: 'Broken Name' } });
        fireEvent.click(screen.getByRole('button', { name: /common.save/i }));
        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Failed to update hideout', expect.any(Error));
        });

        fireEvent.click(screen.getByRole('button', { name: /common.cancel/i }));
        expect(screen.queryByDisplayValue('Admin Kitchen')).not.toBeInTheDocument();
        errorSpy.mockRestore();
    });

    it('deletes hideout through confirmation modal and handles delete failure', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        render(<KitchensPage />);
        await waitFor(() => expect(screen.getByText('Admin Kitchen')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Delete Kitchen'));
        fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
        await waitFor(() => {
            expect(storageService.deleteHideout).toHaveBeenCalledWith('kitchen1');
        });

        (storageService.deleteHideout as jest.Mock).mockRejectedValueOnce(new Error('delete failed'));
        fireEvent.click(screen.getByTitle('Delete Kitchen'));
        fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Failed to delete hideout', expect.any(Error));
        });
        errorSpy.mockRestore();
    });

    it('joins hideout by code and handles join failures', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        render(<KitchensPage />);
        await waitFor(() => expect(screen.getByTestId('code-input')).toBeInTheDocument());

        fireEvent.change(screen.getByTestId('code-input'), { target: { value: 'ABC123' } });
        fireEvent.click(screen.getByRole('button', { name: 'actions.joinCode' }));
        await waitFor(() => {
            expect(storageService.joinHideout).toHaveBeenCalledWith('ABC123');
            expect(storageService.switchHideout).toHaveBeenCalledWith('kitchen2');
        });

        (storageService.joinHideout as jest.Mock).mockResolvedValueOnce({});
        fireEvent.change(screen.getByTestId('code-input'), { target: { value: 'ZZZ999' } });
        fireEvent.click(screen.getByRole('button', { name: 'actions.joinCode' }));
        await waitFor(() => {
            expect(screen.getByText('common.error')).toBeInTheDocument();
        });

        (storageService.joinHideout as jest.Mock).mockRejectedValueOnce(new Error('actions.failedJoin'));
        fireEvent.change(screen.getByTestId('code-input'), { target: { value: 'YYY888' } });
        fireEvent.click(screen.getByRole('button', { name: 'actions.joinCode' }));
        await waitFor(() => {
            expect(screen.getByText('common.error')).toBeInTheDocument();
        });
        errorSpy.mockRestore();
    });

    it('leaves non-admin hideout and handles leave failure', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        (storageService.getCurrentUser as jest.Mock).mockResolvedValue({
            user: {
                ...mockUser,
                currentKitchenId: 'kitchen1',
                kitchenMemberships: [
                    ...mockUser.kitchenMemberships,
                    {
                        id: 'mem3',
                        kitchenId: 'kitchen3',
                        role: 'MEMBER',
                        isGuest: false,
                        kitchen: { id: 'kitchen3', name: 'Party Hideout', inviteCode: 'PARTY1' },
                    },
                ],
            },
        });

        render(<KitchensPage />);
        await waitFor(() => expect(screen.getByText('Party Hideout')).toBeInTheDocument());

        fireEvent.click(screen.getAllByTitle('kitchens.leave')[0]);
        fireEvent.click(screen.getAllByRole('button', { name: 'kitchens.leave' })[0]);
        await waitFor(() => {
            expect(storageService.leaveHideout).toHaveBeenCalled();
        });

        (storageService.leaveHideout as jest.Mock).mockRejectedValueOnce(new Error('leave failed'));
        fireEvent.click(screen.getAllByTitle('kitchens.leave')[0]);
        fireEvent.click(screen.getAllByRole('button', { name: 'kitchens.leave' })[0]);
        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Failed to leave hideout', expect.any(Error));
        });
        errorSpy.mockRestore();
    });

    it('handles load/create/switch failures and join guard branches', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        (storageService.getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('load failed'));
        const firstRender = render(<KitchensPage />);
        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Failed to load user', expect.any(Error));
        });
        firstRender.unmount();

        (storageService.getCurrentUser as jest.Mock).mockResolvedValue({ user: mockUser });
        (storageService.createHideout as jest.Mock).mockRejectedValueOnce(new Error('create failed'));
        const second = render(<KitchensPage />);
        await waitFor(() => expect(screen.getByPlaceholderText('kitchens.createPlaceholder')).toBeInTheDocument());
        fireEvent.change(screen.getByPlaceholderText('kitchens.createPlaceholder'), { target: { value: 'Broken' } });
        fireEvent.click(screen.getByText('kitchens.create'));
        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Failed to create hideout', expect.any(Error));
        });

        (storageService.switchHideout as jest.Mock).mockRejectedValueOnce(new Error('switch failed'));
        fireEvent.click(screen.getByRole('button', { name: 'kitchens.switch' }));
        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Failed to switch hideout', expect.any(Error));
        });

        fireEvent.change(screen.getByTestId('code-input'), { target: { value: 'A1' } });
        fireEvent.click(screen.getByRole('button', { name: 'actions.joinCode' }));
        expect(storageService.joinHideout).not.toHaveBeenCalledWith('A1');
        second.unmount();
        errorSpy.mockRestore();
    });

    it('supports modal cancel actions and leave flow with no remaining memberships', async () => {
        (storageService.getCurrentUser as jest.Mock).mockResolvedValue({ user: mockUser });

        const firstRender = render(<KitchensPage />);
        await waitFor(() => expect(screen.getByText('Admin Kitchen')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Delete Kitchen'));
        fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
        expect(screen.queryByText('kitchens.deleteConfirm')).not.toBeInTheDocument();

        fireEvent.click(screen.getByTitle('kitchens.leave'));
        fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
        expect(screen.queryByText('kitchens.leaveConfirm')).not.toBeInTheDocument();

        firstRender.unmount();
        (storageService.getCurrentUser as jest.Mock).mockResolvedValue({
            user: {
                id: 'user2',
                currentKitchenId: 'kitchen2',
                kitchenMemberships: [
                    {
                        id: 'mem-only',
                        kitchenId: 'kitchen2',
                        role: 'MEMBER',
                        isGuest: false,
                        kitchen: { id: 'kitchen2', name: 'Solo Hideout', inviteCode: 'SOLO12' },
                    },
                ],
            },
        });

        render(<KitchensPage />);
        await waitFor(() => expect(screen.getByText('Solo Hideout')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('kitchens.leave'));
        fireEvent.click(screen.getByText('kitchens.leave'));
        await waitFor(() => {
            expect(storageService.leaveHideout).toHaveBeenCalled();
        });
    });

    it('copies invite code and handles regenerate code confirmation branches', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: jest.fn().mockResolvedValue(undefined) },
            configurable: true,
        });
        (refreshKitchenCode as jest.Mock)
            .mockResolvedValueOnce({ success: true })
            .mockResolvedValueOnce({ success: false, error: 'regen failed' });

        render(<KitchensPage />);
        await waitFor(() => expect(screen.getByText('ADMIN-CODE')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('members.clickToCopy'));
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ADMIN-CODE');

        (window.confirm as jest.Mock).mockReturnValueOnce(false);
        fireEvent.click(screen.getByTitle('kitchens.regenerateConfirm'));
        expect(refreshKitchenCode).not.toHaveBeenCalled();

        (window.confirm as jest.Mock).mockReturnValueOnce(true);
        fireEvent.click(screen.getByTitle('kitchens.regenerateConfirm'));
        await waitFor(() => {
            expect(refreshKitchenCode).toHaveBeenCalledWith('kitchen1');
        });

        (window.confirm as jest.Mock).mockReturnValueOnce(true);
        fireEvent.click(screen.getByTitle('kitchens.regenerateConfirm'));
        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('regen failed');
        });

        errorSpy.mockRestore();
    });

    it('leave flow with only member roles keeps first remaining hideout (sort return 0 branch)', async () => {
        (storageService.getCurrentUser as jest.Mock).mockResolvedValue({
            user: {
                id: 'u-member',
                currentKitchenId: 'kitchen2',
                kitchenMemberships: [
                    {
                        id: 'mem2',
                        kitchenId: 'kitchen2',
                        role: 'MEMBER',
                        isGuest: false,
                        kitchen: { id: 'kitchen2', name: 'Current', inviteCode: 'CURR01' },
                    },
                    {
                        id: 'mem3',
                        kitchenId: 'kitchen3',
                        role: 'MEMBER',
                        isGuest: false,
                        kitchen: { id: 'kitchen3', name: 'Alt A', inviteCode: 'ALTA01' },
                    },
                    {
                        id: 'mem4',
                        kitchenId: 'kitchen4',
                        role: 'MEMBER',
                        isGuest: false,
                        kitchen: { id: 'kitchen4', name: 'Alt B', inviteCode: 'ALTB01' },
                    },
                ],
            },
        });

        render(<KitchensPage />);
        await waitFor(() => expect(screen.getByText('Current')).toBeInTheDocument());

        fireEvent.click(screen.getAllByTitle('kitchens.leave')[0]);
        fireEvent.click(screen.getByText('kitchens.leave'));

        await waitFor(() => {
            expect(storageService.leaveHideout).toHaveBeenCalledWith('mem2');
            expect(storageService.switchHideout).toHaveBeenCalledWith('kitchen3');
        });
    });

    it('covers empty create guard, edit escape key, copy timeout and dialog close', async () => {
        jest.useFakeTimers();
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: jest.fn().mockResolvedValue(undefined) },
            configurable: true,
        });
        (storageService.joinHideout as jest.Mock).mockRejectedValueOnce(new Error('actions.failedJoin'));

        render(<KitchensPage />);
        await waitFor(() => expect(screen.getByText('Admin Kitchen')).toBeInTheDocument());

        const createInput = screen.getByPlaceholderText('kitchens.createPlaceholder');
        fireEvent.change(createInput, { target: { value: '   ' } });
        fireEvent.submit(createInput.closest('form') as HTMLFormElement);
        expect(storageService.createHideout).not.toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('Edit Kitchen'));
        const editInput = screen.getByDisplayValue('Admin Kitchen');
        fireEvent.keyDown(editInput, { key: 'Escape' });
        expect(screen.queryByDisplayValue('Admin Kitchen')).not.toBeInTheDocument();

        fireEvent.click(screen.getByTitle('members.clickToCopy'));
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ADMIN-CODE');
        expect(document.querySelector('.fa-check')).toBeInTheDocument();
        act(() => {
            jest.advanceTimersByTime(2000);
        });
        expect(document.querySelector('.fa-copy')).toBeInTheDocument();

        fireEvent.change(screen.getByTestId('code-input'), { target: { value: 'ABC123' } });
        fireEvent.click(screen.getByRole('button', { name: 'actions.joinCode' }));
        await waitFor(() => {
            expect(screen.getByText('common.error')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole('button', { name: /common.ok|OK/i }));
        expect(screen.queryByText('common.error')).not.toBeInTheDocument();
        jest.useRealTimers();
    });
});
