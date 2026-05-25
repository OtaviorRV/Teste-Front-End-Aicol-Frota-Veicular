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
        style="position:fixed;inset:0;z-index:20;background:var(--bg-overlay)"
        (click)="sidebarOpen.set(false)"
      ></div>
    }

    <aside class="sidebar" [style]="isMobile() ? mobileSidebarStyle() : null">
      <app-sidebar />
    </aside>

    <header class="topbar">
      <app-topbar (menuToggle)="toggleSidebar()" />
    </header>

    <main class="main">
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

  protected mobileSidebarStyle(): string {
    const base = 'position:fixed;inset-block:0;left:0;z-index:30;width:232px;transition:transform 0.2s'
    return base + (this.sidebarOpen() ? '' : ';transform:translateX(-100%)')
  }
}
