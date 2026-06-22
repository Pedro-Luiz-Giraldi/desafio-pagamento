type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

let nextId = 1
let items: ToastItem[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot() {
  return items
}

function addToast(type: ToastType, message: string) {
  const item = { id: nextId++, type, message }
  items = [...items, item]
  emit()
  return item.id
}

export const toast = {
  success: (message: string) => addToast('success', message),
  error: (message: string) => addToast('error', message),
  info: (message: string) => addToast('info', message),
  dismiss: (id: number) => {
    items = items.filter((item) => item.id !== id)
    emit()
  },
  clear: () => {
    items = []
    emit()
  },
}
