'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Extension, type Editor, type Range } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion'
import {
  Pilcrow, Heading2, Heading3, List, ListOrdered, ListChecks, Quote, Code2, Minus, Table2,
  ImageIcon, Info, AlertTriangle, CheckCircle, Zap, ChevronRightSquare, PlaySquare, BarChart3, HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SlashItem {
  title: string
  description: string
  group: 'Basic' | 'Media' | 'Components'
  icon: React.ElementType
  keywords?: string[]
  run: (editor: Editor, range: Range) => void
}

const callout = (type: 'note' | 'warning' | 'tip' | 'important') => (editor: Editor, range: Range) =>
  editor.chain().focus().deleteRange(range).insertContent({
    type: 'callout',
    attrs: { calloutType: type },
    content: [{ type: 'paragraph' }],
  }).run()

export function slashItems(onImage: () => void): SlashItem[] {
  return [
    { group: 'Basic', title: 'Text', description: 'Plain paragraph', icon: Pilcrow, keywords: ['p', 'paragraph'],
      run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run() },
    { group: 'Basic', title: 'Heading', description: 'Section title', icon: Heading2, keywords: ['h2', 'title'],
      run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run() },
    { group: 'Basic', title: 'Subheading', description: 'Smaller section title', icon: Heading3, keywords: ['h3'],
      run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run() },
    { group: 'Basic', title: 'Bullet list', description: 'Simple list', icon: List, keywords: ['ul', 'unordered'],
      run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
    { group: 'Basic', title: 'Numbered list', description: 'Ordered steps', icon: ListOrdered, keywords: ['ol', 'ordered'],
      run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run() },
    { group: 'Basic', title: 'Checklist', description: 'List with checkboxes', icon: ListChecks, keywords: ['todo', 'task'],
      run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run() },
    { group: 'Basic', title: 'Quote', description: 'Pull a quote out', icon: Quote, keywords: ['blockquote'],
      run: (e, r) => e.chain().focus().deleteRange(r).setBlockquote().run() },
    { group: 'Basic', title: 'Code block', description: 'Syntax-highlighted code', icon: Code2, keywords: ['pre', 'snippet'],
      run: (e, r) => e.chain().focus().deleteRange(r).setCodeBlock().run() },
    { group: 'Basic', title: 'Divider', description: 'Horizontal rule', icon: Minus, keywords: ['hr', 'separator'],
      run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
    { group: 'Basic', title: 'Table', description: '3 × 3 grid', icon: Table2, keywords: ['grid'],
      run: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { group: 'Media', title: 'Image', description: 'Upload from your computer', icon: ImageIcon, keywords: ['photo', 'picture', 'upload'],
      run: (e, r) => { e.chain().focus().deleteRange(r).run(); onImage() } },
    { group: 'Media', title: 'Embed', description: 'YouTube, Vimeo or Spotify', icon: PlaySquare, keywords: ['video', 'youtube', 'spotify', 'music'],
      run: (e, r) => e.chain().focus().deleteRange(r).insertContent({ type: 'embed' }).run() },
    { group: 'Components', title: 'Note', description: 'Blue callout', icon: Info, keywords: ['callout', 'info'], run: callout('note') },
    { group: 'Components', title: 'Tip', description: 'Green callout', icon: CheckCircle, keywords: ['callout', 'success'], run: callout('tip') },
    { group: 'Components', title: 'Warning', description: 'Orange callout', icon: AlertTriangle, keywords: ['callout', 'caution'], run: callout('warning') },
    { group: 'Components', title: 'Important', description: 'Red callout', icon: Zap, keywords: ['callout', 'danger'], run: callout('important') },
    { group: 'Components', title: 'Toggle', description: 'Collapsible section', icon: ChevronRightSquare, keywords: ['details', 'accordion', 'spoiler', 'collapse'],
      run: (e, r) => e.chain().focus().deleteRange(r).insertContent({ type: 'toggle', attrs: { summary: '' }, content: [{ type: 'paragraph' }] }).run() },
    { group: 'Components', title: 'Chart', description: 'Bar, line, area or pie', icon: BarChart3, keywords: ['graph', 'data', 'plot'],
      run: (e, r) => e.chain().focus().deleteRange(r).insertContent({ type: 'chart' }).run() },
    { group: 'Components', title: 'Quiz', description: 'Multiple-choice question', icon: HelpCircle, keywords: ['question', 'poll', 'test'],
      run: (e, r) => e.chain().focus().deleteRange(r).insertContent({ type: 'quiz' }).run() },
  ]
}

interface MenuHandle { onKeyDown: (p: SuggestionKeyDownProps) => boolean }

const SlashMenu = forwardRef<MenuHandle, SuggestionProps<SlashItem>>(function SlashMenu({ items, command }, ref) {
  const [index, setIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset the highlight whenever the filtered list changes.
  const [prevItems, setPrevItems] = useState(items)
  if (prevItems !== items) {
    setPrevItems(items)
    setIndex(0)
  }

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [index])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (!items.length) return false
      if (event.key === 'ArrowDown') { setIndex((i) => (i + 1) % items.length); return true }
      if (event.key === 'ArrowUp') { setIndex((i) => (i - 1 + items.length) % items.length); return true }
      if (event.key === 'Enter' || event.key === 'Tab') { command(items[index]); return true }
      return false
    },
  }))

  if (!items.length) {
    return (
      <div className="w-72 rounded-xl border-2 border-border bg-card p-3 text-sm text-muted-foreground shadow-brutal">
        No matching blocks
      </div>
    )
  }

  return (
    <div ref={listRef} className="w-72 max-h-80 overflow-y-auto rounded-xl border-2 border-border bg-card p-1.5 shadow-brutal">
      {items.map((item, i) => {
        const header = item.group !== items[i - 1]?.group ? item.group : null
        const Icon = item.icon
        return (
          <div key={item.title}>
            {header && <p className="px-2 pt-2 pb-1 text-[11px] font-bold tracking-wide text-muted-foreground">{header}</p>}
            <button
              type="button"
              data-index={i}
              onMouseEnter={() => setIndex(i)}
              onMouseDown={(e) => { e.preventDefault(); command(item) }}
              className={cn('flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left', i === index && 'bg-primary')}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-card">
                <Icon size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
})

export const SlashCommand = Extension.create<{ onImage: () => void }>({
  name: 'slashCommand',

  addOptions() {
    return { onImage: () => {} }
  },

  addProseMirrorPlugins() {
    const all = slashItems(() => this.options.onImage())
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: '/',
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from)
          return $from.parent.type.name === 'paragraph'
        },
        items: ({ query }) => {
          const q = query.toLowerCase().trim()
          if (!q) return all
          return all.filter((i) =>
            i.title.toLowerCase().includes(q) || i.keywords?.some((k) => k.startsWith(q)),
          )
        },
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let renderer: ReactRenderer<MenuHandle, SuggestionProps<SlashItem>> | null = null

          const place = (props: SuggestionProps<SlashItem>) => {
            const rect = props.clientRect?.()
            const el = renderer?.element as HTMLElement | undefined
            if (!rect || !el) return
            const below = window.innerHeight - rect.bottom > 340
            el.style.position = 'fixed'
            el.style.zIndex = '60'
            el.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`
            el.style.top = below ? `${rect.bottom + 8}px` : ''
            el.style.bottom = below ? '' : `${window.innerHeight - rect.top + 8}px`
          }

          return {
            onStart: (props) => {
              renderer = new ReactRenderer(SlashMenu, { props, editor: props.editor })
              document.body.appendChild(renderer.element)
              place(props)
            },
            onUpdate: (props) => {
              renderer?.updateProps(props)
              place(props)
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                renderer?.destroy()
                renderer?.element.remove()
                renderer = null
                return true
              }
              return renderer?.ref?.onKeyDown(props) ?? false
            },
            onExit: () => {
              renderer?.destroy()
              renderer?.element.remove()
              renderer = null
            },
          }
        },
      }),
    ]
  },
})
