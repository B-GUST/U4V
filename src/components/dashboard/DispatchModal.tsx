'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NodoGeografico, Despacho, BloquesTiempo } from '@/types/database'

interface DispatchModalProps {
  nodo: NodoGeografico
  franja: BloquesTiempo
  perfilId: string
  onClose: () => void
  onCreated: (despacho: Despacho) => void
}

const FRANJAS_LABELS: Record<BloquesTiempo, string> = {
  'mañana': '☀️ Mañana (6:00 AM – 12:00 PM)',
  'tarde': '🌤 Tarde (12:00 PM – 6:00 PM)',
  'noche': '🌙 Noche (6:00 PM – 12:00 AM)',
}

const TIPOS_INSUMO = [
  'Comida Caliente',
  'Raciones Secas',
  'Agua Potable',
  'Medicamentos Básicos',
  'Artículos de Higiene',
  'Ropa y Abrigo',
  'Colchonetas / Toldos',
  'Material de Primeros Auxilios',
  'Otro',
]

export function DispatchModal({ nodo, franja, perfilId, onClose, onCreated }: DispatchModalProps) {
  const [tipoInsumo, setTipoInsumo] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tipoInsumo || !cantidad || parseInt(cantidad) <= 0) return

    setLoading(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('despachos')
      .insert({
        centro_id: perfilId,
        nodo_id: nodo.id,
        fecha_operacion: new Date().toISOString().split('T')[0],
        franja,
        tipo_insumo: tipoInsumo,
        cantidad_declarada: parseInt(cantidad),
        estado: 'transito',
      })
      .select('*')
      .single()

    setLoading(false)

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Esta franja ya fue reservada por otra ONG mientras registrabas. Elige otra.')
      } else if (insertError.message?.includes('terminos_aceptados')) {
        setError('Debes aceptar los términos de uso antes de crear un despacho.')
      } else {
        setError('Error al registrar el despacho. Intenta nuevamente.')
      }
    } else if (data) {
      onCreated(data as Despacho)
    }
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'oklch(0.076 0.007 285.75 / 0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md glass-strong rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">Manifiesto de Despacho</h2>
              <p className="text-sm text-muted-foreground mt-1">{nodo.nombre_nodo}</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/8"
              id="btn-cerrar-manifiesto"
            >
              ✕
            </button>
          </div>

          {/* Info de la franja seleccionada */}
          <div className="mt-3 flex items-center gap-3">
            <div className="slot-libre px-3 py-1.5 rounded-xl border text-xs font-medium">
              {FRANJAS_LABELS[franja]}
            </div>
            <div className={`text-xs px-2 py-1 rounded-lg border font-medium ${
              nodo.semaforo_medico === 'rojo' ? 'urgencia-rojo' :
              nodo.semaforo_medico === 'amarillo' ? 'urgencia-amarillo' : 'urgencia-verde'
            }`}>
              {nodo.deficit_diario_raciones.toLocaleString()} raciones en déficit
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="select-tipo-insumo" className="text-sm font-medium">Tipo de Insumo</Label>
            <select
              id="select-tipo-insumo"
              value={tipoInsumo}
              onChange={(e) => setTipoInsumo(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 focus:border-teal-500/60 rounded-xl h-11 px-3 text-sm text-foreground focus:outline-none appearance-none cursor-pointer"
            >
              <option value="" disabled style={{ background: '#0f172a' }}>Selecciona el tipo de ayuda...</option>
              {TIPOS_INSUMO.map(tipo => (
                <option key={tipo} value={tipo} style={{ background: '#0f172a' }}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="input-cantidad" className="text-sm font-medium">
              Cantidad Estimada a Despachar
            </Label>
            <div className="relative">
              <Input
                id="input-cantidad"
                type="number"
                min="1"
                placeholder="Ej: 300"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
                className="bg-white/5 border-white/10 focus:border-teal-500/60 rounded-xl h-11 pr-20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                raciones
              </span>
            </div>

            {/* Indicador de cobertura */}
            {cantidad && parseInt(cantidad) > 0 && nodo.deficit_diario_raciones > 0 && (
              <p className="text-xs text-muted-foreground">
                Cubrirá{' '}
                <span className={`font-bold ${
                  parseInt(cantidad) >= nodo.deficit_diario_raciones ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {Math.min(100, Math.round((parseInt(cantidad) / nodo.deficit_diario_raciones) * 100))}%
                </span>
                {' '}del déficit actual ({nodo.deficit_diario_raciones.toLocaleString()} raciones)
              </p>
            )}
          </div>

          {/* Advertencia legal */}
          <div className="glass rounded-xl p-3 border border-amber-500/20 text-xs text-amber-400/80">
            <span className="font-medium">⚠ Compromiso:</span> Al registrar este manifiesto, tu organización confirma
            la intención de despacho. La zona quedará bloqueada para otros centros durante esta franja.
          </div>

          {error && (
            <div className="urgencia-rojo rounded-xl px-3 py-2 text-sm border">
              {error}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 h-11 rounded-xl border-white/10 text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !tipoInsumo || !cantidad}
              id="btn-confirmar-despacho"
              className="flex-1 h-11 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold disabled:opacity-40"
            >
              {loading ? 'Registrando...' : '✓ Confirmar Despacho'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
