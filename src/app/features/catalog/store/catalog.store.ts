import { Injectable, signal } from '@angular/core'

export interface Brand {
  id: string
  name: string
}

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  readonly brands = signal<Brand[]>([])

  loadIfEmpty(): void {
    // populated in catalog tickets (AFV-31+)
  }
}
