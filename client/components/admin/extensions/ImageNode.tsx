'use client'

import { useRef, useState } from 'react'
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { ImageIcon, Loader2, RefreshCw, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import {
  IMAGE_ALIGNS, IMAGE_ASPECTS, IMAGE_WIDTHS, aspectLabel, encodeData, readProps,
  type ImageAlign,
} from '@/lib/blog/content'
import { cn } from '@/lib/utils'
import { BlockFrame, Field, Segmented, inputCls } from './BlockFrame'
import { selfClosing } from './markdown'

export type UploadFn = (file: File) => Promise<{ url: string; storagePath: string } | null>

const ALIGN_ICONS = { left: AlignLeft, center: AlignCenter, right: AlignRight }

function ImageView({ node, updateAttributes, deleteNode, selected, extension }: NodeViewProps) {
  const { src, alt, caption, width, align, aspect, uploading } = node.attrs as {
    src: string; alt: string; caption: string; width: number; align: ImageAlign; aspect: string; uploading: boolean
  }
  const fileRef = useRef<HTMLInputElement>(null)
  const [replacing, setReplacing] = useState(false)
  const upload = (extension.options as { upload?: UploadFn }).upload
  const busy = uploading || replacing

  async function replace(file?: File) {
    if (!file || !upload) return
    setReplacing(true)
    try {
      const res = await upload(file)
      if (res) updateAttributes({ src: res.url })
    } finally {
      setReplacing(false)
    }
  }

  return (
    <BlockFrame
      icon={ImageIcon}
      label="Image"
      selected={selected}
      onDelete={deleteNode}
      actions={
        upload && (
          <button type="button" title="Replace image" onClick={() => fileRef.current?.click()} className="ml-1 rounded p-0.5 hover:bg-muted">
            <RefreshCw size={11} />
          </button>
        )
      }
      panel={
        <>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Width">
              <Segmented
                value={String(width) as `${(typeof IMAGE_WIDTHS)[number]}`}
                options={IMAGE_WIDTHS.map(String) as `${(typeof IMAGE_WIDTHS)[number]}`[]}
                onChange={(w) => updateAttributes({ width: Number(w) })}
                render={(w) => `${w}%`}
              />
            </Field>
            <Field label="Align">
              <Segmented
                value={align}
                options={IMAGE_ALIGNS}
                onChange={(a) => updateAttributes({ align: a })}
                render={(a) => {
                  const Icon = ALIGN_ICONS[a]
                  return <Icon size={13} />
                }}
              />
            </Field>
            <Field label="Crop">
              <select className={`${inputCls} w-auto`} value={aspect} onChange={(e) => updateAttributes({ aspect: e.target.value })}>
                {IMAGE_ASPECTS.map((a) => <option key={a} value={a}>{aspectLabel(a)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Alt text (for screen readers)">
            <input className={inputCls} value={alt} placeholder="Describe the image" onChange={(e) => updateAttributes({ alt: e.target.value })} />
          </Field>
        </>
      }
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => replace(e.target.files?.[0])} />
      <figure className={cn('max-w-full', align === 'center' && 'mx-auto', align === 'right' && 'ml-auto')} style={{ width: `${width}%` }}>
        <div
          className="relative overflow-hidden rounded-xl border-2 border-border bg-muted shadow-brutal"
          style={aspect !== 'auto' ? { aspectRatio: aspect } : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} draggable={false} className={cn('block w-full', aspect !== 'auto' ? 'h-full object-cover' : 'h-auto', busy && 'opacity-50')} />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center gap-2 rounded-lg border-2 border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-brutal-sm">
                <Loader2 size={14} className="animate-spin" /> Uploading…
              </span>
            </div>
          )}
        </div>
        <input
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder={selected ? 'Add a caption…' : ''}
          className="mt-3 w-full bg-transparent text-center text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </figure>
    </BlockFrame>
  )
}

export const BlogImageNode = Node.create<{ upload?: UploadFn }>({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return { upload: undefined }
  },

  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      caption: { default: '' },
      width: { default: 100 },
      align: { default: 'center' },
      aspect: { default: 'auto' },
      // Transient: set while a pasted/dropped file uploads.
      uploading: { default: false, rendered: false },
      uploadId: { default: null, rendered: false },
    }
  },

  parseHTML() {
    return [{
      tag: 'img[src]',
      getAttrs: (el) => {
        const img = el as HTMLImageElement
        const p = readProps(img)
        return {
          src: img.getAttribute('src') ?? '',
          alt: p.alt ?? img.getAttribute('alt') ?? '',
          caption: p.caption ?? img.getAttribute('title') ?? '',
          width: Number(p.width) || 100,
          align: IMAGE_ALIGNS.includes(p.align as ImageAlign) ? p.align : 'center',
          aspect: p.aspect || 'auto',
        }
      },
    }]
  },

  renderHTML({ node }) {
    const { src, alt, caption, width, align, aspect } = node.attrs
    return ['img', { src, alt, 'data-props': encodeData({ alt, caption, width: String(width), align, aspect }) }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView)
  },

  addStorage() {
    return {
      markdown: {
        serialize: selfClosing('BlogImage', (n) => ({
          src: n.attrs.src,
          alt: n.attrs.alt,
          caption: n.attrs.caption,
          width: n.attrs.width === 100 ? undefined : n.attrs.width,
          align: n.attrs.align === 'center' ? undefined : n.attrs.align,
          aspect: n.attrs.aspect === 'auto' ? undefined : n.attrs.aspect,
        })),
        parse: {},
      },
    }
  },
})
