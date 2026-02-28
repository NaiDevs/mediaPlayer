"use client"

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type Session = {
  id: string
  appId: string
  user: string
  startedAt: number
  duration: string
  durationMs: number
  events: number
  errors: number
  status: 'completed' | 'live' | 'error'
  device: 'desktop' | 'mobile' | 'tablet'
  browser: string
  country: string
  pages: number
}

const SESSIONS: Session[] = [
  {
    id: 'sess-1', appId: 'yalo-pos', user: 'Juan Mendez',
    startedAt: Date.now() - 3_600_000, duration: '12:47', durationMs: 767_000,
    events: 342, errors: 2, status: 'completed', device: 'desktop',
    browser: 'Chrome 121', country: 'MX', pages: 8,
  },
  {
    id: 'sess-2', appId: 'bip-bip', user: 'Maria Garcia',
    startedAt: Date.now() - 7_200_000, duration: '07:15', durationMs: 435_000,
    events: 187, errors: 0, status: 'completed', device: 'mobile',
    browser: 'Safari 17', country: 'CO', pages: 4,
  },
  {
    id: 'sess-3', appId: 'patmed', user: 'Carlos Ruiz',
    startedAt: Date.now() - 1_800_000, duration: '19:03', durationMs: 1_143_000,
    events: 521, errors: 5, status: 'error', device: 'desktop',
    browser: 'Firefox 122', country: 'AR', pages: 12,
  },
  {
    id: 'sess-4', appId: 'dashboard', user: 'Ana Torres',
    startedAt: Date.now() - 300_000, duration: '02:31', durationMs: 151_000,
    events: 64, errors: 0, status: 'live', device: 'tablet',
    browser: 'Chrome 121', country: 'MX', pages: 2,
  },
  {
    id: 'sess-5', appId: 'yalo-pos', user: 'Roberto Diaz',
    startedAt: Date.now() - 14_400_000, duration: '05:22', durationMs: 322_000,
    events: 156, errors: 1, status: 'completed', device: 'mobile',
    browser: 'Chrome 120', country: 'PE', pages: 6,
  },
  {
    id: 'sess-6', appId: 'analytics', user: 'Laura Vega',
    startedAt: Date.now() - 28_800_000, duration: '08:44', durationMs: 524_000,
    events: 289, errors: 0, status: 'completed', device: 'desktop',
    browser: 'Edge 121', country: 'CL', pages: 9,
  },
]

const statusConfig = {
  completed: { label: 'Completada', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  live: { label: 'En vivo', className: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  error: { label: 'Con errores', className: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
}

const deviceIcons: Record<Session['device'], React.FC<{ className?: string }>> = {
  desktop: MonitorIcon,
  mobile: SmartphoneIcon,
  tablet: TabletIcon,
}

const avatarColors = [
  'bg-violet-500/20 text-violet-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-amber-500/20 text-amber-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-rose-500/20 text-rose-400',
  'bg-blue-500/20 text-blue-400',
]

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'Hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}

type FilterStatus = 'all' | Session['status']
type SortBy = 'recent' | 'duration' | 'events' | 'errors'

export default function SessionsPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortBy>('recent')

  const filtered = useMemo(() => {
    let result = SESSIONS.filter(s => {
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        s.user.toLowerCase().includes(q) ||
        s.appId.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.browser.toLowerCase().includes(q)
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus
      return matchesSearch && matchesStatus
    })

    switch (sortBy) {
      case 'recent': result.sort((a, b) => b.startedAt - a.startedAt); break
      case 'duration': result.sort((a, b) => b.durationMs - a.durationMs); break
      case 'events': result.sort((a, b) => b.events - a.events); break
      case 'errors': result.sort((a, b) => b.errors - a.errors); break
    }

    return result
  }, [search, filterStatus, sortBy])

  const totalEvents = SESSIONS.reduce((sum, s) => sum + s.events, 0)
  const totalErrors = SESSIONS.reduce((sum, s) => sum + s.errors, 0)
  const avgDuration = Math.round(SESSIONS.reduce((sum, s) => sum + s.durationMs, 0) / SESSIONS.length / 1000)
  const avgMin = Math.floor(avgDuration / 60)
  const avgSec = avgDuration % 60

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sesiones</h1>
        <p className="text-sm text-muted-foreground">
          Explora y reproduce las interacciones de tus usuarios en tiempo real
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total sesiones</CardDescription>
            <CardTitle className="text-3xl">{SESSIONS.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Eventos capturados</CardDescription>
            <CardTitle className="text-3xl">{totalEvents.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Errores detectados</CardDescription>
            <CardTitle className={cn("text-3xl", totalErrors > 0 && "text-rose-400")}>{totalErrors}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Duracion promedio</CardDescription>
            <CardTitle className="text-3xl">{avgMin}:{String(avgSec).padStart(2, '0')}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-72">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar usuario, app, sesion..."
              className="pl-9"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 rounded-lg border border-border bg-secondary/30 p-1">
            {([
              { value: 'all', label: 'Todas' },
              { value: 'live', label: 'En vivo' },
              { value: 'completed', label: 'Completadas' },
              { value: 'error', label: 'Errores' },
            ] as const).map(f => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  filterStatus === f.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ordenar:</span>
          <div className="flex gap-1 rounded-lg border border-border bg-secondary/30 p-1">
            {([
              { value: 'recent', label: 'Recientes' },
              { value: 'duration', label: 'Duracion' },
              { value: 'events', label: 'Eventos' },
              { value: 'errors', label: 'Errores' },
            ] as const).map(s => (
              <button
                key={s.value}
                onClick={() => setSortBy(s.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  sortBy === s.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Usuario</TableHead>
                <TableHead>App</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead className="text-right">Eventos</TableHead>
                <TableHead className="text-right">Errores</TableHead>
                <TableHead className="text-right">Duracion</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead className="text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(session => {
                const DeviceIcon = deviceIcons[session.device]
                return (
                  <TableRow key={session.id} className="group">
                    {/* User */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={cn("text-xs font-semibold", getAvatarColor(session.id))}>
                            {getInitials(session.user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-none">{session.user}</p>
                          <p className="mt-1 text-xs text-muted-foreground font-mono">{session.id}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* App */}
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{session.appId}</Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {session.status === 'live' && (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                          </span>
                        )}
                        <Badge variant="outline" className={cn("text-xs font-medium", statusConfig[session.status].className)}>
                          {statusConfig[session.status].label}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Device */}
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DeviceIcon className="h-4 w-4" />
                        <span className="text-xs">{session.browser}</span>
                      </div>
                    </TableCell>

                    {/* Events */}
                    <TableCell className="text-right font-mono text-sm">
                      {session.events}
                    </TableCell>

                    {/* Errors */}
                    <TableCell className="text-right font-mono text-sm">
                      <span className={cn(session.errors > 0 && "text-rose-400 font-semibold")}>
                        {session.errors}
                      </span>
                    </TableCell>

                    {/* Duration */}
                    <TableCell className="text-right font-mono text-sm">
                      {session.duration}
                    </TableCell>

                    {/* Started */}
                    <TableCell className="text-sm text-muted-foreground">
                      {timeAgo(session.startedAt)}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost" className="gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Link href={`/player/${session.id}`}>
                          <PlayIcon className="h-3.5 w-3.5" />
                          Replay
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No se encontraron sesiones con esos filtros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Inline Icons ────────────────────────────────────────── */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function SmartphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}

function TabletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}
