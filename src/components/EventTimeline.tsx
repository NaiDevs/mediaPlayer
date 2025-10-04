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

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filter !== 'all' && event.type !== filter) return false
      if (search && !JSON.stringify(event).includes(search)) return false
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
    <div className="p-4">
      <h3 className="font-bold mb-2">Timeline</h3>

      <div className="flex gap-2 mb-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-2 py-1">
          <option value="all">Todos</option>
          <option value="click">Clicks</option>
          <option value="input">Inputs</option>
          <option value="error">Errores</option>
          <option value="navigation">Navegación</option>
        </select>

        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredEvents.map((event, index) => (
          <EventCard key={index} event={event} onClick={() => jumpToEvent(event)} />
        ))}
      </div>
    </div>
  )
}
