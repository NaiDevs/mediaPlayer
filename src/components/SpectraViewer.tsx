"use client"
import React, { useEffect, useRef, useState } from 'react'
import 'rrweb-player/dist/style.css'
import pako from 'pako'
import PlayerControls from './PlayerControls'
import EventTimeline from './EventTimeline'
import AnnotationsPanel from './AnnotationsPanel'
import { SpectraEvent, ReplayerMinimal } from '../types/spectra'

type SvelteComponentConstructor = new (options: { target: Element; props?: Record<string, unknown> }) => SvelteComponentInstance
type SvelteComponentInstance = { $destroy?: () => void; destroy?: () => void }

type SpectraViewerProps = {
  sessionId: string
}

export default function SpectraViewer({ sessionId }: SpectraViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const replayerRef = useRef<ReplayerMinimal | null>(null)
  const [events, setEvents] = useState<SpectraEvent[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

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
  const rawEvents = maybe && Array.isArray(maybe.events) ? (maybe.events as unknown[]) : []

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
            const b64 = typeof window !== 'undefined' ? window.atob(s) : Buffer.from(s, 'base64').toString('binary')
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

        setEvents(parsed)
      } catch {
        setError('No se pudo cargar la sesión')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sessionId])

  useEffect(() => {
    if (!events.length || !containerRef.current) return

    const init = async () => {
      try {
        if (replayerRef.current) {
          // si la instancia es Svelte, llama $destroy
          const maybeInst = replayerRef.current as unknown as SvelteComponentInstance | null
          if (maybeInst && typeof maybeInst.$destroy === 'function') maybeInst.$destroy()
          if (maybeInst && typeof maybeInst.destroy === 'function') maybeInst.destroy()
          replayerRef.current = null
        }
        const mod = await import('rrweb-player')
  const modAny = mod as unknown
  const playerCtorCandidate = (modAny as { default?: SvelteComponentConstructor }).default || (modAny as unknown as SvelteComponentConstructor)
  if (!playerCtorCandidate) throw new Error('No se pudo cargar rrweb-player')

  // rrweb-player es un componente Svelte: instanciar con new Player({ target, props })
  const instance = new playerCtorCandidate({ target: containerRef.current as Element, props: { events, autoPlay: false, showController: true } })
  replayerRef.current = instance as unknown as ReplayerMinimal
      } catch {
        setError('Error al inicializar el reproductor')
      }
    }

    init()

    return () => {
      try {
        replayerRef.current?.destroy?.()
      } catch {
      }
      replayerRef.current = null
    }
  }, [events])

  return (
    <div className="flex h-screen">
      <div className="flex-1 bg-gray-100 p-4">
        {loading && <div>Cargando...</div>}
        {error && <div className="text-red-600">{error}</div>}
        <div ref={containerRef} id="player-container" className="w-full h-full" />
      </div>

      <div className="w-80 bg-white border-l">
        <EventTimeline events={events} player={replayerRef.current} />
        <AnnotationsPanel annotations={[]} />
      </div>

      <PlayerControls player={replayerRef.current} />
    </div>
  )
}
