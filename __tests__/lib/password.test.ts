import bcrypt from 'bcryptjs';
import { comparePassword, hashPassword } from '@/lib/password';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('lib/password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hashPassword delegates to bcrypt.hash with fixed rounds', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const result = await hashPassword('my-pass');

    expect(bcrypt.hash).toHaveBeenCalledWith('my-pass', 10);
    expect(result).toBe('hashed');
  });

  it('comparePassword delegates to bcrypt.compare', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await comparePassword('plain', 'hashed');

    expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed');
    expect(result).toBe(true);
  });
});

