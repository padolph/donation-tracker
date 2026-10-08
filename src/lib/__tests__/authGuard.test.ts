import { isAuthenticated, requireAuth, UNAUTHORIZED_ERROR } from '../authGuard';
import { auth } from '@/auth';

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

describe('authGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAuthenticated', () => {
    it('returns true when the session has a user', async () => {
      (auth as jest.Mock).mockResolvedValue({ user: { name: 'User' } });
      await expect(isAuthenticated()).resolves.toBe(true);
    });

    it('returns false when there is no session', async () => {
      (auth as jest.Mock).mockResolvedValue(null);
      await expect(isAuthenticated()).resolves.toBe(false);
    });

    it('returns false when the session has no user', async () => {
      (auth as jest.Mock).mockResolvedValue({ expires: '2099-01-01' });
      await expect(isAuthenticated()).resolves.toBe(false);
    });
  });

  describe('requireAuth', () => {
    it('resolves when logged in', async () => {
      (auth as jest.Mock).mockResolvedValue({ user: { name: 'User' } });
      await expect(requireAuth()).resolves.toBeUndefined();
    });

    it('throws an Unauthorized error when not logged in', async () => {
      (auth as jest.Mock).mockResolvedValue(null);
      await expect(requireAuth()).rejects.toThrow(UNAUTHORIZED_ERROR);
      expect(UNAUTHORIZED_ERROR).toContain('Unauthorized');
    });
  });
});
