import Link from 'next/link'
const sessions = [
  { id: 'sess-1', appId: 'yalo-pos', user: 'juan', startedAt: Date.now() - 60000 },
  { id: 'sess-2', appId: 'bip-bip', user: 'maria', startedAt: Date.now() - 120000 },
  { id: 'sess-3', appId: 'patmed', user: 'carlos', startedAt: Date.now() - 300000 }
]

export default function SessionsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sesiones (demo)</h1>
      <ul className="space-y-3">
        {sessions.map((s) => (
          <li key={s.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-medium">{s.appId} — {s.user}</div>
              <div className="text-sm text-gray-500">{new Date(s.startedAt).toLocaleString()}</div>
            </div>
            <div>
              <Link href={`/player/${s.id}`} className="px-3 py-1 bg-blue-600 text-white rounded">Ver</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
