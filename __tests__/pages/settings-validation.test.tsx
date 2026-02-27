
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from '../../app/settings/page';

// Mocks
const mockSetLanguage = jest.fn();
let mockGlobalLanguage = 'en';
jest.mock('@/components/Providers', () => ({
    useApp: () => ({
        language: mockGlobalLanguage,
        setLanguage: mockSetLanguage,
    }),
}));

jest.mock('@/hooks/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'auth.passwordMismatch') return 'Passwords do not match';
            if (key === 'auth.passwordTooShort') return 'Password too short';
            return key;
        },
    }),
}));

const mockUpdateProfile = jest.fn();
const mockGetCurrentUser = jest.fn().mockResolvedValue({
    user: {
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        language: 'en',
        measurementSystem: 'METRIC'
    }
});

jest.mock('../../services/storageService', () => ({
    storageService: {
        getCurrentUser: () => mockGetCurrentUser(),
        updateProfile: (data: any) => mockUpdateProfile(data),
    }
}));

describe('SettingsPage Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGlobalLanguage = 'en';
        mockGetCurrentUser.mockResolvedValue({
            user: {
                name: 'John',
                surname: 'Doe',
                email: 'john@example.com',
                language: 'en',
                measurementSystem: 'METRIC'
            }
        });
    });

    it('shows error when passwords do not match', async () => {
        render(<SettingsPage />);

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('settings.title')).toBeInTheDocument();
        });

        // Find password inputs
        // "New Password" label -> input
        // "Confirm Password" label -> input
        const confirmInputs = screen.getAllByPlaceholderText('••••••••');
        // PasswordFields renders 2 inputs with placeholder '••••••••'.
        // SettingsPage also renders 1 PasswordInput with placeholder '••••••••' before it.
        // So we should have 3 inputs with '••••••••'.
        // Index 0: Current
        // Index 1: New
        // Index 2: Confirm

        const inputs = screen.getAllByPlaceholderText('••••••••');
        expect(inputs).toHaveLength(3);

        const currentInput = inputs[0];
        const newPasswordInput = inputs[1];
        const confirmInput = inputs[2];

        // Fill current password
        fireEvent.change(currentInput, { target: { value: 'oldpassword' } });

        // Set mismatch
        fireEvent.change(newPasswordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmInput, { target: { value: 'passwordXYZ' } });

        // Wait for real-time validation error to appear
        await waitFor(() => {
            expect(screen.getAllByText('Passwords do not match')[0]).toBeInTheDocument();
        });

        const saveButton = screen.getByText('common.save');
        fireEvent.click(saveButton);


        // Ensure API was NOT called
        expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('shows error when password is too short', async () => {
        render(<SettingsPage />);
        await waitFor(() => expect(screen.queryByText('settings.title')).toBeInTheDocument());

        const inputs = screen.getAllByPlaceholderText('••••••••');
        const currentInput = inputs[0];
        const newPasswordInput = inputs[1];

        fireEvent.change(currentInput, { target: { value: 'oldpass' } });
        fireEvent.change(newPasswordInput, { target: { value: '123' } });

        // Component validates in real-time now
        await waitFor(() => {
            expect(screen.getByText('Password too short')).toBeInTheDocument();
        });

        // Check if button is disabled
        const saveButton = screen.getByText('common.save');
        expect(saveButton).toBeDisabled();
    });

    it('disables save button if current password is missing', async () => {
        render(<SettingsPage />);
        // Wait for loading to complete
        await waitFor(() => expect(screen.queryByText('settings.title')).toBeInTheDocument());

        const inputs = screen.getAllByPlaceholderText('••••••••');
        const newPasswordInput = inputs[1];
        const confirmInput = inputs[2];

        // Set valid new password
        fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
        fireEvent.change(confirmInput, { target: { value: 'newpassword123' } });

        // Current password empty (default)
        const saveButton = screen.getByText('common.save');
        expect(saveButton).toBeDisabled();

        // Fill current
        fireEvent.change(inputs[0], { target: { value: 'currentpass' } });
        expect(saveButton).not.toBeDisabled();
    });
    it('shows translated error when current password is wrong', async () => {
        // Mock update failure
        mockUpdateProfile.mockRejectedValueOnce(new Error('Invalid current password'));

        render(<SettingsPage />);
        await waitFor(() => expect(screen.queryByText('settings.title')).toBeInTheDocument());

        const inputs = screen.getAllByPlaceholderText('••••••••');
        const currentInput = inputs[0];
        const newPasswordInput = inputs[1];
        const confirmInput = inputs[2];

        fireEvent.change(currentInput, { target: { value: 'wrongpass' } });
        fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
        fireEvent.change(confirmInput, { target: { value: 'newpass123' } });

        const saveButton = screen.getByText('common.save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            // We expect the translated key because our mock returns the key if not handled
            // But wait, our mock implementation above returns 'Passwords do not match' etc.
            // Let's rely on the fact that if it's not matched it returns the key.
            expect(screen.getByText('settings.invalidCurrentPassword')).toBeInTheDocument();
        });
    });

    it('saves profile successfully without password change and shows success message', async () => {
        mockUpdateProfile.mockResolvedValueOnce({ ok: true });
        render(<SettingsPage />);
        await waitFor(() => expect(screen.queryByText('settings.title')).toBeInTheDocument());

        fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Jane' } });
        fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Smith' } });
        const inputs = screen.getAllByPlaceholderText('••••••••');
        fireEvent.change(inputs[0], { target: { value: 'oldpassword' } });
        fireEvent.change(inputs[1], { target: { value: 'newpassword123' } });
        fireEvent.change(inputs[2], { target: { value: 'newpassword123' } });
        fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Jane',
                    surname: 'Smith',
                    password: 'newpassword123',
                    currentPassword: 'oldpassword',
                    language: 'en',
                }),
            );
            expect(screen.getByText('settings.updateSuccess')).toBeInTheDocument();
            expect(mockSetLanguage).toHaveBeenCalled();
        });
    });

    it('shows generic backend error message when update fails with custom message', async () => {
        mockUpdateProfile.mockRejectedValueOnce(new Error('Backend exploded'));
        render(<SettingsPage />);
        await waitFor(() => expect(screen.queryByText('settings.title')).toBeInTheDocument());

        const inputs = screen.getAllByPlaceholderText('••••••••');
        fireEvent.change(inputs[0], { target: { value: 'oldpassword' } });
        fireEvent.change(inputs[1], { target: { value: 'newpassword123' } });
        fireEvent.change(inputs[2], { target: { value: 'newpassword123' } });
        fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
        await waitFor(() => {
            expect(screen.getByText('Backend exploded')).toBeInTheDocument();
        });
    });

    it('handles load user error and still leaves loading state', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockGetCurrentUser.mockRejectedValueOnce(new Error('load fail'));
        render(<SettingsPage />);

        await waitFor(() => {
            expect(screen.getByText('settings.title')).toBeInTheDocument();
        });
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('syncs local language with global app language when different', async () => {
        mockGlobalLanguage = 'pt-BR';
        render(<SettingsPage />);
        await waitFor(() => expect(screen.queryByText('settings.title')).toBeInTheDocument());

        const portugueseButton = screen.getByRole('button', { name: /Português/i });
        fireEvent.click(portugueseButton);
        expect(mockSetLanguage).toHaveBeenCalledWith('pt-BR');
    });

    it('blocks submit when password is invalid even via form submit', async () => {
        render(<SettingsPage />);
        await waitFor(() => expect(screen.queryByText('settings.title')).toBeInTheDocument());

        const inputs = screen.getAllByPlaceholderText('••••••••');
        fireEvent.change(inputs[0], { target: { value: 'oldpass' } });
        fireEvent.change(inputs[1], { target: { value: '123' } });

        const form = screen.getByRole('button', { name: 'common.save' }).closest('form');
        fireEvent.submit(form as HTMLFormElement);

        await waitFor(() => {
            expect(screen.getByText('settings.updateError')).toBeInTheDocument();
        });
        expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('switches back to English preference button', async () => {
        mockGlobalLanguage = 'pt-BR';
        render(<SettingsPage />);
        await waitFor(() => expect(screen.queryByText('settings.title')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /English/i }));
        expect(mockSetLanguage).toHaveBeenCalledWith('en');
    });
});
