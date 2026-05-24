import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ToastService, Toast } from './toast.service'

@Component({
  selector: 'app-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @keyframes slideInRight {
      from { transform: translateX(calc(100% + 20px)); opacity: 0; }
      to   { transform: translateX(0);                 opacity: 1; }
    }
    .toast-enter { animation: slideInRight 0.22s ease-out forwards; }
  `],
  template: `
    <div
      class="fixed bottom-5 right-5 z-[200] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast-enter flex w-[360px] max-w-[calc(100vw-40px)] items-start gap-3 rounded-[5px] border border-border bg-surface-raised p-3 shadow-md"
          [style.border-left]="borderLeft(toast)"
          [attr.role]="toast.type === 'danger' ? 'alert' : 'status'"
        >
          <span class="mt-0.5 shrink-0" [innerHTML]="icon(toast.type)" aria-hidden="true"></span>

          <div class="flex flex-1 flex-col gap-0.5 overflow-hidden">
            @if (toast.title) {
              <p class="text-[12.5px] font-medium text-text leading-tight">{{ toast.title }}</p>
            }
            <p class="text-[12.5px] text-muted leading-snug break-words">{{ toast.message }}</p>
          </div>

          <button
            type="button"
            class="ml-auto shrink-0 text-muted transition-colors hover:text-text"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Fechar notificação"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  protected readonly toastService = inject(ToastService)

  protected borderLeft(toast: Toast): string {
    const colors: Record<Toast['type'], string> = {
      success: 'var(--success)',
      warning: 'var(--warning)',
      danger:  'var(--danger)',
      info:    'var(--accent)',
    }
    return `3px solid ${colors[toast.type]}`
  }

  protected icon(type: Toast['type']): string {
    const icons: Record<Toast['type'], string> = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[var(--success)]" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[var(--warning)]" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`,
      danger:  `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[var(--danger)]"  viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`,
      info:    `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[var(--accent)]"   viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`,
    }
    return icons[type]
  }
}
