import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from 'next/image'
import Link from 'next/link'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spectra Player",
  description: "Observa, analiza y revive cada sesión de tus usuarios con estilo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}> 
        <div className="relative min-h-screen overflow-x-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_55%)]" />
          <div className="relative z-10 flex min-h-screen flex-row px-3 pb-10 sm:px-6">
            <aside className="card-surface flex h-[calc(100vh-48px)] w-72 flex-col gap-6 rounded-3xl px-6 py-6">
              <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-lg font-semibold text-foreground">Media Session Player</h1>
                </div>
              </div>

              <nav className="flex flex-col gap-3 text-sm font-medium">
                <Link href="/" className="pill-button">Inicio</Link>
                <Link href="/sessions" className="pill-button">Sesiones</Link>
                <Link href="/player/1" className="pill-button">Reproductor</Link>
              </nav>

              <div className="mt-auto">
                <Link href="/login" className="pill-button">Acceder</Link>
              </div>
            </aside>

            <main className="mx-auto mt-8 w-full max-w-7xl flex-1 rounded-[40px] border p-6 shadow-[0_60px_120px_rgba(12,74,110,0.35)] backdrop-blur-3xl sm:p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
