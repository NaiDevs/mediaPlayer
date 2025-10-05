import Link from 'next/link'

const sessions = [
  { id: 'spectra-demo-01', appId: 'yalo-pos', user: 'Juan', startedAt: Date.now() - 60000, duration: '12:47', country: 'MX' },
  { id: 'spectra-demo-02', appId: 'bip-bip', user: 'María', startedAt: Date.now() - 120000, duration: '07:15', country: 'CO' },
  { id: 'spectra-demo-03', appId: 'patmed', user: 'Carlos', startedAt: Date.now() - 300000, duration: '19:03', country: 'CL' }
]

export default function SessionsPage() {
  return (
    <section className="flex flex-col gap-10 ">
      <header className="card-surface flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.4em]">Sesiones demo</p>
          <h1 className="mt-2 text-3xl font-semibold">Explora interacciones reales</h1>
          <p className="mt-2 max-w-xl text-sm">
            Selecciona una sesión para abrir el reproductor, navegar por eventos y compartir con tu equipo de producto.
          </p>
        </div>
      </header>

      <ul className="grid gap-5 md:grid-cols-2">
        {sessions.map((session) => (
          <li key={session.id} className="card-surface flex flex-col gap-4 p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_40px_120px_rgba(14,165,233,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest /50">{session.appId}</p>
                <h2 className="text-xl font-semibold ">{session.user}</h2>
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs /70">
                {session.country}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm /70">
              <span>{new Date(session.startedAt).toLocaleString()}</span>
              <span className="font-mono /80">Duración · {session.duration}</span>
            </div>

            <Link
              href={`/player/${session.id}`}
              className="pill-button mt-2 justify-center"
            >
              Ver sesión
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
