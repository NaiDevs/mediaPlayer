"use client"
import React, { useEffect, useState } from 'react'

type AppItem = {
  id: string
  name: string
  appId: string
  apiKey: string
}

const STORAGE_KEY = 'mediaPlayer.apps'

function generateApiKey() {
  return 'ak_' + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12)
}

export default function AppsPage() {
  const [items, setItems] = useState<AppItem[]>([])
  const [editing, setEditing] = useState<AppItem | null>(null)
  const [name, setName] = useState('')
  const [appId, setAppId] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed)
        } else {
          // seed example data when array is empty
          const sample: AppItem[] = [
            { id: '1', name: 'Dashboard App', appId: 'dashboard', apiKey: generateApiKey() },
            { id: '2', name: 'Analytics Service', appId: 'analytics', apiKey: generateApiKey() },
          ]
          setItems(sample)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sample))
        }
      } catch {
        setItems([])
      }
    } else {
      // seed example data
      const sample: AppItem[] = [
        { id: '1', name: 'Dashboard App', appId: 'dashboard', apiKey: generateApiKey() },
        { id: '2', name: 'Analytics Service', appId: 'analytics', apiKey: generateApiKey() },
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
    setAppId('')
  }

  const [copiedId, setCopiedId] = useState<string | null>(null)

  function copyApiKey(item: AppItem) {
    try {
      navigator.clipboard.writeText(item.apiKey)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      alert('No se pudo copiar el api-key')
    }
  }

  function regenerateKey(item: AppItem) {
    if (!confirm('Regenerar api-key para la aplicación? Esto invalidará la clave anterior.')) return
    setItems(items.map((it) => it.id === item.id ? { ...it, apiKey: generateApiKey() } : it))
  }
  // helpers to generate unique appId
  function slugify(input: string) {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function randomSuffix(len = 4) {
    return Math.random().toString(36).slice(2, 2 + len)
  }

  function makeUniqueAppId(base: string) {
    let candidate = base
    let i = 0
    while (items.some((it) => it.appId === candidate)) {
      i += 1
      candidate = `${base}-${randomSuffix(3)}`
      if (i > 10) break
    }
    return candidate
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    // determine final appId: if editing keep existing, otherwise generate if empty
    let finalAppId = editing ? editing.appId : appId.trim()
    if (!finalAppId) {
      finalAppId = makeUniqueAppId(slugify(name) || `app${Date.now().toString().slice(-4)}`)
      setAppId(finalAppId)
    }

    // uniqueness check for appId
    const exists = items.some((it) => it.appId === finalAppId && it.id !== editing?.id)
    if (exists) {
      alert('El appId ya existe')
      return
    }

    if (editing) {
      setItems(items.map((it) => it.id === editing.id ? { ...it, name, appId: finalAppId } : it))
    } else {
      const newItem: AppItem = { id: Date.now().toString(), name, appId: finalAppId, apiKey: generateApiKey() }
      setItems([newItem, ...items])
    }
    resetForm()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Aplicaciones</h2>
      <form onSubmit={onSubmit} className="card-surface p-4 rounded-lg flex flex-col gap-3">
        <div className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la aplicación"
            className="flex-1 app-input"
          />
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
              <div className="text-sm text-muted">appId: {it.appId}</div>
              <div className="text-sm text-muted">api-key: <code className="rounded bg-[rgba(255,255,255,0.04)] px-2 py-0.5">{it.apiKey}</code></div>
            </div>
            <div className="flex gap-2">
              <button className="pill-button" onClick={() => { setEditing(it); setName(it.name) }}>Editar</button>
              <button className="pill-button" onClick={() => copyApiKey(it)}>{copiedId === it.id ? 'Copiado!' : 'Copiar'}</button>
              <button className="pill-button" onClick={() => regenerateKey(it)}>Regenerar</button>
              <button className="pill-button bg-red-600" onClick={() => { if (confirm('Eliminar aplicación?')) setItems(items.filter((x) => x.id !== it.id)) }}>Eliminar</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-muted">No hay aplicaciones creadas.</div>}
      </div>
    </div>
  )
}
