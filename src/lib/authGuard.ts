import { auth } from '@/auth';

export const UNAUTHORIZED_ERROR = 'Unauthorized: Access denied.';

/**
 * Server actions are reachable by POST from any page the proxy lets through
 * (including /login), so each action must check the session itself.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}

export async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) {
    throw new Error(UNAUTHORIZED_ERROR);
  }
}
