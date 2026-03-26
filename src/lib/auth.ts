import { apiFetch } from './api'

type LoginPayload = {
  email: string
  password: string
}

type LoginResponse = {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

type ForgotPasswordPayload = {
  email: string
}

type ForgotPasswordResponse = {
  success: boolean
  message: string
}

export async function login(data: LoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function forgotPassword(data: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}