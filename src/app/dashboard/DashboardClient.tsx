'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TermsModal } from '@/components/auth/TermsModal'
import { NodeTable } from '@/components/dashboard/NodeTable'
import { DispatchModal } from '@/components/dashboard/DispatchModal'
import type { Perfil, NodoGeografico, Despacho, BloquesTiempo } from '@/types/database'

interface DashboardClientProps {
  perfil: Perfil
  nodos: NodoGeografico[]
  despachosHoy: Despacho[]
}

type FiltroActivo = 'todos' | 'rojos' | 'amarillos' | 'libres'

export function DashboardClient({ perfil, nodos: nodosInicial, despachosHoy: despachosInicial }: DashboardClientProps) {
  const [showTerms, setShowTerms] = useState(!perfil.terminos_aceptados)
  const [nodos, setNodos] = useState<NodoGeografico[]>(nodosInicial)
  const [despachos, setDespachos] = useState<Despacho[]>(despachosInicial)
  const [filtro, setFiltro] = useState<FiltroActivo>('todos')
  const [slotSeleccionado, setSlotSeleccionado] = useState<{ nodo: NodoGeografico; franja: BloquesTiempo } | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'active' | 'error'>('connecting')

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Suscripción Realtime
  useEffect(() => {
    const channel = supabase
      .channel('u4v-logistica')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'despachos',
        filter: `fecha_operacion=eq.${today}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDespachos(prev => [...prev, payload.new as Despacho])
        } else if (payload.eventType === 'UPDATE') {
          setDespachos(prev => prev.map(d => d.id === payload.new.id ? payload.new as Despacho : d))
        } else if (payload.eventType === 'DELETE') {
          setDespachos(prev => prev.filter(d => d.id !== payload.old.id))
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'nodos_geograficos',
      }, (payload) => {
        setNodos(prev => prev.map(n => n.id === payload.new.id ? payload.new as NodoGeografico : n))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('active')
        else if (status === 'CHANNEL_ERROR') setRealtimeStatus('error')
      })

    return () => { supabase.removeChannel(channel) }
  }, [supabase, today])

  // Filtrado de nodos
  const nodosFiltrados = nodos.filter(nodo => {
    if (filtro === 'rojos') return nodo.semaforo_medico === 'rojo'
    if (filtro === 'amarillos') return nodo.semaforo_medico === 'amarillo'
    if (filtro === 'libres') {
      const despachosNodo = despachos.filter(d => d.nodo_id === nodo.id)
      return despachosNodo.length < 3
    }
    return true
  })

  const handleSlotClick = useCallback((nodo: NodoGeografico, franja: BloquesTiempo) => {
    setSlotSeleccionado({ nodo, franja })
  }, [])

  const handleDespachoCreado = useCallback((nuevoDespacho: Despacho) => {
    setDespachos(prev => [...prev, nuevoDespacho])
    setSlotSeleccionado(null)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const realtimeColor = realtimeStatus === 'active' ? 'text-emerald-400' : realtimeStatus === 'error' ? 'text-red-400' : 'text-amber-400'
  const realtimeLabel = realtimeStatus === 'active' ? 'Tiempo Real Activo' : realtimeStatus === 'error' ? 'Error de Conexión' : 'Conectando...'
  const realtimeDot = realtimeStatus === 'active' ? '🟢' : realtimeStatus === 'error' ? '🔴' : '🟡'

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Modal de Términos — Bloquea toda la interfaz */}
      {showTerms && (
        <TermsModal perfil={perfil} onAccepted={() => setShowTerms(false)} />
      )}

      {/* TOP BAR */}
      <header className="glass border-b border-white/8 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-xl">🇻🇪</span>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">U4V · Libro Mayor</h1>
            <p className="text-xs text-muted-foreground leading-tight">{perfil.nombre_organizacion}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Indicador Realtime */}
          <div className={`flex items-center gap-1.5 text-xs ${realtimeColor}`}>
            <span className={realtimeStatus === 'active' ? 'realtime-pulse' : ''}>{realtimeDot}</span>
            <span className="hidden sm:inline">{realtimeLabel}</span>
          </div>

          {/* Fecha */}
          <div className="text-xs text-muted-foreground hidden md:block">
            {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          {/* Rol badge */}
          <div className={`text-xs px-2 py-1 rounded-lg border font-medium ${
            perfil.rol === 'admin' ? 'urgencia-rojo' :
            perfil.rol === 'primera_linea' ? 'urgencia-amarillo' :
            'urgencia-verde'
          }`}>
            {perfil.rol === 'admin' ? '⚙ Admin' : perfil.rol === 'primera_linea' ? '🔴 1ra Línea' : '🟡 Retaguardia'}
          </div>

          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
            id="btn-cerrar-sesion"
          >
            Salir ↗
          </button>
        </div>
      </header>

      {/* BODY — Filtros + Libro Mayor */}
      <div className="flex flex-1 overflow-hidden">
        {/* PANEL IZQUIERDO — Filtros */}
        <aside className="w-52 shrink-0 border-r border-white/8 p-4 flex flex-col gap-2 glass">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2">Filtros</p>

          {[
            { id: 'todos', label: 'Todas las Zonas', icon: '📋', count: nodos.length },
            { id: 'rojos', label: 'Alertas Críticas', icon: '🔴', count: nodos.filter(n => n.semaforo_medico === 'rojo').length },
            { id: 'amarillos', label: 'Alerta Moderada', icon: '🟡', count: nodos.filter(n => n.semaforo_medico === 'amarillo').length },
            { id: 'libres', label: 'Franjas Libres', icon: '✅', count: nodos.filter(n => despachos.filter(d => d.nodo_id === n.id).length < 3).length },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id as FiltroActivo)}
              id={`filtro-${f.id}`}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                filtro === f.id
                  ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{f.icon}</span>
                <span className="text-xs">{f.label}</span>
              </span>
              <span className={`text-xs font-mono font-bold ${filtro === f.id ? 'text-teal-400' : 'text-muted-foreground'}`}>
                {f.count}
              </span>
            </button>
          ))}

          {/* Resumen de métricas */}
          <div className="mt-auto pt-4 border-t border-white/8 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Hoy</p>
            <div className="px-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Despachos activos</span>
                <span className="font-mono font-bold text-teal-400">{despachos.filter(d => d.estado === 'transito').length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Completados</span>
                <span className="font-mono font-bold text-emerald-400">{despachos.filter(d => d.estado === 'completado').length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Zonas críticas</span>
                <span className="font-mono font-bold text-red-400">{nodos.filter(n => n.semaforo_medico === 'rojo').length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* PANEL CENTRAL — El Libro Mayor */}
        <main className="flex-1 overflow-auto p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Libro Mayor Logístico</h2>
              <p className="text-xs text-muted-foreground">
                {nodosFiltrados.length} nodos · Franjas: Mañana · Tarde · Noche
              </p>
            </div>
            <div className="text-xs text-muted-foreground bg-white/5 rounded-lg px-3 py-1.5 border border-white/8">
              Click en una franja libre para despachar
            </div>
          </div>

          <NodeTable
            nodos={nodosFiltrados}
            despachos={despachos}
            perfilActual={perfil}
            onSlotClick={handleSlotClick}
          />
        </main>
      </div>

      {/* Modal de Manifiesto de Despacho */}
      {slotSeleccionado && (
        <DispatchModal
          nodo={slotSeleccionado.nodo}
          franja={slotSeleccionado.franja}
          perfilId={perfil.id}
          onClose={() => setSlotSeleccionado(null)}
          onCreated={handleDespachoCreado}
        />
      )}
    </div>
  )
}
