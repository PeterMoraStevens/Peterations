// Shared between the Tiptap editor (client) and the MDX renderer (server).
// Posts are stored as MDX: plain markdown plus a handful of JSX components.

// ── Colours ──────────────────────────────────────────────────────────────────
// Stored by name, never by hex, so globals.css can give each one a light and a
// dark variant. Inline `style="…"` strings break MDX, which is why highlights
// used to disappear on the published post.

export const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'] as const
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]

const LEGACY_HIGHLIGHTS: Record<string, HighlightColor> = {
  '#fef08a': 'yellow',
  '#fbcfe8': 'pink',
  '#bbf7d0': 'green',
  '#bfdbfe': 'blue',
  'rgb(254, 240, 138)': 'yellow',
  'rgb(251, 207, 232)': 'pink',
  'rgb(187, 247, 208)': 'green',
  'rgb(191, 219, 254)': 'blue',
}

export function normalizeHighlight(value?: string | null): HighlightColor {
  const v = (value ?? '').trim().toLowerCase()
  if ((HIGHLIGHT_COLORS as readonly string[]).includes(v)) return v as HighlightColor
  return LEGACY_HIGHLIGHTS[v] ?? 'yellow'
}

export const TEXT_COLORS = ['red', 'orange', 'green', 'blue', 'purple', 'muted'] as const
export type TextColor = (typeof TEXT_COLORS)[number]

// ── Images ───────────────────────────────────────────────────────────────────

export const IMAGE_WIDTHS = [25, 33, 50, 66, 75, 100] as const
export const IMAGE_ASPECTS = ['auto', '1/1', '4/3', '3/2', '16/9', '21/9', '3/4', '9/16'] as const
export type ImageAspect = (typeof IMAGE_ASPECTS)[number]
export const IMAGE_ALIGNS = ['left', 'center', 'right'] as const
export type ImageAlign = (typeof IMAGE_ALIGNS)[number]

export function aspectLabel(a: string) {
  return a === 'auto' ? 'Original' : a.replace('/', ':')
}

// ── Interactive blocks ───────────────────────────────────────────────────────

export const CHART_TYPES = ['bar', 'line', 'area', 'pie'] as const
export type ChartType = (typeof CHART_TYPES)[number]
export interface ChartDatum { label: string; value: number }

export const DEFAULT_CHART: ChartDatum[] = [
  { label: 'Mon', value: 4 },
  { label: 'Tue', value: 7 },
  { label: 'Wed', value: 5 },
  { label: 'Thu', value: 9 },
  { label: 'Fri', value: 6 },
]

// Structured props (arrays) are URI-encoded JSON so they survive as a plain
// MDX string attribute — next-mdx-remote blocks `{…}` expressions by default.
export function encodeData(value: unknown): string {
  return encodeURIComponent(JSON.stringify(value))
}

export function decodeData<T>(value: string | undefined | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(decodeURIComponent(value)) as T
  } catch {
    return fallback
  }
}

/** Builds ` a="1" b="2"` for a JSX tag, skipping empty values. */
export function jsxAttrs(attrs: Record<string, string | number | boolean | null | undefined>): string {
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${escapeAttr(String(v))}"`))
    .join('')
}

function escapeAttr(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\s*\n\s*/g, ' ')
}

function unescapeAttr(v: string): string {
  return v
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export function parseJsxAttrs(source: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of source.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) {
    out[m[1]] = m[2] === undefined ? 'true' : unescapeAttr(m[2])
  }
  return out
}

/** Reads one prop back out of the `data-props` blob the editor parses. */
export function readProps(el: HTMLElement): Record<string, string> {
  return decodeData<Record<string, string>>(el.getAttribute('data-props'), {})
}

// ── Embeds ───────────────────────────────────────────────────────────────────

export function toEmbedUrl(raw: string): { src: string; kind: 'video' | 'audio' } | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\.|^m\./, '')
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
    const id = host === 'youtu.be'
      ? url.pathname.slice(1)
      : url.searchParams.get('v') ?? url.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]
    return id ? { src: `https://www.youtube-nocookie.com/embed/${id}`, kind: 'video' } : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.match(/(\d+)/)?.[1]
    return id ? { src: `https://player.vimeo.com/video/${id}`, kind: 'video' } : null
  }
  if (host === 'open.spotify.com') {
    const m = url.pathname.match(/\/(track|album|playlist|episode|show|artist)\/(\w+)/)
    return m ? { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, kind: 'audio' } : null
  }
  return null
}

