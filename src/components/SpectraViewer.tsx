"use client"
import React, { useEffect, useRef, useState } from 'react'
import 'rrweb-player/dist/style.css'
import pako from 'pako'
import PlayerControls from './PlayerControls'
import EventTimeline from './EventTimeline'
import { SpectraEvent, ReplayerMinimal, SpectraMetadata } from '../types/spectra'

type SvelteComponentConstructor = new (options: { target: Element; props?: Record<string, unknown> }) => SvelteComponentInstance
type SvelteComponentInstance = { $destroy?: () => void; destroy?: () => void }
type PlayerInstance = SvelteComponentInstance & ReplayerMinimal

type LooseInst = Record<string, unknown> & {
  __innerReplayer?: ReplayerMinimal
  replayer?: ReplayerMinimal
  player?: ReplayerMinimal
}

type SpectraViewerProps = {
  sessionId: string
}

/* ─── Helper: resolve replayer method across different rrweb-player API shapes ─── */
function resolveMethod(inst: LooseInst | null, method: string): ((...args: unknown[]) => unknown) | null {
  if (!inst) return null
  const paths = [inst, inst.__innerReplayer, inst.replayer, inst.player]
  for (const obj of paths) {
    if (obj && typeof (obj as Record<string, unknown>)[method] === 'function') {
      return (obj as Record<string, (...args: unknown[]) => unknown>)[method].bind(obj)
    }
  }
  // last resort: search values
  const candidate = Object.values(inst).find(
    v => v && typeof (v as Record<string, unknown>)[method] === 'function'
  ) as Record<string, (...args: unknown[]) => unknown> | undefined
  if (candidate) return candidate[method].bind(candidate)
  return null
}

