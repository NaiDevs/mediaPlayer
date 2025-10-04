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

  return (
    <div onClick={onClick} className="p-2 border rounded hover:bg-gray-50 cursor-pointer">
      <div className="flex items-center gap-2">
        <span>{getIcon()}</span>
        <div className="flex-1">
          <div className="font-medium text-sm">{event.type}</div>
          <div className="text-xs text-gray-500">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}</div>
        </div>
      </div>
      {selector && <div className="text-xs text-gray-400 mt-1">{String(selector)}</div>}
    </div>
  )
}
