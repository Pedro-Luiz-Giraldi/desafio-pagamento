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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-xl bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-[#0A2540]">{title}</h2>
          <Button variant="ghost" className="min-h-8 px-2 py-1 text-xs" onClick={onClose}>
            Fechar
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
