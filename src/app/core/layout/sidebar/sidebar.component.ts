import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
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
  host: { style: 'display:contents' },
  imports: [RouterLink],
  template: `
    <!-- Brand -->
    <div class="sidebar-brand">
      <div class="brand-mark">A</div>
      <span class="brand-name">Aicol</span>
    </div>

    <!-- Nav -->
    <nav role="navigation" style="flex:1;overflow-y:auto">

      <!-- Seção OPERAÇÃO -->
      <div class="sidebar-section">
        <span class="sidebar-section-label">Operação</span>
        @for (item of operacaoItems; track item.route) {
          @if (!item.children) {
            <a
              [routerLink]="item.route"
              [attr.aria-current]="isActive(item.route) ? 'page' : null"
              [class]="'sidebar-nav-item' + (isActive(item.route) ? ' active' : '')"
            >
              <span [innerHTML]="icons[item.icon]" class="sidebar-nav-icon" aria-hidden="true"></span>
              <span>{{ item.label }}</span>
            </a>
          } @else {
            <a
              [routerLink]="item.route"
              [attr.aria-current]="isActiveParent(item) ? 'page' : null"
              [class]="'sidebar-nav-item' + (isActiveParent(item) ? ' active' : '')"
            >
              <span [innerHTML]="icons[item.icon]" class="sidebar-nav-icon" aria-hidden="true"></span>
              <span>{{ item.label }}</span>
            </a>
            @for (child of item.children; track child.route) {
              <a
                [routerLink]="child.route"
                [attr.aria-current]="isActive(child.route) ? 'page' : null"
                [class]="'sidebar-nav-item child' + (isActive(child.route) ? ' active' : '')"
              >{{ child.label }}</a>
            }
          }
        }
      </div>

      <!-- Seção CONFIGURAÇÃO -->
      <div class="sidebar-section">
        <span class="sidebar-section-label">Configuração</span>
        @for (item of configuracaoItems; track item.route) {
          @if (!item.children) {
            <a
              [routerLink]="item.route"
              [attr.aria-current]="isActive(item.route) ? 'page' : null"
              [class]="'sidebar-nav-item' + (isActive(item.route) ? ' active' : '')"
            >
              <span [innerHTML]="icons[item.icon]" class="sidebar-nav-icon" aria-hidden="true"></span>
              <span>{{ item.label }}</span>
            </a>
          } @else {
            <a
              [routerLink]="item.route"
              [attr.aria-current]="isActiveParent(item) ? 'page' : null"
              [class]="'sidebar-nav-item' + (isActiveParent(item) ? ' active' : '')"
            >
              <span [innerHTML]="icons[item.icon]" class="sidebar-nav-icon" aria-hidden="true"></span>
              <span>{{ item.label }}</span>
            </a>
            @for (child of item.children; track child.route) {
              <a
                [routerLink]="child.route"
                [attr.aria-current]="isActive(child.route) ? 'page' : null"
                [class]="'sidebar-nav-item child' + (isActive(child.route) ? ' active' : '')"
              >{{ child.label }}</a>
            }
          }
        }
      </div>

    </nav>

    <!-- Footer — User pill -->
    <div class="sidebar-footer" style="position:relative">
      <div class="user-pill" (click)="toggleUserMenu()">
        <div class="avatar">{{ userInitials() }}</div>
        <div style="flex:1;min-width:0">
          <div class="fw-600 text-sm truncate">{{ user()?.name || user()?.nickname }}</div>
          <div class="text-xs text-subtle truncate">{{ user()?.email }}</div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--text-subtle)">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
      @if (userMenuOpen()) {
        <div style="position:absolute;bottom:calc(100% + 4px);left:0;right:0;background:var(--bg-raised);border:1px solid var(--border);border-radius:6px;box-shadow:var(--shadow-overlay);padding:4px;z-index:20">
          <div class="sidebar-nav-item" style="color:var(--danger-text)" (click)="logout(); userMenuOpen.set(false)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="sidebar-nav-icon" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <path d="M16 17l5-5-5-5"/>
              <path d="M21 12H9"/>
            </svg>
            <span>Sair</span>
          </div>
        </div>
      }
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

  readonly userMenuOpen = signal(false)

  readonly operacaoItems: NavItem[] = [
    { label: 'Veículos',  route: '/vehicles', icon: 'car' },
    { label: 'Histórico', route: '/history',  icon: 'clock' },
  ]

  readonly configuracaoItems: NavItem[] = [
    {
      label: 'Catálogo', route: '/catalog', icon: 'folder',
      children: [
        { label: 'Marcas',  route: '/catalog/brands', icon: 'tag' },
        { label: 'Modelos', route: '/catalog/models', icon: 'tag' },
      ],
    },
    { label: 'Auditoria', route: '/audit', icon: 'search' },
  ]

  isActive(route: string): boolean {
    return this.currentUrl().startsWith(route)
  }

  isActiveParent(item: NavItem): boolean {
    return !!item.children?.some(c => this.isActive(c.route))
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v)
  }

  logout(): void {
    this.authStore.logout()
  }

  readonly icons: Record<string, string> = {
    car: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-.82 1.573L3 7.28V13a1 1 0 001 1h.268a2.5 2.5 0 014.464 0h2.536a2.5 2.5 0 014.464 0H16a1 1 0 001-1V7.28l.82-1.707A1 1 0 0017 4H3zm.382 2h13.236L16 7H4l-.618-1zM5 8h10v4H5V8z"/></svg>`,
    folder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>`,
    clipboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>`,
    clock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>`,
    tag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>`,
  }
}
