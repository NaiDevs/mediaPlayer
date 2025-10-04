import Link from 'next/link'

export default function LoginPage() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-8 text-white">
      <div className="card-surface p-8 md:p-10">
        <div className="mb-6 flex flex-col gap-2">
          <span className="text-sm tracking-[0.3em] text-white/60">Bienvenido</span>
          <h1 className="text-3xl font-semibold">Accede a Spectra Player</h1>
          <p className="text-white/70">
            Ingresa tus credenciales para explorar sesiones reales, crear anotaciones y compartir insights con tu equipo.
          </p>
        </div>

        <form className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Usuario</span>
            <input
              className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none"
              placeholder="tu.correo@compañia.com"
              autoComplete="username"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Contraseña</span>
            <input
              type="password"
              className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition duration-200 hover:brightness-110"
            >
              Entrar
            </button>

            <Link
              href="/sessions"
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/20 px-4 py-3 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
            >
              Ver sesiones demo
            </Link>
          </div>
        </form>
      </div>

      <p className="text-center text-xs text-white/60">
        ¿Sin cuenta? Solicita acceso a tu administrador o explora la demo pública.
      </p>
    </section>
  )
}
