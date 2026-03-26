"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { listApps, createApp, updateApp, deleteApp, rotateApiKey, AppItem } from '@/lib/apps'

const statusConfig = {
  active: { label: 'Activa', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  inactive: { label: 'Inactiva', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
}

export default function AppsPage() {
  const [apps, setApps] = useState<AppItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [regenDialogOpen, setRegenDialogOpen] = useState(false)
  const [targetApp, setTargetApp] = useState<AppItem | null>(null)
  const [editing, setEditing] = useState<AppItem | null>(null)

  const [formName, setFormName] = useState('')
  const [formAppId, setFormAppId] = useState('')
  const [formStatus, setFormStatus] = useState<AppItem['status']>('active')
  const [formError, setFormError] = useState('')

  const [copiedField, setCopiedField] = useState<{ id: string; field: 'apiKey' | 'appId' } | null>(null)

  useEffect(() => {
    loadApps()
  }, [])

  async function loadApps() {
    setLoading(true)
    setError(null)
    try {
      const response = await listApps()
      setApps(response?.apps || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar aplicaciones')
    } finally {
      setLoading(false)
    }
  }

  const filteredApps = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.appId.toLowerCase().includes(search.toLowerCase()) ||
    a.status.includes(search.toLowerCase())
  )

  function resetForm() {
    setEditing(null)
    setFormName('')
    setFormAppId('')
    setFormStatus('active')
    setFormError('')
  }

  function openCreate() {
    resetForm()
    setDialogOpen(true)
  }

  function openEdit(app: AppItem) {
    setEditing(app)
    setFormName(app.name)
    setFormAppId(app.appId)
    setFormStatus(app.status)
    setFormError('')
    setDialogOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!formName.trim()) {
      setFormError('El nombre es requerido')
      return
    }

    try {
      if (editing) {
        const updated = await updateApp(editing.appId, {
          name: formName,
          status: formStatus,
        })
        setApps(prev => prev.map(a => a.appId === editing.appId ? updated : a))
      } else {
        const created = await createApp({
          name: formName,
          appId: formAppId.trim() || undefined,
          status: formStatus,
        })
        setApps(prev => [created, ...prev])
      }
      setDialogOpen(false)
      resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar aplicacion')
    }
  }

  function confirmDelete(app: AppItem) {
    setTargetApp(app)
    setDeleteDialogOpen(true)
  }

  async function executeDelete() {
    if (!targetApp) return
    try {
      await deleteApp(targetApp.appId)
      setApps(prev => prev.filter(a => a.appId !== targetApp.appId))
      setDeleteDialogOpen(false)
      setTargetApp(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar aplicacion')
    }
  }

  function confirmRegen(app: AppItem) {
    setTargetApp(app)
    setRegenDialogOpen(true)
  }

  async function executeRegen() {
    if (!targetApp) return
    try {
      const result = await rotateApiKey(targetApp.appId)
      setApps(prev => prev.map(a => a.appId === targetApp.appId ? { ...a, apiKey: result.apiKey } : a))
      setRegenDialogOpen(false)
      setTargetApp(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al regenerar API key')
    }
  }

  const copyToClipboard = useCallback(async (app: AppItem, field: 'apiKey' | 'appId') => {
    const text = field === 'apiKey' ? (app.apiKey || '') : app.appId
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField({ id: app.id, field })
      setTimeout(() => setCopiedField(null), 2000)
    } catch { /* silent */ }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando aplicaciones...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadApps} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aplicaciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las apps conectadas a SpectraView y sus API keys
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Nueva aplicacion
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar aplicacion' : 'Crear aplicacion'}</DialogTitle>
              <DialogDescription>
                {editing
                  ? 'Modifica el nombre o estado de la aplicacion.'
                  : 'Se generara automaticamente un App ID y API Key.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="app-name">Nombre</Label>
                <Input
                  id="app-name"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Mi Aplicacion"
                />
              </div>

              {!editing && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="app-id">
                    App ID <span className="text-muted-foreground font-normal">(opcional, se auto-genera)</span>
                  </Label>
                  <Input
                    id="app-id"
                    value={formAppId}
                    onChange={e => setFormAppId(e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="mi-aplicacion"
                    className="font-mono text-sm"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label>Estado</Label>
                <div className="flex gap-2">
                  {(['active', 'inactive'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormStatus(s)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                        formStatus === s
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}

              <DialogFooter className="gap-2 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button type="submit">
                  {editing ? 'Guardar cambios' : 'Crear aplicacion'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total apps</CardDescription>
            <CardTitle className="text-3xl">{apps.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Activas</CardDescription>
            <CardTitle className="text-3xl text-emerald-400">{apps.filter(a => a.status === 'active').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inactivas</CardDescription>
            <CardTitle className="text-3xl text-zinc-400">{apps.filter(a => a.status === 'inactive').length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, app ID o estado..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Aplicacion</TableHead>
                <TableHead>App ID</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.map(app => (
                <TableRow key={app.id}>
                  {/* Name */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                        <BoxIcon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{app.name}</span>
                    </div>
                  </TableCell>

                  {/* App ID */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">{app.appId}</code>
                      <button
                        onClick={() => copyToClipboard(app, 'appId')}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Copiar App ID"
                      >
                        {copiedField?.id === app.id && copiedField.field === 'appId'
                          ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                          : <CopyIcon className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </TableCell>

                  {/* API Key */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono max-w-[180px] truncate block">
                        {app.apiKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(app, 'apiKey')}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Copiar API Key"
                      >
                        {copiedField?.id === app.id && copiedField.field === 'apiKey'
                          ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                          : <CopyIcon className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => confirmRegen(app)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Regenerar API Key"
                      >
                        <RefreshIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs font-medium", statusConfig[app.status].className)}>
                      {statusConfig[app.status].label}
                    </Badge>
                  </TableCell>

                  {/* Created */}
                  <TableCell className="text-sm text-muted-foreground">
                    {app.createdAt}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(app)} title="Editar">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => confirmDelete(app)} className="text-destructive hover:text-destructive" title="Eliminar">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredApps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {search ? 'No se encontraron aplicaciones con esa busqueda' : 'No hay aplicaciones creadas'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar aplicacion</DialogTitle>
            <DialogDescription>
              Estas seguro que quieres eliminar <span className="font-medium text-foreground">{targetApp?.name}</span>?
              Su API Key dejara de funcionar inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={executeDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate dialog */}
      <Dialog open={regenDialogOpen} onOpenChange={setRegenDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Regenerar API Key</DialogTitle>
            <DialogDescription>
              La API Key actual de <span className="font-medium text-foreground">{targetApp?.name}</span> sera invalidada.
              Necesitaras actualizar la configuracion del SDK.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button onClick={executeRegen}>Regenerar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─── Inline Icons ────────────────────────────────────────── */

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27,6.96 12,12.01 20.73,6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  )
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23,4 23,10 17,10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}