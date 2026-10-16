'use client'

import React from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Shared chrome for atom blocks: label, delete, and an edit panel when selected. */
export function BlockFrame({
  icon: Icon,
  label,
  selected,
  onDelete,
  panel,
  children,
  actions,
}: {
  icon: React.ElementType
  label: string
  selected: boolean
  onDelete: () => void
  panel?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <NodeViewWrapper
      className={cn(
        'group/block not-prose relative my-6 rounded-2xl transition-shadow',
        selected ? 'ring-2 ring-offset-4 ring-offset-card ring-[#7c3aed]' : 'hover:ring-2 hover:ring-offset-4 hover:ring-offset-card hover:ring-border/30',
      )}
      data-drag-handle
    >
      <div
        contentEditable={false}
        className={cn(
          'absolute -top-3 left-3 z-10 flex items-center gap-1 rounded-lg border-2 border-border bg-card px-2 py-0.5 text-[11px] font-semibold shadow-brutal-sm transition-opacity',
          selected ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100',
        )}
      >
        <Icon size={12} />
        {label}
        {actions}
        <button
          type="button"
          title="Delete block"
          onClick={onDelete}
          className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <div contentEditable={false}>{children}</div>
      {selected && panel && (
        <div
          contentEditable={false}
          className="mt-3 rounded-2xl border-2 border-border bg-background p-4 shadow-brutal space-y-3 text-sm"
        >
          {panel}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-lg border-2 border-border bg-card px-2.5 py-1.5 text-sm outline-none focus:shadow-brutal-sm transition-shadow'

export function Segmented<T extends string>({
  value, options, onChange, render,
}: {
  value: T
  options: readonly T[]
  onChange: (v: T) => void
  render?: (v: T) => React.ReactNode
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border-2 border-border bg-card p-0.5 gap-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors',
            o === value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          {render ? render(o) : o}
        </button>
      ))}
    </div>
  )
}
