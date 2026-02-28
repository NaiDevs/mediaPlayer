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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type User = {
  id: string
  name: string
  email: string
  password?: string
  role: 'admin' | 'viewer' | 'editor'
  createdAt: string
}

const STORAGE_KEY = 'mediaPlayer.users'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
] as const

function loadUsersFromStorage(): User[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((u: Record<string, unknown>) => ({
          ...u,
          role: u.role ?? 'viewer',
          createdAt: u.createdAt ?? new Date().toISOString().split('T')[0],
        })) as User[]
      }
    } catch {
      return []
    }
  }
  const sample: User[] = [
    { id: 'u1', name: 'Maria Lopez', email: 'maria@spectraview.io', password: 'pass1234', role: 'admin', createdAt: '2025-12-01' },
    { id: 'u2', name: 'Carlos Ruiz', email: 'carlos@spectraview.io', password: 'secret789', role: 'editor', createdAt: '2026-01-15' },
    { id: 'u3', name: 'Ana Torres', email: 'ana@spectraview.io', password: 'viewer123', role: 'viewer', createdAt: '2026-02-10' },
  ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sample))
  return sample
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const avatarColors = [
  'bg-violet-500/20 text-violet-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-amber-500/20 text-amber-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-rose-500/20 text-rose-400',
  'bg-blue-500/20 text-blue-400',
]

function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const roleBadgeVariant: Record<User['role'], string> = {
  admin: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  editor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  viewer: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const hydratedRef = React.useRef(false)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [editing, setEditing] = useState<User | null>(null)
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState<User['role']>('viewer')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setUsers(loadUsersFromStorage())
    hydratedRef.current = true
  }, [])

  useEffect(() => {
    if (hydratedRef.current) localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  }, [users])

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.includes(search.toLowerCase())
  )

  function resetForm() {
    setEditing(null)
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormRole('viewer')
    setFormError('')
  }

  function openCreate() {
    resetForm()
    setDialogOpen(true)
  }

  function openEdit(user: User) {
    setEditing(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormPassword('')
    setFormRole(user.role)
    setFormError('')
    setDialogOpen(true)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!formName.trim() || !formEmail.trim()) {
      setFormError('Nombre y email son requeridos')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formEmail)) {
      setFormError('Email invalido')
      return
    }
    if (!editing && formPassword.trim().length < 6) {
      setFormError('La contrasena debe tener al menos 6 caracteres')
      return
    }

    if (editing) {
      setUsers(prev =>
        prev.map(u =>
          u.id === editing.id
            ? { ...u, name: formName, email: formEmail, role: formRole, password: formPassword.trim() || u.password }
            : u
        )
      )
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: formName,
        email: formEmail,
        password: formPassword.trim(),
        role: formRole,
        createdAt: new Date().toISOString().split('T')[0],
      }
      setUsers(prev => [newUser, ...prev])
    }
    setDialogOpen(false)
    resetForm()
  }

  function confirmDelete(user: User) {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  function executeDelete() {
    if (!userToDelete) return
    setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
    setDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  const copyPassword = useCallback(async (user: User) => {
    if (!user.password) return
    try {
      await navigator.clipboard.writeText(user.password)
      setCopiedId(user.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // fallback silently
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Administra los usuarios que tienen acceso a la plataforma
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar usuario' : 'Crear usuario'}</DialogTitle>
              <DialogDescription>
                {editing
                  ? 'Modifica los datos del usuario. La contrasena es opcional.'
                  : 'Completa los datos para crear un nuevo usuario.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-name">Nombre</Label>
                <Input
                  id="user-name"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Juan Perez"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="juan@empresa.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-password">
                  Contrasena {editing && <span className="text-muted-foreground font-normal">(opcional)</span>}
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder={editing ? 'Dejar vacio para mantener' : 'Min. 6 caracteres'}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Rol</Label>
                <div className="flex gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setFormRole(r.value)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                        formRole === r.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {r.label}
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
                  {editing ? 'Guardar cambios' : 'Crear usuario'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total usuarios</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-3xl">{users.filter(u => u.role === 'admin').length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Activos este mes</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o rol..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Contrasena</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={cn("text-xs font-semibold", getAvatarColor(user.id))}>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium leading-none">{user.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs font-medium", roleBadgeVariant[user.role])}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                        {showPasswordId === user.id ? (user.password ?? '') : '••••••••'}
                      </code>
                      <button
                        onClick={() => setShowPasswordId(showPasswordId === user.id ? null : user.id)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title={showPasswordId === user.id ? 'Ocultar' : 'Mostrar'}
                      >
                        {showPasswordId === user.id ? <EyeOffIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => copyPassword(user)}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Copiar"
                      >
                        {copiedId === user.id ? <CheckIcon className="h-3.5 w-3.5 text-emerald-400" /> : <CopyIcon className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.createdAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(user)} title="Editar">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => confirmDelete(user)} className="text-destructive hover:text-destructive" title="Eliminar">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    {search ? 'No se encontraron usuarios con esa busqueda' : 'No hay usuarios registrados'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              Estas seguro que quieres eliminar a <span className="font-medium text-foreground">{userToDelete?.name}</span>? Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={executeDelete}>
              Eliminar
            </Button>
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

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
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
