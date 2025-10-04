"use client"
import React, { useMemo, useState } from 'react'
import EventCard from './EventCard'
import { SpectraEvent, ReplayerMinimal } from '../types/spectra'

type EventTimelineProps = {
  events: SpectraEvent[]
  player: ReplayerMinimal | null
}

export default function EventTimeline({ events, player }: EventTimelineProps) {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>('')

  const filters = [
    { value: 'all', label: 'Todos' },
    { value: 'click', label: 'Clicks' },
    { value: 'input', label: 'Inputs' },
    { value: 'error', label: 'Errores' },
    { value: 'navigation', label: 'Navegación' }
  ]

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filter !== 'all' && event.type !== filter) return false
      if (search && !JSON.stringify(event).toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [events, filter, search])

  const jumpToEvent = (event: SpectraEvent) => {
    try {
      player?.pause?.()
      player?.play?.(event.timestamp)
    } catch {
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 text-white">
      <div>
        <h3 className="text-lg font-semibold">Timeline</h3>
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Eventos destacados</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === item.value
                ? 'bg-sky-400/90 text-white shadow-lg shadow-sky-400/40'
                : 'border border-white/20 bg-white/10 text-white/70 hover:border-white/40 hover:text-white'
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
          className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none"
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {filteredEvents.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-6 text-center text-sm text-white/60">
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
