"use client"
import { useParams } from 'next/navigation'
import SpectraViewer from '../../../components/SpectraViewer'

export default function PlayerPage() {
  const params = useParams()
  const rawId = params?.id || 'sess-1'
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  return (
    <section className="flex h-full flex-col gap-4 ">
      <header className="flex flex-col gap-2">
        <span className="text-sm uppercase tracking-[0.4em] /50">Reproduciendo</span>
        <h1 className="text-3xl font-semibold ">Sesión #{id}</h1>
      </header>

      <div className="card-surface h-[680px] w-full overflow-hidden p-4 sm:p-6">
        <SpectraViewer sessionId={id} />
      </div>
    </section>
  )
}
