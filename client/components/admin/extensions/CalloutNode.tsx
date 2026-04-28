'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { Info, AlertTriangle, CheckCircle, Zap } from 'lucide-react'

type CalloutType = 'note' | 'warning' | 'tip' | 'important'

const TYPES: CalloutType[] = ['note', 'warning', 'tip', 'important']

const calloutConfig: Record<CalloutType, {
  icon: React.ElementType
  bg: string
  border: string
  label: string
}> = {
  note:      { icon: Info,          bg: 'bg-[#e8f4ff] dark:bg-[#0c1e3d]', border: 'border-[#0066cc]', label: 'NOTE' },
  warning:   { icon: AlertTriangle, bg: 'bg-[#fff8e0] dark:bg-[#231800]', border: 'border-[#ff9900]', label: 'WARNING' },
  tip:       { icon: CheckCircle,   bg: 'bg-[#e0fff4] dark:bg-[#001f14]', border: 'border-[#00cc66]', label: 'TIP' },
  important: { icon: Zap,           bg: 'bg-[#ffe8e8] dark:bg-[#2a0a0a]', border: 'border-[#ff4800]', label: 'IMPORTANT' },
}

function CalloutNodeView({ node, updateAttributes }: {
  node: { attrs: { calloutType: CalloutType; label: string } }
  updateAttributes: (attrs: Record<string, unknown>) => void
}) {
  const type = node.attrs.calloutType
  const config = calloutConfig[type]
  const Icon = config.icon
  const label = node.attrs.label  // empty string = use type default

  return (
    <NodeViewWrapper className={cn('my-4 border-2 border-l-4 p-4 shadow-brutal not-prose', config.bg, config.border)}>
      <div contentEditable={false} className="flex items-center gap-2 mb-2">
        <Icon size={14} className="shrink-0" />
        <input
          type="text"
          value={label}
          onChange={(e) => updateAttributes({ label: e.target.value })}
          placeholder={config.label}
          size={Math.max((label || config.label).length, 3)}
          className="text-xs font-black tracking-widest bg-transparent border-none outline-none p-0 cursor-text uppercase placeholder:opacity-100 placeholder:text-current"
          onMouseDown={(e) => e.stopPropagation()}
        />
        <div className="ml-auto flex gap-1">
          {TYPES.map((t) => {
            const c = calloutConfig[t]
            return (
              <button
                key={t}
                type="button"
                title={t}
                onClick={() => updateAttributes({ calloutType: t })}
                className={cn(
                  'w-3.5 h-3.5 rounded-full border-2 border-border transition-all',
                  c.bg,
                  c.border,
                  t === type ? 'ring-2 ring-offset-1 ring-foreground scale-110' : 'opacity-50 hover:opacity-100',
                )}
              />
            )
          })}
        </div>
      </div>
      <NodeViewContent className="text-sm [&>p]:m-0" />
    </NodeViewWrapper>
  )
}

export const CalloutNode = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      calloutType: {
        default: 'note',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-callout-type'),
        renderHTML: (attrs) => ({ 'data-callout-type': attrs.calloutType }),
      },
      label: {
        default: '',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-callout-label') ?? '',
        renderHTML: (attrs) => attrs.label ? { 'data-callout-label': attrs.label } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout-type]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0]
  },

  addNodeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(CalloutNodeView as any)
  },

  addStorage() {
    return {
      markdown: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serialize(state: any, node: any) {
          const text = node.textContent.trim()
          const customLabel = node.attrs.label?.trim()
          // Ensure a blank line before the tag
          if (state.out.length > 0) {
            if (state.out.endsWith('\n\n')) { /* already blank */ }
            else if (state.out.endsWith('\n')) { state.out += '\n' }
            else { state.out += '\n\n' }
          }
          const labelAttr = customLabel ? ` label="${customLabel}"` : ''
          state.out += `<Callout type="${node.attrs.calloutType}"${labelAttr}>\n${text}\n</Callout>\n\n`
        },
      },
    }
  },
})

export function preprocessCallouts(md: string): string {
  const normalised = md.replace(/([^\n])(<Callout)/g, '$1\n\n$2')
  return normalised.replace(
    /<Callout\s+type="(note|warning|tip|important)"(?:\s+label="([^"]*)")?>([\s\S]*?)<\/Callout>/g,
    (_, type: string, label: string | undefined, content: string) => {
      const labelAttr = label ? ` data-callout-label="${label}"` : ''
      return `\n\n<div data-callout-type="${type}"${labelAttr}>\n\n${content.trim()}\n\n</div>\n\n`
    },
  )
}
