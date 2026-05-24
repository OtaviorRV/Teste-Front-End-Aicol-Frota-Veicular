import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { delay } from 'rxjs/operators'
import { environment } from '../../../../environments/environment'
import { LoginDto, AuthResponse } from '../models/auth.models'

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient)

  login(credentials: LoginDto): Observable<AuthResponse> {
    if (environment.useMock) {
      const payload = btoa(JSON.stringify({
        sub: '1',
        nickname: 'aivacol',
        name: 'Usuário Aivacol',
        email: 'aivacol@aivacol.com',
      }))
      const mockToken = `eyJhbGciOiJub25lIn0.${payload}.mock`
      return of({
        token: mockToken,
        user: { id: '1', nickname: 'aivacol', name: 'Usuário Aivacol', email: 'aivacol@aivacol.com' },
      }).pipe(delay(400))
    }
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
  }
}
