import Link from 'next/link'
import { type BlogPost } from '@/types'
import { formatDate } from '@/lib/utils'
import { Clock } from 'lucide-react'

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <article className="bg-card border-2 border-border shadow-brutal rounded-2xl overflow-hidden h-full flex flex-col transition-shadow group-hover:shadow-brutal-lg">
        <div className="p-5 flex flex-col flex-1 gap-2">

          {/* Title */}
          <h2 className="text-lg font-bold leading-snug group-hover:underline underline-offset-4 decoration-2">
            {post.title}
          </h2>

          {/* Date + read time */}
          <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
            {post.publishedAt && (
              <time>{formatDate(post.publishedAt)}</time>
            )}
            {post.readingTime != null && (
              <>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {post.readingTime} min read
                </span>
              </>
            )}
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
              {post.excerpt}
            </p>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-muted border border-border rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
