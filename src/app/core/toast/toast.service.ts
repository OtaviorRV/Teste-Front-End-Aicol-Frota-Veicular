import { Injectable, signal } from '@angular/core'

export type ToastType = 'success' | 'warning' | 'danger' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
  title?: string
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([])

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>()

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const toast: Toast = { id: crypto.randomUUID(), message, type, duration }
    this.toasts.update(list => [...list, toast])
    if (duration > 0) {
      const timer = setTimeout(() => this.dismiss(toast.id), duration)
      this.timers.set(toast.id, timer)
    }
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      this.timers.delete(id)
    }
    this.toasts.update(list => list.filter(t => t.id !== id))
  }
}
