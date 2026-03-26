import 'server-only'

import axios from 'axios'

const externalApiBaseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY

if (!externalApiBaseUrl) {
  throw new Error('Falta configurar API_URL o NEXT_PUBLIC_API_URL')
}

if (!apiKey) {
  throw new Error('Falta configurar API_KEY en el servidor')
}

export const externalApi = axios.create({
  baseURL: externalApiBaseUrl,
})

externalApi.interceptors.request.use(config => {
  config.headers.set('x-api-key', apiKey)

  return config
})
