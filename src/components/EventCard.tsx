"use client"
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { SpectraCustomEvent } from '../types/spectra'

type EventCardProps = {
  event: SpectraCustomEvent
  active?: boolean
  onClick?: () => void
}

const typeConfig: Record<string, { icon: string; label: string; color: string; badgeClass: string }> = {
  click: { icon: '🖱', label: 'Click', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  network: { icon: '🌐', label: 'Network', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
  console: { icon: '⌨', label: 'Console', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  navigation: { icon: '🧭', label: 'Nav', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', badgeClass: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  error: { icon: '⚠', label: 'Error', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
}

function getEventTitle(event: SpectraCustomEvent): string {
  switch (event?.eventType) {
    case 'click':
      return String(event?.data?.text || event?.data?.id || event?.data?.tagName || 'Element')
    case 'network':
      return `${event?.data?.method ?? 'GET'} ${shortenUrl(String(event?.data?.url ?? ''))}`
    case 'console':
      return String(event?.data?.message ?? '')
    case 'navigation':
      return shortenUrl(String(event?.data?.url ?? ''))
    case 'error':
      return String(event?.data?.message ?? 'Error')
    default:
      return 'Event'
  }
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname + u.search + u.hash
  } catch {
    return url
  }
}

function formatTimestamp(ts?: number): string {
  if (!ts) return ''
  if (ts > 946684800000) {
    return new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  const sec = Math.floor(ts / 1000)
  const min = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(ms?: number | null): string {
  if (!ms) return ''
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export default function EventCard({ event, active, onClick }: EventCardProps) {
  const [expanded, setExpanded] = useState(false)
  const eventType = event?.eventType ?? 'unknown'
  const config = typeConfig[eventType] ?? { icon: '📍', label: eventType, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', badgeClass: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' }
  const title = getEventTitle(event)
  const time = formatTimestamp(event.timestamp)
  const data = event.data
  const context = event.context

  const hasDetails = !!(
    data?.selector || data?.coordinates || data?.duration ||
    data?.error || data?.tagName || data?.className ||
    context?.url || context?.viewport
  )

  return (
    <div className={cn(
      "group rounded-lg border transition-all",
      active
        ? "border-primary/40 bg-primary/5 shadow-[0_0_8px_rgba(139,92,246,0.1)]"
        : "border-transparent hover:border-border hover:bg-accent/30",
      expanded && !active && "border-border bg-accent/20"
    )}>
      {/* Main row — clickable to jump */}
      <button
        onClick={onClick}
        className="flex w-full items-start gap-2.5 px-3 py-2 text-left"
      >
        <span className="relative">
          <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs", config.color)}>
            {config.icon}
          </span>
          {active && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {config.label}
            </span>
            {/* Extra badges per type */}
            {eventType === 'network' && data?.method && (
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-mono", config.badgeClass)}>
                {String(data.method)}
              </Badge>
            )}
            {eventType === 'console' && data?.level && (
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0",
                data.level === 'error' ? 'bg-rose-500/15 text-rose-400 border-rose-500/20' :
                data.level === 'warn' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                config.badgeClass
              )}>
                {String(data.level)}
              </Badge>
            )}
            {eventType === 'network' && data?.error && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-rose-500/15 text-rose-400 border-rose-500/20">
                error
              </Badge>
            )}
            {eventType === 'network' && data?.duration && (
              <span className="text-[10px] font-mono text-muted-foreground/70">
                {formatDuration(data.duration)}
              </span>
            )}
            {time && (
              <span className="ml-auto text-[10px] font-mono text-muted-foreground/60 shrink-0">{time}</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-foreground/80">{title}</p>
        </div>

        <span className="mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <JumpIcon className="h-3.5 w-3.5" />
        </span>
      </button>

      {/* Expand toggle */}
      {hasDetails && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          className="flex w-full items-center gap-1 px-3 pb-1.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <ChevronIcon className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")} />
          {expanded ? 'Ocultar detalles' : 'Ver detalles'}
        </button>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mx-3 mb-2.5 rounded-md border border-border/50 bg-muted/30 p-2.5 text-[11px] space-y-2">
          {/* Click details */}
          {eventType === 'click' && (
            <>
              {data?.selector && (
                <DetailRow label="Selector" value={String(data.selector)} mono />
              )}
              {data?.tagName && (
                <div className="flex gap-2">
                  <DetailRow label="Tag" value={String(data.tagName)} />
                  {data?.id && <DetailRow label="ID" value={String(data.id)} mono />}
                  {data?.className && <DetailRow label="Class" value={String(data.className)} mono />}
                </div>
              )}
              {data?.coordinates && (
                <DetailRow
                  label="Coords"
                  value={`x:${(data.coordinates as { x?: number }).x} y:${(data.coordinates as { y?: number }).y} (screen: ${(data.coordinates as { screenX?: number }).screenX},${(data.coordinates as { screenY?: number }).screenY})`}
                  mono
                />
              )}
            </>
          )}

          {/* Network details */}
          {eventType === 'network' && (
            <>
              {data?.url && (
                <DetailRow label="URL" value={String(data.url)} mono />
              )}
              {data?.type && (
                <DetailRow label="Type" value={String(data.type)} />
              )}
              {data?.duration && (
                <DetailRow label="Duration" value={formatDuration(data.duration)} />
              )}
              {data?.error && (
                <DetailRow label="Error" value={String(data.error)} error />
              )}
            </>
          )}

          {/* Console details */}
          {eventType === 'console' && (
            <>
              {data?.message && (
                <DetailRow label="Message" value={String(data.message)} />
              )}
            </>
          )}

          {/* Context — common to all */}
          {context?.url && (
            <DetailRow label="Page" value={String(context.url)} mono />
          )}
          {context?.viewport && (
            <DetailRow
              label="Viewport"
              value={`${context.viewport.width}x${context.viewport.height}`}
            />
          )}
          {context?.userAgent && (
            <DetailRow label="UA" value={shortenUA(String(context.userAgent))} />
          )}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, mono, error }: { label: string; value: string; mono?: boolean; error?: boolean }) {
  return (
    <div className="flex items-start gap-2 leading-tight">
      <span className="shrink-0 text-muted-foreground/70 w-14 text-right">{label}</span>
      <span className={cn(
        "break-all",
        mono && "font-mono text-[10px]",
        error && "text-rose-400"
      )}>
        {value}
      </span>
    </div>
  )
}

function shortenUA(ua: string): string {
  // Extract just browser + OS from user agent
  const chrome = ua.match(/Chrome\/([\d.]+)/)
  const firefox = ua.match(/Firefox\/([\d.]+)/)
  const safari = ua.match(/Safari\/([\d.]+)/)
  const opera = ua.match(/OPR\/([\d.]+)/)
  const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : ''

  if (opera) return `Opera ${opera[1]} · ${os}`
  if (chrome) return `Chrome ${chrome[1]} · ${os}`
  if (firefox) return `Firefox ${firefox[1]} · ${os}`
  if (safari) return `Safari ${safari[1]} · ${os}`
  return ua.slice(0, 60)
}

function JumpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  )
}
