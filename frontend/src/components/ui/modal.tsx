import type { ReactNode } from 'react'
import { Button } from './button'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ children, onClose, open, title }: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-md bg-white shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-950">{title}</h2>
          <Button variant="ghost" className="min-h-8 px-2 py-1" onClick={onClose}>
            Fechar
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
