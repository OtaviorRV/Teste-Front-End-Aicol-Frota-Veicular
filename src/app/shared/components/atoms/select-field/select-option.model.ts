export interface SelectOption<T = string> {
  value: T
  label: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  disabled?: boolean
}
