"use client"
import React, { useMemo, useState } from 'react'
import EventCard from './EventCard'
import { ReplayerMinimal, SpectraMetadata } from '../types/spectra'

type EventTimelineProps = {
  player: ReplayerMinimal | null
  metadata?: SpectraMetadata
}

export default function EventTimeline({ player, metadata }: EventTimelineProps) {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  

  const filters = [
    { value: 'all', label: 'Todos' },
    { value: 'click', label: 'Clicks' },
    // { value: 'input', label: 'Inputs' },
    { value: 'network', label: 'Network' },
    { value: 'console', label: 'Console' },
    { value: 'navigation', label: 'Navegación' },
    { value: 'error', label: 'Errores' }
  ]

  // Usar exclusivamente customEvents y errors desde metadata para la timeline
  const filteredEvents = useMemo(() => {
    const custom = (metadata?.customEvents || []).map((c) => ({
      ...c,
      type: 'custom' as const,
      timestamp: c.timestamp ?? 0,
    }))

    // metadata.errors puede no existir o tener un formato distinto; normalizarlo si existe
    const errorsRaw = Array.isArray((metadata as unknown as { errors?: unknown[] })?.errors)
      ? (metadata as unknown as { errors?: unknown[] }).errors!
      : []
    const errors = (errorsRaw as unknown[]).map((e, i) => {
      const obj = e as Record<string, unknown>
      const msg = typeof obj?.message === 'string' ? obj.message : JSON.stringify(obj)
      const ts = typeof obj?.timestamp === 'number' ? (obj.timestamp as number) : (custom[i]?.timestamp ?? 0)
      // Marcar estos errores como "mis errores" incluyendo sessionId y context.userId
      return {
        type: 'custom' as const,
        eventType: 'error',
        data: { message: msg, myError: true },
        timestamp: ts,
        sessionId: metadata?.sessionId,
        context: { userId: (metadata as SpectraMetadata | undefined)?.userId }
      }
    })

    const all = [...custom, ...errors]
    all.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))

    return all.filter((event) => {
      if (filter !== 'all' && (event.eventType ?? '') !== filter) return false
      if (search && !JSON.stringify(event).toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [metadata, filter, search])

  const jumpToEvent = (event: { timestamp?: number }) => {
    try {
      player?.pause?.()
      if (typeof event.timestamp === 'number') player?.play?.(event.timestamp)
    } catch {
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 ">
      <div>
        <h3 className="text-lg font-semibold">Timeline</h3>
        <p className="text-xs uppercase tracking-[0.35em] text-muted">Eventos</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === item.value
                ? 'bg-[var(--accent-1)]/90 shadow-lg shadow-[rgba(255,107,53,0.24)] text-white'
                : 'border border-[rgba(255,174,120,0.14)] bg-[rgba(255,243,236,0.6)] text-muted hover:border-[rgba(255,174,120,0.22)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar evento, selector o payload…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-[rgba(255,174,120,0.14)] bg-[rgba(255,243,236,0.6)] px-4 py-3 text-sm placeholder:text-muted focus:border-[var(--accent-1)] focus:outline-none"
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {filteredEvents.length === 0 && (
          <div className="rounded-2xl border border-[rgba(255,174,120,0.12)] bg-[rgba(255,240,230,0.04)] px-3 py-6 text-center text-sm text-muted">
            Sin eventos que coincidan con tu filtro.
          </div>
        )}
        {filteredEvents.map((event, index) => (
          <EventCard key={`${event.timestamp}-${index}`} event={event} onClick={() => jumpToEvent(event)} />
        ))}
      </div>
    </div>
  )
}
