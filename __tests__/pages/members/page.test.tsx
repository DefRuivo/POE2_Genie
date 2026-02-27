

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import MembersPage from '@/app/party/page';
import { storageService } from '@/services/storageService';
import { KitchenMember, Kitchen } from '@/types';

// Mock storageService
jest.mock('@/services/storageService');
const mockedStorageService = storageService as jest.Mocked<typeof storageService>;

// Mock UI components that might cause issues in JSDOM
jest.mock('@/components/Sidebar', () => function MockSidebar() { return <div data-testid="sidebar">Sidebar</div>; });
// TagInput can be real as it just renders inputs and chips
// ConfirmDialog just renders a modal
// CodeInput is not used here (it's in Home) but used in page.tsx imports? No, MembersPage doesn't use CodeInput.

const mockKitchen: Kitchen = {
    id: 'k1',
    name: 'Test Kitchen',
    inviteCode: 'INV123',
    createdAt: new Date()
};

const mockAdminUser = {
    user: { id: 'u1', name: 'Admin User', email: 'admin@test.com' }
};

const mockGuestUser = {
    user: { id: 'u2', name: 'Guest User', email: 'guest@test.com' }
};

const mockMembers: KitchenMember[] = [
    {
        id: 'm1',
        userId: 'u1',
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'ADMIN',
        isGuest: false,
        kitchenId: 'k1',
        likes: [],
        dislikes: [],
        restrictions: []
    },
    {
        id: 'm2',
        userId: 'u2',
        name: 'Guest User',
        email: 'guest@test.com',
        role: 'MEMBER', // Role MEMBER but isGuest true
        isGuest: true,
        kitchenId: 'k1',
        likes: [],
        dislikes: [],
        restrictions: []
    },
    {
        id: 'm3',
        userId: 'u3',
        name: 'Other Member',
        email: 'other@test.com',
        role: 'MEMBER',
        isGuest: false,
        kitchenId: 'k1',
        likes: [],
        dislikes: [],
        restrictions: []
    }
];

