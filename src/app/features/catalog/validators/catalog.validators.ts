import { Signal } from '@angular/core'
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms'
import { catchError, map, Observable, of, switchMap, timer } from 'rxjs'
import { BrandApiService } from '../services/brand-api.service'
import { ModelApiService } from '../services/model-api.service'

export function uniqueBrandNameValidator(
  brandApi: BrandApiService,
  excludeId?: string
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value?.trim()) return of(null)
    return timer(400).pipe(
      switchMap(() => brandApi.checkNameExists(control.value, excludeId)),
      map(exists => (exists ? { fieldTaken: true } : null)),
      catchError(() => of(null))
    )
  }
}

export function uniqueModelNameValidator(
  modelApi: ModelApiService,
  brandId: Signal<string>,
  excludeId?: string
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const brand = brandId()
    if (!brand || !control.value?.trim()) return of(null)
    return timer(400).pipe(
      switchMap(() => modelApi.checkNameExists(control.value, brand, excludeId)),
      map(exists => (exists ? { fieldTaken: true } : null)),
      catchError(() => of(null))
    )
  }
}
