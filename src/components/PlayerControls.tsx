"use client"
import React, { useEffect, useState } from 'react'

type PlayerType = {
  getMetaData: () => { totalTime: number }
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

  useEffect(() => {
    if (!player) return
    const timer = setInterval(() => {
      try {
        const meta = player.getMetaData()
        const current = player.getCurrentTime()
        setProgress((current / Math.max(meta.totalTime, 1)) * 100)
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
      const time = (percentage / 100) * meta.totalTime
      p.play(time)
    } catch {
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-center gap-4">
          <button onClick={() => player?.play?.(0)}>⏮️</button>
          <button onClick={togglePlay}>{isPlaying ? '⏸️' : '▶️'}</button>
          <button onClick={() => player?.play?.()}>⏭️</button>

          <select
            value={speed}
            onChange={(e) => changeSpeed(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>

          <button onClick={() => player?.toggleFullscreen?.()}>🔳 Fullscreen</button>
        </div>
      </div>
    </div>
  )
}
