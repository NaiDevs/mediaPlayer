"use client"
import { useParams } from 'next/navigation'
import SpectraViewer from '../../../components/SpectraViewer'

export default function PlayerPage() {
  const params = useParams()
  const rawId = params?.id || 'sess-1'
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Player - {id}</h1>
      <div className="h-[600px] border rounded">
        {/* SpectraViewer espera un sessionId y hace fetch a /api/sessions/:id/replay */}
        <SpectraViewer sessionId={id} />
      </div>
    </div>
  )
}
