import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core'

export type IconName =
  | 'car' | 'folder' | 'list' | 'shield' | 'plus' | 'edit' | 'trash'
  | 'settings' | 'search' | 'x' | 'alert' | 'info' | 'check'
  | 'chevronL' | 'chevronR' | 'chevronD' | 'eye' | 'eyeOff'
  | 'refresh' | 'logout' | 'moon' | 'sun' | 'arrowLeft' | 'filter'
  | 'clock' | 'fileText' | 'database' | 'calendar' | 'arrowDR'
  | 'spinner' | 'chevDown' | 'chevUp' | 'caret'

export const ICON_PATHS: Record<IconName, string[]> = {
  car: [
    'M18 8h1a4 4 0 0 1 0 8h-1',
    'M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z',
    'M6 1v3M10 1v3M14 1v3',
  ],
  folder: [
    'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  ],
  list: [
    'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  ],
  shield: [
    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  ],
  plus: ['M12 5v14M5 12h14'],
  edit: [
    'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7',
    'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  ],
  trash: [
    'M3 6h18',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
  ],
  settings: [
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  ],
  search: ['m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0'],
  x: ['M18 6 6 18M6 6l12 12'],
  alert: [
    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    'M12 9v4M12 17h.01',
  ],
  info: [
    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    'M12 16v-4M12 8h.01',
  ],
  check: ['M20 6 9 17l-5-5'],
  chevronL: ['m15 18-6-6 6-6'],
  chevronR: ['m9 18 6-6-6-6'],
  chevronD: ['m6 9 6 6 6-6'],
  eye: [
    'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z',
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  ],
  eyeOff: [
    'M9.88 9.88a3 3 0 1 0 4.24 4.24',
    'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68',
    'M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61',
    'M2 2l20 20',
  ],
  refresh: [
    'M1 4v6h6',
    'M23 20v-6h-6',
    'M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15',
  ],
  logout: [
    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
    'M16 17l5-5-5-5',
    'M21 12H9',
  ],
  moon: ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'],
  sun: [
    'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
    'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
  ],
  arrowLeft: ['M19 12H5', 'M12 19l-7-7 7-7'],
  filter: ['M22 3H2l8 9.46V19l4 2v-8.54z'],
  clock: [
    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    'M12 6v6l4 2',
  ],
  fileText: [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
    'M16 13H8M16 17H8M10 9H8',
  ],
  database: [
    'M12 2c5.523 0 10 1.79 10 4s-4.477 4-10 4-10-1.79-10-4 4.477-4 10-4z',
    'M2 6v4c0 2.21 4.477 4 10 4s10-1.79 10-4V6',
    'M2 10v4c0 2.21 4.477 4 10 4s10-1.79 10-4v-4',
  ],
  calendar: [
    'M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z',
    'M8 2v4M16 2v4M3 10h18',
  ],
  arrowDR: ['m7 7 10 10', 'M17 7v10H7'],
  spinner: ['M12 2a10 10 0 0 1 10 10'],
  chevDown: ['m6 9 6 6 6-6'],
  chevUp: ['m18 15-6-6-6 6'],
  caret: ['m7 10 5 5 5-5'],
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg', number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
}

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': '"inline-flex"',
    '[style.align-items]': '"center"',
    '[style.flex-shrink]': '"0"',
    'aria-hidden': 'true',
  },
  template: `
    <svg
      [attr.width]="px()"
      [attr.height]="px()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>()
  readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md')

  protected readonly paths = computed(() => ICON_PATHS[this.name()])
  protected readonly px    = computed(() => SIZE_MAP[this.size()])
}
