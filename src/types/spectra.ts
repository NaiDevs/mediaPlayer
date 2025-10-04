export type SpectraEvent = {
  type?: string
  timestamp?: number
  data?: Record<string, unknown>
}

export type ReplayerMinimal = {
  getMetaData: () => { totalTime: number }
  getCurrentTime: () => number
  play: (time?: number) => void
  pause: () => void
  setSpeed: (n: number) => void
  toggleFullscreen?: () => void
  destroy?: () => void
}
