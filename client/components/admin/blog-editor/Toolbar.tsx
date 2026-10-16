'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import {
  Undo2, Redo2, Bold, Italic, Underline, Strikethrough, Code, Link as LinkIcon,
  Superscript, Subscript, List, ListOrdered, ListChecks, Quote, Code2, Minus, ImageIcon,
  Plus, Heading2, Heading3, Pilcrow, Table2, Rows3, Columns3, Trash2, Loader2,
} from 'lucide-react'
import { slashItems } from '../extensions/SlashCommand'
import { cn } from '@/lib/utils'
import { ColorMenu, LinkForm, useEditorTick } from './formatting'
import { Divider, Popover, TB } from './ui'

function BlockSelect({ editor }: { editor: Editor }) {
  const options = [
    { label: 'Text', icon: Pilcrow, active: editor.isActive('paragraph'), run: () => editor.chain().focus().setParagraph().run() },
    { label: 'Heading', icon: Heading2, active: editor.isActive('heading', { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Subheading', icon: Heading3, active: editor.isActive('heading', { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  ]
  return (
    <div className="flex items-center">
      {options.map((o) => (
        <TB key={o.label} title={o.label} active={o.active} onClick={o.run}>
          <o.icon size={15} />
        </TB>
      ))}
    </div>
  )
}

function InsertMenu({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  const [open, setOpen] = useState(false)
  const items = slashItems(onImage).filter((i) => i.group !== 'Basic')
  const range = () => ({ from: editor.state.selection.from, to: editor.state.selection.from })

  return (
    <div className="relative">
      <TB title="Insert block" active={open} onClick={() => setOpen(!open)} className="px-2.5 bg-accent border-2 border-border">
        <Plus size={14} /> Insert
      </TB>
      <Popover open={open} onClose={() => setOpen(false)} align="right" className="w-64 p-1.5">
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { item.run(editor, range()); setOpen(false) }}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-primary"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-border bg-card">
              <item.icon size={14} />
            </span>
            <span>
              <span className="block text-sm font-semibold leading-tight">{item.title}</span>
              <span className="block text-xs text-muted-foreground">{item.description}</span>
            </span>
          </button>
        ))}
        <p className="mt-1 border-t-2 border-border/10 px-2 pt-2 pb-1 text-[11px] text-muted-foreground">
          Tip: type <span className="font-mono font-bold">/</span> on an empty line.
        </p>
      </Popover>
    </div>
  )
}

export function Toolbar({ editor, onImage, uploading }: { editor: Editor; onImage: () => void; uploading: boolean }) {
  useEditorTick(editor)
  const [linkOpen, setLinkOpen] = useState(false)
  const inTable = editor.isActive('table')

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-0.5 overflow-x-auto px-2 py-1.5 [scrollbar-width:none]">
        <TB title="Undo (⌘Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 size={15} /></TB>
        <TB title="Redo (⌘⇧Z)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 size={15} /></TB>
        <Divider />
        <BlockSelect editor={editor} />
        <Divider />
        <TB title="Bold (⌘B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15} /></TB>
        <TB title="Italic (⌘I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15} /></TB>
        <TB title="Underline (⌘U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline size={15} /></TB>
        <TB title="Strikethrough (⌘⇧S)" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={15} /></TB>
        <TB title="Inline code (⌘E)" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={15} /></TB>
        <div className="relative">
          <TB title="Link (⌘K)" active={editor.isActive('link') || linkOpen} onClick={() => setLinkOpen(!linkOpen)}><LinkIcon size={15} /></TB>
          <Popover open={linkOpen} onClose={() => setLinkOpen(false)}>
            <LinkForm editor={editor} onDone={() => setLinkOpen(false)} />
          </Popover>
        </div>
        <ColorMenu editor={editor} />
        <TB title="Superscript" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}><Superscript size={15} /></TB>
        <TB title="Subscript" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}><Subscript size={15} /></TB>
        <Divider />
        <TB title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={15} /></TB>
        <TB title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15} /></TB>
        <TB title="Checklist" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks size={15} /></TB>
        <TB title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={15} /></TB>
        <TB title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 size={15} /></TB>
        <TB title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={15} /></TB>
        <TB title="Table" active={inTable} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} disabled={inTable}><Table2 size={15} /></TB>
        <TB title="Upload image" onClick={onImage} disabled={uploading}>
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
        </TB>
        <div className="ml-auto pl-2">
          <InsertMenu editor={editor} onImage={onImage} />
        </div>
      </div>

      {inTable && (
        <div className="flex items-center gap-0.5 overflow-x-auto border-t-2 border-border bg-muted/40 px-2 py-1 text-xs">
          <span className="px-1.5 font-semibold text-muted-foreground">Table</span>
          <TB title="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}><Rows3 size={14} /> Row</TB>
          <TB title="Add column right" onClick={() => editor.chain().focus().addColumnAfter().run()}><Columns3 size={14} /> Column</TB>
          <Divider />
          <TB title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()}>− Row</TB>
          <TB title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()}>− Column</TB>
          <Divider />
          <TB title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()} className="text-destructive"><Trash2 size={14} /> Table</TB>
        </div>
      )}
    </div>
  )
}

/** Floating formatting menu shown over a text selection. */
export function SelectionBubble({ editor, linkOpen, setLinkOpen }: {
  editor: Editor
  linkOpen: boolean
  setLinkOpen: (open: boolean) => void
}) {
  useEditorTick(editor)
  const linkOpenRef = useRef(linkOpen)
  useEffect(() => { linkOpenRef.current = linkOpen }, [linkOpen])

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e, state }) => {
        if (linkOpenRef.current) return true
        if (state.selection.empty || !e.view.hasFocus()) return false
        // Atom blocks (images, charts…) have their own controls.
        if ('node' in state.selection) return false
        if (e.isActive('codeBlock')) return false
        return true
      }}
      options={{ placement: 'top', offset: 8 }}
      className={cn('rounded-xl border-2 border-border bg-card shadow-brutal', linkOpen ? 'p-2' : 'p-1')}
    >
      {linkOpen ? (
        <LinkForm editor={editor} onDone={() => setLinkOpen(false)} />
      ) : (
        <div className="flex items-center gap-0.5">
          <TB title="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={15} /></TB>
          <Divider />
          <TB title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15} /></TB>
          <TB title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15} /></TB>
          <TB title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline size={15} /></TB>
          <TB title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={15} /></TB>
          <TB title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={15} /></TB>
          <Divider />
          <TB title="Link" active={editor.isActive('link')} onClick={() => setLinkOpen(true)}><LinkIcon size={15} /></TB>
          <ColorMenu editor={editor} />
        </div>
      )}
    </BubbleMenu>
  )
}
