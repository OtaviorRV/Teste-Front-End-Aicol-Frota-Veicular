export interface CreateVehicleDto {
  license_plate: string
  chassis: string
  renavam: string
  year: number
  model_id: string
}

export interface UpdateVehicleDto {
  license_plate?: string
  model_id?: string
}
