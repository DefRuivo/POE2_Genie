import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import VerifyEmailPage from '@/app/verify-email/page';

const pushMock = jest.fn();
let tokenValue: string | null = 'valid-token';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'token' ? tokenValue : null),
  }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenValue = 'valid-token';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as jest.Mock;
  });

  it('shows success state when verification request succeeds', async () => {
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText('auth.accountVerified')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'auth.goToLogin' })).toBeInTheDocument();
    });
  });

  it('shows API error message when verification fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Token expired' }),
    });
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText('auth.verifyFailed')).toBeInTheDocument();
      expect(screen.getByText('Token expired')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'auth.backToLogin' })).toBeInTheDocument();
    });
  });

  it('shows invalid link state when token is missing', async () => {
    tokenValue = null;
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText('auth.verifyFailed')).toBeInTheDocument();
      expect(screen.getByText('auth.invalidLink')).toBeInTheDocument();
    });
  });

  it('shows networkError on request exception', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'));
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText('auth.verifyFailed')).toBeInTheDocument();
      expect(screen.getByText('auth.networkError')).toBeInTheDocument();
    });
  });
});
