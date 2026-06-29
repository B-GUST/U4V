'use client'

import type { NodoGeografico, Despacho, Perfil, BloquesTiempo } from '@/types/database'
import { TimeSlotCell } from './TimeSlotCell'

interface NodeTableProps {
  nodos: NodoGeografico[]
  despachos: Despacho[]
  perfilActual: Perfil
  onSlotClick: (nodo: NodoGeografico, franja: BloquesTiempo) => void
}

const FRANJAS: BloquesTiempo[] = ['mañana', 'tarde', 'noche']
const FRANJA_LABELS = { 'mañana': '☀️ Mañana', 'tarde': '🌤 Tarde', 'noche': '🌙 Noche' }

function UrgenciaBadge({ nivel }: { nivel: string }) {
  const cls = nivel === 'rojo' ? 'urgencia-rojo' : nivel === 'amarillo' ? 'urgencia-amarillo' : 'urgencia-verde'
  const dot = nivel === 'rojo' ? '🔴' : nivel === 'amarillo' ? '🟡' : '🟢'
  const label = nivel === 'rojo' ? 'Crítico' : nivel === 'amarillo' ? 'Moderado' : 'Estable'
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border font-medium ${cls}`}>
      {dot} {label}
    </span>
  )
}

function DeficitBar({ actual, total }: { actual: number; total: number }) {
  if (total === 0) return <span className="text-xs text-muted-foreground">—</span>
  const pct = Math.min(100, Math.round((actual / total) * 100))
  const color = pct > 70 ? 'bg-red-500' : pct > 40 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-foreground/70 shrink-0 w-20 text-right">
        {actual.toLocaleString()} rac.
      </span>
    </div>
  )
}

export function NodeTable({ nodos, despachos, perfilActual, onSlotClick }: NodeTableProps) {
  if (nodos.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-muted-foreground">No hay nodos que coincidan con el filtro activo.</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/8">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-0 border-b border-white/8 bg-white/3">
        <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Zona / Nodo</div>
        <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Déficit Hoy</div>
        {FRANJAS.map(f => (
          <div key={f} className="px-2 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
            {FRANJA_LABELS[f]}
          </div>
        ))}
      </div>

      {/* Filas */}
      <div className="divide-y divide-white/5">
        {nodos.map((nodo) => {
          const despachosNodo = despachos.filter(d => d.nodo_id === nodo.id)

          return (
            <div
              key={nodo.id}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-0 hover:bg-white/3 transition-colors duration-150 group"
            >
              {/* Nombre del nodo */}
              <div className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground group-hover:text-teal-400/90 transition-colors">
                    {nodo.nombre_nodo}
                  </span>
                  <div className="flex items-center gap-2">
                    <UrgenciaBadge nivel={nodo.semaforo_medico} />
                    <span className="text-xs text-muted-foreground">
                      {nodo.poblacion_estimada.toLocaleString()} pers.
                    </span>
                  </div>
                </div>
              </div>

              {/* Déficit */}
              <div className="px-4 py-3 flex items-center">
                <div className="w-full">
                  <DeficitBar actual={nodo.deficit_diario_raciones} total={nodo.poblacion_estimada * 3} />
                  {nodo.deficit_diario_agua_litros > 0 && (
                    <p className="text-xs text-blue-400/70 mt-1">
                      💧 {nodo.deficit_diario_agua_litros.toLocaleString()} L agua
                    </p>
                  )}
                </div>
              </div>

              {/* Franjas horarias */}
              {FRANJAS.map(franja => {
                const despacho = despachosNodo.find(d => d.franja === franja) ?? null
                return (
                  <div key={franja} className="px-2 py-3 flex items-center justify-center">
                    <TimeSlotCell
                      nodo={nodo}
                      franja={franja}
                      despacho={despacho}
                      perfilActual={perfilActual}
                      onSlotClick={onSlotClick}
                    />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
