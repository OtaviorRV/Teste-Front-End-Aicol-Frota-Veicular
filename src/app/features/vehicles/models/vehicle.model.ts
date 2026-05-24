export type VehicleStatus = 'disponivel' | 'em_locacao' | 'em_manutencao' | 'inativo'

export interface Vehicle {
  id: string
  license_plate: string
  chassis: string
  renavam: string
  year: number
  model_id: string
  status: VehicleStatus
  brand_name?: string
  model_name?: string
  operation_count?: number
  last_odometer_km?: number
  created_at: string
  created_by: string
}

export interface VehicleFilters {
  search?: string
  status?: VehicleStatus
  brand_id?: string
  year?: number
  page: number
  page_size: number
}

export interface VehicleStatusEvent {
  vehicle_id: string
  new_status: VehicleStatus
}