describe('MembersPage Guest Restrictions', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockedStorageService.getPartyMembers.mockResolvedValue(mockMembers);
        mockedStorageService.getCurrentKitchen.mockResolvedValue(mockKitchen as any);
        mockedStorageService.getCurrentHideout.mockResolvedValue(mockKitchen as any);
        mockedStorageService.savePartyMember.mockResolvedValue(undefined as any);
        mockedStorageService.deletePartyMember.mockResolvedValue(undefined as any);
        mockedStorageService.leaveHideout.mockResolvedValue(undefined as any);
        mockedStorageService.switchHideout.mockResolvedValue(undefined as any);
        // Mock prompt to avoid errors
        window.alert = jest.fn();
        window.scrollTo = jest.fn();
    });

    it('renders correctly for ADMIN user (Full Access)', async () => {
        mockedStorageService.getCurrentUser.mockResolvedValue(mockAdminUser as any);

        render(<MembersPage />);

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.getByText('Invite Code')).toBeInTheDocument();
        });

        // 1. Invite Code should be visible
        expect(screen.getByText('Invite Code')).toBeInTheDocument();
        expect(screen.getByText('INV123')).toBeInTheDocument();

        // 2. Add Member Form should be visible
        expect(screen.getAllByText('Add Mercenary / Party Member').length).toBeGreaterThan(0);

        // 3. Delete buttons should be visible for other members
        // const deleteButtons = screen.getAllByTitle('Remove');
        // expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('restricts UI for GUEST user', async () => {
        mockedStorageService.getCurrentUser.mockResolvedValue(mockGuestUser as any);

        render(<MembersPage />);

        await waitFor(() => {
            expect(screen.getByText('You are viewing this hideout as a Mercenary.')).toBeInTheDocument();
        });

        // 1. Invite Code should NOT be visible
        expect(screen.queryByText('Invite Code')).not.toBeInTheDocument();
        expect(screen.queryByText('INV123')).not.toBeInTheDocument();

        // 2. Add Member Form should NOT be visible (Guest View Message instead)
        expect(screen.queryByText('Add Mercenary / Party Member')).not.toBeInTheDocument();
        expect(screen.getByText('You are viewing this hideout as a Mercenary.')).toBeInTheDocument();

        // 3. Delete buttons should NOT be visible for anyone
        const deleteButtons = screen.queryAllByTitle('Remove member');
        expect(deleteButtons.length).toBe(0);
    });

    it('allows GUEST to edit THEMSELVES', async () => {
        mockedStorageService.getCurrentUser.mockResolvedValue(mockGuestUser as any);

        render(<MembersPage />);

        await waitFor(() => {
            expect(screen.getByText('Guest User')).toBeInTheDocument();
        });

        // Click on self (Guest User) - Use generic card class selector
        // The card has 'bg-white p-4 rounded-3xl' classes
        const guestCard = screen.getByText('Guest User').closest('.bg-white.p-4.rounded-3xl');
        fireEvent.click(guestCard!);

        // Form should appear now for editing self
        expect(screen.getByText('Edit Party Member')).toBeInTheDocument();
        // Since input values are controlled, getByDisplayValue is good
        expect(screen.getByDisplayValue('Guest User')).toBeInTheDocument();

        // Check Name input allows typing
        const nameInput = screen.getByPlaceholderText('e.g. Grandma, Mike');
        fireEvent.change(nameInput, { target: { value: 'Guest Updated' } });
        expect(nameInput).toHaveValue('Guest Updated');
    });

    it('PREVENTS GUEST from editing OTHERS', async () => {
        mockedStorageService.getCurrentUser.mockResolvedValue(mockGuestUser as any);

        render(<MembersPage />);

        await waitFor(() => {
            expect(screen.getByText('Admin User')).toBeInTheDocument();
        });

        // Spy on alert
        const alertSpy = jest.spyOn(window, 'alert');

        // Click on Admin User (Another member) - Should be disabled now
        const adminCard = screen.getByText('Admin User').closest('.bg-white.p-4.rounded-3xl');
        // We can verify it has cursor-not-allowed class
        expect(adminCard).toHaveClass('cursor-not-allowed');

        fireEvent.click(adminCard!);

        // Expect NO alert (click disabled)
        expect(alertSpy).not.toHaveBeenCalled();

        // Expect Form NOT to show/update to Admin User
        expect(screen.getByText('You are viewing this hideout as a Mercenary.')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('Admin User')).not.toBeInTheDocument();
    });

    it('creates and edits a party member, then deletes a guest member', async () => {
        mockedStorageService.getCurrentUser.mockResolvedValue(mockAdminUser as any);
        render(<MembersPage />);

        await waitFor(() => expect(screen.getByText('Invite Code')).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('e.g. Grandma, Mike'), { target: { value: 'New Recruit' } });
        fireEvent.change(screen.getByPlaceholderText('invite@example.com'), { target: { value: 'recruit@test.com' } });
        fireEvent.submit(screen.getByPlaceholderText('e.g. Grandma, Mike').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(mockedStorageService.savePartyMember).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'New Recruit',
                    email: 'recruit@test.com',
                    isGuest: true,
                }),
            );
        });

        const otherCard = screen.getByText('Other Member').closest('.bg-white.p-4.rounded-3xl');
        fireEvent.click(otherCard!);
        fireEvent.change(screen.getByPlaceholderText('e.g. Grandma, Mike'), { target: { value: 'Other Updated' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => {
            expect(mockedStorageService.savePartyMember).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'm3',
                    name: 'Other Updated',
                }),
            );
        });

        fireEvent.click(screen.getByTitle('members.remove'));
        fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));
        await waitFor(() => {
            expect(mockedStorageService.deletePartyMember).toHaveBeenCalledWith('m2');
        });
    });

    it('copies invite code and shares via WhatsApp and Telegram', async () => {
        const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: jest.fn().mockResolvedValue(undefined) },
            configurable: true,
        });
        mockedStorageService.getCurrentUser.mockResolvedValue(mockAdminUser as any);
        render(<MembersPage />);

        await waitFor(() => expect(screen.getByText('INV123')).toBeInTheDocument());

        fireEvent.click(screen.getByText('INV123'));
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('INV123');

        fireEvent.click(screen.getByRole('button', { name: /WhatsApp/i }));
        fireEvent.click(screen.getByRole('button', { name: /Telegram/i }));

        expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('wa.me'), '_blank');
        expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('t.me/share/url'), '_blank');
        openSpy.mockRestore();
    });

    it('leaves hideout and switches to next membership when available', async () => {
        mockedStorageService.getCurrentUser
            .mockResolvedValueOnce(mockGuestUser as any)
            .mockResolvedValueOnce({
                user: {
                    id: 'u2',
                    kitchenMemberships: [{ id: 'leftover-1', kitchenId: 'k2', role: 'ADMIN' }],
                },
            } as any);

        render(<MembersPage />);
        await waitFor(() => expect(screen.getByText('Guest User')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('kitchens.leave'));
        fireEvent.click(screen.getAllByRole('button', { name: 'kitchens.leave' }).slice(-1)[0]);

        await waitFor(() => {
            expect(mockedStorageService.leaveHideout).toHaveBeenCalledWith('m2');
            expect(mockedStorageService.switchHideout).toHaveBeenCalledWith('k2');
        });
    });

    it('shows alert when save or leave actions fail', async () => {
        mockedStorageService.getCurrentUser.mockResolvedValue(mockAdminUser as any);
        mockedStorageService.savePartyMember.mockRejectedValueOnce(new Error('Save failed'));
        const firstRender = render(<MembersPage />);
        await waitFor(() => expect(screen.getByPlaceholderText('e.g. Grandma, Mike')).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('e.g. Grandma, Mike'), { target: { value: 'Broken Save' } });
        fireEvent.submit(screen.getByPlaceholderText('e.g. Grandma, Mike').closest('form') as HTMLFormElement);
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Save failed');
        });

        firstRender.unmount();
        mockedStorageService.getCurrentUser.mockReset();
        mockedStorageService.getCurrentUser.mockResolvedValue(mockGuestUser as any);
        mockedStorageService.leaveHideout.mockRejectedValueOnce(new Error('Leave failed'));
        render(<MembersPage />);
        await waitFor(() => expect(screen.getByText('Guest User')).toBeInTheDocument());
        fireEvent.click(screen.getByTitle('kitchens.leave'));
        fireEvent.click(screen.getAllByRole('button', { name: 'kitchens.leave' }).slice(-1)[0]);
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('common.error');
        });
    });

    it('handles member load failure and exits loading state', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockedStorageService.getPartyMembers.mockRejectedValueOnce(new Error('load failed'));
        mockedStorageService.getCurrentUser.mockResolvedValueOnce(mockAdminUser as any);

        render(<MembersPage />);

        await waitFor(() => {
            expect(screen.getByText('You are viewing this hideout as a Mercenary.')).toBeInTheDocument();
        });
        expect(errorSpy).toHaveBeenCalledWith('Failed to load members', expect.any(Error));
        errorSpy.mockRestore();
    });

    it('supports cancel edit and shows admin guest toggle guard + preference tags', async () => {
        mockedStorageService.getCurrentUser.mockResolvedValue(mockAdminUser as any);
        mockedStorageService.getPartyMembers.mockResolvedValueOnce([
            {
                ...mockMembers[0],
                likes: ['Spark'],
                dislikes: ['Melee'],
                restrictions: ['No Minions'],
            },
            mockMembers[1],
        ] as any);

        render(<MembersPage />);
        await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Admin User').closest('.bg-white.p-4.rounded-3xl')!);

        const guestCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(guestCheckbox.disabled).toBe(true);
        expect(screen.getByText('members.adminCannotBeGuest')).toBeInTheDocument();
        expect(screen.getAllByText('Spark').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Melee').length).toBeGreaterThan(0);
        expect(screen.getAllByText('No Minions').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(screen.queryByText('Edit Party Member')).not.toBeInTheDocument();
    });

    it('toggles guest checkbox when editing non-admin member', async () => {
        mockedStorageService.getCurrentUser.mockResolvedValue(mockAdminUser as any);
        render(<MembersPage />);
        await waitFor(() => expect(screen.getByText('Other Member')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Other Member').closest('.bg-white.p-4.rounded-3xl')!);
        const guestCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(guestCheckbox.checked).toBe(false);
        fireEvent.click(guestCheckbox);
        expect(guestCheckbox.checked).toBe(true);

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => {
            expect(mockedStorageService.savePartyMember).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'm3',
                    isGuest: true,
                }),
            );
        });
    });

    it('logs delete failure and closes confirmation dialog', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockedStorageService.getCurrentUser.mockResolvedValue(mockAdminUser as any);
        mockedStorageService.deletePartyMember.mockRejectedValueOnce(new Error('delete failed'));

        render(<MembersPage />);
        await waitFor(() => expect(screen.getByText('Invite Code')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('members.remove'));
        fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));

        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Failed to delete member', expect.any(Error));
        });
        expect(screen.queryByRole('button', { name: 'common.confirm' })).not.toBeInTheDocument();
        errorSpy.mockRestore();
    });

    it('handles leave modal cancel and no-remaining-membership flow', async () => {
        mockedStorageService.getCurrentUser
            .mockResolvedValueOnce(mockGuestUser as any)
            .mockResolvedValueOnce({
                user: {
                    id: 'u2',
                    kitchenMemberships: [{ id: 'm2', kitchenId: 'k1', role: 'MEMBER' }],
                },
            } as any);

        render(<MembersPage />);
        await waitFor(() => expect(screen.getByText('Guest User')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('kitchens.leave'));
        fireEvent.click(screen.getAllByRole('button', { name: /Cancel/i }).slice(-1)[0]);
        expect(screen.queryAllByRole('button', { name: 'kitchens.leave' }).length).toBe(1);

        fireEvent.click(screen.getByTitle('kitchens.leave'));
        fireEvent.click(screen.getAllByRole('button', { name: 'kitchens.leave' }).slice(-1)[0]);

        await waitFor(() => {
            expect(mockedStorageService.leaveHideout).toHaveBeenCalledWith('m2');
        });
    });

    it('selects admin membership first when leaving and multiple memberships remain', async () => {
        mockedStorageService.getCurrentUser
            .mockResolvedValueOnce(mockGuestUser as any)
            .mockResolvedValueOnce({
                user: {
                    id: 'u2',
                    kitchenMemberships: [
                        { id: 'm2', kitchenId: 'k1', role: 'MEMBER' },
                        { id: 'm3', kitchenId: 'k3', role: 'MEMBER' },
                        { id: 'm4', kitchenId: 'k4', role: 'ADMIN' },
                    ],
                },
            } as any);

        render(<MembersPage />);
        await waitFor(() => expect(screen.getByText('Guest User')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('kitchens.leave'));
        fireEvent.click(screen.getAllByRole('button', { name: 'kitchens.leave' }).slice(-1)[0]);

        await waitFor(() => {
            expect(mockedStorageService.switchHideout).toHaveBeenCalledWith('k4');
        });
    });

    it('ignores submit when member name is blank', async () => {
        mockedStorageService.getCurrentUser.mockResolvedValue(mockAdminUser as any);
        render(<MembersPage />);
        await waitFor(() => expect(screen.getByText('Invite Code')).toBeInTheDocument());

        const nameInput = screen.getByPlaceholderText('e.g. Grandma, Mike');
        fireEvent.change(nameInput, { target: { value: '   ' } });
        fireEvent.submit(nameInput.closest('form') as HTMLFormElement);

        expect(mockedStorageService.savePartyMember).not.toHaveBeenCalled();
    });

    it('handles invite code copied state timeout callback', async () => {
        jest.useFakeTimers();
        mockedStorageService.getCurrentUser.mockResolvedValue(mockAdminUser as any);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: jest.fn().mockResolvedValue(undefined) },
            configurable: true,
        });

        render(<MembersPage />);
        await waitFor(() => expect(screen.getByText('INV123')).toBeInTheDocument());

        fireEvent.click(screen.getByText('INV123'));
        expect(screen.getByText('INV123').parentElement?.querySelector('.fa-check')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(2000);
        });
        expect(screen.getByText('INV123').parentElement?.querySelector('.fa-copy')).toBeInTheDocument();
        jest.useRealTimers();
    });

    it('keeps first remaining membership when all remaining roles are non-admin', async () => {
        mockedStorageService.getCurrentUser
            .mockResolvedValueOnce(mockGuestUser as any)
            .mockResolvedValueOnce({
                user: {
                    id: 'u2',
                    kitchenMemberships: [
                        { id: 'm2', kitchenId: 'k1', role: 'MEMBER' },
                        { id: 'm3', kitchenId: 'k3', role: 'MEMBER' },
                        { id: 'm5', kitchenId: 'k5', role: 'GUEST' },
                    ],
                },
            } as any);

        render(<MembersPage />);
        await waitFor(() => expect(screen.getByText('Guest User')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('kitchens.leave'));
        fireEvent.click(screen.getAllByRole('button', { name: 'kitchens.leave' }).slice(-1)[0]);

        await waitFor(() => {
            expect(mockedStorageService.switchHideout).toHaveBeenCalledWith('k3');
        });
    });
});
