export interface Brand {
  id: string
  name: string
  created_at: string
  created_by: string
}

export interface VehicleModel {
  id: string
  name: string
  brand_id: string
  created_at: string
  created_by: string
}

export interface CreateBrandDto {
  name: string
  created_by: string
}

export interface UpdateBrandDto {
  name?: string
}

export interface CreateModelDto {
  name: string
  brand_id: string
  created_by: string
}

export interface UpdateModelDto {
  name?: string
  brand_id?: string
}
