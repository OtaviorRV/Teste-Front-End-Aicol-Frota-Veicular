export type OperationType =
  | 'check_in'
  | 'check_out'
  | 'maintenance'
  | 'deactivation'
  | 'reactivation'
  | 'status_change'

export interface VehicleOperation {
  id: string
  vehicle_id: string
  vehicle_plate: string
  type: OperationType
  notes?: string
  odometer_km?: number
  expected_return_date?: string
  performed_by: string
  created_at: string
}

export interface CreateOperationDto {
  vehicle_id: string
  type: OperationType
  notes?: string
  odometer_km?: number
  expected_return_date?: string
  created_by: string
}

export interface VehicleOperationFilters {
  vehicle_plate?: string
  type?: OperationType
  date_from?: string
  date_to?: string
  page: number
  page_size: number
}

export interface PaginatedOperationResponse {
  data: VehicleOperation[]
  total: number
}
