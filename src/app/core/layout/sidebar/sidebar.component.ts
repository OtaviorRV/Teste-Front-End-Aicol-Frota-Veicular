import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router, RouterLink } from '@angular/router'
import { filter, map } from 'rxjs/operators'
import { AuthStore } from '../../auth/auth.store'
import { IconComponent, IconName } from '../../../shared/components/atoms/icon/icon.component'

interface NavItem {
  label: string
  route: string
  icon: IconName
  children?: NavItem[]
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  imports: [RouterLink, IconComponent],
  template: `
    <!-- Brand -->
    <a class="sidebar-brand" [routerLink]="'/vehicles'" style="text-decoration:none">
      <div class="brand-mark">A</div>
      <span class="brand-name">Aicol</span>
    </a>

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
              <app-icon [name]="item.icon" class="sidebar-nav-icon" />
              <span>{{ item.label }}</span>
            </a>
          } @else {
            <a
              [routerLink]="item.route"
              [attr.aria-current]="isActiveParent(item) ? 'page' : null"
              [class]="'sidebar-nav-item' + (isActiveParent(item) ? ' active' : '')"
            >
              <app-icon [name]="item.icon" class="sidebar-nav-icon" />
              <span>{{ item.label }}</span>
            </a>
            @for (child of item.children; track child.route) {
              <a
                [routerLink]="child.route"
                [attr.aria-current]="isActive(child.route) ? 'page' : null"
                [class]="'sidebar-nav-item child' + (isActive(child.route) ? ' active' : '')"
              >
                <app-icon [name]="child.icon" class="sidebar-nav-icon" />
                <span>{{ child.label }}</span>
              </a>
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
              <app-icon [name]="item.icon" class="sidebar-nav-icon" />
              <span>{{ item.label }}</span>
            </a>
          } @else {
            <a
              [routerLink]="item.route"
              [attr.aria-current]="isActiveParent(item) ? 'page' : null"
              [class]="'sidebar-nav-item' + (isActiveParent(item) ? ' active' : '')"
            >
              <app-icon [name]="item.icon" class="sidebar-nav-icon" />
              <span>{{ item.label }}</span>
            </a>
            @for (child of item.children; track child.route) {
              <a
                [routerLink]="child.route"
                [attr.aria-current]="isActive(child.route) ? 'page' : null"
                [class]="'sidebar-nav-item child' + (isActive(child.route) ? ' active' : '')"
              >
                <app-icon [name]="child.icon" class="sidebar-nav-icon" />
                <span>{{ child.label }}</span>
              </a>
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
            <app-icon name="logout" class="sidebar-nav-icon" />
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
    { label: 'Catálogo', route: '/catalog', icon: 'folder' },
    { label: 'Auditoria', route: '/audit',   icon: 'shield' },
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

}
