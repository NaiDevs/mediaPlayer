export type SpectraEvent = {
  type?: string
  timestamp?: number
  data?: Record<string, unknown>
}

export type SpectraCoordinates = {
  x?: number
  y?: number
  screenX?: number
  screenY?: number
}

export type SpectraContextViewport = {
  width?: number
  height?: number
}

export type SpectraContext = {
  url?: string
  userAgent?: string
  viewport?: SpectraContextViewport
  [key: string]: unknown
}

export type SpectraCustomEventData = {
  selector?: string | null
  text?: string | null
  tagName?: string | null
  className?: string | null
  id?: string | null
  href?: string | null
  coordinates?: SpectraCoordinates
  // network specific fields
  type?: string | null
  url?: string | null
  method?: string | null
  error?: string | null
  duration?: number | null
  // console specific
  level?: string | null
  message?: string | null
  [key: string]: unknown
}

export type SpectraCustomEvent = {
  type: 'custom'
  eventType?: string
  data?: SpectraCustomEventData
  timestamp?: number
  sessionId?: string
  context?: SpectraContext
}

export type SpectraMetadata = {
  sessionId?: string
  userId?: string
  appId?: string
  startTime?: number
  eventCount?: number
  customEvents?: SpectraCustomEvent[]
  [key: string]: unknown
}

export type ReplayerMinimal = {
  getMetaData: () => SpectraMetadata
  getCurrentTime: () => number
  play: (time?: number) => void
  pause: () => void
  setSpeed: (n: number) => void
  toggleFullscreen?: () => void
  destroy?: () => void
}
