import { Injectable, signal } from '@angular/core'

export interface Brand {
  id: string
  name: string
}

export interface Model {
  id: string
  name: string
  brand_id: string
}

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  readonly brands = signal<Brand[]>([])
  readonly models = signal<Model[]>([])
  readonly loaded = signal(false)

  loadIfEmpty(): void {
    if (this.loaded()) return
    this.loaded.set(true)
  }
}
