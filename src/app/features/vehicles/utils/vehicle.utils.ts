import { BadgeVariant } from '../../../shared/components/atoms/badge/badge.component'
import { VehicleStatus } from '../models/vehicle.model'

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
