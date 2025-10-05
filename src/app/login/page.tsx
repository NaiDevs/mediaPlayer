"use client"

import { useRouter } from 'next/navigation'
import React from 'react'

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = (e?: React.MouseEvent) => {
    e?.preventDefault()
    // placeholder: currently redirect to /sessions
    router.push('/sessions')
  }

  return (
    <section className="flex min-h-full items-center justify-center w-full px-4">
      <div className="card-surface w-full max-w-xl p-8 md:p-10">
        <div className="mb-6 flex flex-col gap-2">
          <span className="text-sm tracking-[0.3em] text-muted">Bienvenido</span>
          <h1 className="text-3xl font-semibold">Accede a Spectra Player</h1>
          <p className="text-muted">
            Ingresa tus credenciales para explorar sesiones reales, crear anotaciones y compartir insights con tu equipo.
          </p>
        </div>

        <form className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Usuario</span>
            <input
              className="w-full rounded-2xl border border-[rgba(255,174,120,0.14)] bg-[rgba(255,243,236,0.6)] px-4 py-3 placeholder:text-muted focus:border-[var(--accent-1)] focus:outline-none"
              placeholder="tu.correo@compañia.com"
              autoComplete="username"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Contraseña</span>
            <input
              type="password"
              className="w-full rounded-2xl border border-[rgba(255,174,120,0.14)] bg-[rgba(255,243,236,0.6)] px-4 py-3 placeholder:text-muted focus:border-[var(--accent-1)] focus:outline-none"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleLogin}
              className="inline-flex flex-1 items-center justify-center rounded-2xl pill-button px-4 py-3 text-sm font-semibold shadow-lg transition duration-200 hover:brightness-110"
            >
              Entrar
            </button>

          </div>
        </form>
      </div>

    </section>
  )
}
