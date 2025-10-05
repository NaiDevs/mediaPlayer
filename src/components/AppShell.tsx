"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  children: React.ReactNode
}

export default function AppShell({ children }: Props) {
  const pathname = usePathname() ?? ''
  const hideSidebar = pathname.startsWith('/')

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,107,53,0.12),_transparent_55%)]" />
      <div className="relative z-10 flex min-h-screen flex-row gap-6 px-4 py-6 sm:px-6">
        {!hideSidebar && (
          <aside className="card-surface flex h-screen w-72 flex-col gap-6 rounded-2xl px-4 py-6 overflow-y-auto sticky top-0">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Session Player</h1>
              </div>
            </div>

            <nav className="flex flex-col gap-3 text-sm font-medium h-full">
              <Link href="/sessions" className="pill-button">Sesiones</Link>
              <Link href="/apps" className="pill-button">Aplicaciones</Link>
              <Link href="/apps" className="pill-button">Usuarios</Link>
            </nav>

          </aside>
        )}

        <main className={`flex-1 py-2 rounded-2xl overflow-auto ${hideSidebar ? 'mx-auto w-full max-w-4xl' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
