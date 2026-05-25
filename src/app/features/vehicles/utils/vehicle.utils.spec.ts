import { Vehicle } from '../models/vehicle.model'
import {
  ALLOWED_OPERATIONS,
  canDeleteVehicle,
  formatKm,
  vehicleStatusLabel,
  vehicleStatusVariant,
} from './vehicle.utils'

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

describe('canDeleteVehicle', () => {
  it('blocks vehicle in active rental (em_locacao)', () => {
    const result = canDeleteVehicle(mockVehicle({ status: 'em_locacao' }))
    expect(result.allowed).toBe(false)
    expect(result.reason).toBeTruthy()
  })

  it('blocks vehicle in maintenance (em_manutencao)', () => {
    const result = canDeleteVehicle(mockVehicle({ status: 'em_manutencao' }))
    expect(result.allowed).toBe(false)
    expect(result.reason).toBeTruthy()
  })

  it('allows deletion of available vehicle (disponivel)', () => {
    const result = canDeleteVehicle(mockVehicle({ status: 'disponivel' }))
    expect(result.allowed).toBe(true)
  })

  it('allows deletion of inactive vehicle (inativo)', () => {
    const result = canDeleteVehicle(mockVehicle({ status: 'inativo' }))
    expect(result.allowed).toBe(true)
  })
})

describe('ALLOWED_OPERATIONS', () => {
  it('disponivel: allows check_out, maintenance, deactivation — not check_in', () => {
    expect(ALLOWED_OPERATIONS['disponivel']).toContain('check_out')
    expect(ALLOWED_OPERATIONS['disponivel']).toContain('maintenance')
    expect(ALLOWED_OPERATIONS['disponivel']).toContain('deactivation')
    expect(ALLOWED_OPERATIONS['disponivel']).not.toContain('check_in')
  })

  it('em_locacao: only check_in allowed', () => {
    expect(ALLOWED_OPERATIONS['em_locacao']).toEqual(['check_in'])
  })

  it('em_manutencao: allows check_in and deactivation', () => {
    expect(ALLOWED_OPERATIONS['em_manutencao']).toContain('check_in')
    expect(ALLOWED_OPERATIONS['em_manutencao']).toContain('deactivation')
    expect(ALLOWED_OPERATIONS['em_manutencao']).not.toContain('check_out')
  })

  it('inativo: only reactivation allowed', () => {
    expect(ALLOWED_OPERATIONS['inativo']).toEqual(['reactivation'])
  })
})

describe('formatKm', () => {
  it('returns "—" for null', () => {
    expect(formatKm(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatKm(undefined)).toBe('—')
  })

  it('appends " km" suffix to formatted number', () => {
    const result = formatKm(42000)
    expect(result).toMatch(/\d/)
    expect(result).toContain('km')
  })

  it('handles zero correctly (not treated as falsy)', () => {
    const result = formatKm(0)
    expect(result).toContain('km')
  })
})

describe('vehicleStatusLabel', () => {
  it('maps disponivel', () => expect(vehicleStatusLabel('disponivel')).toBe('Disponível'))
  it('maps em_locacao', () => expect(vehicleStatusLabel('em_locacao')).toBe('Em Locação'))
  it('maps em_manutencao', () => expect(vehicleStatusLabel('em_manutencao')).toBe('Manutenção'))
  it('maps inativo', () => expect(vehicleStatusLabel('inativo')).toBe('Inativo'))
})

describe('vehicleStatusVariant', () => {
  it('disponivel → success', () => expect(vehicleStatusVariant('disponivel')).toBe('success'))
  it('em_locacao → info', () => expect(vehicleStatusVariant('em_locacao')).toBe('info'))
  it('em_manutencao → warning', () => expect(vehicleStatusVariant('em_manutencao')).toBe('warning'))
  it('inativo → neutral', () => expect(vehicleStatusVariant('inativo')).toBe('neutral'))
})
