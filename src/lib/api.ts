import axios from 'axios'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
const apiKey = process.env.NEXT_PUBLIC_API_KEY || ''

export const apiConfig = {
  baseUrl: apiUrl,
  apiKey,
}

const apiClient = axios.create({
  baseURL: apiUrl,
})

function normalizeHeaders(headers?: HeadersInit) {
  if (!headers) {
    return undefined
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }

  return headers
}

apiClient.interceptors.request.use(config => {
  config.headers.set('x-api-key', apiKey)

  if (config.data && !config.headers.get('Content-Type')) {
    config.headers.set('Content-Type', 'application/json')
  }

  return config
})

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: endpoint,
      method: options.method,
      data: options.body,
      headers: normalizeHeaders(options.headers),
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseError = error.response?.data as { error?: string; message?: string } | undefined
      throw new Error(
        responseError?.error ||
        responseError?.message ||
        error.message ||
        'API Error'
      )
    }

    throw error
  }
}
