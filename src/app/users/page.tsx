"use client"
import React, { useEffect, useState } from 'react'

type User = {
  id: string
  name: string
  email: string
  password?: string
}

const STORAGE_KEY = 'mediaPlayer.users'

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([])
  const [editing, setEditing] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed)
        } else {
          const sample: User[] = [
            { id: 'u1', name: 'María López', email: 'maria@example.com', password: 'pass1234' },
            { id: 'u2', name: 'Carlos Ruiz', email: 'carlos@example.com', password: 'secret789' },
          ]
          setItems(sample)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sample))
        }
      } catch {
        setItems([])
      }
    } else {
      const sample: User[] = [
        { id: 'u1', name: 'María López', email: 'maria@example.com', password: 'pass1234' },
        { id: 'u2', name: 'Carlos Ruiz', email: 'carlos@example.com', password: 'secret789' },
      ]
      setItems(sample)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sample))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function resetForm() {
    setEditing(null)
    setName('')
    setEmail('')
    setPassword('')
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { alert('Email inválido'); return }
    if (!editing && password.trim().length < 6) { alert('La contraseña debe tener al menos 6 caracteres'); return }

    if (editing) {
      setItems(items.map((it) => it.id === editing.id ? { ...it, name, email, password: password.trim() || it.password } : it))
    } else {
      const newItem: User = { id: Date.now().toString(), name, email, password: password.trim() }
      setItems([newItem, ...items])
    }
    resetForm()
  }

  async function copyToClipboard(text: string) {
    try { await navigator.clipboard.writeText(text); alert('Contraseña copiada'); return true } catch { alert('No se pudo copiar'); return false }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Usuarios</h2>
      <form onSubmit={onSubmit} className="card-surface p-4 rounded-lg flex flex-col gap-3">
        <div className="flex gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="flex-1 app-input" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" className="w-64 app-input" />
        </div>

        <div className="flex gap-3">
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'} type="password" className="flex-1 app-input" />
        </div>

        <div className="flex items-center gap-3">
          <button className="pill-button" type="submit">{editing ? 'Guardar' : 'Crear'}</button>
          {editing && <button type="button" className="pill-button bg-gray-600" onClick={resetForm}>Cancelar</button>}
        </div>
      </form>

      <div className="grid gap-3">
        {items.map((it) => (
          <div key={it.id} className="card-surface p-3 rounded flex items-center justify-between">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-sm text-muted">{it.email}</div>
              <div className="text-sm text-muted">Contraseña: <code className="rounded bg-[rgba(255,255,255,0.04)] px-2 py-0.5">{showPasswordId === it.id ? (it.password ?? '') : '••••••••'}</code></div>
            </div>
            <div className="flex gap-2">
              <button className="pill-button" onClick={() => { setEditing(it); setName(it.name); setEmail(it.email); setPassword('') }}>Editar</button>
              <button className="pill-button" onClick={() => { setShowPasswordId(showPasswordId === it.id ? null : it.id) }}>{showPasswordId === it.id ? 'Ocultar' : 'Mostrar'}</button>
              <button className="pill-button" onClick={() => { if (it.password) copyToClipboard(it.password) }}>Copiar</button>
              <button className="pill-button bg-red-600" onClick={() => { if (confirm('Eliminar usuario?')) setItems(items.filter((x) => x.id !== it.id)) }}>Eliminar</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-muted">No hay usuarios registrados.</div>}
      </div>
    </div>
  )
}
