'use client'

import { useState } from 'react'
import type { BloquesTiempo } from '@/types/database'

interface FieldReportFormProps {
  despachoId: string
  token: string
  nombreNodo: string
  franja: BloquesTiempo
  cantidadDeclarada: number
}

type SemaforoKey = 'falta_agua' | 'falta_comida' | 'emergencia_medica'

const FRANJA_LABELS: Record<BloquesTiempo, string> = {
  'mañana': '☀️ Mañana',
  'tarde': '🌤 Tarde',
  'noche': '🌙 Noche',
}

export function FieldReportForm({
  despachoId,
  token,
  nombreNodo,
  franja,
  cantidadDeclarada,
}: FieldReportFormProps) {
  const [cantidad, setCantidad] = useState(cantidadDeclarada)
  const [poblacion, setPoblacion] = useState<string>('')
  const [semaforo, setSemaforo] = useState<Record<SemaforoKey, boolean>>({
    falta_agua: false,
    falta_comida: false,
    emergencia_medica: false,
  })
  const [observacion, setObservacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleSemaforo(key: SemaforoKey) {
    setSemaforo(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function ajustarCantidad(delta: number) {
    setCantidad(prev => Math.max(0, prev + delta))
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          despachoId,
          token,
          cantidad_entregada_real: cantidad,
          nueva_poblacion_estimada: poblacion ? parseInt(poblacion) : null,
          falta_agua: semaforo.falta_agua,
          falta_comida: semaforo.falta_comida,
          emergencia_medica: semaforo.emergencia_medica,
          observacion_urgente: observacion || null,
          semaforo_observado: semaforo.emergencia_medica ? 'rojo' : (semaforo.falta_agua || semaforo.falta_comida) ? 'amarillo' : 'verde',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido')

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-4xl">
          ✅
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">¡Reporte Recibido!</h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Datos inyectados al centro de mando.<br />
            El sistema ha recalibrado las métricas de la zona.
          </p>
        </div>
        <div className="glass rounded-2xl px-6 py-4 text-sm text-muted-foreground border border-white/8 max-w-xs">
          <strong className="text-foreground block mb-1">{nombreNodo}</strong>
          {cantidad} raciones reportadas · {FRANJA_LABELS[franja]}
        </div>
        <p className="text-xs text-muted-foreground/50 mt-4">
          Gracias por tu labor. Puedes cerrar esta pestaña.
        </p>
      </div>
    )
  }

  // ── Formulario principal ────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      {/* Header — Sin menú de navegación para evitar abandonos */}
      <div className="px-5 pt-6 pb-4 border-b border-white/8 glass sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🇻🇪</span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sensor de Campo · U4V</span>
        </div>
        <h1 className="text-xl font-bold leading-tight">Reporte de Salida</h1>
        <p className="text-sm text-teal-400 font-medium mt-0.5">{nombreNodo}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {FRANJA_LABELS[franja]} · Declarado: {cantidadDeclarada.toLocaleString()} raciones
        </p>
      </div>

      {/* Cuerpo del formulario */}
      <div className="flex-1 px-5 py-6 space-y-7 overflow-y-auto pb-32">
        {/* Sección 1: Confirmación de entrega */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-3">
            Raciones entregadas reales
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => ajustarCantidad(-10)}
              className="w-14 h-14 rounded-2xl glass border border-white/10 text-xl font-bold text-muted-foreground hover:text-foreground hover:border-white/20 active:scale-95 transition-all"
              id="btn-decrementar"
              aria-label="Reducir 10"
            >
              −
            </button>

            <div className="flex-1 text-center">
              <input
                type="number"
                min="0"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-4xl font-bold text-center bg-transparent text-foreground focus:outline-none focus:text-teal-400 transition-colors"
                id="input-cantidad-real"
              />
              <p className="text-xs text-muted-foreground mt-1">raciones</p>
            </div>

            <button
              type="button"
              onClick={() => ajustarCantidad(10)}
              className="w-14 h-14 rounded-2xl glass border border-teal-500/30 text-xl font-bold text-teal-400 hover:bg-teal-500/10 active:scale-95 transition-all"
              id="btn-incrementar"
              aria-label="Añadir 10"
            >
              +
            </button>
          </div>

          {/* Diferencia vs declarado */}
          {cantidad !== cantidadDeclarada && (
            <p className={`text-xs text-center mt-2 ${cantidad < cantidadDeclarada ? 'text-amber-400' : 'text-emerald-400'}`}>
              {cantidad < cantidadDeclarada
                ? `⚠ ${(cantidadDeclarada - cantidad).toLocaleString()} raciones menos que lo declarado`
                : `✓ ${(cantidad - cantidadDeclarada).toLocaleString()} raciones adicionales`
              }
            </p>
          )}
        </div>

        {/* Sección 2: Semáforo de alertas */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-3">
            Estado de la Zona <span className="text-muted-foreground font-normal">(selecciona todo lo que aplique)</span>
          </label>
          <div className="grid grid-cols-1 gap-3">
            {([
              { key: 'falta_agua' as SemaforoKey, icon: '💧', label: 'Falta Agua', activeClass: 'border-blue-400/60 bg-blue-500/15 text-blue-300' },
              { key: 'falta_comida' as SemaforoKey, icon: '🍽', label: 'Falta Comida', activeClass: 'border-amber-400/60 bg-amber-500/15 text-amber-300' },
              { key: 'emergencia_medica' as SemaforoKey, icon: '🚨', label: 'Emergencia Médica', activeClass: 'border-red-400/60 bg-red-500/15 text-red-300' },
            ] as const).map(({ key, icon, label, activeClass }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleSemaforo(key)}
                id={`toggle-${key}`}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl border text-left font-semibold text-base transition-all duration-150 active:scale-[0.98] ${
                  semaforo[key]
                    ? `${activeClass} border`
                    : 'glass border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <span className="flex-1">{label}</span>
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                  semaforo[key] ? 'border-current bg-current/20' : 'border-white/20'
                }`}>
                  {semaforo[key] ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sección 3: Ajuste poblacional (opcional) */}
        <div>
          <label htmlFor="input-poblacion" className="text-sm font-semibold text-foreground block mb-2">
            Personas estimadas al salir{' '}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            id="input-poblacion"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Ej: 280"
            value={poblacion}
            onChange={(e) => setPoblacion(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal-500/60 text-lg"
          />
        </div>

        {/* Sección 4: Observación urgente (opcional) */}
        <div>
          <label htmlFor="input-observacion" className="text-sm font-semibold text-foreground block mb-2">
            Necesidad crítica{' '}
            <span className="text-muted-foreground font-normal">(opcional, breve)</span>
          </label>
          <textarea
            id="input-observacion"
            rows={2}
            placeholder='Ej: "Faltan toldos urgente" · "Puente cortado, ruta alterna por..."'
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            maxLength={200}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal-500/60 resize-none text-sm"
          />
        </div>

        {error && (
          <div className="urgencia-rojo rounded-2xl px-4 py-3 text-sm border">
            {error}
          </div>
        )}
      </div>

      {/* Footer fijo — Botón de envío */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-5 pb-6 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          id="btn-enviar-reporte"
          className="w-full h-16 rounded-2xl bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-slate-950 font-black text-base uppercase tracking-wide transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
        >
          {loading ? 'Enviando datos...' : 'ENVIAR REPORTE Y CERRAR DESPACHO'}
        </button>
        <p className="text-center text-xs text-muted-foreground/50 mt-2">
          Este enlace se invalidará tras el envío
        </p>
      </div>
    </div>
  )
}
