import { User } from '../../../core/auth/user.model'

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}
