import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router, RouterOutlet } from '@angular/router'
import { BreakpointObserver } from '@angular/cdk/layout'
import { toSignal } from '@angular/core/rxjs-interop'
import { filter, map } from 'rxjs/operators'
import { SidebarComponent } from '../sidebar/sidebar.component'
import { TopbarComponent } from '../topbar/topbar.component'
import { ToastHostComponent } from '../../toast/toast-host.component'

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ToastHostComponent],
  styles: [`
    :host {
      display: grid;
      grid-template-columns: 232px 1fr;
      grid-template-rows: 48px 1fr;
      grid-template-areas: "sidebar topbar" "sidebar main";
      height: 100vh;
    }
  `],
  template: `
    @if (isMobile() && sidebarOpen()) {
      <div
        class="fixed inset-0 z-20 bg-overlay"
        (click)="sidebarOpen.set(false)"
      ></div>
    }

    <aside [class]="sidebarClass()">
      <app-sidebar />
    </aside>

    <header class="bg-surface-raised border-b border-border flex items-center justify-between px-4" style="grid-area: topbar">
      <app-topbar (menuToggle)="toggleSidebar()" />
    </header>

    <main class="overflow-auto bg-surface-base" style="grid-area: main">
      <router-outlet />
    </main>

    <app-toast-host />
  `,
})
export class DashboardShellComponent {
  private readonly breakpoint = inject(BreakpointObserver)

  readonly isMobile = toSignal(
    this.breakpoint.observe(['(max-width: 767px)']).pipe(map(r => r.matches)),
    { initialValue: false }
  )
  readonly sidebarOpen = signal(false)

  constructor() {
    inject(Router).events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      if (this.isMobile()) this.sidebarOpen.set(false)
    })
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v)
  }

  protected sidebarClass(): string {
    if (!this.isMobile()) {
      return 'bg-surface-raised border-r border-border flex flex-col'
    }
    const base = 'fixed inset-y-0 left-0 z-30 w-64 bg-surface-raised border-r border-border flex flex-col transition-transform duration-200'
    return base + (this.sidebarOpen() ? ' translate-x-0' : ' -translate-x-full')
  }
}
