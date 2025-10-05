"use client"
import React from 'react'

type AnnotationsPanelProps = {
  annotations: unknown[]
}

export default function AnnotationsPanel({ annotations }: AnnotationsPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4 ">
      <div>
        <h4 className="text-lg font-semibold">Anotaciones</h4>
        <p className="text-xs uppercase tracking-[0.35em] /50">Insights del equipo</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {annotations.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm /60">
            Sin anotaciones todavía. Captura un insight clave y compártelo con tu squad.
          </div>
        )}
        {annotations.map((annotation, index) => (
          <article
            key={index}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm /80"
          >
            {String(annotation)}
          </article>
        ))}
      </div>
    </div>
  )
}
