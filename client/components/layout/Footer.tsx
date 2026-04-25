import React from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t-2 border-border bg-primary py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm font-semibold">
          © {new Date().getFullYear()} Peter Mora-Stevens
        </p>
        <div className="flex items-center gap-6 text-sm font-semibold">
          <Link href="/blog" className="hover:underline underline-offset-4">Blog</Link>
          <Link href="/photography" className="hover:underline underline-offset-4">Photos</Link>
          <Link href="/about" className="hover:underline underline-offset-4">About</Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity"
            title="Admin"
          >
            <Lock size={13} />
          </Link>
        </div>
      </div>
    </footer>
  )
}
