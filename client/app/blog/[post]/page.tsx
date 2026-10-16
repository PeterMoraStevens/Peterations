import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mdxComponents, mdxOptions } from '@/components/blog/mdx-components'
import { ReadingProgress } from '@/components/blog/ReadingProgress'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { extractHeadings, sanitizeMdx } from '@/lib/blog/content'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Clock, Calendar, Eye, Pencil } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/auth'
import type { BlogPost } from '@/types'

interface Props {
  params: Promise<{ post: string }>
}

/** Drafts are only visible to the signed-in admin (as a preview). */
async function loadPost(slug: string): Promise<{ post: BlogPost; preview: boolean } | null> {
  let post: BlogPost | null = null
  try {
    const { getBlogPost } = await import('@/lib/db/blog')
    post = await getBlogPost(slug)
  } catch {
    return null
  }
  if (!post) return null
  if (post.published) return { post, preview: false }
  const session = await auth()
  return session ? { post, preview: true } : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { post } = await params
  const loaded = await loadPost(post)
  if (!loaded) return { title: 'Post Not Found' }
  const { post: blogPost, preview } = loaded
  return {
    title: blogPost.title,
    description: blogPost.excerpt,
    robots: preview ? { index: false } : undefined,
    openGraph: {
      title: blogPost.title,
      description: blogPost.excerpt,
      type: 'article',
      images: blogPost.coverImage ? [blogPost.coverImage] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { post } = await params
  const loaded = await loadPost(post)
  if (!loaded) notFound()
  const { post: blogPost, preview } = loaded

  const content = sanitizeMdx(blogPost.content ?? '')
  const headings = extractHeadings(content)
  const showToc = headings.length >= 3

  return (
    <>
      <ReadingProgress />
      <div className={showToc ? 'max-w-6xl mx-auto px-4 py-12' : 'max-w-3xl mx-auto px-4 py-12'}>
        <div className={showToc ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_240px] xl:gap-12' : undefined}>
          <div className="min-w-0 max-w-3xl mx-auto w-full">
            <div className="flex items-center justify-between gap-4 mb-8">
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline underline-offset-4 group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                All Posts
              </Link>
              {preview && blogPost.id && (
                <Link href={`/admin/blog/${blogPost.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline underline-offset-4">
                  <Pencil size={14} /> Edit
                </Link>
              )}
            </div>

            {preview && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border-2 border-border bg-accent px-4 py-2.5 text-sm font-semibold shadow-brutal-sm">
                <Eye size={16} /> Draft preview — only you can see this.
              </div>
            )}

            <header className="mb-12 border-2 border-border shadow-brutal-lg rounded-2xl overflow-hidden bg-primary">
              {blogPost.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blogPost.coverImage}
                  alt=""
                  className="block w-full aspect-[2/1] object-cover border-b-2 border-border"
                />
              )}
              <div className="p-8">
                {(blogPost.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {blogPost.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  {blogPost.title}
                </h1>
                {blogPost.excerpt && (
                  <p className="text-lg font-medium opacity-80 mb-5 max-w-2xl">{blogPost.excerpt}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                  {blogPost.publishedAt && (
                    <span className="flex items-center gap-1.5 opacity-70">
                      <Calendar size={14} />
                      {formatDate(blogPost.publishedAt)}
                    </span>
                  )}
                  {blogPost.readingTime && (
                    <span className="flex items-center gap-1.5 opacity-70">
                      <Clock size={14} />
                      {blogPost.readingTime} min read
                    </span>
                  )}
                  {blogPost.updatedAt && blogPost.updatedAt !== blogPost.createdAt && (
                    <span className="text-xs opacity-50">
                      Updated {formatDate(blogPost.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
            </header>

            <article className="prose prose-lg max-w-none prose-brutal">
              <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
            </article>

            <div className="mt-16 pt-8 border-t-2 border-border">
              <Button asChild variant="outline">
                <Link href="/blog"><ArrowLeft size={16} />Back to Blog</Link>
              </Button>
            </div>
          </div>

          {showToc && (
            <aside className="hidden xl:block">
              <div className="sticky top-24">
                <TableOfContents headings={headings} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  )
}
