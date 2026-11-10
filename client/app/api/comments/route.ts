import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import Redis from 'ioredis'
import { isAdmin } from '@/lib/auth/require-admin'

const RATE_LIMIT = 5       // max comments
const RATE_WINDOW = 3600   // per hour (seconds)
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

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  const admin = await isAdmin()

  // Rate limit visitors (not the author) per IP
  if (!admin) {
    try {
      const key = `comments:rl:${getIp(req)}`
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, RATE_WINDOW)
      if (count > RATE_LIMIT) {
        return NextResponse.json(
          { error: 'Too many comments. Please try again later.' },
          { status: 429 },
        )
      }
    } catch {
      // Redis unavailable — allow the request through
    }
  }

  let slug: string
  let parentId: string | undefined
  let name: string
  let message: string
  try {
    const body = await req.json()
    slug = String(body.slug ?? '')
    parentId = body.parentId ? String(body.parentId) : undefined
    name = String(body.name ?? '').trim().slice(0, MAX_NAME_LEN) || 'Anonymous'
    message = String(body.message ?? '').trim().slice(0, MAX_MSG_LEN)
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!message) {
    return NextResponse.json({ error: 'Comment is required.' }, { status: 400 })
  }
  if (parentId && !UUID_RE.test(parentId)) {
    return NextResponse.json({ error: 'Invalid reply target.' }, { status: 400 })
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
      // Visitors can only reply to visible comments; the author replying to a pending one approves it.
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
    if (comment.approved) revalidatePath(`/blog/${slug}`)
    return NextResponse.json({ ok: true, approved: comment.approved })
  } catch (err) {
    console.error('[comments/POST]', err)
    return NextResponse.json({ error: 'Failed to save comment.' }, { status: 500 })
  }
}
