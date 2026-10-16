'use client'

import CodeBlock from '@tiptap/extension-code-block'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'

export const CODE_LANGUAGES = [
  'plaintext', 'bash', 'css', 'diff', 'go', 'html', 'java', 'javascript', 'json', 'jsx', 'markdown',
  'python', 'ruby', 'rust', 'sql', 'swift', 'tsx', 'typescript', 'yaml',
] as const

function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const language: string = node.attrs.language || 'plaintext'
  return (
    <NodeViewWrapper className="not-prose my-6 rounded-xl border-2 border-border shadow-brutal overflow-hidden">
      <div contentEditable={false} className="flex items-center gap-2 border-b-2 border-border bg-muted px-3 py-1.5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-border bg-[#f9a8d4]" />
          <div className="w-3 h-3 rounded-full border-2 border-border bg-[#fde047]" />
          <div className="w-3 h-3 rounded-full border-2 border-border bg-[#86efac]" />
        </div>
        <select
          value={CODE_LANGUAGES.includes(language as (typeof CODE_LANGUAGES)[number]) ? language : 'plaintext'}
          onChange={(e) => updateAttributes({ language: e.target.value === 'plaintext' ? null : e.target.value })}
          className="ml-1 rounded-md border-2 border-transparent bg-transparent px-1 text-xs font-mono font-semibold outline-none hover:border-border focus:border-border"
        >
          {CODE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <pre className="m-0 overflow-x-auto bg-[#0d1117] p-4 text-sm leading-relaxed text-[#e6edf3]">
        <NodeViewContent<'code'> as="code" className="font-mono whitespace-pre" />
      </pre>
    </NodeViewWrapper>
  )
}

export const CodeBlockNode = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView)
  },
}).configure({ defaultLanguage: null, enableTabIndentation: true })
