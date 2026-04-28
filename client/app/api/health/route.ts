import { NextResponse } from 'next/server'
import Redis from 'ioredis'

export async function GET() {
  const redis = new Redis(process.env.REDIS_URL!, {
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 3000,
    retryStrategy: () => null,
  })

  try {
    const pong = await redis.ping()
    return NextResponse.json({ redis: pong === 'PONG' ? 'ok' : 'unexpected response', response: pong })
  } catch (err) {
    return NextResponse.json({ redis: 'error', error: (err as Error).message }, { status: 503 })
  } finally {
    redis.disconnect()
  }
}
