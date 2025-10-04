"use client"
import React from 'react'

import { SpectraEvent } from '../types/spectra'

type EventCardProps = {
  event: SpectraEvent
  onClick?: () => void
}

export default function EventCard({ event, onClick }: EventCardProps) {
  const getIcon = () => {
    switch (event.type) {
      case 'click':
        return '👆'
      case 'input':
        return '⌨️'
      case 'error':
        return '❌'
      case 'navigation':
        return '🧭'
      default:
        return '📍'
    }
  }

  const rawSelector = (event.data as Record<string, unknown> | undefined)?.selector
  const selector = rawSelector !== undefined ? String(rawSelector) : ''

  const typeColors: Record<string, string> = {
    click: 'from-sky-400/40 to-blue-500/40',
    input: 'from-emerald-400/40 to-teal-400/40',
    error: 'from-rose-500/40 to-orange-500/40',
    navigation: 'from-violet-500/40 to-indigo-500/40',
    default: 'from-white/20 to-white/5'
  }

  const typeKey = event.type ?? 'default'
  const typeColor = typeColors[typeKey as keyof typeof typeColors] || typeColors.default
  const timestampLabel = event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '—'

  return (
    <button
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${typeColor} px-4 py-3 text-left text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(59,130,246,0.25)]`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/20 text-xl">
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.2em]">
            <span>{event.type}</span>
            <span className="text-xs font-normal text-white/70">{timestampLabel}</span>
          </div>
          {selector && <p className="mt-2 overflow-hidden text-ellipsis text-xs text-white/75">{selector}</p>}
        </div>
      </div>
    </button>
  )
}
