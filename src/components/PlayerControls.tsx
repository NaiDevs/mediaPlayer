"use client"
import React, { useEffect, useState } from 'react'
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
}

export default function PlayerControls({ player }: PlayerControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(1)
  const [progress, setProgress] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [totalTime, setTotalTime] = useState<number>(0)

  const formatTime = (ms: number) => {
    if (!ms || Number.isNaN(ms)) return '00:00'
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  useEffect(() => {
    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    setTotalTime(0)
  }, [player])

  useEffect(() => {
    if (!player) return
    const timer = setInterval(() => {
      try {
        const meta = player.getMetaData()
        const current = player.getCurrentTime()
        const total = typeof meta.totalTime === 'number' ? meta.totalTime : 0
        setProgress(total > 0 ? (current / total) * 100 : 0)
        setCurrentTime(current)
        setTotalTime(total)
      } catch {
      }
    }, 200)

    return () => clearInterval(timer)
  }, [player])

  const togglePlay = () => {
    if (!player) return
    try {
      const p = player as PlayerType
      if (isPlaying) p.pause()
      else p.play()
      setIsPlaying(!isPlaying)
    } catch {
    }
  }

  const changeSpeed = (newSpeed: number) => {
    if (!player) return
    try {
      const p = player as PlayerType
      p.setSpeed(newSpeed)
      setSpeed(newSpeed)
    } catch {
    }
  }

  const seek = (percentage: number) => {
    if (!player) return
    try {
      const p = player as PlayerType
      const meta = p.getMetaData()
      const total = typeof meta.totalTime === 'number' ? meta.totalTime : 0
      const time = total > 0 ? (percentage / 100) * total : 0
      p.play(time)
    } catch {
    }
  }

  return (
    <div className="flex flex-col gap-3 text-white">
      <div className="flex items-center gap-4 text-xs uppercase tracking-[0.4em] text-white/50">
        <span>{formatTime(currentTime)}</span>
        <div className="flex-1 overflow-hidden rounded-full bg-white/10">
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="range-slider"
          />
        </div>
        <span>{formatTime(totalTime)}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => player?.play?.(0)}
            className="pill-button !px-3 !py-2"
            aria-label="Volver al inicio"
          >
            ⏮️
          </button>
          <button
            onClick={togglePlay}
            className="pill-button !px-6 !py-3 text-base"
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? '⏸️ Pausa' : '▶️ Reproducir'}
          </button>
          <button
            onClick={() => player?.play?.()}
            className="pill-button !px-3 !py-2"
            aria-label="Reanudar"
          >
            ⏭️
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70">
            <span>Velocidad</span>
            <select
              value={speed}
              onChange={(e) => changeSpeed(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold focus:outline-none"
            >
              {[0.5, 1, 1.5, 2, 4].map((option) => (
                <option key={option} value={option} className="text-black">
                  {option}x
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => player?.toggleFullscreen?.()}
            className="pill-button !px-4 !py-2"
          >
            🔳 Pantalla completa
          </button>
        </div>
      </div>
    </div>
  )
}
