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
    <div class="w-full max-w-sm rounded-[9px] border border-border bg-surface-raised p-8">

      <div class="mb-6 flex flex-col gap-1">
        <span class="text-[22px] font-bold tracking-tight text-text">Aivacol</span>
        <h1 class="text-[15px] font-semibold text-text">Bem-vindo de volta</h1>
        <p class="text-[13px] text-muted">Entre com suas credenciais</p>
      </div>

      @if (loginError()) {
        <div
          class="mb-4 rounded-[5px] border border-danger bg-danger-soft px-3 py-2 text-[13px] text-danger-text"
          role="alert"
        >
          {{ loginError() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">

        <app-input-field
          label="E-mail"
          type="email"
          formControlName="email"
          [required]="true"
          [error]="emailError()"
        />

        <div class="relative">
          <app-input-field
            label="Senha"
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            [required]="true"
          />
          <button
            type="button"
            class="absolute right-2.5 top-[26px] text-muted transition-colors hover:text-text"
            (click)="showPassword.set(!showPassword())"
            [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'"
          >
            @if (showPassword()) {
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
              </svg>
            }
          </button>
        </div>

        <app-button
          type="submit"
          variant="primary"
          size="md"
          [loading]="saving()"
          [disabled]="saving()"
          class="mt-2 w-full"
        >
          {{ saving() ? 'Entrando...' : 'Entrar' }}
        </app-button>

      </form>
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
