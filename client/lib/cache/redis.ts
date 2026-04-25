import 'server-only'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!, {
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null, // don't retry; fail fast so missing Redis doesn't crash the app
})

const SILENT_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'])

redis.on('error', (err: NodeJS.ErrnoException) => {
  if (SILENT_CODES.has(err.code ?? '')) return
  if (process.env.NODE_ENV !== 'test') console.error('[redis]', err.message)
})

const TTL_POST_LIST = 300   // 5 min
const TTL_POST      = 600   // 10 min

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export async function setCached(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl)
  } catch {}
}

export async function invalidatePostCache(slug?: string): Promise<void> {
  try {
    const keys = ['blog:posts:published', 'blog:posts:all']
    if (slug) keys.push(`blog:post:${slug}`)
    if (keys.length) await redis.del(...keys)
  } catch {}
}

export { TTL_POST_LIST, TTL_POST }
