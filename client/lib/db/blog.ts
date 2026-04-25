import 'server-only'
import sql from './postgres'
import { getCached, setCached, invalidatePostCache, TTL_POST_LIST, TTL_POST } from '@/lib/cache/redis'
import type { BlogPost } from '@/types'

type Row = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  cover_image: string | null
  cover_image_path: string | null
  tags: string[]
  published: boolean
  read_time: number | null
  author: string | null
  published_at: Date | null
  image_paths: string[]
  created_at: Date
  updated_at: Date
}

function rowToPost(r: Row): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    coverImage: r.cover_image ?? undefined,
    coverImagePath: r.cover_image_path ?? undefined,
    tags: r.tags,
    published: r.published,
    readingTime: r.read_time ?? undefined,
    author: r.author ?? undefined,
    publishedAt: r.published_at?.toISOString() ?? '',
    imagePaths: r.image_paths ?? [],
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  }
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const cached = await getCached<BlogPost[]>('blog:posts:published')
  if (cached) return cached

  const rows = await sql<Row[]>`
    SELECT * FROM posts
    WHERE published = true
    ORDER BY published_at DESC
  `
  const posts = rows.map(rowToPost)
  await setCached('blog:posts:published', posts, TTL_POST_LIST)
  return posts
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const cached = await getCached<BlogPost[]>('blog:posts:all')
  if (cached) return cached

  const rows = await sql<Row[]>`
    SELECT * FROM posts
    ORDER BY created_at DESC
  `
  const posts = rows.map(rowToPost)
  await setCached('blog:posts:all', posts, TTL_POST_LIST)
  return posts
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const cacheKey = `blog:post:${slug}`
  const cached = await getCached<BlogPost>(cacheKey)
  if (cached) return cached

  const rows = await sql<Row[]>`
    SELECT * FROM posts WHERE slug = ${slug} LIMIT 1
  `
  if (!rows.length) return null
  const post = rowToPost(rows[0])
  await setCached(cacheKey, post, TTL_POST)
  return post
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const rows = await sql<Row[]>`
    SELECT * FROM posts WHERE id = ${id} LIMIT 1
  `
  if (!rows.length) return null
  return rowToPost(rows[0])
}

export async function saveBlogPost(
  data: Omit<BlogPost, 'id'> & { id?: string }
): Promise<string> {
  const { id, slug, title, excerpt, content, coverImage, coverImagePath, tags, published, readingTime, author, publishedAt, imagePaths } = data
  const now = new Date()

  if (id) {
    await sql`
      UPDATE posts SET
        slug         = ${slug},
        title        = ${title},
        excerpt      = ${excerpt ?? ''},
        content      = ${content},
        cover_image      = ${coverImage ?? null},
        cover_image_path = ${coverImagePath ?? null},
        tags             = ${sql.array(tags)},
        published    = ${published},
        read_time    = ${readingTime ?? null},
        author       = ${author ?? null},
        published_at = ${publishedAt ? new Date(publishedAt) : null},
        image_paths  = ${sql.array(imagePaths ?? [])},
        updated_at   = ${now}
      WHERE id = ${id}
    `
    await invalidatePostCache(slug)
    return id
  }

  const rows = await sql<{ id: string }[]>`
    INSERT INTO posts (slug, title, excerpt, content, cover_image, cover_image_path, tags, published, read_time, author, published_at, image_paths, created_at, updated_at)
    VALUES (
      ${slug},
      ${title},
      ${excerpt ?? ''},
      ${content},
      ${coverImage ?? null},
      ${coverImagePath ?? null},
      ${sql.array(tags)},
      ${published},
      ${readingTime ?? null},
      ${author ?? null},
      ${publishedAt ? new Date(publishedAt) : null},
      ${sql.array(imagePaths ?? [])},
      ${now},
      ${now}
    )
    RETURNING id
  `
  await invalidatePostCache()
  return rows[0].id
}

export async function removeImagePathFromPost(postId: string, storagePath: string): Promise<void> {
  await sql`
    UPDATE posts
    SET image_paths = array_remove(image_paths, ${storagePath}),
        updated_at  = NOW()
    WHERE id = ${postId}
  `
  const rows = await sql<{ slug: string }[]>`SELECT slug FROM posts WHERE id = ${postId}`
  if (rows.length) await invalidatePostCache(rows[0].slug)
}

export async function deleteBlogPost(id: string): Promise<{ slug: string; imagePaths: string[] } | null> {
  const rows = await sql<{ slug: string; image_paths: string[] }[]>`
    DELETE FROM posts WHERE id = ${id} RETURNING slug, image_paths
  `
  if (!rows.length) return null
  await invalidatePostCache(rows[0].slug)
  return { slug: rows[0].slug, imagePaths: rows[0].image_paths }
}
