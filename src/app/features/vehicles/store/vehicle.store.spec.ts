import { fakeAsync, TestBed, tick } from '@angular/core/testing'
import { of } from 'rxjs'
import { CreateVehicleDto } from '../models/vehicle-dto.models'
import { Vehicle } from '../models/vehicle.model'
import { VehicleApiService } from '../services/vehicle-api.service'
import { VehicleStore } from './vehicle.store'

function mockVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v1',
    license_plate: 'ABC1234',
    chassis: '9BWZZZ377VT004251',
    renavam: '00123456789',
    year: 2022,
    model_id: 'm1',
    status: 'disponivel',
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'aivacol',
    ...overrides,
  }
}

const mockDto: CreateVehicleDto = {
  license_plate: 'ZZZ9999',
  chassis: '1HGCM82633A004352',
  renavam: '99999999999',
  year: 2023,
  model_id: 'm2',
  brand_id: 'b1',
  created_by: 'aivacol',
}

describe('VehicleStore', () => {
  let store: VehicleStore
  let apiMock: jasmine.SpyObj<VehicleApiService>

  beforeEach(() => {
    apiMock = jasmine.createSpyObj('VehicleApiService', [
      'getAll', 'create', 'update', 'remove', 'checkFieldExists',
    ])

    TestBed.configureTestingModule({
      providers: [
        VehicleStore,
        { provide: VehicleApiService, useValue: apiMock },
      ],
    })
    store = TestBed.inject(VehicleStore)
  })

  it('initial state: empty vehicles, loading false, total 0, no error', () => {
    expect(store.vehicles()).toEqual([])
    expect(store.loading()).toBe(false)
    expect(store.total()).toBe(0)
    expect(store.loadError()).toBe(false)
  })

  it('isEmpty is true when vehicles is empty and not loading', () => {
    expect(store.isEmpty()).toBe(true)
  })

  it('isEmpty is false when vehicles has entries', fakeAsync(() => {
    apiMock.getAll.and.returnValue(of({ data: [mockVehicle()], total: 1 }))
    store.loadVehicles()
    tick()
    expect(store.isEmpty()).toBe(false)
  }))

  it('loadVehicles sets loading=true then populates vehicles on response', fakeAsync(() => {
    apiMock.getAll.and.returnValue(of({ data: [mockVehicle()], total: 1 }))

    store.loadVehicles()
    expect(store.loading()).toBe(true)

    tick()

    expect(store.loading()).toBe(false)
    expect(store.vehicles()).toHaveSize(1)
    expect(store.total()).toBe(1)
  }))

  it('createVehicle inserts new vehicle at top of list via tap', fakeAsync(() => {
    const existing = mockVehicle({ id: 'v1' })
    const created = mockVehicle({ id: 'v2', license_plate: 'ZZZ9999' })
    store.vehicles.set([existing])
    store.total.set(1)

    apiMock.create.and.returnValue(of(created))
    store.createVehicle(mockDto).subscribe()
    tick()

    expect(store.vehicles()[0].id).toBe('v2')
    expect(store.total()).toBe(2)
  }))

  it('deleteVehicle removes vehicle from list and decrements total', fakeAsync(() => {
    store.vehicles.set([mockVehicle({ id: 'v1' }), mockVehicle({ id: 'v2' })])
    store.total.set(2)

    apiMock.remove.and.returnValue(of(undefined))
    store.deleteVehicle('v1').subscribe()
    tick()

    expect(store.vehicles().find(v => v.id === 'v1')).toBeUndefined()
    expect(store.total()).toBe(1)
  }))

  it('hasActiveFilters is false on default filters', () => {
    expect(store.hasActiveFilters()).toBe(false)
  })

  it('hasActiveFilters is true when search filter is set', () => {
    store.filters.update(f => ({ ...f, search: 'ABC' }))
    expect(store.hasActiveFilters()).toBe(true)
  })
})