export default function SpectraViewer({ sessionId }: SpectraViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const replayerRef = useRef<PlayerInstance | null>(null)
  const [playerInstance, setPlayerInstance] = useState<PlayerInstance | null>(null)
  const [events, setEvents] = useState<SpectraEvent[]>([])
  const [metadata, setMetadata] = useState<SpectraMetadata | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  /* ─── Load session data ─── */
  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    const load = async () => {
      try {
        let data: Record<string, unknown> | null = null

        try {
          const mod = await import(`../sessions/${sessionId}.json`)
          data = (mod && (mod as unknown as { default?: unknown }).default) as Record<string, unknown> || (mod as Record<string, unknown>)
        } catch {
          data = null
        }

        if (!data) {
          const res = await fetch(`/api/sessions/${sessionId}/replay`)
          if (!res.ok) throw new Error('network')
          data = await res.json()
        }

        const maybe = data as Record<string, unknown> | null
        const rawEvents = maybe && Array.isArray((maybe as { events?: unknown[] }).events)
          ? ((maybe as { events?: unknown[] }).events as unknown[])
          : []

        try {
          const md = maybe && (maybe as { metadata?: unknown }).metadata
          if (md && typeof md === 'object') setMetadata(md as SpectraMetadata)
          else setMetadata(undefined)
        } catch {
          setMetadata(undefined)
        }

        function decodeToUint8(str: string) {
          const arr = new Uint8Array(str.length)
          for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i) & 0xff
          return arr
        }

        function tryParseEventString(s: string): SpectraEvent | null {
          try {
            const maybeJson = JSON.parse(s)
            if (maybeJson && typeof maybeJson === 'object') {
              const asRecord = maybeJson as Record<string, unknown>
              if ('timestamp' in asRecord) return maybeJson as SpectraEvent
            }
          } catch {}

          try {
            const bin = decodeToUint8(s)
            const inflated = pako.inflate(bin, { to: 'string' })
            return JSON.parse(inflated) as SpectraEvent
          } catch {}

          try {
            const decodeBase64 = typeof atob === 'function' ? atob : (globalThis as unknown as { atob?: (input: string) => string }).atob
            if (!decodeBase64) throw new Error('Base64 decoder not available')
            const b64 = decodeBase64(s)
            const bin = decodeToUint8(b64)
            const inflated = pako.inflate(bin, { to: 'string' })
            return JSON.parse(inflated) as SpectraEvent
          } catch {}

          return null
        }

        const parsed: SpectraEvent[] = rawEvents.map((ev) => {
          if (typeof ev === 'string') {
            const r = tryParseEventString(ev)
            if (r) return r
            return { type: 'Custom', data: { raw: ev }, timestamp: Date.now() } as unknown as SpectraEvent
          }
          return ev as SpectraEvent
        })

        try {
          const timestamps = parsed.map((e) => Number(e.timestamp ?? 0)).filter((t) => t > 0)
          if (timestamps.length) {
            const min = Math.min(...timestamps)
            const max = Math.max(...timestamps)
            const total = Math.max(0, max - min)
            setMetadata((prev) => ({ ...(prev || {}), totalTime: total }))
          }
        } catch {}

        setEvents(parsed)
      } catch (err) {
        setError('No se pudo cargar la sesion')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sessionId])

  /* ─── Initialize rrweb-player ─── */
  useEffect(() => {
    if (!events.length || !containerRef.current) return

    const init = async () => {
      try {
        if (replayerRef.current) {
          const maybeInst = replayerRef.current as SvelteComponentInstance | null
          if (maybeInst?.$destroy) maybeInst.$destroy()
          if (maybeInst?.destroy) maybeInst.destroy()
          replayerRef.current = null
          setPlayerInstance(null)
        }
        const mod = await import('rrweb-player')
        const modAny = mod as unknown
        const playerCtorCandidate = (modAny as { default?: SvelteComponentConstructor }).default || (modAny as unknown as SvelteComponentConstructor)
        if (!playerCtorCandidate) throw new Error('No se pudo cargar rrweb-player')

        const instance = new playerCtorCandidate({
          target: containerRef.current as Element,
          props: { events, autoPlay: false, showController: false, skipInactive: false }
        }) as PlayerInstance

        try {
          const anyInst = instance as unknown as LooseInst
          const inner = Object.values(anyInst).find((v) => v && typeof (v as unknown as { getCurrentTime?: unknown })?.getCurrentTime === 'function') as unknown as ReplayerMinimal | undefined
          if (inner) {
            anyInst.__innerReplayer = inner
          }
        } catch {}

        replayerRef.current = instance
        setPlayerInstance(instance)
      } catch (err) {
        setError('Error al inicializar el reproductor')
        console.error(err)
      }
    }

    init()

    return () => {
      try {
        if (replayerRef.current?.destroy) replayerRef.current.destroy()
        else replayerRef.current?.$destroy?.()
      } catch (err) {
        console.warn('Error al limpiar el reproductor', err)
      }
      replayerRef.current = null
      setPlayerInstance(null)
    }
  }, [events])

  /* ─── Build controls adapter ─── */
  const controls = {
    play: (t?: number) => { try { resolveMethod(replayerRef.current as unknown as LooseInst, 'play')?.(t) } catch {} },
    pause: () => { try { resolveMethod(replayerRef.current as unknown as LooseInst, 'pause')?.() } catch {} },
    setSpeed: (n: number) => { try { resolveMethod(replayerRef.current as unknown as LooseInst, 'setSpeed')?.(n) } catch {} },
    getCurrentTime: (): number => {
      try {
        const fn = resolveMethod(replayerRef.current as unknown as LooseInst, 'getCurrentTime')
        return (fn?.() as number) ?? 0
      } catch { return 0 }
    },
    getMetaData: (): SpectraMetadata => {
      try {
        const fn = resolveMethod(replayerRef.current as unknown as LooseInst, 'getMetaData')
        return (fn?.() as SpectraMetadata) ?? (metadata ?? {})
      } catch { return metadata ?? {} }
    },
    toggleFullscreen: () => {
      try {
        const inst = replayerRef.current as unknown as Record<string, unknown>
        if (inst && typeof inst.toggleFullscreen === 'function') (inst.toggleFullscreen as () => void)()
      } catch {}
    },
  }

  return (
    <div className="flex h-full flex-col">
      {/* Player + Timeline */}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {/* Video area */}
        <div className="relative flex-1 min-h-0 bg-black/40">
          <div ref={containerRef} id="player-container" className="h-full w-full [&_.rr-player]:!w-full [&_.rr-player]:!h-full [&_.rr-player__frame]:!h-full" />

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Cargando sesion...</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-x-4 top-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive backdrop-blur-sm">
              {error}
            </div>
          )}
        </div>

        {/* Timeline sidebar */}
        <aside className="w-full border-t border-border lg:w-96 lg:border-l lg:border-t-0 overflow-hidden">
          <EventTimeline player={playerInstance} metadata={metadata} />
        </aside>
      </div>

      {/* Controls bar */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm px-4 py-3">
        <PlayerControls player={playerInstance} controls={controls} />
      </div>
    </div>
  )
}
