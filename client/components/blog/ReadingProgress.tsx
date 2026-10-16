'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    function update() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = document.documentElement
        const max = el.scrollHeight - el.clientHeight
        setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0)
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="fixed inset-x-0 top-[58px] z-40 h-1.5 pointer-events-none" aria-hidden>
      <div
        className="h-full origin-left bg-primary border-b-2 border-border"
        style={{ transform: `scaleX(${progress})`, opacity: progress > 0 ? 1 : 0 }}
      />
    </div>
  )
}
