import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ResetPasswordPage from '@/app/(auth)/reset-password/page';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'token' ? 'valid-token' : null),
  }),
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/components/PasswordFields', () => ({
  PasswordFields: ({ onChange }: { onChange: (isValid: boolean, value: string) => void }) => (
    <div>
      <button type="button" onClick={() => onChange(true, 'newpass123')}>
        set-valid
      </button>
      <button type="button" onClick={() => onChange(false, '')}>
        set-invalid
      </button>
    </div>
  ),
}));

describe('Reset password submit branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits POST reset request when password is valid', async () => {
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/auth/verify-token')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ valid: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as Response);
    }) as jest.Mock;

    render(<ResetPasswordPage />);
    await screen.findByRole('button', { name: 'auth.resetPassword' });

    fireEvent.click(screen.getByRole('button', { name: 'set-valid' }));
    fireEvent.submit(screen.getByRole('button', { name: 'auth.resetPassword' }).closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/reset-password',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'valid-token', newPassword: 'newpass123' }),
        }),
      );
    });
  });

  it('executes non-ok reset branch and keeps app responsive', async () => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/verify-token')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ valid: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 400,
        json: async () => ({ error: 'reset.failed' }),
      } as Response);
    }) as jest.Mock;

    render(<ResetPasswordPage />);
    await screen.findByRole('button', { name: 'auth.resetPassword' });
    fireEvent.click(screen.getByRole('button', { name: 'set-valid' }));
    fireEvent.submit(screen.getByRole('button', { name: 'auth.resetPassword' }).closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/reset-password',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('executes exception branch when reset endpoint throws', async () => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/verify-token')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ valid: true }),
        } as Response);
      }
      return Promise.reject(new Error('network'));
    }) as jest.Mock;

    render(<ResetPasswordPage />);
    await screen.findByRole('button', { name: 'auth.resetPassword' });
    fireEvent.click(screen.getByRole('button', { name: 'set-valid' }));
    fireEvent.submit(screen.getByRole('button', { name: 'auth.resetPassword' }).closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/reset-password',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});

