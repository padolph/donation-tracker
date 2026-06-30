import { hashPassword, verifyPassword } from '../crypto';

describe('crypto utilities', () => {
  describe('hashPassword and verifyPassword', () => {
    it('should securely hash and successfully verify a password', () => {
      const password = 'my_secure_password';
      const hash = hashPassword(password);

      expect(hash).toMatch(/^scrypt:[0-9a-f]+:[0-9a-f]+$/);
      expect(verifyPassword(password, hash)).toBe(true);
    });

    it('should fail verification for incorrect password', () => {
      const password = 'my_secure_password';
      const hash = hashPassword(password);

      expect(verifyPassword('wrong_password', hash)).toBe(false);
    });

    it('should strictly reject plaintext passwords', () => {
      const password = 'my_secure_password';
      // Stored value is plaintext, verifyPassword must return false (no plaintext fallback allowed)
      expect(verifyPassword(password, password)).toBe(false);
    });
  });
});
