import { BadgeVariant } from '../../../shared/components/atoms/badge/badge.component'
import { OperationType } from '../models/history.models'

const BADGE_VARIANT_MAP: Record<OperationType, BadgeVariant> = {
  check_in: 'success',
  check_out: 'warning',
  maintenance: 'warning',
  deactivation: 'danger',
  reactivation: 'success',
  status_change: 'neutral',
}

const OPERATION_LABEL_MAP: Record<OperationType, string> = {
  check_in: 'Entrada',
  check_out: 'Saída',
  maintenance: 'Manutenção',
  deactivation: 'Desativação',
  reactivation: 'Reativação',
  status_change: 'Alteração',
}

export function operationBadgeVariant(type: OperationType): BadgeVariant {
  return BADGE_VARIANT_MAP[type]
}

export function operationLabel(type: OperationType): string {
  return OPERATION_LABEL_MAP[type]
}
