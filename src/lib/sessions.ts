import { apiFetch } from './api'

export type Session = {
  id: string
  appId: string
  user: string
  startedAt: number
  duration: string
  durationMs: number
  events: number
  errors: number
  status: 'completed' | 'live' | 'error'
  device: 'desktop' | 'mobile' | 'tablet'
  browser: string
  country: string
  pages: number
}

type ApiSession = {
  sessionId: string
  appId: string
  userId: string
  startTime: string
  endTime: string | null
  duration: number | null
  eventCount: number
  errorCount: number
  clickCount: number
}

type SessionsListResponse = {
  sessions: ApiSession[]
  total: number
  limit: number
  offset: number
}

function mapSession(apiSession: ApiSession): Session {
  const startTime = new Date(apiSession.startTime).getTime()
  const endTime = apiSession.endTime ? new Date(apiSession.endTime).getTime() : Date.now()
  const durationMs = endTime - startTime
  const durationMin = Math.floor(durationMs / 60000)
  const durationSec = Math.floor((durationMs % 60000) / 1000)
  
  let status: Session['status'] = 'live'
  if (apiSession.endTime) {
    status = apiSession.errorCount > 0 ? 'error' : 'completed'
  }
  
  return {
    id: apiSession.sessionId,
    appId: apiSession.appId,
    user: apiSession.userId || 'Anonimo',
    startedAt: startTime,
    duration: `${durationMin}:${String(durationSec).padStart(2, '0')}`,
    durationMs,
    events: apiSession.eventCount,
    errors: apiSession.errorCount,
    status,
    device: 'desktop',
    browser: 'Unknown',
    country: '--',
    pages: 1,
  }
}

export async function fetchSessions(): Promise<Session[]> {
  const response = await apiFetch<SessionsListResponse | Session[]>('/sessions')
  
  if (Array.isArray(response)) {
    return response
  }
  
  if (response?.sessions) {
    return response.sessions.map(mapSession)
  }
  
  return []
}

export async function fetchSession(id: string): Promise<Session> {
  const response = await apiFetch<ApiSession | Session>(`/sessions/${id}`)
  
  if ('sessionId' in response) {
    return mapSession(response as ApiSession)
  }
  
  return response as Session
}

export async function fetchSessionReplay(id: string): Promise<unknown> {
  return apiFetch<unknown>(`/sessions/${id}/replay`)
}