import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms'
import { Observable, of, timer } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs/operators'
import { VehicleApiService } from '../services/vehicle-api.service'

export function uniqueFieldValidator(
  api: VehicleApiService,
  field: 'license_plate' | 'chassis' | 'renavam',
  excludeId?: string
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) return of(null)
    return timer(400).pipe(
      switchMap(() => api.checkFieldExists(field, String(control.value), excludeId)),
      map(exists => (exists ? { duplicate: true } : null)),
      catchError(() => of(null))
    )
  }
}
