"use client"

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { login, forgotPassword } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordResult, setForgotPasswordResult] = useState<string | null>(null)
  const [forgotPasswordError, setForgotPasswordError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const response = await login({ email, password })
      
      if (response.token) {
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
      }
      
      router.push('/sessions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotPasswordLoading(true)
    setForgotPasswordError('')
    setForgotPasswordResult(null)
    
    try {
      const response = await forgotPassword({ email: forgotPasswordEmail })
      setForgotPasswordResult(response.message || 'Revisa tu correo para restablecer tu contrasena')
    } catch (err) {
      setForgotPasswordError(err instanceof Error ? err.message : 'Error al enviar el correo')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 spectra-grid-bg opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[oklch(0.65_0.2_280_/_6%)] blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-[oklch(0.75_0.14_195_/_4%)] blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SpectraView</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Session Recording & Analytics
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="spectra-glow border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Iniciar sesion</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Correo electronico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contrasena</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordOpen(true)
                      setForgotPasswordEmail(email)
                      setForgotPasswordResult(null)
                      setForgotPasswordError('')
                    }}
                    className="text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    Olvidaste tu contrasena?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          SpectraView by CIT &middot; Session Recording Platform
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar contrasena</DialogTitle>
            <DialogDescription>
              Ingresa tu correo electronico y te enviaremos instrucciones para restablecer tu contrasena.
            </DialogDescription>
          </DialogHeader>
          
          {forgotPasswordResult ? (
            <div className="rounded-lg bg-emerald-500/15 text-emerald-400 p-3 text-sm">
              {forgotPasswordResult}
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="forgot-email">Correo electronico</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="tu@empresa.com"
                  required
                  value={forgotPasswordEmail}
                  onChange={e => setForgotPasswordEmail(e.target.value)}
                />
              </div>
              {forgotPasswordError && (
                <p className="text-sm text-destructive">{forgotPasswordError}</p>
              )}
            </form>
          )}
          
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost">
                {forgotPasswordResult ? 'Cerrar' : 'Cancelar'}
              </Button>
            </DialogClose>
            {!forgotPasswordResult && (
              <Button onClick={handleForgotPassword} disabled={forgotPasswordLoading}>
                {forgotPasswordLoading ? 'Enviando...' : 'Enviar instrucciones'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}