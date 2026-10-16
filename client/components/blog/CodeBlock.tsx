'use client'

import React, { useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps extends React.ComponentPropsWithoutRef<'pre'> {
  'data-language'?: string
}

export function CodeBlock({ children, className, 'data-language': language, ...rest }: CodeBlockProps) {
  // shiki's inline theme colours would fight the block's own background.
  const { style: _style, ...props } = rest // eslint-disable-line @typescript-eslint/no-unused-vars
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  async function copy() {
    const text = preRef.current?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — nothing useful to do */
    }
  }

  const label = language && language !== 'plaintext' && language !== 'text' ? language : 'code'

  return (
    <div className="not-prose my-6 rounded-xl border-2 border-border shadow-brutal overflow-hidden">
      <div className="bg-muted border-b-2 border-border px-3 py-1.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-border bg-[#f9a8d4]" />
          <div className="w-3 h-3 rounded-full border-2 border-border bg-[#fde047]" />
          <div className="w-3 h-3 rounded-full border-2 border-border bg-[#86efac]" />
        </div>
        <span className="text-xs font-semibold tracking-wide opacity-70 ml-1 font-mono">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold opacity-70 hover:opacity-100 hover:bg-card transition"
          aria-label="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        ref={preRef}
        {...props}
        className={cn('overflow-x-auto p-4 text-sm leading-relaxed m-0 bg-[#0d1117] text-[#e6edf3]', className)}
      >
        {children}
      </pre>
    </div>
  )
}
