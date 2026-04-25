import type { Metadata } from 'next'
import { BlogList } from '@/components/blog/BlogList'
import { getPublishedBlogPosts } from '@/lib/db/blog'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Writing on software, design, and everything else.',
}

export default async function BlogPage() {
  let posts: Awaited<ReturnType<typeof getPublishedBlogPosts>> = []
  try {
    posts = await getPublishedBlogPosts()
  } catch {
    posts = []
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">Blog</h1>
        <p className="text-base font-medium text-muted-foreground max-w-lg">
          Writing on software, design, and whatever else is on my mind.
        </p>
      </header>
      <BlogList posts={posts} />
    </div>
  )
}
