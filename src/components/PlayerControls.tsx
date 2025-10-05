"use client"
import React, { useEffect, useState, useRef } from 'react'
import PlayIcon from '@/icons/PlayIcon'
import PauseIcon from '@/icons/PauseIcon'
import SkipBackIcon from '@/icons/SkipBackIcon'
import SkipForwardIcon from '@/icons/SkipForwardIcon'
import MaximizeIcon from '@/icons/MaximizeIcon'
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

export default function PlayerControls({ player, controls }: PlayerControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(1)
  
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [totalTime, setTotalTime] = useState<number>(0)
  const lastReportedRef = useRef<number | null>(null)

  // Determina startTime desde metadata (si existe) para interpretar timestamps absolutos del JSON
  const meta = (controls ?? player)?.getMetaData?.() ?? ({} as SpectraMetadata)
  const startTimeFromMeta = typeof meta.startTime === 'number' ? meta.startTime : undefined

  const formatTime = (ms: number) => {
    if (!ms || Number.isNaN(ms)) return '00:00'

    let elapsed = ms
    let showSecondsCount: number | null = null
    if (startTimeFromMeta && ms > 1e11) {
      elapsed = ms - startTimeFromMeta
      showSecondsCount = Math.floor(elapsed / 1000)
    }

    if (elapsed < 0) elapsed = 0
    const totalSeconds = Math.floor(elapsed / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const base = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    if (showSecondsCount !== null) return `${base} (${showSecondsCount}s)`
    return base
  }

  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setTotalTime(0)
  }, [player])

  useEffect(() => {
    if (!player && !controls) return
    const timer = setInterval(() => {
      try {
        const p = controls ?? player
        const meta = p?.getMetaData?.() ?? ({} as SpectraMetadata)
        const total = typeof meta.totalTime === 'number' ? meta.totalTime : 0
        const reported = p?.getCurrentTime?.()

        // Si la API devuelve un tiempo válido (>0), usarlo y guardarlo como último tiempo real.
        if (typeof reported === 'number' && !Number.isNaN(reported) && reported > 0) {
          lastReportedRef.current = reported
          setCurrentTime(reported)
        } else {
          // Si la API no reporta progreso:
          if (isPlaying && total > 0) {
            // fallback para que el contador avance mientras reproducimos
            setCurrentTime((prev) => {
              const next = Math.min((prev ?? 0) + 200, total)
              return next
            })
          } else {
            // Si estamos pausados, mantener el último tiempo real conocido (si existe)
            if (lastReportedRef.current && lastReportedRef.current > 0) {
              setCurrentTime(lastReportedRef.current)
            } else {
              // sin reportes ni último conocido, mantener 0
              setCurrentTime(0)
            }
          }
        }

        setTotalTime(total)
      } catch {
      }
    }, 200)

    return () => clearInterval(timer)
  }, [player, controls, isPlaying])

  const togglePlay = () => {
    try {
      const p = controls ?? player
      if (!p) return
      if (isPlaying) {
        // estamos pausando: capturar el tiempo actual y mantenerlo en la UI
        try {
          const reported = p.getCurrentTime?.()
          if (typeof reported === 'number' && !Number.isNaN(reported) && reported > 0) {
            lastReportedRef.current = reported
            setCurrentTime(reported)
          } else {
            // si la API no reporta, usar el tiempo mostrado en la UI como referencia
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
    } catch {}
  }

  const seekBySeconds = (deltaMs: number) => {
    try {
      const p = controls ?? player
      if (!p) return
      // Usar el tiempo mostrado en la UI (último reportado o estado) como base para los saltos
      const current = lastReportedRef.current ?? currentTime ?? 0
      const meta = p.getMetaData?.() ?? { totalTime: 0 }
      const total = typeof meta.totalTime === 'number' ? meta.totalTime : 0
      let target = Number(current ?? 0) + deltaMs
      if (target < 0) target = 0
      if (total > 0 && target > total) target = total
      // actualizar último tiempo conocido para mantener la UI consistente
      lastReportedRef.current = target
      setCurrentTime(target)
      p.play?.(target)
    } catch {}
  }

  

  return (
    <div className="flex flex-col gap-3 text-foreground">
      <div className="flex items-center gap-4 text-xs uppercase tracking-[0.4em] text-muted">
        <span>{formatTime(currentTime)}</span>
  <div className="flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.10)]">
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
            className="range-slider"
            title={`${formatTime(currentTime)} / ${formatTime(totalTime)}`}
          />
        </div>
        <span>{formatTime(totalTime)}</span>
      </div>

  <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={(e: React.MouseEvent) => {
                if (e.shiftKey || e.altKey) {
                try { (controls ?? player)?.play?.(0) } catch {}
              } else {
                seekBySeconds(-5000)
              }
            }}
            className="pill-button !px-3 !py-2 flex items-center justify-center"
            aria-label="Volver al inicio / Retroceder 5s (Shift/Alt para ir al inicio)"
            title="Click: -5s · Shift/Alt+Click: Ir al inicio"
          >
            <span className="w-5 h-5 text-white flex items-center justify-center"><SkipBackIcon /></span>
          </button>
          <button
            onClick={togglePlay}
            className="pill-button !px-3 !py-3 text-base flex items-center gap-3"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            <span className="w-5 h-5 text-white flex items-center justify-center">
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </span>
          </button>
          <button
            onClick={(e: React.MouseEvent) => {
              if (e.shiftKey || e.altKey) {
                try { (controls ?? player)?.play?.() } catch {}
              } else {
                seekBySeconds(5000)
              }
            }}
            className="pill-button !px-3 !py-2 flex items-center justify-center"
            aria-label="Reanudar / Adelantar 5s (Shift/Alt para reanudar)"
            title="Click: +5s · Shift/Alt+Click: Reanudar"
          >
            <span className="w-5 h-5 text-white flex items-center justify-center"><SkipForwardIcon /></span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-xs text-muted">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">Velocidad</span>
              <div className="relative">
                <button className="flex items-center gap-2 rounded bg-transparent px-2 py-1 text-sm font-semibold" title={`Velocidad actual: ${speed}x`}>
                  {speed}x
                  <span className="text-muted">▾</span>
                </button>
                <div className="absolute mt-2 right-0 w-36 rounded bg-black/90 p-2 shadow-lg z-[9999]">
                  {[0.25, 0.5, 0.75, 1, 1.5, 2, 4].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => changeSpeed(opt)}
                      className={`w-full text-left px-2 py-1 text-sm ${opt === speed ? 'font-bold text-sky-400' : 'text-muted'}`}
                      title={`Poner velocidad ${opt}x`}
                    >
                      {opt}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => (controls ?? player)?.toggleFullscreen?.()}
            className="pill-button !px-4 !py-2 flex items-center justify-center"
          >
            <span className="w-5 h-5 text-white flex items-center justify-center"><MaximizeIcon /></span>
          </button>
        </div>
      </div>
    </div>
  )
}
