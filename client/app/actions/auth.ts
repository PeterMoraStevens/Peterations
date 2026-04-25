'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function loginAction(email: string, password: string): Promise<{ error: string } | void> {
  try {
    await signIn('credentials', { email, password, redirectTo: '/admin' })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Invalid email or password.' }
    }
    throw error // re-throw redirect — Next.js handles it
  }
}