// ── MDX → editor ─────────────────────────────────────────────────────────────
// tiptap-markdown parses with markdown-it + DOMParser, which can't read JSX
// (self-closing custom tags swallow everything after them), so each component
// is rewritten to an HTML element the matching Tiptap node knows how to parse.

const BLOCK_TAGS = 'Callout|Toggle|BlogImage|Chart|Quiz|Embed'
const SELF_CLOSING = /<(BlogImage|Chart|Quiz|Embed)\b((?:[^>"]|"[^"]*")*?)\/>/g

export interface QuizData {
  question: string
  options: string[]
  answer: number
  explanation?: string
}

export const DEFAULT_QUIZ: QuizData = {
  question: 'What does MDX let you put inside markdown?',
  options: ['Only images', 'React components', 'SQL queries'],
  answer: 1,
  explanation: 'MDX compiles markdown to JSX, so components drop right in.',
}

// Older posts stored highlights as `<mark data-color="#hex" style="…">`.
// MDX can't parse string styles, so rewrite them to named colours.
function normalizeMarks(md: string): string {
  return md.replace(/<mark\b([^>]*)>/g, (_, raw: string) => {
    const color = raw.match(/data-color="([^"]*)"/)?.[1] ?? raw.match(/background-color:\s*([^;"]+)/)?.[1]
    return `<mark data-color="${normalizeHighlight(color)}">`
  })
}

export function mdxToEditorHtml(md: string): string {
  let out = normalizeMarks(md)
    // Block components must start on their own line (repairs older content).
    .replace(new RegExp(`([^\\n])(<\\/?(?:${BLOCK_TAGS})\\b)`, 'g'), '$1\n\n$2')

  out = out.replace(SELF_CLOSING, (_, tag: string, rawAttrs: string) => {
    const attrs = parseJsxAttrs(rawAttrs)
    if (tag === 'BlogImage') {
      return `\n\n<img src="${escapeAttr(attrs.src ?? '')}" alt="${escapeAttr(attrs.alt ?? '')}" data-props="${encodeData(attrs)}">\n\n`
    }
    return `\n\n<div data-node="${tag.toLowerCase()}" data-props="${encodeData(attrs)}"></div>\n\n`
  })

  out = out.replace(
    /<Callout\b((?:[^>"]|"[^"]*")*)>([\s\S]*?)<\/Callout>/g,
    (_, rawAttrs: string, body: string) => {
      const a = parseJsxAttrs(rawAttrs)
      const label = a.label ? ` data-callout-label="${escapeAttr(a.label)}"` : ''
      return `\n\n<div data-callout-type="${escapeAttr(a.type ?? 'note')}"${label}>\n\n${body.trim()}\n\n</div>\n\n`
    },
  )

  out = out.replace(
    /<Toggle\b((?:[^>"]|"[^"]*")*)>([\s\S]*?)<\/Toggle>/g,
    (_, rawAttrs: string, body: string) => {
      const a = parseJsxAttrs(rawAttrs)
      return `\n\n<div data-node="toggle" data-props="${encodeData(a)}">\n\n${body.trim()}\n\n</div>\n\n`
    },
  )

  return out
}

// ── MDX safety on the render side ────────────────────────────────────────────

export function sanitizeMdx(content: string): string {
  // Ensure JSX block components always start on their own blank line.
  // This repairs content saved before the editor enforced proper separation
  // (e.g. "![img](url)<Callout" on one line).
  return normalizeMarks(content)
    .replace(new RegExp(`([^\\n])(<\\/?(?:${BLOCK_TAGS})\\b)`, 'g'), '$1\n\n$2')
}

/** Pulls `## ` / `### ` headings out of the MDX for the table of contents. */
export function extractHeadings(md: string): { depth: 2 | 3; text: string; id: string }[] {
  const out: { depth: 2 | 3; text: string; id: string }[] = []
  let inFence = false
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (inFence) continue
    const m = line.match(/^(##|###)\s+(.+?)\s*#*\s*$/)
    if (!m) continue
    const text = m[2]
      .replace(/<[^>]+>/g, '')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_`~]|\\(?=\S)/g, '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .trim()
    out.push({ depth: m[1].length as 2 | 3, text, id: githubSlug(text) })
  }
  // Mirror github-slugger's de-duplication so ids match rehype-slug.
  const seen = new Map<string, number>()
  for (const h of out) {
    const n = seen.get(h.id) ?? 0
    seen.set(h.id, n + 1)
    if (n) h.id = `${h.id}-${n}`
  }
  return out
}

function githubSlug(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '').replace(/ /g, '-')
}
