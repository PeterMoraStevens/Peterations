import { notFound } from 'next/navigation'
import { BlogEditor } from '@/components/admin/BlogEditor'
import { getBlogPostById } from '@/lib/db/blog'

export const metadata = { title: 'Edit Post' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const post = await getBlogPostById(id)
  if (!post) notFound()
  return <BlogEditor initialPost={post} postId={id} />
}
