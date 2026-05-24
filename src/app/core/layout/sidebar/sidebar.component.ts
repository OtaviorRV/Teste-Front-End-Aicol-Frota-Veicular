import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router, RouterLink } from '@angular/router'
import { filter, map } from 'rxjs/operators'
import { AuthStore } from '../../auth/auth.store'

interface NavItem {
  label: string
  route: string
  icon: string
  children?: NavItem[]
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex h-full flex-col bg-surface-raised">

      <!-- Brand -->
      <div class="flex h-[48px] shrink-0 items-center gap-2.5 border-b border-border px-4">
        <div class="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] bg-brand-500 text-[10px] font-bold text-white">
          A
        </div>
        <span class="text-[13.5px] font-semibold text-text">Aivacol</span>
      </div>

      <!-- Nav -->
      <nav role="navigation" class="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">

        <!-- Seção GESTÃO -->
        <span class="mb-1 px-2 text-[10.5px] font-medium uppercase tracking-[0.06em] text-subtle">Gestão</span>

        @for (item of gestaoItems; track item.route) {
          @if (!item.children) {
            <a
              [routerLink]="item.route"
              [attr.aria-current]="isActive(item.route) ? 'page' : null"
              [class]="navItemClass(item.route)"
            >
              <span [innerHTML]="icons[item.icon]" class="h-4 w-4 shrink-0" aria-hidden="true"></span>
              <span>{{ item.label }}</span>
            </a>
          } @else {
            <!-- Parent com children (Catálogo) -->
            <div
              [class]="navItemClass(item.route) + ' cursor-default'"
            >
              <span [innerHTML]="icons[item.icon]" class="h-4 w-4 shrink-0" aria-hidden="true"></span>
              <span>{{ item.label }}</span>
            </div>
            @for (child of item.children; track child.route) {
              <a
                [routerLink]="child.route"
                [attr.aria-current]="isActive(child.route) ? 'page' : null"
                [class]="childItemClass(child.route)"
              >
                {{ child.label }}
              </a>
            }
          }
        }

        <div class="my-2 border-t border-border"></div>

        <!-- Seção SISTEMA -->
        <span class="mb-1 px-2 text-[10.5px] font-medium uppercase tracking-[0.06em] text-subtle">Sistema</span>

        @for (item of sistemaItems; track item.route) {
          <a
            [routerLink]="item.route"
            [attr.aria-current]="isActive(item.route) ? 'page' : null"
            [class]="navItemClass(item.route)"
          >
            <span [innerHTML]="icons[item.icon]" class="h-4 w-4 shrink-0" aria-hidden="true"></span>
            <span>{{ item.label }}</span>
          </a>
        }

      </nav>

      <!-- Footer — User pill -->
      <div class="shrink-0 border-t border-border p-2">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-[5px] px-2 py-1.5 text-left transition-colors duration-[80ms] hover:bg-surface-elevated"
          (click)="logout()"
        >
          <div class="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-soft-text">
            {{ userInitials() }}
          </div>
          <div class="flex min-w-0 flex-col">
            <span class="truncate text-[12.5px] font-medium text-text">{{ user()?.nickname }}</span>
            <span class="text-[11px] text-subtle">Sair</span>
          </div>
        </button>
      </div>

    </div>
  `,
})
export class SidebarComponent {
  private readonly authStore = inject(AuthStore)
  private readonly router = inject(Router)

  readonly user = this.authStore.user

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  )

  readonly userInitials = computed(() => {
    const name = this.user()?.name ?? ''
    return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'A'
  })

  readonly gestaoItems: NavItem[] = [
    { label: 'Veículos',  route: '/vehicles', icon: 'car' },
    {
      label: 'Catálogo', route: '/catalog', icon: 'folder',
      children: [
        { label: 'Marcas',  route: '/catalog/brands', icon: 'tag' },
        { label: 'Modelos', route: '/catalog/models', icon: 'tag' },
      ],
    },
    { label: 'Histórico', route: '/history', icon: 'clipboard' },
  ]

  readonly sistemaItems: NavItem[] = [
    { label: 'Auditoria', route: '/audit', icon: 'search' },
  ]

  isActive(route: string): boolean {
    return this.currentUrl().startsWith(route)
  }

  navItemClass(route: string): string {
    const base = 'flex items-center gap-2.5 rounded-[5px] px-2.5 py-1.5 text-[13px] transition-colors duration-[80ms]'
    return this.isActive(route)
      ? `${base} bg-surface-elevated font-[550] text-text`
      : `${base} font-[450] text-muted hover:bg-surface-elevated hover:text-text`
  }

  childItemClass(route: string): string {
    const base = 'flex items-center rounded-[5px] py-1 pl-[30px] pr-2.5 text-[12.5px] transition-colors duration-[80ms]'
    return this.isActive(route)
      ? `${base} font-[550] text-text`
      : `${base} text-muted hover:text-text`
  }

  logout(): void {
    this.authStore.logout()
  }

  readonly icons: Record<string, string> = {
    car: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-.82 1.573L3 7.28V13a1 1 0 001 1h.268a2.5 2.5 0 014.464 0h2.536a2.5 2.5 0 014.464 0H16a1 1 0 001-1V7.28l.82-1.707A1 1 0 0017 4H3zm.382 2h13.236L16 7H4l-.618-1zM5 8h10v4H5V8z"/></svg>`,
    folder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>`,
    clipboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>`,
    tag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>`,
  }
}
