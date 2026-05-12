'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Button from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  isLoading?: boolean
  children?: ReactNode
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      dialog.showModal()
      cancelRef.current?.focus()
    } else {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-0 z-50 m-auto max-h-[90vh] w-full max-w-md rounded-xl border border-border bg-card p-0 shadow-[var(--shadow-lg,0_20px_60px_rgb(0,0,0,0.15))]',
        'backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        'open:animate-in open:fade-in open:zoom-in-95',
        'open:backdrop:animate-in open:backdrop:fade-in'
      )}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          {variant === 'danger' && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)]" aria-hidden>
              <AlertTriangle size={16} className="text-destructive" />
            </div>
          )}
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X size={14} aria-hidden />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {children}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
        <Button
          ref={cancelRef}
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Procesando…' : confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
