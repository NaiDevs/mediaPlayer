import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
      <form className="flex flex-col gap-3">
        <input className="border rounded px-3 py-2" placeholder="Usuario" />
        <input className="border rounded px-3 py-2" placeholder="Contraseña" type="password" />
        <div className="flex gap-2">
          <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded">Entrar</button>
          <Link href="/sessions" className="px-4 py-2 border rounded">Ir a sesiones (demo)</Link>
        </div>
      </form>
    </div>
  )
}
