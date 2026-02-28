"use client"

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import SpectraViewer from '@/components/SpectraViewer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function PlayerPage() {
  const params = useParams()
  const router = useRouter()
  const rawId = params?.id || 'sess-1'
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()} title="Volver">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold tracking-tight">Sesion {id}</h1>
              <Badge variant="outline" className="bg-violet-500/15 text-violet-400 border-violet-500/20 text-xs">
                Replay
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Reproductor de sesion &middot; SpectraView
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/sessions">Todas las sesiones</Link>
        </Button>
      </div>

      {/* Player */}
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-card overflow-hidden">
        <SpectraViewer sessionId={id} />
      </div>
    </div>
  )
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12,19 5,12 12,5" />
    </svg>
  )
}
