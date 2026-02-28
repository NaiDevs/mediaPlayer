"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import EventCard from './EventCard'
import { ReplayerMinimal, SpectraMetadata } from '../types/spectra'

type EventTimelineProps = {
  player: ReplayerMinimal | null
  metadata?: SpectraMetadata
}

const FILTERS = [
  { value: 'all', label: 'Todos', icon: null },
  { value: 'click', label: 'Clicks', icon: '🖱' },
  { value: 'network', label: 'Network', icon: '🌐' },
  { value: 'console', label: 'Console', icon: '⌨' },
  { value: 'navigation', label: 'Nav', icon: '🧭' },
  { value: 'error', label: 'Errores', icon: '⚠' },
] as const

export default function EventTimeline({ player, metadata }: EventTimelineProps) {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [activeEventIndex, setActiveEventIndex] = useState<number>(-1)
  const [autoScroll, setAutoScroll] = useState(true)
  const listRef = useRef<HTMLDivElement | null>(null)
  const activeCardRef = useRef<HTMLDivElement | null>(null)

  const startTime = typeof metadata?.startTime === 'number' ? metadata.startTime : 0

  const filteredEvents = useMemo(() => {
    const custom = (metadata?.customEvents || []).map((c) => ({
      ...c,
      type: 'custom' as const,
      timestamp: c.timestamp ?? 0,
    }))

    const errorsRaw = Array.isArray((metadata as unknown as { errors?: unknown[] })?.errors)
      ? (metadata as unknown as { errors?: unknown[] }).errors!
      : []
    const errors = (errorsRaw as unknown[]).map((e, i) => {
      const obj = e as Record<string, unknown>
      const msg = typeof obj?.message === 'string' ? obj.message : JSON.stringify(obj)
      const ts = typeof obj?.timestamp === 'number' ? (obj.timestamp as number) : (custom[i]?.timestamp ?? 0)
      return {
        type: 'custom' as const,
        eventType: 'error',
        data: { message: msg, myError: true },
        timestamp: ts,
        sessionId: metadata?.sessionId,
        context: { userId: (metadata as SpectraMetadata | undefined)?.userId },
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

  // Track playback position and highlight the closest past event
  useEffect(() => {
    if (!player || !filteredEvents.length) return
    const timer = setInterval(() => {
      try {
        const currentTime = player.getCurrentTime?.()
        if (typeof currentTime !== 'number' || Number.isNaN(currentTime)) return

        // currentTime from rrweb-player is ms offset from start
        const absoluteTime = startTime > 0 ? startTime + currentTime : currentTime

        // Find last event that has already occurred
        let bestIdx = -1
        for (let i = filteredEvents.length - 1; i >= 0; i--) {
          const ts = filteredEvents[i].timestamp ?? 0
          if (ts <= absoluteTime + 500) { // 500ms tolerance
            bestIdx = i
            break
          }
        }
        setActiveEventIndex(bestIdx)
      } catch {}
    }, 300)
    return () => clearInterval(timer)
  }, [player, filteredEvents, startTime])

  // Auto-scroll to active event
  useEffect(() => {
    if (!autoScroll || activeEventIndex < 0 || !activeCardRef.current || !listRef.current) return
    activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeEventIndex, autoScroll])

  const jumpToEvent = useCallback((event: { timestamp?: number }) => {
    try {
      if (typeof event.timestamp !== 'number') return
      // Convert absolute timestamp to offset from recording start
      const offset = startTime > 0 ? event.timestamp - startTime : event.timestamp
      player?.play?.(Math.max(0, offset))
    } catch {}
  }, [player, startTime])

  const eventCounts = useMemo(() => {
    const custom = metadata?.customEvents || []
    const counts: Record<string, number> = { all: custom.length }
    custom.forEach(c => {
      const t = c.eventType ?? 'unknown'
      counts[t] = (counts[t] || 0) + 1
    })
    return counts
  }, [metadata])

  // Disable auto-scroll when user manually scrolls the list
  const handleListScroll = useCallback(() => {
    setAutoScroll(false)
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Timeline</h3>
          <div className="flex items-center gap-2">
            {!autoScroll && (
              <button
                onClick={() => setAutoScroll(true)}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                title="Reactivar auto-scroll"
              >
                <FollowIcon className="h-3.5 w-3.5 inline mr-0.5" />
                Seguir
              </button>
            )}
            <Badge variant="outline" className="text-xs font-mono">
              {filteredEvents.length} eventos
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar evento..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Filter pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {FILTERS.map((item) => {
            const count = item.value === 'all' ? eventCounts.all : (eventCounts[item.value] || 0)
            return (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all",
                  filter === item.value
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.label}
                {count > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 text-[10px] font-semibold",
                    filter === item.value ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Events list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-2"
        onScroll={handleListScroll}
      >
        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="text-2xl opacity-40">🔍</div>
            <p className="text-sm text-muted-foreground">Sin eventos que coincidan</p>
          </div>
        )}
        <div className="space-y-1">
          {filteredEvents.map((event, index) => (
            <div
              key={`${event.timestamp}-${index}`}
              ref={index === activeEventIndex ? activeCardRef : undefined}
            >
              <EventCard
                event={event}
                active={index === activeEventIndex}
                onClick={() => jumpToEvent(event)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function FollowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )
}
