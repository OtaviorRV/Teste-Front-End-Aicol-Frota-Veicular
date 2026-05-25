import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router'
import { AuthStore } from './auth.store'
import { authGuard, redirectIfAuthenticatedGuard } from './auth.guard'

function mockRouteState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot
}

describe('authGuard', () => {
  describe('when user is authenticated', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AuthStore, useValue: { isAuthenticated: signal(true) } },
        ],
      })
    })

    it('returns true (allows navigation)', () => {
      TestBed.runInInjectionContext(() => {
        const result = authGuard({} as ActivatedRouteSnapshot, mockRouteState('/vehicles'))
        expect(result).toBe(true)
      })
    })
  })

  describe('when user is NOT authenticated', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AuthStore, useValue: { isAuthenticated: signal(false) } },
        ],
      })
    })

    it('redirects to /login with returnUrl query param', () => {
      TestBed.runInInjectionContext(() => {
        const result = authGuard({} as ActivatedRouteSnapshot, mockRouteState('/vehicles'))
        expect(result instanceof UrlTree).toBe(true)
        const tree = result as UrlTree
        expect(tree.toString()).toContain('/login')
        expect(tree.queryParams['returnUrl']).toBe('/vehicles')
      })
    })
  })
})

describe('redirectIfAuthenticatedGuard', () => {
  describe('when user is NOT authenticated', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AuthStore, useValue: { isAuthenticated: signal(false) } },
        ],
      })
    })

    it('returns true (allows navigation to login)', () => {
      TestBed.runInInjectionContext(() => {
        const result = redirectIfAuthenticatedGuard({} as ActivatedRouteSnapshot, mockRouteState('/login'))
        expect(result).toBe(true)
      })
    })
  })

  describe('when user IS authenticated', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AuthStore, useValue: { isAuthenticated: signal(true) } },
        ],
      })
    })

    it('redirects to /vehicles', () => {
      TestBed.runInInjectionContext(() => {
        const result = redirectIfAuthenticatedGuard({} as ActivatedRouteSnapshot, mockRouteState('/login'))
        expect(result instanceof UrlTree).toBe(true)
        const router = TestBed.inject(Router)
        expect(result).toEqual(router.createUrlTree(['/vehicles']))
      })
    })
  })
})
