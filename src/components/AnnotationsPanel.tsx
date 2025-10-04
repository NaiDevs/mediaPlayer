"use client"
import React from 'react'

type AnnotationsPanelProps = {
  annotations: unknown[]
}

export default function AnnotationsPanel({ annotations }: AnnotationsPanelProps) {
  return (
    <div className="p-4 border-t">
      <h4 className="font-medium mb-2">Anotaciones</h4>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {annotations.length === 0 && <div className="text-sm text-gray-500">Sin anotaciones</div>}
        {annotations.map((a, i) => (
          <div key={i} className="text-sm text-gray-700">{String(a)}</div>
        ))}
      </div>
    </div>
  )
}
