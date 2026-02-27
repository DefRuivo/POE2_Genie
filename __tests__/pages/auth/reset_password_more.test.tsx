import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ResetPasswordPage from '@/app/(auth)/reset-password/page';

let tokenValue: string | null = 'valid-token';
const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'token' ? tokenValue : null),
  }),
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('@/components/PasswordFields', () => ({
  PasswordFields: ({ onChange }: { onChange: (isValid: boolean, val: string) => void }) => {
    const React = require('react');
    React.useEffect(() => {
      onChange(true, 'newpassword123');
    }, [onChange]);
    return <div data-testid="password-fields-mock" />;
  },
}));

describe('Reset password additional coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenValue = 'valid-token';
  });

  it('shows invalid link when token is missing', async () => {
    tokenValue = null;
    render(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getAllByText('auth.invalidResetLink').length).toBeGreaterThan(0);
    });
  });

  it('shows expired token message when verification returns 410/expired', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({ valid: false, error: 'token expired' }),
    }) as jest.Mock;

    render(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText('auth.tokenExpired')).toBeInTheDocument();
    });
  });

  it('shows common error when verify-token request fails unexpectedly', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as jest.Mock;
    render(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText('common.error')).toBeInTheDocument();
    });
  });

});
