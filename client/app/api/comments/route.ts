import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import Redis from 'ioredis'
import { isAdmin } from '@/lib/auth/require-admin'

// Comments publish without moderation, so visitors are rate limited per IP:
// at most HOURLY_LIMIT per hour, and no more than one every COOLDOWN seconds.
const HOURLY_LIMIT = 5
const HOURLY_WINDOW = 3600 // seconds
const COOLDOWN = 30        // seconds
const MIN_NAME_LEN = 2
const MAX_NAME_LEN = 80
const MAX_MSG_LEN = 2000
const AUTHOR_NAME = 'Peter'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const redis = new Redis(process.env.REDIS_URL!, {
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null,
})
redis.on('error', () => {})

/**
 * Client IP as seen by our reverse proxy. X-Real-IP is set by the proxy itself;
 * otherwise use the LAST X-Forwarded-For entry (the one the proxy appended),
 * since earlier entries are supplied by the client and can be spoofed.
 */
function getIp(req: NextRequest): string {
  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }
  return 'unknown'
}

// In-memory fallback used only when Redis is unreachable, so the limit still
// holds (per server instance) instead of letting everything through.
const memHits = new Map<string, number[]>()

function memCheck(ip: string): 'ok' | 'cooldown' | 'limit' {
  const now = Date.now()
  const hits = (memHits.get(ip) ?? []).filter((t) => now - t < HOURLY_WINDOW * 1000)
  if (hits.length && now - hits[hits.length - 1] < COOLDOWN * 1000) return 'cooldown'
  if (hits.length >= HOURLY_LIMIT) return 'limit'
  hits.push(now)
  memHits.set(ip, hits)
  if (memHits.size > 10_000) memHits.clear() // crude bound on memory
  return 'ok'
}

async function checkRateLimit(ip: string): Promise<'ok' | 'cooldown' | 'limit'> {
  try {
    // SET NX only succeeds if no comment was posted in the last COOLDOWN seconds.
    const fresh = await redis.set(`comments:cd:${ip}`, '1', 'EX', COOLDOWN, 'NX')
    if (fresh === null) return 'cooldown'
    const key = `comments:rl:${ip}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, HOURLY_WINDOW)
    return count > HOURLY_LIMIT ? 'limit' : 'ok'
  } catch {
    return memCheck(ip)
  }
}

export async function POST(req: NextRequest) {
  const admin = await isAdmin()

  let slug: string
  let parentId: string | undefined
  let name: string
  let message: string
  try {
    const body = await req.json()
    slug = String(body.slug ?? '')
    parentId = body.parentId ? String(body.parentId) : undefined
    name = String(body.name ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LEN)
    message = String(body.message ?? '').trim().slice(0, MAX_MSG_LEN)
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!admin && name.length < MIN_NAME_LEN) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  }
  if (!message) {
    return NextResponse.json({ error: 'Comment is required.' }, { status: 400 })
  }
  if (parentId && !UUID_RE.test(parentId)) {
    return NextResponse.json({ error: 'Invalid reply target.' }, { status: 400 })
  }

  // Rate limit visitors (not the author) after validation, so typos don't burn quota.
  if (!admin) {
    const result = await checkRateLimit(getIp(req))
    if (result === 'cooldown') {
      return NextResponse.json(
        { error: `Slow down! Please wait ${COOLDOWN} seconds between comments.` },
        { status: 429 },
      )
    }
    if (result === 'limit') {
      return NextResponse.json(
        { error: 'Too many comments. Please try again later.' },
        { status: 429 },
      )
    }
  }

  try {
    const { getBlogPost } = await import('@/lib/db/blog')
    const { createComment, getCommentMeta, approveComment } = await import('@/lib/db/comments')

    const post = await getBlogPost(slug)
    if (!post?.id || !post.published) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    }
    if (parentId) {
      const parent = await getCommentMeta(parentId)
      // Visitors can only reply to visible comments; the author replying to a hidden one makes it visible.
      if (!parent || parent.postId !== post.id || (!parent.approved && !admin)) {
        return NextResponse.json({ error: 'That comment no longer exists.' }, { status: 404 })
      }
      if (!parent.approved) await approveComment(parentId)
    }

    const comment = await createComment({
      postId: post.id,
      parentId,
      name: admin ? AUTHOR_NAME : name,
      message,
      isAuthor: admin,
    })
    revalidatePath('/admin/comments')
    revalidatePath(`/blog/${slug}`)
    return NextResponse.json({ ok: true, approved: comment.approved })
  } catch (err) {
    console.error('[comments/POST]', err)
    return NextResponse.json({ error: 'Failed to save comment.' }, { status: 500 })
  }
}
