"use client"
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SpectraMetadata } from '../types/spectra'

type PlayerType = {
  getMetaData: () => SpectraMetadata
  getCurrentTime: () => number
  play: (time?: number) => void
  pause: () => void
  setSpeed: (n: number) => void
  toggleFullscreen?: () => void
}

type PlayerControlsProps = {
  player: PlayerType | null
  controls?: {
    play?: (time?: number) => void
    pause?: () => void
    setSpeed?: (n: number) => void
    getCurrentTime?: () => number
    getMetaData?: () => SpectraMetadata
    toggleFullscreen?: () => void
  }
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.5, 2]

function SpeedMenu({ anchorRef, onChoose, onClose, current }: {
  anchorRef: React.RefObject<HTMLElement | null>
  onChoose: (n: number) => void
  onClose: () => void
  current: number
}) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  useEffect(() => {
    function update() {
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const menuW = 128
      const left = Math.min(Math.max(8, rect.right - menuW), window.innerWidth - menuW - 8)
      const top = Math.max(8, rect.top - (SPEED_OPTIONS.length * 32 + 16))
      setCoords({ top, left })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null
      if (!menuRef.current) return
      if (anchorRef.current?.contains(target)) return
      if (!menuRef.current.contains(target)) onClose()
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchorRef, onClose])

  const menu = (
    <div ref={menuRef} style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 99999 }}>
      <div className="w-32 rounded-lg border border-border bg-popover p-1 shadow-lg">
        {SPEED_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => onChoose(opt)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
              opt === current
                ? "bg-primary/10 text-primary font-semibold"
                : "text-popover-foreground hover:bg-accent"
            )}
          >
            {opt}x
            {opt === current && <CheckIcon className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(menu, document.body)
}

