import { Brand, VehicleModel } from '../models/catalog.models'

export function canDeleteBrand(
  brand: Brand,
  modelCount: number
): { allowed: boolean; reason?: string } {
  if (modelCount > 0) {
    return {
      allowed: false,
      reason: `Marca possui ${modelCount} modelo(s) vinculado(s) e não pode ser excluída.`,
    }
  }
  return { allowed: true }
}

export function canDeleteModel(
  _model: VehicleModel,
  vehicleCount: number
): { allowed: boolean; reason?: string } {
  if (vehicleCount > 0) {
    return {
      allowed: false,
      reason: `Modelo possui ${vehicleCount} veículo(s) vinculado(s) e não pode ser excluído.`,
    }
  }
  return { allowed: true }
}
