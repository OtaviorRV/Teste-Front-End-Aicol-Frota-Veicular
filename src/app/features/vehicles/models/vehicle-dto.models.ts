export interface CreateVehicleDto {
  license_plate: string
  chassis: string
  renavam: string
  year: number
  model_id: string
  brand_id: string
  created_by: string
}

export interface UpdateVehicleDto {
  license_plate?: string
  model_id?: string
  brand_id?: string
}
