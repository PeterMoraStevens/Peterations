import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/blog/Callout'
import { CodeBlock } from '@/components/blog/CodeBlock'
import { BlogImage } from '@/components/blog/BlogImage'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ post: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { post } = await params
  try {
    const { getBlogPost } = await import('@/lib/db/blog')
    const blogPost = await getBlogPost(post)
    if (!blogPost) return { title: 'Post Not Found' }
    return { title: blogPost.title, description: blogPost.excerpt }
  } catch {
    return { title: post }
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { post } = await params

  let blogPost = null
  try {
    const { getBlogPost } = await import('@/lib/db/blog')
    blogPost = await getBlogPost(post)
  } catch {
    notFound()
  }

  if (!blogPost) notFound()

  const mdxComponents = {
    pre: ({ children, ...props }: React.ComponentPropsWithoutRef<'pre'>) => (
      <CodeBlock {...props}>{children}</CodeBlock>
    ),
    img: ({ src, alt, ...props }: React.ComponentPropsWithoutRef<'img'>) => (
      <BlogImage src={(src as string) ?? ''} alt={alt} {...props} />
    ),
    BlogImage,
    Callout,
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline underline-offset-4 mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        All Posts
      </Link>

      <header className="mb-12 border-2 border-border shadow-brutal-lg rounded-2xl p-8 bg-primary">
        <div className="flex flex-wrap gap-2 mb-4">
          {(blogPost.tags ?? []).map((tag: string) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          {blogPost.title}
        </h1>
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
      </header>

      <article className="prose prose-lg max-w-none prose-brutal">
        <MDXRemote source={blogPost.content ?? ''} components={mdxComponents} />
      </article>

      <div className="mt-16 pt-8 border-t-2 border-border">
        <Button asChild variant="outline">
          <Link href="/blog"><ArrowLeft size={16} />Back to Blog</Link>
        </Button>
      </div>
    </div>
  )
}
