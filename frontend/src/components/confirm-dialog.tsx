import { Button, Modal } from '@/components/ui'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={loading}>
          {loading ? 'Aguarde...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
