import { NextRequest, NextResponse } from 'next/server'
import Redis from 'ioredis'

const RATE_LIMIT = 3       // max submissions
const RATE_WINDOW = 3600   // per hour (seconds)
const MAX_NAME_LEN = 80
const MAX_MSG_LEN = 500

const redis = new Redis(process.env.REDIS_URL!, {
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null,
})
redis.on('error', () => {})

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)

  // Rate limit: 3 submissions per hour per IP
  try {
    const key = `guestbook:rl:${ip}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, RATE_WINDOW)
    if (count > RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 },
      )
    }
  } catch {
    // Redis unavailable — allow the request through
  }

  let name: string
  let message: string
  try {
    const body = await req.json()
    name = String(body.name ?? '').trim().slice(0, MAX_NAME_LEN) || 'Anonymous'
    message = String(body.message ?? '').trim().slice(0, MAX_MSG_LEN)
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
  }

  try {
    const { createEntry } = await import('@/lib/db/guestbook')
    const entry = await createEntry(name, message)
    return NextResponse.json({ ok: true, id: entry.id })
  } catch (err) {
    console.error('[guestbook/POST]', err)
    return NextResponse.json({ error: 'Failed to save entry.' }, { status: 500 })
  }
}
