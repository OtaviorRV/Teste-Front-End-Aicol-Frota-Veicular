import { TemplateRef } from '@angular/core'

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  width?: string
  render?: (row: T) => string
  cellTemplate?: TemplateRef<{ $implicit: T }>
  headerTemplate?: TemplateRef<void>
  action?: boolean
}
