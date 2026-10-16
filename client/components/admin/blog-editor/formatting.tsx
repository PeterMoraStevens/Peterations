'use client'

import React, { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Check, ExternalLink, Highlighter, Palette, Trash2, X } from 'lucide-react'
import { HIGHLIGHT_COLORS, TEXT_COLORS, type HighlightColor, type TextColor } from '@/lib/blog/content'
import { cn } from '@/lib/utils'
import { Popover, TB } from './ui'

export function LinkForm({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  const [href, setHref] = useState<string>(editor.getAttributes('link').href ?? '')
  const isLink = editor.isActive('link')

  function apply(value: string) {
    let v = value.trim()
    if (v && !/^(https?:|mailto:|\/|#)/.test(v)) v = `https://${v}`
    const { empty } = editor.state.selection
    if (v && empty && !isLink) {
      // Nothing selected: insert the URL itself as linked text.
      editor.chain().focus().insertContent({ type: 'text', text: v, marks: [{ type: 'link', attrs: { href: v } }] }).run()
    } else {
      const chain = editor.chain().focus().extendMarkRange('link')
      if (v) chain.setLink({ href: v }).run()
      else chain.unsetLink().run()
    }
    onDone()
  }

  return (
    <form
      className="flex w-80 items-center gap-1.5"
      onSubmit={(e) => { e.preventDefault(); apply(href) }}
    >
      <input
        autoFocus
        value={href}
        onChange={(e) => setHref(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onDone()}
        placeholder="Paste or type a link"
        className="min-w-0 flex-1 rounded-lg border-2 border-border bg-background px-2 py-1 font-mono text-xs outline-none"
      />
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" title="Open link" className="rounded-lg p-1.5 hover:bg-muted">
          <ExternalLink size={13} />
        </a>
      )}
      {isLink && (
        <button type="button" title="Remove link" onClick={() => apply('')} className="rounded-lg p-1.5 text-destructive hover:bg-muted">
          <Trash2 size={13} />
        </button>
      )}
      <button type="submit" title="Apply" className="rounded-lg border-2 border-border bg-primary p-1">
        <Check size={13} />
      </button>
    </form>
  )
}

const SWATCH: Record<HighlightColor, string> = {
  yellow: 'var(--hl-yellow)', green: 'var(--hl-green)', blue: 'var(--hl-blue)',
  pink: 'var(--hl-pink)', purple: 'var(--hl-purple)', orange: 'var(--hl-orange)',
}
const TEXT_SWATCH: Record<TextColor, string> = {
  red: 'var(--tc-red)', orange: 'var(--tc-orange)', green: 'var(--tc-green)',
  blue: 'var(--tc-blue)', purple: 'var(--tc-purple)', muted: 'var(--tc-muted)',
}

/** Highlight + text colour picker, used in both the toolbar and bubble menu. */
export function ColorMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const activeHl = HIGHLIGHT_COLORS.find((c) => editor.isActive('highlight', { color: c }))
  const activeTc = TEXT_COLORS.find((c) => editor.isActive('textColor', { color: c }))

  return (
    <div className="relative">
      <TB title="Colour" active={open || !!activeHl || !!activeTc} onClick={() => setOpen(!open)}>
        <Palette size={15} />
      </TB>
      <Popover open={open} onClose={() => setOpen(false)} className="w-56 space-y-3">
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-muted-foreground"><Highlighter size={11} /> Highlight</p>
          <div className="flex flex-wrap gap-1.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                className={cn('h-6 w-6 rounded-md border-2 border-border transition-transform hover:scale-110', activeHl === c && 'ring-2 ring-offset-1 ring-border')}
                style={{ background: SWATCH[c] }}
              />
            ))}
            <button
              type="button"
              title="No highlight"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-dashed border-border hover:bg-muted"
            >
              <X size={12} />
            </button>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-muted-foreground">Text</p>
          <div className="flex flex-wrap gap-1.5">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (activeTc === c ? editor.chain().focus().unsetTextColor().run() : editor.chain().focus().setTextColor(c).run())}
                className={cn('flex h-6 w-6 items-center justify-center rounded-md border-2 border-border bg-card text-sm font-black hover:scale-110 transition-transform', activeTc === c && 'ring-2 ring-offset-1 ring-border')}
                style={{ color: TEXT_SWATCH[c] }}
              >
                A
              </button>
            ))}
            <button
              type="button"
              title="Default colour"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().unsetTextColor().run()}
              className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-dashed border-border hover:bg-muted"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </Popover>
    </div>
  )
}

/** Re-render on every transaction so active states stay in sync. */
export function useEditorTick(editor: Editor | null) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!editor) return
    const bump = () => setTick((t) => t + 1)
    editor.on('transaction', bump)
    return () => { editor.off('transaction', bump) }
  }, [editor])
}
