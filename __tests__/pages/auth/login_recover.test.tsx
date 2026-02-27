import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
import RecoverPage from '@/app/(auth)/recover/page';

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    lang: 'en',
  }),
}));

describe('Auth pages: login + recover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Email sent' }),
    }) as jest.Mock;
  });

  it('login succeeds and redirects home', async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('members.emailPlaceholder'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.loginBtn' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/');
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it('login shows unverified flow and supports resend verification', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ code: 'auth.unverified' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('members.emailPlaceholder'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.loginBtn' }));

    await waitFor(() => {
      expect(screen.getByText('auth.unverifiedError')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'auth.resendVerification' }));
    await waitFor(() => {
      expect(screen.getByText('auth.verificationResent')).toBeInTheDocument();
    });
  });

  it('login shows resend error when resend call fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ code: 'auth.unverified' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('members.emailPlaceholder'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.loginBtn' }));

    await waitFor(() => {
      expect(screen.getByText('auth.unverifiedError')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'auth.resendVerification' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'auth.resendError' })).toBeInTheDocument();
    });
  });

  it('recover page sends request and renders success state', async () => {
    render(<RecoverPage />);

    fireEvent.change(screen.getByPlaceholderText('members.emailPlaceholder'), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.sendInstructions' }));

    await waitFor(() => {
      expect(screen.getByText('auth.checkEmailTitle')).toBeInTheDocument();
      expect(screen.getByText('Email sent')).toBeInTheDocument();
    });
  });

  it('recover page handles network error by showing common.error message', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'));

    render(<RecoverPage />);
    fireEvent.change(screen.getByPlaceholderText('members.emailPlaceholder'), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.sendInstructions' }));

    await waitFor(() => {
      expect(screen.getByText('auth.recoverTitle')).toBeInTheDocument();
      expect(screen.queryByText('auth.checkEmailTitle')).not.toBeInTheDocument();
    });
  });
});
