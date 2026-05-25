import { BadgeVariant } from '../../../shared/components/atoms/badge/badge.component'
import { OperationType, Vehicle, VehicleStatus } from '../models/vehicle.model'
import { PlateFormatPipe } from '../../../shared/pipes/plate-format.pipe'

export const ALLOWED_OPERATIONS: Record<VehicleStatus, OperationType[]> = {
  disponivel:    ['check_out', 'maintenance', 'deactivation'],
  em_locacao:    ['check_in'],
  em_manutencao: ['check_in', 'deactivation'],
  inativo:       ['reactivation'],
}

export const NEXT_STATUS: Record<OperationType, VehicleStatus> = {
  check_out:    'em_locacao',
  check_in:     'disponivel',
  maintenance:  'em_manutencao',
  deactivation: 'inativo',
  reactivation: 'disponivel',
}

export const OPERATION_LABEL: Record<OperationType, string> = {
  check_out:    'Saída',
  check_in:     'Entrada',
  maintenance:  'Manutenção',
  deactivation: 'Desativação',
  reactivation: 'Reativação',
}

export const OPERATION_VARIANT: Record<OperationType, BadgeVariant> = {
  check_out:    'info',
  check_in:     'success',
  maintenance:  'warning',
  deactivation: 'danger',
  reactivation: 'success',
}

export function vehicleStatusVariant(status: VehicleStatus): BadgeVariant {
  const map: Record<VehicleStatus, BadgeVariant> = {
    disponivel:     'success',
    em_locacao:     'info',
    em_manutencao:  'warning',
    inativo:        'neutral',
  }
  return map[status]
}

export function vehicleStatusLabel(status: VehicleStatus): string {
  const map: Record<VehicleStatus, string> = {
    disponivel:     'Disponível',
    em_locacao:     'Em Locação',
    em_manutencao:  'Manutenção',
    inativo:        'Inativo',
  }
  return map[status]
}

export function formatPlate(plate: string, separator: '-' | '·' | ' ' = '·'): string {
  return new PlateFormatPipe().transform(plate, separator)
}

export function formatKm(km: number | undefined | null): string {
  if (km == null) return '—'
  return km.toLocaleString('pt-BR') + ' km'
}

export function canDeleteVehicle(vehicle: Vehicle): { allowed: boolean; reason?: string } {
  if (vehicle.status === 'em_locacao') {
    return { allowed: false, reason: 'Veículo em locação ativa não pode ser excluído.' }
  }
  if (vehicle.status === 'em_manutencao') {
    return { allowed: false, reason: 'Veículo em manutenção não pode ser excluído.' }
  }
  return { allowed: true }
}
