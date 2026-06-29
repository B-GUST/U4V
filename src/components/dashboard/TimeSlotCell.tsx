'use client'

import type { NodoGeografico, Despacho, Perfil, BloquesTiempo } from '@/types/database'

interface TimeSlotCellProps {
  nodo: NodoGeografico
  franja: BloquesTiempo
  despacho: Despacho | null
  perfilActual: Perfil
  onSlotClick: (nodo: NodoGeografico, franja: BloquesTiempo) => void
}

export function TimeSlotCell({ nodo, franja, despacho, perfilActual, onSlotClick }: TimeSlotCellProps) {
  if (!despacho) {
    // Slot libre — botón de acción
    return (
      <button
        onClick={() => onSlotClick(nodo, franja)}
        id={`slot-${nodo.id}-${franja}`}
        title={`Asignar despacho: ${nodo.nombre_nodo} · ${franja}`}
        className="slot-libre w-full text-xs px-2 py-2 rounded-xl border font-medium text-center cursor-pointer"
      >
        + Asignar
      </button>
    )
  }

  // Slot ocupado por esta ONG
  const esMio = despacho.centro_id === perfilActual.id
  const ongNombre = (despacho as Despacho & { perfiles?: { nombre_organizacion: string } }).perfiles?.nombre_organizacion

  return (
    <div
      className="slot-ocupado w-full text-xs px-2 py-2 rounded-xl border text-center space-y-0.5"
      title={`Ocupado por ${ongNombre ?? 'otra ONG'} · ${despacho.cantidad_declarada} ${despacho.tipo_insumo}`}
    >
      <div className="font-medium truncate max-w-[80px] mx-auto">
        {esMio ? (
          <span className="text-teal-400/70">✓ Tú</span>
        ) : (
          <span className="truncate block">{ongNombre?.split(' ').slice(0, 2).join(' ') ?? 'ONG'}</span>
        )}
      </div>
      <div className="text-muted-foreground/60 font-mono">
        {despacho.cantidad_declarada.toLocaleString()}
      </div>
    </div>
  )
}
