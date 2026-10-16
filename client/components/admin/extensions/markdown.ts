// Helpers for serialising custom Tiptap nodes back to MDX via tiptap-markdown
// (which wraps prosemirror-markdown's serializer state).
import { Mark, Node } from '@tiptap/core'
import Text from '@tiptap/extension-text'
import Highlight from '@tiptap/extension-highlight'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { jsxAttrs, normalizeHighlight, type TextColor as TextColorName } from '@/lib/blog/content'

/* eslint-disable @typescript-eslint/no-explicit-any */
type State = any
type PMNode = any
type Attrs = Record<string, string | number | boolean | null | undefined>

/** `<Tag a="1" />` on its own block. */
export function selfClosing(tag: string, attrs: (node: PMNode) => Attrs) {
  return (state: State, node: PMNode) => {
    state.write(`<${tag}${jsxAttrs(attrs(node))} />`)
    state.closeBlock(node)
  }
}

/** `<Tag a="1">` + blank line + child markdown + blank line + `</Tag>`. */
export function container(tag: string, attrs: (node: PMNode) => Attrs) {
  return (state: State, node: PMNode) => {
    state.write(`<${tag}${jsxAttrs(attrs(node))}>`)
    state.closeBlock(node)
    state.renderContent(node)
    state.write(`</${tag}>`)
    state.closeBlock(node)
  }
}

/**
 * Plain text, made safe for MDX: `<`/`>` become entities and `{`/`}` become
 * numeric references so MDX doesn't read them as JSX or expressions.
 * Inline code bypasses this (prosemirror-markdown writes it unescaped).
 */
export const MdxText = Text.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: State, node: PMNode) {
          state.text(
            node.text
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\{/g, '&#123;')
              .replace(/\}/g, '&#125;'),
          )
        },
        parse: {},
      },
    }
  },
})

/** Highlights stored by colour *name* (`<mark data-color="yellow">`). */
export const NamedHighlight = Highlight.extend({
  addAttributes() {
    return {
      color: {
        default: 'yellow',
        parseHTML: (el: HTMLElement) =>
          normalizeHighlight(el.getAttribute('data-color') || el.style.backgroundColor),
        renderHTML: (attrs: { color?: string }) => ({ 'data-color': normalizeHighlight(attrs.color) }),
      },
    }
  },
}).configure({ multicolor: true })

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textColor: {
      setTextColor: (color: TextColorName) => ReturnType
      unsetTextColor: () => ReturnType
    }
  }
}

export const TextColor = Mark.create({
  name: 'textColor',
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-text-color'),
        renderHTML: (attrs: { color?: string }) => (attrs.color ? { 'data-text-color': attrs.color } : {}),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-text-color]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },
  addCommands() {
    return {
      setTextColor: (color) => ({ commands }) => commands.setMark(this.name, { color }),
      unsetTextColor: () => ({ commands }) => commands.unsetMark(this.name),
    }
  },
})

/**
 * Tables always serialise as GFM markdown. tiptap-markdown falls back to raw
 * HTML (with `style="…"` strings MDX can't parse) for anything unusual, so
 * cells are limited to paragraphs and joined with `<br />`.
 */
export const MdxTable = Table.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: State, node: PMNode) {
          state.inTable = true
          node.forEach((row: PMNode, _p: number, i: number) => {
            state.write('| ')
            row.forEach((cell: PMNode, _p2: number, j: number) => {
              if (j) state.write(' | ')
              cell.forEach((para: PMNode, _p3: number, k: number) => {
                if (k) state.write('<br />')
                if (para.textContent.trim()) state.renderInline(para)
              })
            })
            state.write(' |')
            state.ensureNewLine()
            if (!i) {
              state.write(`| ${Array.from({ length: row.childCount }, () => '---').join(' | ')} |`)
              state.ensureNewLine()
            }
          })
          state.closeBlock(node)
          state.inTable = false
        },
        parse: {},
      },
    }
  },
}).configure({ resizable: false })

export const MdxTableCell = TableCell.extend({ content: 'paragraph+' })
export const MdxTableHeader = TableHeader.extend({ content: 'paragraph+' })
export { TableRow }

/** Re-export so node files share one Node import. */
export { Node }
