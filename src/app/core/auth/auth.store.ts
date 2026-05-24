import { Injectable, computed, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { User } from './user.model'

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly token = signal<string | null>(null)
  readonly user = signal<User | null>(null)
  readonly isAuthenticated = computed(() => !!this.token())

  private readonly router = inject(Router)

  constructor() {
    this.hydrateFromStorage()
  }

  setToken(token: string, user: User): void {
    this.token.set(token)
    this.user.set(user)
    localStorage.setItem('auth_token', token)
  }

  logout(): void {
    this.token.set(null)
    this.user.set(null)
    localStorage.removeItem('auth_token')
    this.router.navigate(['/login'])
  }

  private hydrateFromStorage(): void {
    const stored = localStorage.getItem('auth_token')
    if (!stored) return
    try {
      const raw = stored.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
      const padded = raw.padEnd(Math.ceil(raw.length / 4) * 4, '=')
      const payload = JSON.parse(atob(padded))
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('auth_token')
        return
      }
      this.token.set(stored)
      this.user.set({
        id: payload.sub,
        nickname: payload.nickname ?? payload.sub,
        name: payload.name ?? payload.nickname ?? payload.sub,
        email: payload.email ?? '',
      })
    } catch {
      localStorage.removeItem('auth_token')
    }
  }
}
