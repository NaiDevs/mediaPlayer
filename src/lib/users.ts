import { apiFetch } from './api'

export type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'viewer' | 'editor'
  createdAt: string
}

type ListUsersParams = {
  limit?: number
  offset?: number
}

type ListUsersResponse = {
  users: User[]
  total: number
}

type ApiResponse = {
  items: User[]
  total: number
  limit: number
  offset: number
}

type CreateUserPayload = {
  name: string
  email: string
  password: string
  role: User['role']
}

type UpdateUserPayload = {
  name?: string
  email?: string
  role?: User['role']
}

export async function listUsers(params: ListUsersParams = {}): Promise<ListUsersResponse> {
  const searchParams = new URLSearchParams()
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.offset) searchParams.set('offset', String(params.offset))
  
  const query = searchParams.toString()
  const endpoint = `/users${query ? `?${query}` : ''}`
  
  const response = await apiFetch<ApiResponse | ListUsersResponse | User[]>(endpoint)
  
  if (Array.isArray(response)) {
    return { users: response, total: response.length }
  }
  
  if ('items' in response) {
    return { users: response.items, total: response.total }
  }
  
  return response as ListUsersResponse
}

export async function createUser(data: CreateUserPayload): Promise<User> {
  return apiFetch<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUser(userId: string, data: UpdateUserPayload): Promise<User> {
  return apiFetch<User>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteUser(userId: string): Promise<void> {
  await apiFetch<void>(`/users/${userId}`, {
    method: 'DELETE',
  })
}

type ResetPasswordPayload = {
  newPassword: string
}

type ResetPasswordResponse = {
  success: boolean
  message: string
}

export async function resetUserPassword(userId: string, data: ResetPasswordPayload): Promise<ResetPasswordResponse> {
  return apiFetch<ResetPasswordResponse>(`/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}