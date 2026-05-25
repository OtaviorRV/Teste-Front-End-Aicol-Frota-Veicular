import { fakeAsync, TestBed, tick } from '@angular/core/testing'
import { FormControl, ValidationErrors } from '@angular/forms'
import { Observable, of, throwError } from 'rxjs'
import { VehicleApiService } from '../services/vehicle-api.service'
import { uniqueFieldValidator } from './unique-field.validator'

describe('uniqueFieldValidator', () => {
  let apiMock: jasmine.SpyObj<VehicleApiService>

  beforeEach(() => {
    apiMock = jasmine.createSpyObj('VehicleApiService', ['checkFieldExists'])
    TestBed.configureTestingModule({
      providers: [{ provide: VehicleApiService, useValue: apiMock }],
    })
  })

  it('returns null immediately for empty value without calling API', (done) => {
    const validator = uniqueFieldValidator(apiMock, 'license_plate')
    const control = new FormControl('')
    ;(validator(control) as Observable<ValidationErrors | null>).subscribe(result => {
      expect(result).toBeNull()
      expect(apiMock.checkFieldExists).not.toHaveBeenCalled()
      done()
    })
  })

  it('returns null when field does not exist in database', fakeAsync(() => {
    apiMock.checkFieldExists.and.returnValue(of(false))
    const validator = uniqueFieldValidator(apiMock, 'license_plate')
    const control = new FormControl('ABC1234')
    let result: ValidationErrors | null = null

    ;(validator(control) as Observable<ValidationErrors | null>).subscribe(r => (result = r))
    tick(400)

    expect(result).toBeNull()
  }))

  it('returns { duplicate: true } when field already exists', fakeAsync(() => {
    apiMock.checkFieldExists.and.returnValue(of(true))
    const validator = uniqueFieldValidator(apiMock, 'license_plate')
    const control = new FormControl('ABC1234')
    let result: ValidationErrors | null = null

    ;(validator(control) as Observable<ValidationErrors | null>).subscribe(r => (result = r))
    tick(400)

    expect(result).toEqual({ duplicate: true })
  }))

  it('returns null on API error (graceful fallback)', fakeAsync(() => {
    apiMock.checkFieldExists.and.returnValue(throwError(() => new Error('Network error')))
    const validator = uniqueFieldValidator(apiMock, 'license_plate')
    const control = new FormControl('ABC1234')
    let result: ValidationErrors | null = null

    ;(validator(control) as Observable<ValidationErrors | null>).subscribe(r => (result = r))
    tick(400)

    expect(result).toBeNull()
  }))

  it('passes excludeId to API so edit mode does not self-conflict', fakeAsync(() => {
    apiMock.checkFieldExists.and.returnValue(of(false))
    const validator = uniqueFieldValidator(apiMock, 'chassis', 'v-existing-id')
    const control = new FormControl('9BWZZZ377VT004251')

    ;(validator(control) as Observable<ValidationErrors | null>).subscribe()
    tick(400)

    expect(apiMock.checkFieldExists).toHaveBeenCalledWith('chassis', '9BWZZZ377VT004251', 'v-existing-id')
  }))
})