export default function PlayerControls({ player, controls }: PlayerControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const speedButtonRef = useRef<HTMLButtonElement | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const lastReportedRef = useRef<number | null>(null)
  const [prevPlayer, setPrevPlayer] = useState(player)

  if (prevPlayer !== player) {
    setPrevPlayer(player)
    setIsPlaying(false)
    setCurrentTime(0)
    setTotalTime(0)
  }

  const meta = (controls ?? player)?.getMetaData?.() ?? ({} as SpectraMetadata)
  const startTimeFromMeta = typeof meta.startTime === 'number' ? meta.startTime : undefined

  const formatTime = (ms: number) => {
    if (!ms || Number.isNaN(ms)) return '00:00'
    let elapsed = ms
    if (startTimeFromMeta && ms > 1e11) elapsed = ms - startTimeFromMeta
    if (elapsed < 0) elapsed = 0
    const totalSeconds = Math.floor(elapsed / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const progress = totalTime > 0 ? Math.min((currentTime / totalTime) * 100, 100) : 0

  useEffect(() => {
    if (!player && !controls) return
    const timer = setInterval(() => {
      try {
        const p = controls ?? player
        const meta = p?.getMetaData?.() ?? ({} as SpectraMetadata)
        const total = typeof meta.totalTime === 'number' ? meta.totalTime : 0
        const reported = p?.getCurrentTime?.()

        if (typeof reported === 'number' && !Number.isNaN(reported) && reported > 0) {
          lastReportedRef.current = reported
          setCurrentTime(reported)
        } else {
          if (isPlaying && total > 0) {
            setCurrentTime((prev) => Math.min((prev ?? 0) + 200, total))
          } else if (lastReportedRef.current && lastReportedRef.current > 0) {
            setCurrentTime(lastReportedRef.current)
          }
        }
        setTotalTime(total)
      } catch {}
    }, 200)
    return () => clearInterval(timer)
  }, [player, controls, isPlaying])

  const togglePlay = () => {
    try {
      const p = controls ?? player
      if (!p) return
      if (isPlaying) {
        try {
          const reported = p.getCurrentTime?.()
          if (typeof reported === 'number' && !Number.isNaN(reported) && reported > 0) {
            lastReportedRef.current = reported
            setCurrentTime(reported)
          } else {
            lastReportedRef.current = currentTime ?? lastReportedRef.current
            if (typeof lastReportedRef.current === 'number') setCurrentTime(lastReportedRef.current)
          }
        } catch {
          lastReportedRef.current = currentTime ?? lastReportedRef.current
          if (typeof lastReportedRef.current === 'number') setCurrentTime(lastReportedRef.current)
        }
        p.pause?.()
        setIsPlaying(false)
      } else {
        p.play?.()
        setIsPlaying(true)
      }
    } catch {}
  }

  const changeSpeed = (newSpeed: number) => {
    try {
      const p = controls ?? player
      if (!p) return
      p.setSpeed?.(newSpeed)
      setSpeed(newSpeed)
      setShowSpeedMenu(false)
    } catch {}
  }

  const seekBySeconds = (deltaMs: number) => {
    try {
      const p = controls ?? player
      if (!p) return
      const current = lastReportedRef.current ?? currentTime ?? 0
      const meta = p.getMetaData?.() ?? { totalTime: 0 }
      const total = typeof meta.totalTime === 'number' ? meta.totalTime : 0
      let target = Number(current ?? 0) + deltaMs
      if (target < 0) target = 0
      if (total > 0 && target > total) target = total
      lastReportedRef.current = target
      setCurrentTime(target)
      p.play?.(target)
    } catch {}
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="w-12 text-right text-xs font-mono text-muted-foreground tabular-nums">
          {formatTime(currentTime)}
        </span>

        <div className="group relative flex-1 h-2 cursor-pointer">
          <input
            type="range"
            min={0}
            max={Math.max(1, totalTime)}
            step={100}
            value={Math.min(Math.max(0, currentTime), Math.max(1, totalTime))}
            onChange={(e) => {
              const val = Number(e.target.value)
              try {
                lastReportedRef.current = val
                setCurrentTime(val);
                (controls ?? player)?.play?.(val)
              } catch {}
            }}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            title={`${formatTime(currentTime)} / ${formatTime(totalTime)}`}
          />
          {/* Track */}
          <div className="absolute inset-0 rounded-full bg-muted/50" />
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-primary shadow-md ring-2 ring-background opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>

        <span className="w-12 text-xs font-mono text-muted-foreground tabular-nums">
          {formatTime(totalTime)}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Skip back */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              if (e.shiftKey || e.altKey) {
                try { (controls ?? player)?.play?.(0) } catch {}
              } else {
                seekBySeconds(-5000)
              }
            }}
            title="Click: -5s"
          >
            <SkipBackIcon className="h-4 w-4" />
          </Button>

          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="hover:bg-primary/10 hover:text-primary"
          >
            {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
          </Button>

          {/* Skip forward */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              if (e.shiftKey || e.altKey) {
                try { (controls ?? player)?.play?.() } catch {}
              } else {
                seekBySeconds(5000)
              }
            }}
            title="Click: +5s"
          >
            <SkipForwardIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* Speed */}
          <div className="relative">
            <Button
              ref={speedButtonRef}
              variant="ghost"
              size="sm"
              onClick={() => setShowSpeedMenu(s => !s)}
              className="gap-1 font-mono text-xs"
            >
              {speed}x
              <ChevronUpIcon className="h-3 w-3 text-muted-foreground" />
            </Button>
            {showSpeedMenu && (
              <SpeedMenu
                anchorRef={speedButtonRef}
                onChoose={changeSpeed}
                onClose={() => setShowSpeedMenu(false)}
                current={speed}
              />
            )}
          </div>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => (controls ?? player)?.toggleFullscreen?.()}
            title="Pantalla completa"
          >
            <MaximizeIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─── Inline Icons ─── */

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  )
}

function SkipBackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="19,20 9,12 19,4" /><line x1="5" y1="19" x2="5" y2="5" />
    </svg>
  )
}

function SkipForwardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5,4 15,12 5,20" /><line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  )
}

function MaximizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15,3 21,3 21,9" /><polyline points="9,21 3,21 3,15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18,15 12,9 6,15" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  )
}
