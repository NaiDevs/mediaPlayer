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

// Un tipo flexible para instancias de replayer que pueden exponer la API en diferentes propiedades
type LooseInst = Record<string, unknown> & {
  __innerReplayer?: ReplayerMinimal
  replayer?: ReplayerMinimal
  player?: ReplayerMinimal
}

type SpectraViewerProps = {
  sessionId: string
}



export default function SpectraViewer({ sessionId }: SpectraViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const replayerRef = useRef<PlayerInstance | null>(null)
  const [playerInstance, setPlayerInstance] = useState<PlayerInstance | null>(null)
  const [events, setEvents] = useState<SpectraEvent[]>([])
  const [metadata, setMetadata] = useState<SpectraMetadata | undefined>(undefined)
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

        // extraer metadata si está presente en el objeto
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

        // calcular totalTime a partir de timestamps en los eventos y guardarlo en metadata
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
          props: { events, autoPlay: false, showController: false, skipInactive: false }
        }) as PlayerInstance

        // try to detect an inner/native replayer object that rrweb-player may expose
        try {
          // algunos wrappers colocan la instancia real en propiedades internas; buscar un objeto con getCurrentTime
          const anyInst = instance as unknown as LooseInst
          const inner = Object.values(anyInst).find((v) => v && typeof (v as unknown as { getCurrentTime?: unknown })?.getCurrentTime === 'function') as unknown as ReplayerMinimal | undefined
          if (inner) {
            anyInst.__innerReplayer = inner
          }
        } catch {
          // ignore
        }

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
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <div className="relative max-h-[480px] overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-[0_30px_80px_rgba(14,116,144,0.4)]">
          <div ref={containerRef} id="player-container" />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 ">
              <span className="animate-pulse text-sm uppercase tracking-[0.5em] /80">Cargando sesión…</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-x-6 top-6 rounded-2xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm text-red-100 backdrop-blur">
              {error}
            </div>
          )}
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-96 max-h-[480px]">
          

          <div className="glass-panel flex-1 overflow-hidden p-5">
            <EventTimeline player={playerInstance} metadata={metadata} />
          </div>
        </aside>
      </div>

      <div className="glass-panel px-6 py-4">
        <PlayerControls
          player={playerInstance}
          controls={{
            play: (t?: number) => {
              try {
                const inst = replayerRef.current as unknown as LooseInst | null
                if (!inst) return
                const topPlay = (inst as Record<string, unknown>)['play']
                if (typeof topPlay === 'function') { try { (topPlay as (...a: unknown[]) => unknown)(t); return } catch {} }
                if (inst.__innerReplayer) {
                  const ip = (inst.__innerReplayer as Record<string, unknown>)['play']
                  if (typeof ip === 'function') { try { (ip as (...a: unknown[]) => unknown)(t); return } catch {} }
                }
                if (inst.replayer) {
                  const rp = (inst.replayer as Record<string, unknown>)['play']
                  if (typeof rp === 'function') { try { (rp as (...a: unknown[]) => unknown)(t); return } catch {} }
                }
                if (inst.player) {
                  const pp = (inst.player as Record<string, unknown>)['play']
                  if (typeof pp === 'function') { try { (pp as (...a: unknown[]) => unknown)(t); return } catch {} }
                }
                try {
                  const setFn = (inst as Record<string, unknown>)['$set']
                  if (typeof setFn === 'function') (setFn as (...a: unknown[]) => unknown)({ currentTime: t })
                } catch {}
              } catch {}
            },
            pause: () => {
              try {
                const inst = replayerRef.current as unknown as LooseInst | null
                if (!inst) return
                const topPause = (inst as Record<string, unknown>)['pause']
                if (typeof topPause === 'function') { try { (topPause as (...a: unknown[]) => unknown)(); return } catch {} }
                if (inst.__innerReplayer) {
                  const ip = (inst.__innerReplayer as Record<string, unknown>)['pause']
                  if (typeof ip === 'function') { try { (ip as (...a: unknown[]) => unknown)(); return } catch {} }
                }
                if (inst.replayer) {
                  const rp = (inst.replayer as Record<string, unknown>)['pause']
                  if (typeof rp === 'function') { try { (rp as (...a: unknown[]) => unknown)(); return } catch {} }
                }
                if (inst.player) {
                  const pp = (inst.player as Record<string, unknown>)['pause']
                  if (typeof pp === 'function') { try { (pp as (...a: unknown[]) => unknown)(); return } catch {} }
                }
              } catch {}
            },
            setSpeed: (n: number) => {
              try {
                const inst = replayerRef.current as unknown as LooseInst | null
                if (!inst) return
                const topSet = (inst as Record<string, unknown>)['setSpeed']
                if (typeof topSet === 'function') { try { (topSet as (...a: unknown[]) => unknown)(n); return } catch {} }
                if (inst.__innerReplayer) {
                  const ip = (inst.__innerReplayer as Record<string, unknown>)['setSpeed']
                  if (typeof ip === 'function') { try { (ip as (...a: unknown[]) => unknown)(n); return } catch {} }
                }
                if (inst.replayer) {
                  const rp = (inst.replayer as Record<string, unknown>)['setSpeed']
                  if (typeof rp === 'function') { try { (rp as (...a: unknown[]) => unknown)(n); return } catch {} }
                }
                if (inst.player) {
                  const pp = (inst.player as Record<string, unknown>)['setSpeed']
                  if (typeof pp === 'function') { try { (pp as (...a: unknown[]) => unknown)(n); return } catch {} }
                }
              } catch {}
            },
            getCurrentTime: () => {
              try {
                const inst = replayerRef.current as unknown as LooseInst | null
                if (!inst) return 0
                // probar diferentes caminos donde la API puede vivir
                if (typeof (inst as unknown as ReplayerMinimal).getCurrentTime === 'function') return (inst as unknown as ReplayerMinimal).getCurrentTime()
                if (inst.__innerReplayer && typeof inst.__innerReplayer.getCurrentTime === 'function') return inst.__innerReplayer.getCurrentTime()
                if (inst.replayer && typeof inst.replayer.getCurrentTime === 'function') return inst.replayer.getCurrentTime()
                if (inst.player && typeof inst.player.getCurrentTime === 'function') return inst.player.getCurrentTime()
                // como último recurso, buscar en valores
                const candidate = Object.values(inst).find((v) => v && typeof (v as unknown as Record<string, unknown>)['getCurrentTime'] === 'function') as unknown as ReplayerMinimal | undefined
                if (candidate) return candidate.getCurrentTime()
                return 0
              } catch { return 0 }
            },
            getMetaData: () => {
              try {
                const inst = replayerRef.current as unknown as LooseInst | null
                if (!inst) return (metadata ?? {})
                if (typeof (inst as unknown as ReplayerMinimal).getMetaData === 'function') return (inst as unknown as ReplayerMinimal).getMetaData()
                if (inst.__innerReplayer && typeof inst.__innerReplayer.getMetaData === 'function') return inst.__innerReplayer.getMetaData()
                if (inst.replayer && typeof inst.replayer.getMetaData === 'function') return inst.replayer.getMetaData()
                if (inst.player && typeof inst.player.getMetaData === 'function') return inst.player.getMetaData()
                // buscar en valores si es necesario
                const candidate = Object.values(inst).find((v) => v && typeof (v as unknown as Record<string, unknown>)['getMetaData'] === 'function') as unknown as ReplayerMinimal | undefined
                if (candidate) return candidate.getMetaData()
                return (metadata ?? {})
              } catch { return (metadata ?? {}) }
            },
            toggleFullscreen: () => {
              try {
                const inst = replayerRef.current as unknown as Record<string, unknown>
                if (!inst) return
                if (typeof inst.toggleFullscreen === 'function') inst.toggleFullscreen()
              } catch {}
            }
          }}
        />
      </div>
    </div>
  )
}
