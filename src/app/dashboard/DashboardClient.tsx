'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TermsModal } from '@/components/auth/TermsModal'
import { NodeTable } from '@/components/dashboard/NodeTable'
import { DispatchModal } from '@/components/dashboard/DispatchModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Perfil, NodoGeografico, Despacho, BloquesTiempo, SolicitudRecurso, DespachoIntermedio } from '@/types/database'

interface DashboardClientProps {
  perfil: Perfil
  nodos: NodoGeografico[]
  despachosHoy: Despacho[]
  perfilesRed: any[]
  solicitudesIniciales: SolicitudRecurso[]
  despachosIntermediosIniciales: DespachoIntermedio[]
}

type TabActiva = 'libro_mayor' | 'solicitudes' | 'envios' | 'peticion'
type FiltroActivo = 'todos' | 'rojos' | 'amarillos' | 'libres'

export function DashboardClient({
  perfil,
  nodos: nodosInicial,
  despachosHoy: despachosInicial,
  perfilesRed,
  solicitudesIniciales,
  despachosIntermediosIniciales,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabActiva>('libro_mayor')
  const [showTerms, setShowTerms] = useState(!perfil.terminos_aceptados)
  const [nodos, setNodos] = useState<NodoGeografico[]>(nodosInicial)
  const [despachos, setDespachos] = useState<Despacho[]>(despachosInicial)
  const [solicitudes, setSolicitudes] = useState<SolicitudRecurso[]>(solicitudesIniciales)
  const [despachosIntermedios, setDespachosIntermedios] = useState<DespachoIntermedio[]>(despachosIntermediosIniciales)
  
  const [filtro, setFiltro] = useState<FiltroActivo>('todos')
  const [slotSeleccionado, setSlotSeleccionado] = useState<{ nodo: NodoGeografico; franja: BloquesTiempo } | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'active' | 'error'>('connecting')

  // Formulario de nueva petición
  const [peticionForm, setPeticionForm] = useState({
    tipo_insumo: '',
    cantidad_solicitada: 1,
    tipo_solicitud: 'entrega' as 'entrega' | 'recogida',
    descripcion: '',
  })

  // Modal para atender petición
  const [atenderPeticionTarget, setAtenderPeticionTarget] = useState<SolicitudRecurso | null>(null)
  const [whatsappChofer, setWhatsappChofer] = useState('')

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Recarga de datos relacionales desde la API
  const fetchSolicitudes = useCallback(async () => {
    const res = await fetch('/api/solicitudes')
    if (res.ok) {
      const data = await res.json()
      setSolicitudes(data)
    }
  }, [])

  const fetchEnvios = useCallback(async () => {
    const res = await fetch('/api/envios')
    if (res.ok) {
      const data = await res.json()
      setDespachosIntermedios(data)
    }
  }, [])

  // Suscripción Realtime
  useEffect(() => {
    const channel = supabase
      .channel('u4v-logistica-v2')
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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'solicitudes_recursos',
      }, () => {
        fetchSolicitudes()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'despachos_intermedios',
      }, () => {
        fetchEnvios()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('active')
        else if (status === 'CHANNEL_ERROR') setRealtimeStatus('error')
      })

    return () => { supabase.removeChannel(channel) }
  }, [supabase, today, fetchSolicitudes, fetchEnvios])

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

  // Enviar nueva petición de recursos
  async function handleCrearPeticion(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...peticionForm,
          cantidad_solicitada: Number(peticionForm.cantidad_solicitada),
        }),
      })

      if (response.ok) {
        setPeticionForm({
          tipo_insumo: '',
          cantidad_solicitada: 1,
          tipo_solicitud: 'entrega',
          descripcion: '',
        })
        fetchSolicitudes()
        setActiveTab('solicitudes')
      } else {
        const errData = await response.json()
        alert(`Error al crear la petición: ${errData.error}`)
      }
    } catch (err) {
      console.error(err)
      alert('Error de red al crear la petición.')
    }
  }

  // Confirmar y atender la solicitud seleccionada
  async function handleAtenderPeticionConfirmar(e: React.FormEvent) {
    e.preventDefault()
    if (!atenderPeticionTarget) return

    try {
      // 1. Crear el despacho punto a punto en camino
      const responseEnvio = await fetch('/api/envios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destino_perfil_id: atenderPeticionTarget.solicitante_id,
          tipo_insumo: atenderPeticionTarget.tipo_insumo,
          cantidad: atenderPeticionTarget.cantidad_solicitada,
          whatsapp_chofer: whatsappChofer || null,
        }),
      })

      if (!responseEnvio.ok) {
        const errData = await responseEnvio.json()
        alert(`Error al registrar el envío: ${errData.error}`)
        return
      }

      // 2. Marcar la solicitud original como "atendida"
      await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: atenderPeticionTarget.id,
          estado: 'atendida',
        }),
      })

      // Limpiar y actualizar
      setAtenderPeticionTarget(null)
      setWhatsappChofer('')
      fetchSolicitudes()
      fetchEnvios()
      setActiveTab('envios')
    } catch (err) {
      console.error(err)
      alert('Error al procesar la atención logístca.')
    }
  }

  // Modificar estado del envío
  async function handleActualizarEnvioEstado(id: string, nuevoEstado: 'preparacion' | 'camino' | 'entregado' | 'desviado') {
    try {
      const response = await fetch('/api/envios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado_envio: nuevoEstado }),
      })

      if (response.ok) {
        fetchEnvios()
      } else {
        const errData = await response.json()
        alert(`Error: ${errData.error}`)
      }
    } catch (err) {
      console.error(err)
      alert('Error al actualizar el envío.')
    }
  }

  const realtimeColor = realtimeStatus === 'active' ? 'text-emerald-400' : realtimeStatus === 'error' ? 'text-red-400' : 'text-amber-400'
  const realtimeLabel = realtimeStatus === 'active' ? 'Tiempo Real Activo' : realtimeStatus === 'error' ? 'Error de Conexión' : 'Conectando...'
  const realtimeDot = realtimeStatus === 'active' ? '🟢' : realtimeStatus === 'error' ? '🔴' : '🟡'

  // Formatear tipo de entidad para badges
  const formatTipoEntidad = (type: string) => {
    switch (type) {
      case 'centro_acopio': return '📦 Depósito / Acopio'
      case 'refugio': return '🏠 Refugio'
      case 'hospital': return '🏥 Punto Salud'
      case 'ong': return '🤝 ONG'
      default: return '📍 Organización'
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Modal de Términos */}
      {showTerms && (
        <TermsModal perfil={perfil} onAccepted={() => setShowTerms(false)} />
      )}

      {/* TOP BAR */}
      <header className="glass border-b border-white/8 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-xl">🇻🇪</span>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">U4V · Red Logística</h1>
            <p className="text-xs text-muted-foreground leading-tight">{perfil.nombre_organizacion}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 text-xs ${realtimeColor}`}>
            <span className={realtimeStatus === 'active' ? 'realtime-pulse' : ''}>{realtimeDot}</span>
            <span className="hidden sm:inline">{realtimeLabel}</span>
          </div>

          <div className="text-xs text-muted-foreground hidden md:block">
            {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div className="text-xs px-2.5 py-1 rounded-lg border font-medium bg-zinc-900 border-white/10">
            {formatTipoEntidad(perfil.tipo_entidad)}
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

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* PANEL IZQUIERDO — Navegación e Indicadores */}
        <aside className="w-56 shrink-0 border-r border-white/8 p-4 flex flex-col gap-6 glass overflow-y-auto">
          {/* SECCIONES */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Secciones</p>
            <button
              onClick={() => setActiveTab('libro_mayor')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm w-full transition-all text-left ${
                activeTab === 'libro_mayor' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span className="text-base">📋</span>
              <span className="text-xs font-semibold">Libro Mayor</span>
            </button>

            <button
              onClick={() => setActiveTab('solicitudes')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm w-full transition-all text-left ${
                activeTab === 'solicitudes' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base">🚨</span>
                <span className="text-xs font-semibold">Peticiones de Ayuda</span>
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-white/5 font-mono text-zinc-400">
                {solicitudes.filter(s => s.estado === 'pendiente').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('envios')}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm w-full transition-all text-left ${
                activeTab === 'envios' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base">🚛</span>
                <span className="text-xs font-semibold">Envíos en Tránsito</span>
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-white/5 font-mono text-zinc-400">
                {despachosIntermedios.filter(e => e.estado_envio !== 'entregado').length}
              </span>
            </button>

            {perfil.tipo_entidad !== 'ong' && (
              <button
                onClick={() => setActiveTab('peticion')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm w-full transition-all text-left ${
                  activeTab === 'peticion' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <span className="text-base">➕</span>
                <span className="text-xs font-semibold">Solicitar Recursos</span>
              </button>
            )}
          </div>

          {/* FILTROS (Solo visibles en Libro Mayor) */}
          {activeTab === 'libro_mayor' && (
            <div className="space-y-1 border-t border-white/5 pt-4">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Filtros de Zonas</p>
              {[
                { id: 'todos', label: 'Todas las Zonas', icon: '📋', count: nodos.length },
                { id: 'rojos', label: 'Alertas Críticas', icon: '🔴', count: nodos.filter(n => n.semaforo_medico === 'rojo').length },
                { id: 'amarillos', label: 'Alerta Moderada', icon: '🟡', count: nodos.filter(n => n.semaforo_medico === 'amarillo').length },
                { id: 'libres', label: 'Franjas Libres', icon: '✅', count: nodos.filter(n => despachos.filter(d => d.nodo_id === n.id).length < 3).length },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id as FiltroActivo)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs w-full transition-all ${
                    filtro === f.id ? 'bg-white/10 text-white font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                  </span>
                  <span>{f.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* CAPACIDADES DE NUESTRA ORGANIZACIÓN */}
          <div className="mt-auto border-t border-white/8 pt-4 space-y-3">
            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider px-2">Nuestra Capacidad</p>
            <div className="px-2 space-y-2">
              {perfil.capacidad_hospedaje > 0 && (
                <div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Albergue Temporal</p>
                  <p className="text-xs font-bold text-white font-mono">{perfil.capacidad_hospedaje} personas</p>
                </div>
              )}
              {perfil.capacidad_salud_camas > 0 && (
                <div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Atención Médica</p>
                  <p className="text-xs font-bold text-white font-mono">{perfil.capacidad_salud_camas} camas</p>
                </div>
              )}
              {perfil.capacidad_raciones_diarias > 0 && (
                <div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Raciones de Comida</p>
                  <p className="text-xs font-bold text-white font-mono">
                    {perfil.capacidad_raciones_diarias} / día
                    <span className="text-[10px] text-teal-300 ml-1">
                      ({perfil.tipo_racion === 'comida_bebida' ? 'Completa' : 'Solo Comida'})
                    </span>
                  </p>
                </div>
              )}
              {perfil.direccion_fisica && (
                <div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Ubicación</p>
                  <p className="text-[10px] text-zinc-300 font-medium truncate">{perfil.direccion_fisica}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* PANEL CENTRAL — Vistas Dinámicas */}
        <main className="flex-1 overflow-auto p-6 bg-zinc-950/40">
          
          {/* TAB 1: LIBRO MAYOR (Original) */}
          {activeTab === 'libro_mayor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Libro Mayor de Distribución</h2>
                  <p className="text-xs text-muted-foreground">
                    Establece despachos coordinados en franjas horarias sobre las zonas del desastre.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground bg-white/5 rounded-lg px-3 py-1.5 border border-white/8">
                  Haz clic en una franja horaria vacía para programar un envío a zona cero
                </div>
              </div>

              <NodeTable
                nodos={nodosFiltrados}
                despachos={despachos}
                perfilActual={perfil}
                onSlotClick={handleSlotClick}
              />
            </div>
          )}

          {/* TAB 2: PETICIONES DE AYUDA ACTIVE */}
          {activeTab === 'solicitudes' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">Peticiones de Insumos Activas</h2>
                <p className="text-xs text-muted-foreground">
                  Refugios, Hospitales y Centros de la red solicitando recursos urgentes o recogidas de insumos.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-2">
                {solicitudes.length === 0 ? (
                  <div className="text-center py-12 glass border border-white/5 rounded-2xl">
                    <p className="text-sm text-zinc-400">No hay peticiones de recursos activas en la red en este momento.</p>
                  </div>
                ) : (
                  solicitudes.map(sol => (
                    <div
                      key={sol.id}
                      className={`glass border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 ${
                        sol.estado === 'pendiente' ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5 bg-white/2'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            sol.tipo_solicitud === 'entrega' ? 'urgencia-rojo' : 'urgencia-verde'
                          }`}>
                            {sol.tipo_solicitud === 'entrega' ? '📥 Requiere Entrega' : '📤 Recogida / Donación'}
                          </span>

                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            sol.estado === 'pendiente' ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {sol.estado === 'pendiente' ? 'Pendiente' : 'Atendida'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white">
                          Solicita: <span className="text-teal-400 font-mono">{sol.cantidad_solicitada}</span> x {sol.tipo_insumo}
                        </h3>

                        {sol.descripcion && (
                          <p className="text-xs text-zinc-300 italic">“{sol.descripcion}”</p>
                        )}

                        <div className="text-[11px] text-zinc-400 space-y-0.5">
                          <p>🏢 **Entidad**: {sol.perfiles?.nombre_organizacion}</p>
                          <p>📞 **Contacto**: {sol.perfiles?.nombre_contacto} ({sol.perfiles?.whatsapp || 'Sin WhatsApp'})</p>
                        </div>
                      </div>

                      {sol.estado === 'pendiente' && (
                        <div className="shrink-0 flex gap-2 w-full md:w-auto">
                          {sol.solicitante_id === perfil.id ? (
                            <Button
                              onClick={async () => {
                                if (confirm('¿Estás seguro de cancelar esta petición?')) {
                                  await fetch('/api/solicitudes', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: sol.id, estado: 'cancelada' }),
                                  })
                                  fetchSolicitudes()
                                }
                              }}
                              className="text-xs bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 text-red-200 rounded-xl px-4 py-2 w-full md:w-auto"
                            >
                              Cancelar Petición
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setAtenderPeticionTarget(sol)}
                              className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-5 py-2.5 w-full md:w-auto"
                            >
                              Atender con Despacho 🚛
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ENVÍOS EN TRÁNSITO */}
          {activeTab === 'envios' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">Envíos de Recursos Activos (Punto a Punto)</h2>
                <p className="text-xs text-muted-foreground">
                  Monitoreo de insumos moviéndose entre depósitos, ONGs y refugios del país.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-2">
                {despachosIntermedios.length === 0 ? (
                  <div className="text-center py-12 glass border border-white/5 rounded-2xl">
                    <p className="text-sm text-zinc-400">No hay envíos activos transitando por la red actualmente.</p>
                  </div>
                ) : (
                  despachosIntermedios.map(envio => {
                    const esOrigen = envio.origen_id === perfil.id
                    const esDestino = envio.destino_perfil_id === perfil.id
                    const esAdmin = perfil.rol === 'admin'
                    
                    return (
                      <div
                        key={envio.id}
                        className={`glass border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                          envio.estado_envio === 'entregado' ? 'border-white/5 bg-white/2 opacity-70' : 'border-teal-500/20 bg-teal-500/5'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              envio.estado_envio === 'entregado' ? 'bg-emerald-500/20 text-emerald-400' :
                              envio.estado_envio === 'camino' ? 'bg-sky-500/20 text-sky-400' :
                              envio.estado_envio === 'desviado' ? 'bg-red-500/20 text-red-400' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {envio.estado_envio === 'preparacion' ? '📋 En Preparación' :
                               envio.estado_envio === 'camino' ? '🚚 En Camino' :
                               envio.estado_envio === 'entregado' ? '✅ Entregado' :
                               '❌ Desviado'}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white">
                            Operación: <span className="text-teal-400 font-mono">{envio.cantidad}</span> x {envio.tipo_insumo}
                          </h3>

                          <div className="text-xs text-zinc-300 space-y-1">
                            <p>🟢 **Origen**: {envio.perfil_origen?.nombre_organizacion}</p>
                            <p>
                              🔴 **Destino**: {envio.perfil_destino?.nombre_organizacion || envio.nodo_destino?.nombre_nodo} 
                              <span className="text-[10px] text-zinc-400 block ml-4">
                                {envio.perfil_destino?.direccion_fisica || 'Zona Cero'}
                              </span>
                            </p>
                            {envio.whatsapp_chofer && (
                              <p className="text-[11px] text-zinc-400">
                                📱 **Chofer**: {envio.whatsapp_chofer}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Acciones del envío */}
                        <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
                          {envio.estado_envio !== 'entregado' && (esOrigen || esDestino || esAdmin) && (
                            <div className="flex gap-2">
                              {envio.estado_envio === 'preparacion' && (esOrigen || esAdmin) && (
                                <Button
                                  onClick={() => handleActualizarEnvioEstado(envio.id, 'camino')}
                                  className="text-xs bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl px-4 py-2 w-full"
                                >
                                  Despachar / En Camino 🚚
                                </Button>
                              )}
                              
                              {envio.estado_envio === 'camino' && (esDestino || esOrigen || esAdmin) && (
                                <Button
                                  onClick={() => handleActualizarEnvioEstado(envio.id, 'entregado')}
                                  className="text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl px-4 py-2 w-full"
                                >
                                  Confirmar Entrega / Recibido ✓
                                </Button>
                              )}
                            </div>
                          )}

                          {envio.whatsapp_chofer && (
                            <a
                              href={`https://wa.me/${envio.whatsapp_chofer.replace(/\D/g, '')}?text=Hola,%20somos%20de%20la%20red%20log%C3%ADstica%20U4V.%20%C2%BFCu%C3%A1l%20es%20el%20estatus%20del%20env%C3%ADo%20de%20${envio.cantidad}%20${envio.tipo_insumo}?`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-zinc-900 border border-white/8 hover:bg-white/5 text-zinc-200 rounded-xl px-4 py-2 text-center flex items-center justify-center gap-1.5"
                            >
                              💬 Contactar Chofer
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SOLICITAR RECURSOS (Solo no ONGs) */}
          {activeTab === 'peticion' && perfil.tipo_entidad !== 'ong' && (
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">Solicitud de Recursos de Emergencia</h2>
                <p className="text-xs text-muted-foreground">
                  Publica las necesidades inmediatas de tu refugio u hospital para que la red pueda enviarte suministros.
                </p>
              </div>

              <div className="glass-strong rounded-3xl p-6 border border-white/5">
                <form onSubmit={handleCrearPeticion} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="tipo_insumo_solicitud" className="text-xs font-medium text-zinc-300">
                      Insumo Requerido
                    </Label>
                    <select
                      id="tipo_insumo_solicitud"
                      value={peticionForm.tipo_insumo}
                      onChange={(e) => setPeticionForm(prev => ({ ...prev, tipo_insumo: e.target.value }))}
                      required
                      className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-sm focus:border-teal-500/60 focus:ring-teal-500/20 w-full"
                    >
                      <option value="">Selecciona una categoría...</option>
                      <option value="Agua Potable">Agua Potable</option>
                      <option value="Raciones de Alimento">Raciones de Alimento</option>
                      <option value="Medicamentos">Medicamentos</option>
                      <option value="Colchonetas / Cobijas">Colchonetas / Cobijas</option>
                      <option value="Kits de Higiene">Kits de Higiene</option>
                      <option value="Herramientas / Rescate">Herramientas / Rescate</option>
                      <option value="Otro">Otro Insumo</option>
                    </select>
                  </div>

                  {peticionForm.tipo_insumo === 'Otro' && (
                    <div className="space-y-1">
                      <Label htmlFor="tipo_insumo_custom" className="text-xs font-medium text-zinc-300">
                        Especificar Insumo
                      </Label>
                      <Input
                        id="tipo_insumo_custom"
                        type="text"
                        placeholder="Leche para bebés, linternas, etc."
                        onChange={(e) => setPeticionForm(prev => ({ ...prev, tipo_insumo: e.target.value }))}
                        required
                        className="bg-white/5 border-white/10 focus:border-teal-500/60 rounded-xl h-10 text-sm"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="cantidad_solicitada" className="text-xs font-medium text-zinc-300">
                        Cantidad Requerida
                      </Label>
                      <Input
                        id="cantidad_solicitada"
                        type="number"
                        min="1"
                        value={peticionForm.cantidad_solicitada}
                        onChange={(e) => setPeticionForm(prev => ({ ...prev, cantidad_solicitada: Number(e.target.value) }))}
                        required
                        className="bg-white/5 border-white/10 focus:border-teal-500/60 rounded-xl h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="tipo_solicitud" className="text-xs font-medium text-zinc-300">
                        Modalidad
                      </Label>
                      <select
                        id="tipo_solicitud"
                        value={peticionForm.tipo_solicitud}
                        onChange={(e) => setPeticionForm(prev => ({ ...prev, tipo_solicitud: e.target.value as 'entrega' | 'recogida' }))}
                        className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-sm focus:border-teal-500/60 focus:ring-teal-500/20 w-full"
                      >
                        <option value="entrega">Necesito que me lo entreguen</option>
                        <option value="recogida">Ofrezco que lo pasen a recoger</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="descripcion" className="text-xs font-medium text-zinc-300">
                      Detalles / Observación Adicional
                    </Label>
                    <textarea
                      id="descripcion"
                      rows={3}
                      placeholder="Necesitamos urgentemente colchonetas para 30 niños de bajos recursos..."
                      value={peticionForm.descripcion}
                      onChange={(e) => setPeticionForm(prev => ({ ...prev, descripcion: e.target.value }))}
                      className="bg-white/5 border border-white/10 text-white focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl p-3 text-sm w-full"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all mt-2 text-sm"
                  >
                    Publicar Petición en la Red 🚨
                  </Button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Manifiesto de Despacho (Libro Mayor) */}
      {slotSeleccionado && (
        <DispatchModal
          nodo={slotSeleccionado.nodo}
          franja={slotSeleccionado.franja}
          perfilId={perfil.id}
          onClose={() => setSlotSeleccionado(null)}
          onCreated={handleDespachoCreado}
        />
      )}

      {/* MODAL PARA ATENDER PETICIÓN */}
      {atenderPeticionTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-sm w-full space-y-4 border border-teal-500/30">
            <div>
              <h2 className="text-base font-bold text-white">Atender Solicitud de Ayuda</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Te estás comprometiendo a despachar {atenderPeticionTarget.cantidad_solicitada} x {atenderPeticionTarget.tipo_insumo} a {atenderPeticionTarget.perfiles?.nombre_organizacion}.
              </p>
            </div>

            <form onSubmit={handleAtenderPeticionConfirmar} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="whatsapp_chofer" className="text-xs font-medium text-zinc-300">
                  Teléfono del Chofer / Transportista
                </Label>
                <Input
                  id="whatsapp_chofer"
                  type="text"
                  placeholder="+584121234567"
                  value={whatsappChofer}
                  onChange={(e) => setWhatsappChofer(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-teal-500/60 rounded-xl h-10 text-sm"
                />
                <p className="text-[10px] text-zinc-400">
                  Opcional. Permite coordinar llamadas o mensajes directos desde el dashboard.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => setAtenderPeticionTarget(null)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-5 py-2"
                >
                  Confirmar Despacho 🚛
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
