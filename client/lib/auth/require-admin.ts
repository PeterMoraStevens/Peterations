import 'server-only'
import { auth } from '@/auth'

/** Server actions and route handlers are reachable without the proxy, so check here too. */
export async function isAdmin(): Promise<boolean> {
  return !!(await auth())
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error('Unauthorized')
}
