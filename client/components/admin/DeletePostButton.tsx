'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function DeletePostButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const { deleteBlogPostAction } = await import('@/app/actions/blog')
      await deleteBlogPostAction(id)
      router.refresh()
    } catch (err) {
      console.error('Failed to delete post', err)
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? '...' : 'CONFIRM'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
          CANCEL
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} className="text-destructive hover:bg-destructive/10">
      <Trash2 size={12} />
    </Button>
  )
}
