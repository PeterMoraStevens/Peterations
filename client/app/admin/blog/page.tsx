import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Plus, Pencil, Clock, Calendar } from 'lucide-react'
import { DeletePostButton } from '@/components/admin/DeletePostButton'
import type { BlogPost } from '@/types'

async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const { getBlogPosts } = await import('@/lib/db/blog')
    return getBlogPosts()
  } catch {
    return []
  }
}

export default async function AdminBlogPage() {
  const posts = await getAllPosts()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Button asChild>
          <Link href="/admin/blog/new"><Plus size={16} />New Post</Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="border-2 border-border shadow-brutal rounded-2xl p-12 text-center bg-white">
          <p className="font-bold text-lg mb-2">No posts yet.</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first post to get started.</p>
          <Button asChild>
            <Link href="/admin/blog/new"><Plus size={16} />Create Post</Link>
          </Button>
        </div>
      ) : (
        <div className="border-2 border-border shadow-brutal rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 bg-foreground text-white px-4 py-3 text-xs font-semibold tracking-widest">
            <span>Title</span>
            <span>Status</span>
            <span className="hidden sm:block">Created</span>
            <span className="hidden sm:block">Edited</span>
            <span>Actions</span>
          </div>
          {/* Rows */}
          {posts.map((post, i) => (
            <div
              key={post.id ?? post.slug}
              className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-4 border-t-2 border-border ${i % 2 === 0 ? 'bg-white' : 'bg-muted'}`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{post.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground font-mono">/{post.slug}</span>
                  {post.readingTime && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Clock size={10} />
                      {post.readingTime}m
                    </span>
                  )}
                </div>
              </div>
              <Badge variant={post.published ? 'default' : 'outline'}>
                {post.published ? 'Live' : 'Draft'}
              </Badge>
              <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={12} />
                {post.createdAt ? formatDate(post.createdAt) : '—'}
              </span>
              <span className="hidden sm:block text-xs text-muted-foreground">
                {post.updatedAt ? formatDate(post.updatedAt) : '—'}
              </span>
              <div className="flex items-center gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/admin/blog/${post.id}`}>
                    <Pencil size={12} />
                    Edit
                  </Link>
                </Button>
                <DeletePostButton id={post.id!} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
