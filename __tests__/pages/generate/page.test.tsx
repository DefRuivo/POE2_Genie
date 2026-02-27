import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GenerateRecipePage from '../../../app/builds/craft/page';
import { storageService } from '../../../services/storageService';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    usePathname: () => '/builds/craft',
}));

jest.mock('../../../services/storageService', () => ({
    storageService: {
        saveBuild: jest.fn(),
    }
}));

jest.mock('@/hooks/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

jest.mock('@/hooks/useCurrentMember', () => ({
    useCurrentMember: () => ({ isGuest: false, loading: false, member: { role: 'ADMIN' } }),
}));

let mockUseAppValues: any = {};

jest.mock('../../../components/Providers', () => ({
    useApp: () => mockUseAppValues,
}));

describe('GenerateRecipePage', () => {
    const mockSetActiveDiners = jest.fn();
    const mockSetMealType = jest.fn();
    const mockSetCostTier = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (global as any).fetch = jest.fn();

        mockUseAppValues = {
            members: [],
            pantry: [],
            activeDiners: [],
            setActiveDiners: mockSetActiveDiners,
            costTier: 'cheap',
            setCostTier: mockSetCostTier,
            prepTime: 'quick',
            mealType: 'main',
            setMealType: mockSetMealType,
            language: 'en'
        };
    });

    it('defaults selection to Kitchen Admin when no one is selected', async () => {
        const adminMember = { id: 'admin-1', name: 'Chef', role: 'ADMIN' };
        const regularMember = { id: 'mem-1', name: 'User', role: 'MEMBER' };

        mockUseAppValues.members = [regularMember, adminMember];
        mockUseAppValues.activeDiners = [];

        render(<GenerateRecipePage />);

        await waitFor(() => {
            expect(mockSetActiveDiners).toHaveBeenCalledWith(['admin-1']);
        });
    });

    it('falls back to first member if no Admin is found', async () => {
        const regularMember1 = { id: 'mem-1', name: 'User 1', role: 'MEMBER' };
        const regularMember2 = { id: 'mem-2', name: 'User 2', role: 'MEMBER' };

        mockUseAppValues.members = [regularMember1, regularMember2];
        mockUseAppValues.activeDiners = [];

        render(<GenerateRecipePage />);

        await waitFor(() => {
            expect(mockSetActiveDiners).toHaveBeenCalledWith(['mem-1']);
        });
    });

    it('does not change selection if someone is already active', async () => {
        const adminMember = { id: 'admin-1', name: 'Chef', role: 'ADMIN' };

        mockUseAppValues.members = [adminMember];
        mockUseAppValues.activeDiners = ['some-other-id'];

        render(<GenerateRecipePage />);

        await waitFor(() => {
            expect(mockSetActiveDiners).not.toHaveBeenCalled();
        });
    });

    it('hides quota-specific backend message and shows generic localized error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        mockUseAppValues.members = [{ id: 'admin-1', name: 'Chef', role: 'ADMIN' }];
        mockUseAppValues.activeDiners = ['admin-1'];

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 429,
            json: jest.fn().mockResolvedValue({
                error: 'Gemini quota exceeded. Please try again in 46s.',
                code: 'gemini.quota_exceeded',
                retryAfterSeconds: 46
            })
        });

        render(<GenerateRecipePage />);

        fireEvent.click(screen.getByRole('button', { name: 'generate.generateBtn' }));

        await waitFor(() => {
            expect(screen.getByText('generate.generateError')).toBeInTheDocument();
            expect(screen.queryByText('Gemini quota exceeded. Please try again in 46s.')).not.toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    it('falls back to localized generate error when API error payload is invalid', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        mockUseAppValues.members = [{ id: 'admin-1', name: 'Chef', role: 'ADMIN' }];
        mockUseAppValues.activeDiners = ['admin-1'];

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500,
            json: jest.fn().mockRejectedValue(new Error('invalid JSON'))
        });

        render(<GenerateRecipePage />);

        fireEvent.click(screen.getByRole('button', { name: 'generate.generateBtn' }));

        await waitFor(() => {
            expect(screen.getByText('generate.generateError')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    it('shows diner selection error when none is selected', async () => {
        mockUseAppValues.members = [{ id: 'admin-1', name: 'Chef', role: 'ADMIN' }];
        mockUseAppValues.activeDiners = [];

        render(<GenerateRecipePage />);
        fireEvent.click(screen.getByRole('button', { name: 'generate.generateBtn' }));

        expect(screen.getByText('generate.selectDinersError')).toBeInTheDocument();
    });

    it('crafts build successfully and redirects to saved build', async () => {
        mockUseAppValues.members = [{ id: 'admin-1', name: 'Chef', role: 'ADMIN' }];
        mockUseAppValues.pantry = [
            { id: 'p1', name: 'Orb of Alteration', inStock: true },
            { id: 'p2', name: 'Alchemy Orb', inStock: false },
        ];
        mockUseAppValues.activeDiners = ['admin-1'];
        mockUseAppValues.prepTime = 'fast';
        mockUseAppValues.costTier = 'cheap';
        mockUseAppValues.language = 'pt-BR';

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ build_title: 'Arc Build', build_steps: ['step'] }),
        });
        (storageService.saveBuild as jest.Mock).mockResolvedValue({ id: 'saved-build' });

        render(<GenerateRecipePage />);
        fireEvent.change(screen.getByPlaceholderText('generate.specialRequestsPlaceholder'), { target: { value: 'Starter mapper' } });
        fireEvent.click(screen.getByRole('button', { name: 'generate.generateBtn' }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/build',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('Orb of Alteration'),
                }),
            );
            expect(storageService.saveBuild).toHaveBeenCalled();
            expect(mockPush).toHaveBeenCalledWith('/builds/saved-build');
        });
    });

    it('shows API-provided non-quota error message and handles save failure', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockUseAppValues.members = [{ id: 'admin-1', name: 'Chef', role: 'ADMIN' }];
        mockUseAppValues.activeDiners = ['admin-1'];

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 422,
            json: jest.fn().mockResolvedValue({ error: 'gemini.domain_mismatch' }),
        });

        render(<GenerateRecipePage />);
        fireEvent.click(screen.getByRole('button', { name: 'generate.generateBtn' }));
        await waitFor(() => {
            expect(screen.getByText('gemini.domain_mismatch')).toBeInTheDocument();
        });

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({ build_title: 'Arc Build', build_steps: ['step'] }),
        });
        (storageService.saveBuild as jest.Mock).mockRejectedValueOnce(new Error('save fail'));

        fireEvent.click(screen.getByRole('button', { name: 'generate.generateBtn' }));
        await waitFor(() => {
            expect(screen.getByText('save fail')).toBeInTheDocument();
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });
});
