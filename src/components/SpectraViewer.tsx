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
type PlayerInstance = SvelteComponentInstance & ReplayerMinimal

type SpectraViewerProps = {
  sessionId: string
}

export default function SpectraViewer({ sessionId }: SpectraViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const replayerRef = useRef<PlayerInstance | null>(null)
  const [playerInstance, setPlayerInstance] = useState<PlayerInstance | null>(null)
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
        const rawEvents = maybe && Array.isArray((maybe as { events?: unknown[] }).events)
          ? ((maybe as { events?: unknown[] }).events as unknown[])
          : []

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

        setEvents(parsed)
      } catch (err) {
        setError('No se pudo cargar la sesión')
        console.error(err)
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

        // rrweb-player es un componente Svelte: instanciar con new Player({ target, props })
        const instance = new playerCtorCandidate({
          target: containerRef.current as Element,
          props: { events, autoPlay: false, showController: true, skipInactive: false }
        }) as PlayerInstance

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

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-[0_30px_80px_rgba(14,116,144,0.4)]">
          <div ref={containerRef} id="player-container" className="h-full w-full" />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
              <span className="animate-pulse text-sm uppercase tracking-[0.5em] text-white/80">Cargando sesión…</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-x-6 top-6 rounded-2xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm text-red-100 backdrop-blur">
              {error}
            </div>
          )}
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-96">
          <div className="glass-panel flex-1 overflow-hidden p-5">
            <EventTimeline events={events} player={playerInstance} />
          </div>

          <div className="glass-panel p-5">
            <AnnotationsPanel annotations={[]} />
          </div>
        </aside>
      </div>

      <div className="glass-panel px-6 py-4">
        <PlayerControls player={playerInstance} />
      </div>
    </div>
  )
}
