import { BadgeVariant } from '../../../shared/components/atoms/badge/badge.component'
import { Vehicle, VehicleStatus } from '../models/vehicle.model'
import { PlateFormatPipe } from '../../../shared/pipes/plate-format.pipe'

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

export function canDeleteVehicle(vehicle: Vehicle): { allowed: boolean; reason?: string } {
  if (vehicle.status === 'em_locacao') {
    return { allowed: false, reason: 'Veículo em locação ativa não pode ser excluído.' }
  }
  if (vehicle.status === 'em_manutencao') {
    return { allowed: false, reason: 'Veículo em manutenção não pode ser excluído.' }
  }
  return { allowed: true }
}
