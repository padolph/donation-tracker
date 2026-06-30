import crypto from 'crypto';

/**
 * Hashes a plaintext password using scryptSync.
 * Returns a string formatted as scrypt:salt:hash.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash.
 * Plaintext matches are strictly rejected (returns false).
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  if (storedValue.startsWith('scrypt:')) {
    const parts = storedValue.split(':');
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    const currentHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return currentHash === hash;
  }
  return false; // Plaintext matches are strictly rejected for production security
}
