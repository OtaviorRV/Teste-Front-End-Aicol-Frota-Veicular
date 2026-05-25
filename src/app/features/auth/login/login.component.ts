import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, ActivatedRoute } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'
import { map } from 'rxjs/operators'
import { finalize } from 'rxjs/operators'
import { AuthApiService } from '../services/auth-api.service'
import { AuthStore } from '../../../core/auth/auth.store'
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component'
import { InputFieldComponent } from '../../../shared/components/atoms/input-field/input-field.component'

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, InputFieldComponent],
  template: `
    <div class="auth-card">

      <div class="auth-brand">
        <div class="brand-mark" style="width: 26px; height: 26px; font-size: 13px">A</div>
        <span class="name">Aicol</span>
        <span class="badge outline" style="font-size: 10px">Gestão de Frota</span>
      </div>
      <h1 class="auth-title">Bem-vindo de volta</h1>
      <p class="auth-subtitle">Entre com suas credenciais para acessar o painel.</p>

      @if (loginError()) {
        <div class="alert danger" style="margin-bottom: 14px" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0; margin-top: 1px">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>{{ loginError() }}</div>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" style="display:flex;flex-direction:column;gap:16px" noValidate>

        <app-input-field
          label="E-mail"
          type="email"
          placeholder="aivacol@aicol.com.br"
          autocomplete="username"
          formControlName="email"
          [required]="true"
          [error]="emailError()"
        />

        <app-input-field
          label="Senha"
          [type]="showPassword() ? 'text' : 'password'"
          placeholder="••••••••"
          autocomplete="current-password"
          formControlName="password"
          [required]="true"
          [hasTrailing]="true"
        >
          <button
            trailingButton
            type="button"
            class="btn icon"
            (click)="showPassword.set(!showPassword())"
            [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'"
            [attr.title]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'"
          >
            @if (showPassword()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A11 11 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13 13 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            }
          </button>
        </app-input-field>

        <app-button
          type="submit"
          variant="primary"
          size="lg"
          [loading]="saving()"
          [disabled]="saving()"
          [block]="true"
        >
          {{ saving() ? 'Entrando…' : 'Entrar' }}
        </app-button>

      </form>

      <div style="margin-top: 18px; padding: 10px 12px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 6px; font-size: 11.5px; color: var(--text-muted); line-height: 1.55">
        <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 4px">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <span style="font-weight: 600; color: var(--text)">Credenciais de demonstração</span>
        </div>
        <div>
          E-mail <span class="mono">aivacol&#64;aicol.com.br</span> ·
          senha <span class="mono">aivacol</span>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly authApi = inject(AuthApiService)
  private readonly authStore = inject(AuthStore)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)

  readonly returnUrl = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(
      map(params => {
        const url = params.get('returnUrl') ?? '/vehicles'
        return url.startsWith('/') && !url.startsWith('//') ? url : '/vehicles'
      })
    ),
    { initialValue: '/vehicles' }
  )

  readonly saving = signal(false)
  readonly loginError = signal<string | null>(null)
  readonly showPassword = signal(false)

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  })

  protected emailError(): string | null {
    const ctrl = this.form.controls.email
    if (!ctrl.touched || ctrl.valid) return null
    if (ctrl.hasError('required')) return 'E-mail obrigatório'
    if (ctrl.hasError('email')) return 'E-mail inválido'
    return null
  }

  onSubmit(): void {
    if (this.saving()) return
    this.form.markAllAsTouched()
    if (this.form.invalid) return
    this.saving.set(true)
    this.loginError.set(null)

    this.authApi.login(this.form.getRawValue()).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: ({ token, user }) => {
        this.authStore.setToken(token, user)
        this.router.navigateByUrl(this.returnUrl())
      },
      error: (err: HttpErrorResponse) => {
        this.loginError.set(
          err.status === 401
            ? 'E-mail ou senha incorretos'
            : 'Erro ao conectar. Tente novamente.'
        )
      },
    })
  }
}
