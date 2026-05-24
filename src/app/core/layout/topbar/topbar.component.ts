import { ChangeDetectionStrategy, Component, computed, effect, inject, output, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router, RouterLink } from '@angular/router'
import { filter, map } from 'rxjs/operators'
import { AuthStore } from '../../auth/auth.store'

interface Crumb {
  label: string
  route?: string
}

function buildCrumbs(url: string): Crumb[] {
  if (url.startsWith('/vehicles/new'))         return [{ label: 'Veículos', route: '/vehicles' }, { label: 'Novo' }]
  if (/^\/vehicles\/.+\/edit/.test(url))       return [{ label: 'Veículos', route: '/vehicles' }, { label: 'Editar' }]
  if (url.startsWith('/vehicles'))             return [{ label: 'Veículos' }]
  if (url.startsWith('/catalog/brands'))       return [{ label: 'Catálogo', route: '/catalog/brands' }, { label: 'Marcas' }]
  if (url.startsWith('/catalog/models'))       return [{ label: 'Catálogo', route: '/catalog/models' }, { label: 'Modelos' }]
  if (url.startsWith('/history'))              return [{ label: 'Histórico' }]
  if (url.startsWith('/audit'))                return [{ label: 'Auditoria' }]
  return []
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex h-full w-full items-center justify-between px-4">

      <!-- Left: hamburger + breadcrumb -->
      <div class="flex items-center gap-3">

        <!-- Hamburger — mobile only -->
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-[5px] text-muted transition-colors hover:bg-surface-elevated hover:text-text md:hidden"
          (click)="menuToggle.emit()"
          aria-label="Abrir menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
          </svg>
        </button>

        <!-- Breadcrumb -->
        <nav aria-label="Breadcrumb">
          <ol class="flex items-center gap-1.5">
            @for (crumb of crumbs(); track crumb.label; let last = $last) {
              <li class="flex items-center gap-1.5">
                @if (!last) {
                  @if (crumb.route) {
                    <a [routerLink]="crumb.route" class="text-[13px] text-muted transition-colors hover:text-text">
                      {{ crumb.label }}
                    </a>
                  } @else {
                    <span class="text-[13px] text-muted">{{ crumb.label }}</span>
                  }
                  <span class="text-[10px] text-subtle" aria-hidden="true">›</span>
                } @else {
                  <span class="text-[13px] font-medium text-text" aria-current="page">{{ crumb.label }}</span>
                }
              </li>
            }
          </ol>
        </nav>

      </div>

      <!-- Right: theme toggle + avatar dropdown -->
      <div class="flex items-center gap-1">

        <!-- Theme toggle -->
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-[5px] text-muted transition-colors hover:bg-surface-elevated hover:text-text"
          (click)="toggleTheme()"
          [attr.aria-label]="theme() === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
        >
          @if (theme() === 'dark') {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
          }
        </button>

        <!-- Avatar dropdown -->
        <div class="relative">
          <button
            type="button"
            class="flex h-7 items-center gap-1.5 rounded-[5px] px-2 text-muted transition-colors hover:bg-surface-elevated hover:text-text"
            (click)="dropdownOpen.update(v => !v)"
            [attr.aria-expanded]="dropdownOpen()"
            aria-haspopup="menu"
          >
            <div class="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-soft-text">
              {{ initials() }}
            </div>
            <span class="hidden text-[12.5px] font-medium md:block">{{ user()?.nickname }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>

          @if (dropdownOpen()) {
            <div
              class="absolute right-0 top-full z-50 mt-1 w-40 rounded-[6px] border border-border bg-surface-raised py-1 shadow-md"
              role="menu"
            >
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-elevated hover:text-text"
                role="menuitem"
                (click)="logout()"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
                </svg>
                Sair
              </button>
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class TopbarComponent {
  private readonly authStore = inject(AuthStore)
  private readonly router = inject(Router)

  readonly menuToggle = output<void>()

  readonly user = this.authStore.user

  readonly crumbs = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => buildCrumbs((e as NavigationEnd).urlAfterRedirects))
    ),
    { initialValue: buildCrumbs(this.router.url) }
  )

  readonly theme = signal<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') ?? 'dark'
  )

  readonly dropdownOpen = signal(false)

  readonly initials = computed(() => {
    const name = this.user()?.name ?? this.user()?.nickname ?? ''
    return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'A'
  })

  constructor() {
    effect(() => {
      const t = this.theme()
      document.documentElement.setAttribute('data-theme', t)
      localStorage.setItem('theme', t)
    })
  }

  toggleTheme(): void {
    this.theme.update(t => t === 'dark' ? 'light' : 'dark')
  }

  logout(): void {
    this.authStore.logout()
  }
}
