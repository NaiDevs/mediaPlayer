import { apiFetch } from './api'

export type AppItem = {
  id: string
  name: string
  appId: string
  apiKey?: string
  status: 'active' | 'inactive'
  createdAt: string
}

type ListAppsParams = {
  limit?: number
  offset?: number
}

type ListAppsResponse = {
  apps: AppItem[]
  total: number
}

type ApiResponse = {
  items: AppItem[]
  total: number
  limit: number
  offset: number
}

type CreateAppPayload = {
  name: string
  appId?: string
  status?: 'active' | 'inactive'
}

type UpdateAppPayload = {
  name?: string
  status?: 'active' | 'inactive'
}

type RotateApiKeyResponse = {
  apiKey: string
}

export async function listApps(params: ListAppsParams = {}): Promise<ListAppsResponse> {
  const searchParams = new URLSearchParams()
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.offset) searchParams.set('offset', String(params.offset))
  
  const query = searchParams.toString()
  const endpoint = `/apps${query ? `?${query}` : ''}`
  
  const response = await apiFetch<ApiResponse | ListAppsResponse | AppItem[]>(endpoint)
  
  if (Array.isArray(response)) {
    return { apps: response, total: response.length }
  }
  
  if ('items' in response) {
    return { apps: response.items, total: response.total }
  }
  
  return response as ListAppsResponse
}

export async function createApp(data: CreateAppPayload): Promise<AppItem> {
  return apiFetch<AppItem>('/apps', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateApp(appId: string, data: UpdateAppPayload): Promise<AppItem> {
  return apiFetch<AppItem>(`/apps/${appId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteApp(appId: string): Promise<void> {
  await apiFetch<void>(`/apps/${appId}`, {
    method: 'DELETE',
  })
}

export async function rotateApiKey(appId: string): Promise<RotateApiKeyResponse> {
  return apiFetch<RotateApiKeyResponse>(`/apps/${appId}/api-key/rotate`, {
    method: 'POST',
  })
}