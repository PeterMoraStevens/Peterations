'use client'

import { useState } from 'react'
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { PlaySquare } from 'lucide-react'
import { Embed } from '@/components/blog/Embed'
import { encodeData, readProps, toEmbedUrl } from '@/lib/blog/content'
import { BlockFrame, Field, inputCls } from './BlockFrame'
import { selfClosing } from './markdown'

function EmbedView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { url, caption } = node.attrs as { url: string; caption: string }
  const [draft, setDraft] = useState(url)
  const valid = !!toEmbedUrl(draft)

  if (!url) {
    return (
      <BlockFrame icon={PlaySquare} label="Embed" selected onDelete={deleteNode}>
        <form
          className="rounded-2xl border-2 border-dashed border-border bg-muted/50 p-5 space-y-2"
          onSubmit={(e) => { e.preventDefault(); if (valid) updateAttributes({ url: draft.trim() }) }}
        >
          <p className="text-sm font-semibold">Paste a YouTube, Vimeo or Spotify link</p>
          <div className="flex gap-2">
            <input autoFocus className={inputCls} value={draft} placeholder="https://youtube.com/watch?v=…" onChange={(e) => setDraft(e.target.value)} />
            <button type="submit" disabled={!valid} className="rounded-lg border-2 border-border bg-primary px-3 text-sm font-semibold disabled:opacity-40">
              Embed
            </button>
          </div>
          {draft && !valid && <p className="text-xs text-destructive">That link isn&apos;t a supported embed.</p>}
        </form>
      </BlockFrame>
    )
  }

  return (
    <BlockFrame
      icon={PlaySquare}
      label="Embed"
      selected={selected}
      onDelete={deleteNode}
      panel={
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Link">
            <input
              className={inputCls}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => toEmbedUrl(draft) && updateAttributes({ url: draft.trim() })}
            />
          </Field>
          <Field label="Caption">
            <input className={inputCls} value={caption} placeholder="Optional" onChange={(e) => updateAttributes({ caption: e.target.value })} />
          </Field>
        </div>
      }
    >
      {/* The iframe would swallow clicks meant to select the block. */}
      <div className="relative">
        <Embed url={url} caption={caption} />
        {!selected && <div className="absolute inset-0 cursor-pointer" />}
      </div>
    </BlockFrame>
  )
}

export const EmbedNode = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return { url: { default: '' }, caption: { default: '' } }
  },

  parseHTML() {
    return [{
      tag: 'div[data-node="embed"]',
      getAttrs: (el) => {
        const p = readProps(el as HTMLElement)
        return { url: p.url ?? '', caption: p.caption ?? '' }
      },
    }]
  },

  renderHTML({ node }) {
    return ['div', { 'data-node': 'embed', 'data-props': encodeData({ url: node.attrs.url, caption: node.attrs.caption }) }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedView)
  },

  addStorage() {
    return {
      markdown: {
        serialize: selfClosing('Embed', (n) => ({ url: n.attrs.url, caption: n.attrs.caption })),
        parse: {},
      },
    }
  },
})
