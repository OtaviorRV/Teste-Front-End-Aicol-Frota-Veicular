import { Pipe, PipeTransform } from '@angular/core'

@Pipe({ name: 'plateFormat', standalone: true, pure: true })
export class PlateFormatPipe implements PipeTransform {
  transform(value: string | null | undefined, separator: '-' | '·' | ' ' = '·'): string {
    if (!value) return ''
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (/^[A-Z]{3}\d{4}$/.test(clean)) {
      return `${clean.slice(0, 3)}${separator}${clean.slice(3)}`
    }
    if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(clean)) {
      return clean
    }
    return value
  }
}
