'use client'

import { useState } from 'react'
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { ChevronRight } from 'lucide-react'
import { encodeData, readProps } from '@/lib/blog/content'
import { container } from './markdown'

function ToggleView({ node, updateAttributes }: NodeViewProps) {
  const [open, setOpen] = useState(true)
  return (
    <NodeViewWrapper className="not-prose my-6 rounded-xl border-2 border-border bg-card shadow-brutal overflow-hidden">
      <div contentEditable={false} className="flex items-center gap-2 px-3 py-2.5 bg-muted/40">
        <button
          type="button"
          title={open ? 'Collapse in editor' : 'Expand in editor'}
          onClick={() => setOpen(!open)}
          className="rounded p-0.5 hover:bg-muted"
        >
          <ChevronRight size={16} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
        <input
          value={node.attrs.summary}
          onChange={(e) => updateAttributes({ summary: e.target.value })}
          placeholder="Toggle title"
          className="flex-1 bg-transparent font-semibold outline-none"
        />
      </div>
      <NodeViewContent
        className={`prose prose-brutal max-w-none border-t-2 border-border px-5 py-3 [&>:first-child]:mt-0 [&>:last-child]:mb-0 ${open ? '' : 'hidden'}`}
      />
    </NodeViewWrapper>
  )
}

export const ToggleNode = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'block+',
  defining: true,
  draggable: true,

  addAttributes() {
    return { summary: { default: '' } }
  },

  parseHTML() {
    return [{
      tag: 'div[data-node="toggle"]',
      getAttrs: (el) => ({ summary: readProps(el as HTMLElement).summary ?? '' }),
    }]
  },

  renderHTML({ node }) {
    return ['div', { 'data-node': 'toggle', 'data-props': encodeData({ summary: node.attrs.summary }) }, 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleView)
  },

  addStorage() {
    return {
      markdown: {
        serialize: container('Toggle', (n) => ({ summary: n.attrs.summary || 'Details' })),
        parse: {},
      },
    }
  },
})
