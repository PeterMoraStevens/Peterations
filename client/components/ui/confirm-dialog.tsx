'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  /** The element that opens the dialog (rendered via asChild, so pass a single button). */
  trigger: React.ReactNode
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Runs when confirmed. The dialog shows a busy state until it settles, then closes. */
  onConfirm: () => void | Promise<void>
}

/** Neobrutalist replacement for window.confirm() on destructive actions. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')

  async function handleConfirm() {
    setBusy(true)
    setError('')
    try {
      await onConfirm()
      setOpen(false)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (busy) return // don't let Escape / outside click abandon an in-flight delete
        setOpen(next)
        if (!next) setError('')
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="confirm-overlay fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]" />
        <Dialog.Content
          className="confirm-content fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-border bg-card text-card-foreground shadow-brutal-xl focus:outline-none"
        >
          <div className="flex items-start gap-4 p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-destructive text-destructive-foreground shadow-brutal-sm">
              <AlertTriangle size={20} />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
              <Dialog.Title className="text-lg font-black leading-tight">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">Confirm this action</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              disabled={busy}
              className="-mr-2 -mt-2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              aria-label="Close"
            >
              <X size={16} />
            </Dialog.Close>
          </div>

          {error && <p className="px-6 pb-2 text-sm font-medium text-destructive">{error}</p>}

          <div className="flex flex-col-reverse gap-3 border-t-2 border-border bg-muted/40 px-6 py-4 rounded-b-2xl sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" disabled={busy}>{cancelLabel}</Button>
            </Dialog.Close>
            <Button type="button" variant="destructive" onClick={handleConfirm} disabled={busy}>
              {busy ? 'Deleting…' : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
