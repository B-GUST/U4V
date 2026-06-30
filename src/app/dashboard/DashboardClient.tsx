'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TermsModal } from '@/components/auth/TermsModal'
import { NodeTable } from '@/components/dashboard/NodeTable'
import { PredictiveAnalytics } from '@/components/dashboard/PredictiveAnalytics'
import { DispatchModal } from '@/components/dashboard/DispatchModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { 
  Perfil, 
  NodoGeografico, 
  Despacho, 
  BloquesTiempo, 
  SolicitudRecurso, 
  DespachoIntermedio,
  PostulacionSolicitud,
  ReporteIncidencia,
  TrasladoPaciente
} from '@/types/database'

import type { BoletinAviso } from '@/types/database'
import { generarTokenOffline } from '@/lib/totp'

interface DashboardClientProps {
  perfil: Perfil
  nodos: NodoGeografico[]
  despachosHoy: Despacho[]
  perfilesRed: any[]
  solicitudesIniciales: SolicitudRecurso[]
  despachosIntermediosIniciales: DespachoIntermedio[]
  incidenciasIniciales: ReporteIncidencia[]
  trasladosIniciales: TrasladoPaciente[]
  boletinInicial?: BoletinAviso[]
}

type TabActiva = 'libro_mayor' | 'sabana_solicitudes' | 'rutas_transporte' | 'traslados' | 'incidentes' | 'boletin' | 'mi_organizacion' | 'guia' | 'usuarios'
type FiltroActivo = 'todos' | 'rojos' | 'amarillos' | 'libres'

export function DashboardClient({
  perfil: perfilInicial,
  nodos: nodosInicial,
  despachosHoy: despachosInicial,
  perfilesRed,
  solicitudesIniciales,
  despachosIntermediosIniciales,
  incidenciasIniciales,
  trasladosIniciales,
  boletinInicial = [],
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabActiva>('libro_mayor')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showTerms, setShowTerms] = useState(!perfilInicial.terminos_aceptados)
  const [perfil, setPerfil] = useState<Perfil>(perfilInicial)
  const [nodos, setNodos] = useState<NodoGeografico[]>(nodosInicial)
  const [despachos, setDespachos] = useState<Despacho[]>(despachosInicial)
  const [solicitudes, setSolicitudes] = useState<SolicitudRecurso[]>(solicitudesIniciales)
  const [despachosIntermedios, setDespachosIntermedios] = useState<DespachoIntermedio[]>(despachosIntermediosIniciales)
  const [incidencias, setIncidencias] = useState<ReporteIncidencia[]>(incidenciasIniciales)
  const [traslados, setTraslados] = useState<TrasladoPaciente[]>(trasladosIniciales)
  const [boletin, setBoletin] = useState<BoletinAviso[]>(boletinInicial)

  // Edit targets
  const [zonaAEditar, setZonaAEditar] = useState<NodoGeografico | null>(null)
  const [solicitudAEditar, setSolicitudAEditar] = useState<SolicitudRecurso | null>(null)
  const [envioAEditar, setEnvioAEditar] = useState<DespachoIntermedio | null>(null)
  const [incidenciaAEditar, setIncidenciaAEditar] = useState<ReporteIncidencia | null>(null)
  const [trasladoAEditar, setTrasladoAEditar] = useState<TrasladoPaciente | null>(null)
  const [avisoAEditar, setAvisoAEditar] = useState<BoletinAviso | null>(null)
  const [usersList, setUsersList] = useState<Perfil[]>([])

  const [showCrearAviso, setShowCrearAviso] = useState(false)
  const [nuevoAvisoForm, setNuevoAvisoForm] = useState({
    titulo: '',
    contenido: '',
    categoria: 'general'
  })

  const [profileForm, setProfileForm] = useState({
    nombre_contacto: perfilInicial.nombre_contacto || '',
    whatsapp: perfilInicial.whatsapp || '',
    instagram: perfilInicial.instagram || '',
    direccion_fisica: perfilInicial.direccion_fisica || '',
    estado: perfilInicial.estado || '',
    ciudad: perfilInicial.ciudad || '',
    municipio: perfilInicial.municipio || '',
    parroquia: perfilInicial.parroquia || '',
    calle_casa: perfilInicial.calle_casa || '',
    punto_referencia: perfilInicial.punto_referencia || '',
    capacidad_hospedaje: perfilInicial.capacidad_hospedaje,
    capacidad_salud_camas: perfilInicial.capacidad_salud_camas,
    capacidad_raciones_diarias: perfilInicial.capacidad_raciones_diarias,
    tipo_racion: perfilInicial.tipo_racion
  })
  
  const [filtro, setFiltro] = useState<FiltroActivo>('todos')
  const [slotSeleccionado, setSlotSeleccionado] = useState<{ nodo: NodoGeografico; franja: BloquesTiempo } | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'active' | 'error'>('connecting')

  // Modales y formularios
  const [showCrearZona, setShowCrearZona] = useState(false)
  const [nuevaZonaForm, setNuevaZonaForm] = useState({
    nombre_nodo: '',
    direccion: '',
    punto_referencia: '',
    descripcion: ''
  })

  const [showCrearSolicitud, setShowCrearSolicitud] = useState(false)
  const [nuevaSolicitudForm, setNuevaSolicitudForm] = useState({
    tipo_insumo: '',
    cantidad_solicitada: 1,
    tipo_solicitud: 'entrega' as 'entrega' | 'recogida',
    categoria: 'comida' as any,
    descripcion: ''
  })

  const [showCrearDespacho, setShowCrearDespacho] = useState(false)
  const [nuevoDespachoForm, setNuevoDespachoForm] = useState({
    destino_perfil_id: '',
    destino_nodo_id: '',
    tipo_insumo: '',
    cantidad: 1,
    whatsapp_chofer: '',
    capacidad_carga_disponible: '',
    capacidad_voluntarios_disponible: 0,
    punto_encuentro: '',
    hora_salida: ''
  })

  const [showReportarIncidencia, setShowReportarIncidencia] = useState(false)
  const [nuevaIncidenciaForm, setNuevaIncidenciaForm] = useState({
    nodo_id: '',
    tipo_incidencia: 'otro' as any,
    descripcion: ''
  })

  const [showCrearTraslado, setShowCrearTraslado] = useState(false)
  const [nuevoTrasladoForm, setNuevoTrasladoForm] = useState({
    cantidad_personas: 1,
    observaciones: ''
  })

  const [postulacionTarget, setPostulacionTarget] = useState<SolicitudRecurso | null>(null)
  const [cantidadOfrecida, setCantidadOfrecida] = useState(1)

  const [vacantesUpdate, setVacantesUpdate] = useState(perfil.vacantes_disponibles)

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

  const fetchIncidencias = useCallback(async () => {
    const res = await fetch('/api/incidencias')
    if (res.ok) {
      const data = await res.json()
      setIncidencias(data)
    }
  }, [])

  const fetchTraslados = useCallback(async () => {
    const res = await fetch('/api/traslados')
    if (res.ok) {
      const data = await res.json()
      setTraslados(data)
    }
  }, [])

  const fetchNodos = useCallback(async () => {
    const res = await fetch('/api/zonas')
    if (res.ok) {
      const data = await res.json()
      setNodos(data)
    }
  }, [])

  const fetchBoletin = useCallback(async () => {
    const res = await fetch('/api/boletin')
    if (res.ok) {
      const data = await res.json()
      setBoletin(data)
    }
  }, [])

  const fetchMiPerfil = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
      if (data) {
        setPerfil(data as Perfil)
        setVacantesUpdate(data.vacantes_disponibles)
        setProfileForm({
          nombre_contacto: data.nombre_contacto || '',
          whatsapp: data.whatsapp || '',
          instagram: data.instagram || '',
          direccion_fisica: data.direccion_fisica || '',
          estado: data.estado || '',
          ciudad: data.ciudad || '',
          municipio: data.municipio || '',
          parroquia: data.parroquia || '',
          calle_casa: data.calle_casa || '',
          punto_referencia: data.punto_referencia || '',
          capacidad_hospedaje: data.capacidad_hospedaje,
          capacidad_salud_camas: data.capacidad_salud_camas,
          capacidad_raciones_diarias: data.capacidad_raciones_diarias,
          tipo_racion: data.tipo_racion
        })
      }
    }
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleActualizarEnvioEstado(envioId: string, nuevoEstado: string) {
    try {
      const response = await fetch('/api/envios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: envioId, estado_envio: nuevoEstado }),
      })
      if (response.ok) {
        fetchEnvios()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error de red al actualizar estado del envío.')
    }
  }

  async function handleActualizarEnvioEstadoConToken(envioId: string, nuevoEstado: string, token: string) {
    try {
      const response = await fetch('/api/envios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: envioId, estado_envio: nuevoEstado, token_entrega: token }),
      })
      if (response.ok) {
        fetchEnvios()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error de red al confirmar entrega.')
    }
  }

  const handleSlotClick = useCallback((nodo: NodoGeografico, franja: BloquesTiempo) => {
    setSlotSeleccionado({ nodo, franja })
  }, [])

  const handleDespachoCreado = useCallback((nuevoDespacho: Despacho) => {
    setDespachos(prev => [...prev, nuevoDespacho])
    setSlotSeleccionado(null)
  }, [])

  // Suscripción Realtime completa
  useEffect(() => {
    const channel = supabase
      .channel('u4v-colaborativo-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'despachos', filter: `fecha_operacion=eq.${today}` }, (payload) => {
        if (payload.eventType === 'INSERT') setDespachos(prev => [...prev, payload.new as Despacho])
        else if (payload.eventType === 'UPDATE') setDespachos(prev => prev.map(d => d.id === payload.new.id ? payload.new as Despacho : d))
        else if (payload.eventType === 'DELETE') setDespachos(prev => prev.filter(d => d.id !== payload.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nodos_geograficos' }, () => { fetchNodos() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_recursos' }, () => { fetchSolicitudes() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'despachos_intermedios' }, () => { fetchEnvios() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reportes_incidencias' }, () => { fetchIncidencias() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'traslados_pacientes' }, () => { fetchTraslados() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boletin_avisos' }, () => { fetchBoletin() })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'perfiles', filter: `id=eq.${perfil.id}` }, () => { fetchMiPerfil() })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('active')
        else if (status === 'CHANNEL_ERROR') setRealtimeStatus('error')
      })

    return () => { supabase.removeChannel(channel) }
  }, [supabase, today, perfil.id, fetchNodos, fetchSolicitudes, fetchEnvios, fetchIncidencias, fetchTraslados, fetchBoletin, fetchMiPerfil])

  async function fetchUsuarios() {
    try {
      const response = await fetch('/api/usuarios')
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) setUsersList(data)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'usuarios' && perfil.rol === 'admin') {
      fetchUsuarios()
    }
  }, [activeTab, perfil.rol])

  async function handleCambiarRol(userId: string, nuevoRol: 'admin' | 'primera_linea' | 'retaguardia') {
    try {
      const response = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, rol: nuevoRol })
      })
      if (response.ok) {
        fetchUsuarios()
      } else {
        const err = await response.json()
        alert(`Error al actualizar rol: ${err.error}`)
      }
    } catch {
      alert('Error de red al actualizar rol.')
    }
  }

  async function handleEliminarUsuario(userId: string) {
    if (!confirm('¿Estás completamente seguro de eliminar a este usuario de la red? Esta acción es irreversible y borrará sus registros asociados en cascada.')) {
      return
    }
    try {
      const response = await fetch(`/api/usuarios?id=${userId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchUsuarios()
      } else {
        const err = await response.json()
        alert(`Error al eliminar usuario: ${err.error}`)
      }
    } catch {
      alert('Error de red al eliminar usuario.')
    }
  }

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

  // Crear una nueva Zona de Ayuda (Nodo Geográfico)
  async function handleCrearZonaSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch('/api/zonas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaZonaForm),
      })
      if (response.ok) {
        setShowCrearZona(false)
        setNuevaZonaForm({ nombre_nodo: '', direccion: '', punto_referencia: '', descripcion: '' })
        fetchNodos()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error de red al registrar zona.')
    }
  }

  // Crear Petición de Recursos
  async function handleCrearSolicitudSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevaSolicitudForm,
          cantidad_solicitada: Number(nuevaSolicitudForm.cantidad_solicitada)
        })
      })
      if (response.ok) {
        setShowCrearSolicitud(false)
        setNuevaSolicitudForm({ tipo_insumo: '', cantidad_solicitada: 1, tipo_solicitud: 'entrega', categoria: 'comida', descripcion: '' })
        fetchSolicitudes()
        setActiveTab('sabana_solicitudes')
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al publicar petición.')
    }
  }

  // Registrar un Despacho Activo / Compartir Flete
  async function handleCrearDespachoSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoDespachoForm.destino_perfil_id && !nuevoDespachoForm.destino_nodo_id) {
      alert('Debes indicar un destino (organización o zona geográfica).')
      return
    }

    try {
      const response = await fetch('/api/envios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoDespachoForm,
          cantidad: Number(nuevoDespachoForm.cantidad),
          capacidad_voluntarios_disponible: Number(nuevoDespachoForm.capacidad_voluntarios_disponible),
          destino_perfil_id: nuevoDespachoForm.destino_perfil_id || null,
          destino_nodo_id: nuevoDespachoForm.destino_nodo_id || null,
          hora_salida: nuevoDespachoForm.hora_salida ? new Date(nuevoDespachoForm.hora_salida).toISOString() : null
        })
      })
      if (response.ok) {
        setShowCrearDespacho(false)
        setNuevoDespachoForm({
          destino_perfil_id: '', destino_nodo_id: '', tipo_insumo: '', cantidad: 1, whatsapp_chofer: '',
          capacidad_carga_disponible: '', capacidad_voluntarios_disponible: 0, punto_encuentro: '', hora_salida: ''
        })
        fetchEnvios()
        setActiveTab('rutas_transporte')
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error de red al crear despacho.')
    }
  }

  // Postulación a ayuda parcial (Fulfillment)
  async function handlePostularseSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!postulacionTarget) return
    try {
      const response = await fetch('/api/postulaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitud_id: postulacionTarget.id,
          cantidad_ofrecida: Number(cantidadOfrecida)
        })
      })
      if (response.ok) {
        setPostulacionTarget(null)
        setCantidadOfrecida(1)
        fetchSolicitudes()
        fetchEnvios()
        setActiveTab('rutas_transporte')
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al procesar la postulación.')
    }
  }

  // Confirmar recibo de postulación por parte del receptor
  async function handleConfirmarReciboPostulacion(postulacionId: string) {
    try {
      const response = await fetch('/api/postulaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postulacionId, estado: 'atendida' })
      })
      if (response.ok) {
        fetchSolicitudes()
        fetchEnvios()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al confirmar el recibo.')
    }
  }

  // Crear reporte de incidencia en una zona
  async function handleCrearIncidenciaSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch('/api/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaIncidenciaForm)
      })
      if (response.ok) {
        setShowReportarIncidencia(false)
        setNuevaIncidenciaForm({ nodo_id: '', tipo_incidencia: 'otro', descripcion: '' })
        fetchIncidencias()
        setActiveTab('incidentes')
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al reportar la incidencia.')
    }
  }

  // Crear traslado hospitalario
  async function handleCrearTrasladoSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch('/api/traslados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoTrasladoForm,
          cantidad_personas: Number(nuevoTrasladoForm.cantidad_personas)
        })
      })
      if (response.ok) {
        setShowCrearTraslado(false)
        setNuevoTrasladoForm({ cantidad_personas: 1, observaciones: '' })
        fetchTraslados()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al publicar solicitud de traslado.')
    }
  }

  // Asignar refugio a un paciente de alta médica
  async function handleAsignarRefugioTraslado(trasladoId: string) {
    try {
      const response = await fetch('/api/traslados', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: trasladoId,
          estado: 'asignado',
          refugio_id: perfil.id
        })
      })
      if (response.ok) {
        fetchTraslados()
        fetchMiPerfil()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al asignar el refugio.')
    }
  }

  // Completar traslado hospitalario
  async function handleCompletarTraslado(trasladoId: string) {
    try {
      const response = await fetch('/api/traslados', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: trasladoId,
          estado: 'completado',
          refugio_id: perfil.id
        })
      })
      if (response.ok) {
        fetchTraslados()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al completar el traslado.')
    }
  }

  // Actualizar vacantes disponibles directas (Refugios)
  async function handleActualizarVacantes(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ vacantes_disponibles: Number(vacantesUpdate) })
        .eq('id', perfil.id)
      
      if (error) {
        alert(`Error: ${error.message}`)
      } else {
        alert('Vacantes actualizadas correctamente.')
        fetchMiPerfil()
      }
    } catch {
      alert('Error al actualizar vacantes.')
    }
  }

  // Actualizar Perfil Completo
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('perfiles')
        .update({
          nombre_contacto: profileForm.nombre_contacto,
          whatsapp: profileForm.whatsapp,
          instagram: profileForm.instagram || null,
          direccion_fisica: `${profileForm.calle_casa}, Parroquia ${profileForm.parroquia}, Municipio ${profileForm.municipio}, ${profileForm.ciudad}, Estado ${profileForm.estado}`,
          estado: profileForm.estado,
          ciudad: profileForm.ciudad,
          municipio: profileForm.municipio,
          parroquia: profileForm.parroquia,
          calle_casa: profileForm.calle_casa,
          punto_referencia: profileForm.punto_referencia,
          capacidad_hospedaje: Number(profileForm.capacidad_hospedaje),
          capacidad_salud_camas: Number(profileForm.capacidad_salud_camas),
          capacidad_raciones_diarias: Number(profileForm.capacidad_raciones_diarias),
          tipo_racion: profileForm.tipo_racion
        })
        .eq('id', perfil.id)

      if (error) {
        alert(`Error: ${error.message}`)
      } else {
        alert('Perfil operativo actualizado correctamente.')
        fetchMiPerfil()
      }
    } catch {
      alert('Error al actualizar el perfil.')
    }
  }

  // Boletín: Crear Aviso
  async function handleCrearAvisoSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch('/api/boletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoAvisoForm)
      })
      if (response.ok) {
        setShowCrearAviso(false)
        setNuevoAvisoForm({ titulo: '', contenido: '', categoria: 'general' })
        fetchBoletin()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error de red al crear aviso.')
    }
  }

  // Boletín: Editar Aviso
  async function handleEditAvisoSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!avisoAEditar) return
    try {
      const response = await fetch('/api/boletin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: avisoAEditar.id,
          titulo: avisoAEditar.titulo,
          contenido: avisoAEditar.contenido,
          categoria: avisoAEditar.categoria
        })
      })
      if (response.ok) {
        setAvisoAEditar(null)
        fetchBoletin()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al editar el aviso.')
    }
  }

  // Boletín: Eliminar Aviso
  async function handleDeleteAviso(id: string) {
    if (!confirm('¿Estás seguro de eliminar este aviso general del boletín?')) return
    try {
      const response = await fetch(`/api/boletin?id=${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchBoletin()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error de red al eliminar aviso.')
    }
  }

  // Editar Zona (Nodo Geográfico)
  async function handleEditZonaSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!zonaAEditar) return
    try {
      const response = await fetch('/api/zonas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: zonaAEditar.id,
          nombre_nodo: zonaAEditar.nombre_nodo,
          direccion: zonaAEditar.direccion,
          punto_referencia: zonaAEditar.punto_referencia,
          descripcion: zonaAEditar.descripcion
        })
      })
      if (response.ok) {
        setZonaAEditar(null)
        fetchNodos()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al editar la zona.')
    }
  }

  // Editar Solicitud de Recursos
  async function handleEditSolicitudSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!solicitudAEditar) return
    try {
      const response = await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: solicitudAEditar.id,
          tipo_insumo: solicitudAEditar.tipo_insumo,
          cantidad_solicitada: Number(solicitudAEditar.cantidad_solicitada),
          tipo_solicitud: solicitudAEditar.tipo_solicitud,
          categoria: solicitudAEditar.categoria,
          descripcion: solicitudAEditar.descripcion
        })
      })
      if (response.ok) {
        setSolicitudAEditar(null)
        fetchSolicitudes()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al editar la solicitud.')
    }
  }

  // Editar Envió (Despacho Intermedio / Rideshare)
  async function handleEditEnvioSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!envioAEditar) return
    try {
      const response = await fetch('/api/envios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: envioAEditar.id,
          tipo_insumo: envioAEditar.tipo_insumo,
          cantidad: Number(envioAEditar.cantidad),
          whatsapp_chofer: envioAEditar.whatsapp_chofer,
          capacidad_carga_disponible: envioAEditar.capacidad_carga_disponible,
          capacidad_voluntarios_disponible: Number(envioAEditar.capacidad_voluntarios_disponible),
          punto_encuentro: envioAEditar.punto_encuentro,
          hora_salida: envioAEditar.hora_salida ? new Date(envioAEditar.hora_salida).toISOString() : null
        })
      })
      if (response.ok) {
        setEnvioAEditar(null)
        fetchEnvios()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al editar el despacho.')
    }
  }

  // Editar Incidencia en Zona
  async function handleEditIncidenciaSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!incidenciaAEditar) return
    try {
      const response = await fetch('/api/incidencias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: incidenciaAEditar.id,
          tipo_incidencia: incidenciaAEditar.tipo_incidencia,
          descripcion: incidenciaAEditar.descripcion
        })
      })
      if (response.ok) {
        setIncidenciaAEditar(null)
        fetchIncidencias()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al editar la incidencia.')
    }
  }

  // Editar Traslado Hospitalario
  async function handleEditTrasladoSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trasladoAEditar) return
    try {
      const response = await fetch('/api/traslados', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: trasladoAEditar.id,
          cantidad_personas: Number(trasladoAEditar.cantidad_personas),
          observaciones: trasladoAEditar.observaciones
        })
      })
      if (response.ok) {
        setTrasladoAEditar(null)
        fetchTraslados()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert('Error al editar the traslado.')
    }
  }

  // Formatear categorías
  const formatCategoria = (cat: string) => {
    switch(cat) {
      case 'comida': return '🍲 Comida'
      case 'agua': return '💧 Agua'
      case 'ropa': return '👕 Ropa'
      case 'medicamentos': return '💊 Medicamentos'
      case 'voluntarios': return '🙋 Voluntarios'
      default: return '📦 Insumo'
    }
  }

  const formatTipoEntidad = (type: string) => {
    switch (type) {
      case 'centro_acopio': return '📦 Depósito / Acopio'
      case 'refugio': return '🏠 Refugio'
      case 'hospital': return '🏥 Hospital'
      case 'ong': return '🤝 ONG'
      default: return '📍 Organización'
    }
  }

  const realtimeColor = realtimeStatus === 'active' ? 'text-emerald-400' : realtimeStatus === 'error' ? 'text-red-400' : 'text-amber-400'
  const realtimeLabel = realtimeStatus === 'active' ? 'Tiempo Real Activo' : realtimeStatus === 'error' ? 'Error de Conexión' : 'Conectando...'
  const realtimeDot = realtimeStatus === 'active' ? '🟢' : realtimeStatus === 'error' ? '🔴' : '🟡'

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Modal de Términos */}
      {showTerms && (
        <TermsModal perfil={perfil} onAccepted={() => setShowTerms(false)} />
      )}

      {/* TOP BAR */}
      <header className="glass border-b border-white/8 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileMenu(prev => !prev)}
            className="lg:hidden text-zinc-300 hover:text-white p-2 rounded-xl border border-white/10 bg-white/5 cursor-pointer flex items-center justify-center mr-1"
            title="Menu"
          >
            <span className="text-base">☰</span>
          </button>
          <span className="text-xl">🇻🇪</span>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">U4V · Sábana Colaborativa</h1>
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
      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop para el sidebar en móviles */}
        {showMobileMenu && (
          <div
            onClick={() => setShowMobileMenu(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 lg:hidden animate-fadeIn"
          />
        )}

        {/* PANEL IZQUIERDO */}
        <aside className={`w-56 shrink-0 border-r border-white/8 p-4 flex flex-col gap-6 glass overflow-y-auto
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transition-transform duration-300 transform 
          ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:flex bg-zinc-950/95 lg:bg-transparent`}
        >
          {/* SECCIONES */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Secciones</p>
            
            <button
              onClick={() => { setActiveTab('libro_mayor'); setShowMobileMenu(false); }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs w-full text-left transition-all ${
                activeTab === 'libro_mayor' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span>📋</span> <span>Libro Mayor (Zonas)</span>
            </button>

            <button
              onClick={() => { setActiveTab('sabana_solicitudes'); setShowMobileMenu(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs w-full text-left transition-all ${
                activeTab === 'sabana_solicitudes' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span>🚨</span> <span>Sábana de Solicitudes</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 font-mono text-zinc-400">
                {solicitudes.filter(s => s.estado === 'pendiente').length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('rutas_transporte'); setShowMobileMenu(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs w-full text-left transition-all ${
                activeTab === 'rutas_transporte' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span>🚛</span> <span>Viajes / Rideshare</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 font-mono text-zinc-400">
                {despachosIntermedios.filter(d => d.estado_envio !== 'entregado').length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('traslados'); setShowMobileMenu(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs w-full text-left transition-all ${
                activeTab === 'traslados' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span>🏥</span> <span>Altas Médicas</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 font-mono text-zinc-400">
                {traslados.filter(t => t.estado === 'pendiente').length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('incidentes'); setShowMobileMenu(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs w-full text-left transition-all ${
                activeTab === 'incidentes' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span>🚧</span> <span>Reporte Vial/Incidencias</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 font-mono text-zinc-400">
                {incidencias.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('boletin'); setShowMobileMenu(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs w-full text-left transition-all ${
                activeTab === 'boletin' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span>📢</span> <span>Boletín de Avisos</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 font-mono text-zinc-400">
                {boletin.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('mi_organizacion'); setShowMobileMenu(false); }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs w-full text-left transition-all ${
                activeTab === 'mi_organizacion' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span>⚙️</span> <span>Mi Perfil Operativo</span>
            </button>

            <button
              onClick={() => { setActiveTab('guia'); setShowMobileMenu(false); }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs w-full text-left transition-all ${
                activeTab === 'guia' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span>📖</span> <span>Manual de Uso</span>
            </button>

            {perfil.rol === 'admin' && (
              <button
                onClick={() => { setActiveTab('usuarios'); setShowMobileMenu(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs w-full text-left transition-all ${
                  activeTab === 'usuarios' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400 font-semibold' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <span>👥</span> <span>Gestión de Usuarios</span>
              </button>
            )}
          </div>

          {/* FILTROS (Libro Mayor) */}
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

          {/* CAPACIDADES */}
          <div className="mt-auto border-t border-white/8 pt-4 space-y-3">
            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider px-2">Mis Capacidades</p>
            <div className="px-2 space-y-2">
              {perfil.tipo_entidad === 'refugio' && (
                <div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Plazas Libres / Total</p>
                  <p className="text-xs font-bold text-white font-mono">{perfil.vacantes_disponibles} / {perfil.capacidad_hospedaje}</p>
                </div>
              )}
              {perfil.capacidad_salud_camas > 0 && (
                <div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Camas de Emergencia</p>
                  <p className="text-xs font-bold text-white font-mono">{perfil.capacidad_salud_camas}</p>
                </div>
              )}
              {perfil.capacidad_raciones_diarias > 0 && (
                <div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Raciones de Comida</p>
                  <p className="text-xs font-bold text-white font-mono">
                    {perfil.capacidad_raciones_diarias} / día
                    <span className="text-[10px] text-teal-300 ml-1">
                      ({perfil.tipo_racion === 'comida_bebida' ? 'Menú Completo' : 'Comida'})
                    </span>
                  </p>
                </div>
              )}
              {perfil.instagram && (
                <div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Instagram</p>
                  <p className="text-xs font-bold text-teal-300 truncate">{perfil.instagram}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pie de Página */}
          <div className="mt-4 pt-4 border-t border-white/5 text-center shrink-0">
            <p className="text-[9px] text-zinc-500 leading-normal">
              © 2026 BGUST
            </p>
            <p className="text-[9px] text-zinc-600 leading-normal mt-0.5 italic">
              "La vida es más alegre cuando vives para servir"
            </p>
            <p className="text-[8px] text-teal-500/70 leading-normal mt-0.5">
              Hecho con amor para mi Venezuela 🇻🇪
            </p>
          </div>
        </aside>

        {/* PANEL CENTRAL */}
        <main className="flex-1 overflow-auto p-6 bg-zinc-950/40">
          
          {/* TAB 1: LIBRO MAYOR (ZONAS Y REGISTRO) */}
          {activeTab === 'libro_mayor' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Libro Mayor de Zonas Críticas</h2>
                  <p className="text-xs text-zinc-300 mt-1">
                    Lista general de ubicaciones de desastre, semáforo médico y planificación de despachos en franjas.
                  </p>
                </div>
                <div className="flex">
                  <Button
                    onClick={() => setShowCrearZona(true)}
                    className="w-full md:w-auto text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                  >
                    ➕ Registrar Nueva Zona / Ubicación
                  </Button>
                </div>
              </div>

              {/* NodeTable (Zonas) */}
              <NodeTable
                nodos={nodosFiltrados}
                despachos={despachos}
                perfilActual={perfil}
                onSlotClick={handleSlotClick}
                onEditZona={setZonaAEditar}
              />

              {/* Analítica Predictiva y Cercanía de Centros */}
              <div className="pt-6 border-t border-white/5">
                <PredictiveAnalytics
                  nodos={nodos}
                  despachos={despachos}
                  envios={despachosIntermedios}
                  traslados={traslados}
                  perfilActual={perfil}
                  perfilesRed={perfilesRed}
                />
              </div>
            </div>
          )}

          {/* TAB 2: SÁBANA GENERAL DE SOLICITUDES */}
          {activeTab === 'sabana_solicitudes' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Sábana General de Necesidades</h2>
                  <p className="text-xs text-zinc-300 mt-1">
                    Todas las solicitudes activas de alimentos, agua, ropa, medicamentos o voluntarios publicadas en la red.
                  </p>
                </div>
                <div className="flex">
                  <Button
                    onClick={() => setShowCrearSolicitud(true)}
                    className="w-full md:w-auto text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                  >
                    🚨 Publicar Petición de Recursos
                  </Button>
                </div>
              </div>

              {/* Lista de Solicitudes */}
              <div className="grid grid-cols-1 gap-4 mt-2">
                {solicitudes.filter(s => s.estado === 'pendiente').length === 0 ? (
                  <div className="text-center py-12 glass border border-white/5 rounded-2xl">
                    <p className="text-sm text-zinc-400">No hay solicitudes de auxilio pendientes en la red logístca.</p>
                  </div>
                ) : (
                  solicitudes.filter(s => s.estado === 'pendiente').map(sol => {
                    const deficit = sol.cantidad_solicitada - sol.cantidad_atendida
                    
                    return (
                      <div
                        key={sol.id}
                        className="glass border border-white/8 rounded-2xl p-5 flex flex-col gap-4 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/5 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-zinc-800 text-teal-300">
                                {formatCategoria(sol.categoria)}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                sol.tipo_solicitud === 'entrega' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                              }`}>
                                {sol.tipo_solicitud === 'entrega' ? 'Requiere Entrega' : 'Recogida / Donación disponible'}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-1">
                              Necesita: <span className="text-teal-400 font-mono">{sol.cantidad_solicitada}</span> {sol.tipo_insumo}
                            </h3>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-zinc-400">Faltante a cubrir</p>
                            <p className="text-lg font-bold font-mono text-amber-400">{deficit} unidades</p>
                          </div>
                        </div>

                        {/* Detalles */}
                        <div className="text-xs text-zinc-300 flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-1">
                            <p>🏢 **Organización**: {sol.perfiles?.nombre_organizacion} <span className="text-[10px] text-zinc-500">({formatTipoEntidad(sol.perfiles?.tipo_entidad || '')})</span></p>
                            <p>📍 **Dirección**: {sol.perfiles?.direccion_fisica}</p>
                            {sol.descripcion && <p className="text-zinc-400 mt-1.5 italic">“{sol.descripcion}”</p>}
                          </div>
                          
                          <div className="shrink-0 space-y-1 text-left md:text-right border-t md:border-t-0 border-white/5 pt-2 md:pt-0">
                            <p className="text-[10px] text-zinc-400">Contacto Directo</p>
                            <p className="font-semibold text-white">{sol.perfiles?.nombre_contacto}</p>
                            <div className="flex gap-2 justify-start md:justify-end mt-1">
                              {sol.perfiles?.whatsapp && (
                                <a
                                  href={`https://wa.me/${sol.perfiles.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-lg hover:bg-emerald-500/25 transition-all"
                                >
                                  💬 WhatsApp
                                </a>
                              )}
                              {sol.perfiles?.instagram && (
                                <a
                                  href={`https://instagram.com/${sol.perfiles.instagram.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] bg-pink-500/15 border border-pink-500/30 text-pink-400 px-2 py-0.5 rounded-lg hover:bg-pink-500/25 transition-all"
                                >
                                  📸 Instagram
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Postulaciones (Ayudas en curso) */}
                        {sol.postulaciones && sol.postulaciones.length > 0 && (
                          <div className="bg-white/3 border border-white/5 rounded-xl p-3 space-y-2">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Postulaciones en curso:</p>
                            <div className="divide-y divide-white/5">
                              {sol.postulaciones.map((post: any) => (
                                <div key={post.id} className="py-1.5 flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-zinc-300">🚛 **{post.voluntario_perfil?.nombre_organizacion}** ofreció {post.cantidad_ofrecida}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                                      post.estado === 'atendida' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/25 text-amber-300 animate-pulse'
                                    }`}>
                                      {post.estado === 'atendida' ? 'Entregado' : 'En camino'}
                                    </span>
                                  </div>

                                  {post.estado === 'pendiente' && sol.solicitante_id === perfil.id && (
                                    <Button
                                      onClick={() => handleConfirmarReciboPostulacion(post.id)}
                                      className="text-[10px] bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-2 py-0.5 rounded-lg"
                                    >
                                      Confirmar Recibido ✓
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Acción para Postularse */}
                        {deficit > 0 && sol.solicitante_id !== perfil.id && (
                          <div className="flex justify-end pt-2">
                            <Button
                              onClick={() => {
                                setPostulacionTarget(sol)
                                setCantidadOfrecida(deficit)
                              }}
                              className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                            >
                              Postularme / Ofrecer Ayuda Parcial 🚛
                            </Button>
                          </div>
                        )}

                        {sol.solicitante_id === perfil.id && (
                          <div className="flex justify-end pt-2">
                            <Button
                              onClick={() => setSolicitudAEditar(sol)}
                              className="text-xs bg-zinc-900 border border-white/8 hover:bg-white/5 text-teal-400 font-bold rounded-xl px-4 py-2"
                            >
                              Editar Petición ✏️
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VIAJES / RIDESHARE / TRANSPORTE COMPARTIDO */}
          {activeTab === 'rutas_transporte' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Logística de Transporte y Carga Compartida</h2>
                  <p className="text-xs text-zinc-300 mt-1">
                    ¿Vas a despachar insumos? Publica tus viajes y disponibilidad de espacio de carga o asientos para unir esfuerzos.
                  </p>
                </div>
                <div className="flex">
                  <Button
                    onClick={() => setShowCrearDespacho(true)}
                    className="w-full md:w-auto text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                  >
                    🚛 Registrar Despacho / Compartir Viaje
                  </Button>
                </div>
              </div>

              {/* Lista de Viajes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {despachosIntermedios.filter(d => d.estado_envio !== 'entregado').length === 0 ? (
                  <div className="text-center py-12 glass border border-white/5 rounded-2xl col-span-2">
                    <p className="text-sm text-zinc-400">No hay fletes ni viajes en camino programados en este momento.</p>
                  </div>
                ) : (
                  despachosIntermedios.filter(d => d.estado_envio !== 'entregado').map(envio => (
                    <div
                      key={envio.id}
                      className="glass border border-white/8 rounded-2xl p-5 flex flex-col justify-between gap-4 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                            envio.estado_envio === 'camino' ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {envio.estado_envio === 'camino' ? '🚚 En Camino' : '📋 En Preparación'}
                          </span>
                          
                          {envio.hora_salida && (
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Salida: {new Date(envio.hora_salida).toLocaleString('es-VE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-white">
                          Carga: <span className="text-teal-400">{envio.cantidad}</span> x {envio.tipo_insumo}
                        </h3>

                        <div className="text-xs text-zinc-300 space-y-1">
                          <p>📤 **Origen**: {envio.perfil_origen?.nombre_organizacion}</p>
                          <p>📥 **Destino**: {envio.perfil_destino?.nombre_organizacion || envio.nodo_destino?.nombre_nodo}</p>
                          {envio.punto_encuentro && <p>📍 **Punto de Encuentro**: {envio.punto_encuentro}</p>}
                        </div>

                        {/* Ridesharing Info */}
                        {(envio.capacidad_carga_disponible || (envio.capacidad_voluntarios_disponible !== undefined && envio.capacidad_voluntarios_disponible > 0)) && (
                          <div className="mt-3 p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl space-y-1.5 text-xs">
                            <p className="text-[10px] font-bold text-teal-400 uppercase">Capacidad de Viaje Compartido:</p>
                            {envio.capacidad_carga_disponible && (
                              <p>📦 **Espacio de Carga**: {envio.capacidad_carga_disponible}</p>
                            )}
                            {envio.capacidad_voluntarios_disponible !== undefined && envio.capacidad_voluntarios_disponible > 0 && (
                              <p>🙋 **Asientos para Voluntarios**: {envio.capacidad_voluntarios_disponible} vacantes</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-between items-center border-t border-white/5 pt-3">
                        <div className="text-xs text-zinc-400">
                          {envio.perfil_origen?.nombre_contacto}
                        </div>

                        <div className="flex gap-2">
                          {envio.origen_id === perfil.id && (
                            <button
                              onClick={() => setEnvioAEditar(envio)}
                              className="text-[10px] bg-zinc-900 border border-white/8 hover:bg-white/5 text-teal-400 px-3 py-1.5 rounded-lg text-center font-bold"
                            >
                              Editar ✏️
                            </button>
                          )}

                          {envio.origen_id === perfil.id && envio.estado_envio === 'preparacion' && (
                            <Button
                              onClick={() => handleActualizarEnvioEstado(envio.id, 'camino')}
                              className="text-[10px] bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold px-3 py-1.5 rounded-lg"
                            >
                              Marcar en Camino
                            </Button>
                          )}

                          {envio.origen_id === perfil.id && envio.estado_envio === 'camino' && (
                            <Button
                              onClick={() => {
                                const token = prompt("Ingresa el código 'Salto y Seña' de 6 caracteres del receptor (disponible en su perfil):")
                                if (token) {
                                  handleActualizarEnvioEstadoConToken(envio.id, 'entregado', token)
                                }
                              }}
                              className="text-[10px] bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-3 py-1.5 rounded-lg"
                            >
                              Confirmar Entrega ✓
                            </Button>
                          )}
                          
                          {envio.whatsapp_chofer && (
                            <a
                              href={`https://wa.me/${envio.whatsapp_chofer.replace(/\D/g, '')}?text=Hola,%20somos%20de%20U4V.%20Vimos%20tu%20viaje%20de%20log%C3%ADstica%20programado.%20%C2%BFTenemos%20oportunidad%20de%20coordinar?`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] bg-zinc-900 border border-white/8 hover:bg-white/5 text-zinc-200 px-3 py-1.5 rounded-lg text-center flex items-center justify-center gap-1"
                            >
                              💬 Contactar
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TRASLADOS HOSPITALARIOS */}
          {activeTab === 'traslados' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Cola de Traslados Médicos / Pacientes Dados de Alta</h2>
                  <p className="text-xs text-zinc-300 mt-1">
                    Los hospitales notifican pacientes que ya están de alta pero no tienen vivienda a donde regresar, permitiendo a los refugios asignarlos.
                  </p>
                </div>
                {perfil.tipo_entidad === 'hospital' && (
                  <div className="flex">
                    <Button
                      onClick={() => setShowCrearTraslado(true)}
                      className="w-full md:w-auto text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                    >
                      🏥 Publicar Requerimiento de Traslado
                    </Button>
                  </div>
                )}
              </div>

              {/* Lista de Traslados */}
              <div className="grid grid-cols-1 gap-4 mt-2">
                {traslados.length === 0 ? (
                  <div className="text-center py-12 glass border border-white/5 rounded-2xl">
                    <p className="text-sm text-zinc-400">No hay requerimientos de traslados de alta activos en la red.</p>
                  </div>
                ) : (
                  traslados.map(tras => (
                    <div
                      key={tras.id}
                      className={`glass border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        tras.estado === 'pendiente' ? 'border-red-500/20 bg-red-500/5' :
                        tras.estado === 'asignado' ? 'border-sky-500/20 bg-sky-500/5' :
                        'border-white/5 bg-white/2 opacity-70'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                            tras.estado === 'pendiente' ? 'bg-red-500/20 text-red-400' :
                            tras.estado === 'asignado' ? 'bg-sky-500/20 text-sky-400 animate-pulse' :
                            'bg-zinc-850 text-zinc-400'
                          }`}>
                            {tras.estado === 'pendiente' ? 'Pendiente Reubicación' :
                             tras.estado === 'asignado' ? 'Refugio Asignado' :
                             'Traslado Completado'}
                          </span>

                          <span className="text-xs font-bold text-white bg-zinc-900 border border-white/8 px-2 py-0.5 rounded">
                            👨‍👩‍👧‍👦 {tras.cantidad_personas} {tras.cantidad_personas === 1 ? 'persona' : 'personas'}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-300">
                          <p>🏥 **Hospital Emisor**: {tras.hospital_perfil?.nombre_organizacion}</p>
                          {tras.observaciones && <p className="text-zinc-400 mt-1 italic">“{tras.observaciones}”</p>}
                          {tras.refugio_id && (
                            <p className="text-teal-400 font-medium">🏠 **Refugio Receptor**: {tras.refugio_perfil?.nombre_organizacion}</p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex gap-2 w-full md:w-auto">
                        {tras.hospital_id === perfil.id && (
                          <button
                            onClick={() => setTrasladoAEditar(tras)}
                            className="text-xs bg-zinc-900 border border-white/8 hover:bg-white/5 text-teal-400 font-bold rounded-xl px-4 py-2 text-center"
                          >
                            Editar ✏️
                          </button>
                        )}

                        {tras.estado === 'pendiente' && perfil.tipo_entidad === 'refugio' && (
                          <Button
                            disabled={perfil.vacantes_disponibles < tras.cantidad_personas}
                            onClick={() => handleAsignarRefugioTraslado(tras.id)}
                            className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2 w-full md:w-auto"
                          >
                            {perfil.vacantes_disponibles < tras.cantidad_personas ? 'Sin Vacantes Suficientes' : 'Recibir en mi Refugio 🏠'}
                          </Button>
                        )}

                        {tras.estado === 'asignado' && tras.refugio_id === perfil.id && (
                          <Button
                            onClick={() => handleCompletarTraslado(tras.id)}
                            className="text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl px-4 py-2 w-full md:w-auto"
                          >
                            Confirmar Llegada / Recibido ✓
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: REPORTES DE INCIDENCIAS */}
          {activeTab === 'incidentes' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Alertas de Tránsito e Incidencias en la Vía</h2>
                  <p className="text-xs text-zinc-300 mt-1">
                    Reporta autopistas trancadas, exceso de ayuda en una zona o problemas viales para alertar a los despachadores.
                  </p>
                </div>
                <div className="flex">
                  <Button
                    onClick={() => setShowReportarIncidencia(true)}
                    className="w-full md:w-auto text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                  >
                    ⚠️ Reportar Incidencia Vial
                  </Button>
                </div>
              </div>

              {/* Feed de incidencias */}
              <div className="grid grid-cols-1 gap-4 mt-2">
                {incidencias.length === 0 ? (
                  <div className="text-center py-12 glass border border-white/5 rounded-2xl">
                    <p className="text-sm text-zinc-400">No hay incidencias reportadas en la vía actualmente.</p>
                  </div>
                ) : (
                  incidencias.map(inc => (
                    <div key={inc.id} className="glass border border-red-500/10 bg-red-500/3 rounded-2xl p-5 flex justify-between items-center gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">
                            {inc.tipo_incidencia === 'transito_bloqueado' ? '🚧 Vía Trancada' :
                             inc.tipo_incidencia === 'sobrecarga_recursos' ? '⚠️ Sobrecarga Recursos' :
                             inc.tipo_incidencia === 'sobrecarga_personas' ? '👥 Sobrecarga Personas' :
                             '⚠️ Incidencia'}
                          </span>
                          <span className="text-zinc-500 font-mono">
                            {new Date(inc.creado_en).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">
                          Ubicación: <span className="text-teal-300">{inc.nodo?.nombre_nodo}</span>
                        </h4>
                        <p className="text-xs text-zinc-300 mt-1 italic">“{inc.descripcion}”</p>
                        <p className="text-[10px] text-zinc-500">Reportado por: {inc.perfil_autor?.nombre_organizacion}</p>
                      </div>

                      {inc.autor_id === perfil.id && (
                        <div className="shrink-0">
                          <button
                            onClick={() => setIncidenciaAEditar(inc)}
                            className="text-xs bg-zinc-900 border border-white/8 hover:bg-white/5 text-teal-400 font-bold px-3 py-1.5 rounded-xl"
                          >
                            Editar ✏️
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5.5: BOLETÍN DE AVISOS */}
          {activeTab === 'boletin' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Boletín de Avisos y Alertas Logísticas Generales</h2>
                  <p className="text-xs text-zinc-300 mt-1">
                    Publica instrucciones de seguridad, avisos de coordinación general o requerimientos normativos para los voluntarios.
                  </p>
                </div>
                <div className="flex">
                  <Button
                    onClick={() => setShowCrearAviso(true)}
                    className="w-full md:w-auto text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                  >
                    📢 Publicar Aviso General
                  </Button>
                </div>
              </div>

              {/* Feed de boletin */}
              <div className="grid grid-cols-1 gap-4 mt-2">
                {boletin.length === 0 ? (
                  <div className="text-center py-12 glass border border-white/5 rounded-2xl">
                    <p className="text-sm text-zinc-400">No hay avisos o alertas generales publicadas en el boletín actualmente.</p>
                  </div>
                ) : (
                  boletin.map(aviso => (
                    <div key={aviso.id} className="glass border border-white/8 rounded-2xl p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            aviso.categoria === 'seguridad' ? 'bg-red-500/20 text-red-400' :
                            aviso.categoria === 'logistica' ? 'bg-sky-500/20 text-sky-400' :
                            aviso.categoria === 'salud' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {aviso.categoria === 'seguridad' ? '🛡️ Seguridad' :
                             aviso.categoria === 'logistica' ? '📦 Logística' :
                             aviso.categoria === 'salud' ? '🩺 Salud' :
                             '📢 General'}
                          </span>
                          <span className="text-zinc-500 font-mono">
                            {new Date(aviso.creado_en).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-2">{aviso.titulo}</h4>
                        <p className="text-xs text-zinc-300 whitespace-pre-line mt-1">“{aviso.contenido}”</p>
                      </div>

                      <div className="flex justify-between items-center border-t border-white/5 pt-3 text-xs text-zinc-400">
                        <div>
                          ✍️ **Autor**: {aviso.perfil_autor?.nombre_organizacion} ({aviso.perfil_autor?.nombre_contacto})
                        </div>

                        {(aviso.autor_id === perfil.id || perfil.rol === 'admin') && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAvisoAEditar(aviso)}
                              className="text-[10px] text-teal-400 hover:text-teal-300 font-medium px-2 py-0.5 rounded bg-white/5 border border-white/5"
                            >
                              Editar ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteAviso(aviso.id)}
                              className="text-[10px] text-red-400 hover:text-red-300 font-medium px-2 py-0.5 rounded bg-white/5 border border-white/5"
                            >
                              Eliminar 🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: MI PERFIL OPERATIVO */}
          {activeTab === 'mi_organizacion' && (
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Configuración del Perfil Operativo</h2>
                <p className="text-xs text-muted-foreground">
                  Actualiza tus capacidades logísticas, datos de contacto y dirección física en tiempo real.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="glass-strong rounded-3xl p-6 border border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-teal-400">📋 Editar Ficha Técnica</h3>
                
                <div className="space-y-1">
                  <Label htmlFor="prof_contacto" className="text-xs text-zinc-300">Nombre del Responsable / Contacto</Label>
                  <Input
                    id="prof_contacto"
                    type="text"
                    value={profileForm.nombre_contacto}
                    onChange={(e) => setProfileForm(p => ({ ...p, nombre_contacto: e.target.value }))}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prof_whatsapp" className="text-xs text-zinc-300">WhatsApp de Coordinación</Label>
                    <Input
                      id="prof_whatsapp"
                      type="text"
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm(p => ({ ...p, whatsapp: e.target.value }))}
                      required
                      className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prof_instagram" className="text-xs text-zinc-300">Usuario Instagram</Label>
                    <Input
                      id="prof_instagram"
                      type="text"
                      placeholder="@ong_rescate"
                      value={profileForm.instagram || ''}
                      onChange={(e) => setProfileForm(p => ({ ...p, instagram: e.target.value }))}
                      className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prof_estado" className="text-xs text-zinc-300">Estado</Label>
                    <select
                      id="prof_estado"
                      value={profileForm.estado}
                      onChange={(e) => setProfileForm(p => ({ ...p, estado: e.target.value }))}
                      className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full focus:border-teal-500/60 focus:ring-teal-500/20"
                      required
                    >
                      <option value="">Selecciona...</option>
                      <option value="Distrito Capital">Distrito Capital</option>
                      <option value="Miranda">Miranda</option>
                      <option value="Aragua">Aragua</option>
                      <option value="Carabobo">Carabobo</option>
                      <option value="Zulia">Zulia</option>
                      <option value="Lara">Lara</option>
                      <option value="Mérida">Mérida</option>
                      <option value="Táchira">Táchira</option>
                      <option value="Bolívar">Bolívar</option>
                      <option value="Anzoátegui">Anzoátegui</option>
                      <option value="Otro">Otro Estado</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prof_ciudad" className="text-xs text-zinc-300">Ciudad</Label>
                    <Input
                      id="prof_ciudad"
                      type="text"
                      placeholder="Ej: Caracas"
                      value={profileForm.ciudad}
                      onChange={(e) => setProfileForm(p => ({ ...p, ciudad: e.target.value }))}
                      required
                      className="bg-white/5 border-white/10 text-xs focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prof_municipio" className="text-xs text-zinc-300">Municipio</Label>
                    <Input
                      id="prof_municipio"
                      type="text"
                      placeholder="Ej: Chacao"
                      value={profileForm.municipio}
                      onChange={(e) => setProfileForm(p => ({ ...p, municipio: e.target.value }))}
                      required
                      className="bg-white/5 border-white/10 text-xs focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prof_parroquia" className="text-xs text-zinc-300">Parroquia</Label>
                    <Input
                      id="prof_parroquia"
                      type="text"
                      placeholder="Ej: El Rosal"
                      value={profileForm.parroquia}
                      onChange={(e) => setProfileForm(p => ({ ...p, parroquia: e.target.value }))}
                      required
                      className="bg-white/5 border-white/10 text-xs focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="prof_calle_casa" className="text-xs text-zinc-300">Calle / Av. / Casa / Apto</Label>
                    <Input
                      id="prof_calle_casa"
                      type="text"
                      placeholder="Ej: Av. Principal, Res. Sol Apt 2B"
                      value={profileForm.calle_casa}
                      onChange={(e) => setProfileForm(p => ({ ...p, calle_casa: e.target.value }))}
                      required
                      className="bg-white/5 border-white/10 text-xs focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="prof_punto_referencia" className="text-xs text-zinc-300">Punto de Referencia</Label>
                  <Input
                    id="prof_punto_referencia"
                    type="text"
                    placeholder="Ej: Frente al CC El Recreo"
                    value={profileForm.punto_referencia}
                    onChange={(e) => setProfileForm(p => ({ ...p, punto_referencia: e.target.value }))}
                    required
                    className="bg-white/5 border-white/10 text-xs focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10"
                  />
                </div>


                {/* Edit Capacities depending on role */}
                {perfil.tipo_entidad === 'refugio' && (
                  <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                    <div className="space-y-1">
                      <Label htmlFor="prof_hospedaje" className="text-xs text-zinc-300">Capacidad Alojamiento</Label>
                      <Input
                        id="prof_hospedaje"
                        type="number"
                        min="0"
                        value={profileForm.capacidad_hospedaje}
                        onChange={(e) => setProfileForm(p => ({ ...p, capacidad_hospedaje: Number(e.target.value) }))}
                        className="bg-white/5 border-white/10 rounded-xl h-10 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="prof_vacantes" className="text-xs text-zinc-300">Vacantes Libres</Label>
                      <Input
                        id="prof_vacantes"
                        type="number"
                        min="0"
                        max={profileForm.capacidad_hospedaje}
                        value={vacantesUpdate}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setVacantesUpdate(val)
                        }}
                        className="bg-white/5 border-white/10 rounded-xl h-10 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {perfil.tipo_entidad === 'hospital' && (
                  <div className="space-y-1 border-t border-white/5 pt-3">
                    <Label htmlFor="prof_camas" className="text-xs text-zinc-300">Camas de Salud / Emergencia</Label>
                    <Input
                      id="prof_camas"
                      type="number"
                      min="0"
                      value={profileForm.capacidad_salud_camas}
                      onChange={(e) => setProfileForm(p => ({ ...p, capacidad_salud_camas: Number(e.target.value) }))}
                      className="bg-white/5 border-white/10 rounded-xl h-10 text-xs font-mono"
                    />
                  </div>
                )}

                {(perfil.tipo_entidad === 'centro_acopio' || perfil.tipo_entidad === 'ong' || perfil.capacidad_raciones_diarias > 0) && (
                  <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                    <div className="space-y-1">
                      <Label htmlFor="prof_raciones" className="text-xs text-zinc-300">Capacidad Raciones Diarias</Label>
                      <Input
                        id="prof_raciones"
                        type="number"
                        min="0"
                        value={profileForm.capacidad_raciones_diarias}
                        onChange={(e) => setProfileForm(p => ({ ...p, capacidad_raciones_diarias: Number(e.target.value) }))}
                        className="bg-white/5 border-white/10 rounded-xl h-10 text-xs font-mono"
                      />
                    </div>

                    {profileForm.capacidad_raciones_diarias > 0 && (
                      <div className="space-y-1">
                        <Label htmlFor="prof_tipo_racion" className="text-xs text-zinc-300">El Menú Incluye</Label>
                        <select
                          id="prof_tipo_racion"
                          value={profileForm.tipo_racion}
                          onChange={(e) => setProfileForm(p => ({ ...p, tipo_racion: e.target.value as any }))}
                          className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                        >
                          <option value="comida_bebida">Comida y Bebida</option>
                          <option value="solo_comida">Solo Alimento</option>
                          <option value="ninguno">Ninguno</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs mt-2"
                >
                  Guardar Cambios de Ficha Técnica 💾
                </Button>
              </form>

              {/* Salto y Seña Offline Token Card */}
              <div className="glass-strong rounded-3xl p-6 border border-teal-500/20 bg-teal-950/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-teal-400">🔑 Salto y Seña Activo</h3>
                  <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full font-bold">Offline OK</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Muestra este código de 6 caracteres al conductor del despacho para confirmar la entrega sin cobertura de red. Rota cada 4 horas.
                </p>
                <div className="flex justify-center py-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                  <span className="text-3xl font-mono font-extrabold tracking-widest text-teal-300">
                    {generarTokenOffline(perfil.id)}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 text-center">
                  Semilla ID: <span className="font-mono">{perfil.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: MANUAL DE USO */}
          {activeTab === 'guia' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📖</span> Manual del Operador de Auxilio U4V
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Guía técnica y operativa para la coordinación en campo bajo contingencia por terremotos.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 text-foreground">
                
                {/* Protocolo de Salto y Seña */}
                <div className="glass-strong rounded-3xl p-6 border border-white/5 space-y-3">
                  <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                    <span>🔑</span> Protocolo "Salto y Seña" (Entregas Offline)
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Para registrar entregas en la **Zona Cero** sin cobertura celular, el sistema opera de forma descentralizada:
                  </p>
                  <ol className="text-xs text-zinc-400 list-decimal pl-4 space-y-1.5">
                    <li>El **Receptor** (Refugio, Hospital o Acopio) abre su pestaña <em>"Mi Perfil Operativo"</em> y visualiza su <strong>Salto y Seña Activo</strong> (código de 6 caracteres). Este código se autogenera localmente cada 4 horas utilizando su ID de base de datos como semilla criptográfica.</li>
                    <li>El **Chofer** o despachador entrega físicamente los recursos y solicita la frase de verificación al receptor.</li>
                    <li>El chofer ingresa la palabra clave en su aplicación presionando el botón <strong>"Confirmar Entrega"</strong> de su despacho activo.</li>
                    <li>La app del chofer valida y guarda el despacho en cola. Una vez que el dispositivo del chofer recupera internet, el sistema valida el token retroactivamente en el servidor de Supabase y archiva la entrega.</li>
                  </ol>
                </div>

                {/* Tabla de Roles y Reglas */}
                <div className="glass-strong rounded-3xl p-6 border border-white/5 space-y-3">
                  <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                    <span>⚖️</span> Reglas de Gobernanza Logística
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="text-xs text-zinc-300 w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-teal-400">
                          <th className="py-2">Regla Operativa</th>
                          <th className="py-2">Descripción Logística</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <td className="py-2.5 font-semibold">Exclusividad de Franja</td>
                          <td className="py-2.5 text-zinc-400">Solo un despacho puede reservar una franja horaria (Mañana/Tarde/Noche) por zona. Evita la congestión vehicular en accesos agrietados.</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold">Bloqueo de Zonas (Saturación)</td>
                          <td className="py-2.5 text-zinc-400">Si los despachos del día cubren el 100% de la capacidad de consumo de una comunidad, la zona se bloquea por 24 horas para redirigir el excedente de ayuda a otros puntos.</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold">Despacho Primera Línea</td>
                          <td className="py-2.5 text-zinc-400">Solo perfiles catalogados de "Primera Línea" pueden emitir despachos dirigidos al epicentro de desastre ("Zona Cero").</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold">Alertas Amarillas (Retaguardia)</td>
                          <td className="py-2.5 text-zinc-400">Se activan automáticamente cuando el inventario disponible de un centro cae por debajo del 30% del consumo proyectado.</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold">Anonimato de Víctimas (GDPR)</td>
                          <td className="py-2.5 text-zinc-400">Queda prohibido recopilar datos personales de personas afectadas (PII). Las necesidades se miden por rangos de población estimada por los sensores.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Control de Vacantes de Albergue */}
                <div className="glass-strong rounded-3xl p-6 border border-white/5 space-y-3">
                  <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                    <span>🏠</span> Gestión Automatizada de Vacantes
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Cuando un Hospital da de alta médica a una víctima sin hogar, publica una solicitud de traslado en la cola de altas. Cualquier **Refugio** con vacantes disponibles puede admitir a la persona haciendo clic en <em>"Recibir en mi Refugio"</em>. El sistema descontará automáticamente del perfil del refugio las plazas ocupadas mediante una transacción de base de datos atómica.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 8: GESTIÓN DE USUARIOS (Super Admin CRUD) */}
          {activeTab === 'usuarios' && perfil.rol === 'admin' && (
            <div className="space-y-4 text-foreground">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>👥</span> Panel de Control de Super Administrador
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visualiza, modifica roles y revoca accesos de los coordinadores y centros registrados en la red.
                </p>
              </div>

              <div className="glass-strong rounded-3xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto animate-fadeIn">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-teal-400 font-bold">
                        <th className="p-4">Organización</th>
                        <th className="p-4">Contacto</th>
                        <th className="p-4">WhatsApp / SMS</th>
                        <th className="p-4">Tipo</th>
                        <th className="p-4">Rol</th>
                        <th className="p-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {usersList.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition-all">
                          <td className="p-4 font-semibold text-white">{u.nombre_organizacion}</td>
                          <td className="p-4">{u.nombre_contacto}</td>
                          <td className="p-4 font-mono">
                            <div>WA: {u.whatsapp}</div>
                            <div>SMS: {u.sms}</div>
                          </td>
                          <td className="p-4 capitalize">{u.tipo_entidad || 'ong'}</td>
                          <td className="p-4">
                            <select
                              value={u.rol}
                              onChange={(e) => handleCambiarRol(u.id, e.target.value as any)}
                              className="bg-zinc-950 border border-white/15 text-white rounded-lg px-2 py-1 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            >
                              <option value="admin">Administrador</option>
                              <option value="primera_linea">Primera Línea</option>
                              <option value="retaguardia">Retaguardia</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            {u.id !== perfil.id ? (
                              <button
                                onClick={() => handleEliminarUsuario(u.id)}
                                className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                              >
                                Revocar Acceso ❌
                              </button>
                            ) : (
                              <span className="text-[10px] text-teal-400 font-bold bg-teal-500/10 px-2.5 py-1 rounded-full">Tú (Actual)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ============================================================ */}
      {/* MODALES Y DIALOGS DE CREACIÓN */}
      {/* ============================================================ */}

      {/* 1. REGISTRAR NUEVA ZONA */}
      {showCrearZona && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-teal-500/30 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Registrar Nueva Zona Crítica</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crea una nueva ubicación geográfica para dirigir y traquear ayuda humanitaria.
              </p>
            </div>

            <form onSubmit={handleCrearZonaSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="nombre_nodo_zona" className="text-xs text-zinc-300">Nombre de la Zona / Comunidad</Label>
                <Input
                  id="nombre_nodo_zona"
                  type="text"
                  placeholder="Residencias Palma Real"
                  value={nuevaZonaForm.nombre_nodo}
                  onChange={(e) => setNuevaZonaForm(p => ({ ...p, nombre_nodo: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="direccion_zona" className="text-xs text-zinc-300">Dirección Física</Label>
                <Input
                  id="direccion_zona"
                  type="text"
                  placeholder="Av. Principal El Limón, entre calles 2 y 3"
                  value={nuevaZonaForm.direccion}
                  onChange={(e) => setNuevaZonaForm(p => ({ ...p, direccion: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="punto_referencia_zona" className="text-xs text-zinc-300">Punto de Referencia</Label>
                <Input
                  id="punto_referencia_zona"
                  type="text"
                  placeholder="Frente al módulo policial"
                  value={nuevaZonaForm.punto_referencia}
                  onChange={(e) => setNuevaZonaForm(p => ({ ...p, punto_referencia: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="descripcion_zona" className="text-xs text-zinc-300">Descripción / Detalles Adicionales</Label>
                <Input
                  id="descripcion_zona"
                  type="text"
                  placeholder="Zona inundada con 50 familias aisladas"
                  value={nuevaZonaForm.descripcion}
                  onChange={(e) => setNuevaZonaForm(p => ({ ...p, descripcion: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setShowCrearZona(false)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Registrar Zona ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PUBLICAR PETICIÓN DE RECURSOS */}
      {showCrearSolicitud && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-teal-500/30 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Publicar Petición de Recursos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Solicita ayuda directa para tu refugio, hospital o comunidad.
              </p>
            </div>

            <form onSubmit={handleCrearSolicitudSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="categoria_sol" className="text-xs text-zinc-300">Categoría</Label>
                  <select
                    id="categoria_sol"
                    value={nuevaSolicitudForm.categoria}
                    onChange={(e) => setNuevaSolicitudForm(p => ({ ...p, categoria: e.target.value as any }))}
                    className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                  >
                    <option value="comida">🍲 Comida</option>
                    <option value="agua">💧 Agua</option>
                    <option value="ropa">👕 Ropa</option>
                    <option value="medicamentos">💊 Medicamentos</option>
                    <option value="voluntarios">🙋 Voluntarios</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="tipo_solicitud_sol" className="text-xs text-zinc-300">Modalidad</Label>
                  <select
                    id="tipo_solicitud_sol"
                    value={nuevaSolicitudForm.tipo_solicitud}
                    onChange={(e) => setNuevaSolicitudForm(p => ({ ...p, tipo_solicitud: e.target.value as any }))}
                    className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                  >
                    <option value="entrega">Necesito Entrega</option>
                    <option value="recogida">Ofrezco Recogida</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="tipo_insumo_sol" className="text-xs text-zinc-300">Insumo / Detalle corto</Label>
                  <Input
                    id="tipo_insumo_sol"
                    type="text"
                    placeholder="ej: Platos de sopa, Garrafones, Kits médicos"
                    value={nuevaSolicitudForm.tipo_insumo}
                    onChange={(e) => setNuevaSolicitudForm(p => ({ ...p, tipo_insumo: e.target.value }))}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cantidad_sol" className="text-xs text-zinc-300">Cantidad</Label>
                  <Input
                    id="cantidad_sol"
                    type="number"
                    min="1"
                    value={nuevaSolicitudForm.cantidad_solicitada}
                    onChange={(e) => setNuevaSolicitudForm(p => ({ ...p, cantidad_solicitada: Number(e.target.value) }))}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="desc_sol" className="text-xs text-zinc-300">Detalles adicionales</Label>
                <textarea
                  id="desc_sol"
                  rows={2}
                  placeholder="Por favor, especificar fecha límite o requerimiento de frío"
                  value={nuevaSolicitudForm.descripcion}
                  onChange={(e) => setNuevaSolicitudForm(p => ({ ...p, descripcion: e.target.value }))}
                  className="bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs w-full"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setShowCrearSolicitud(false)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Publicar en la Sábana ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. REGISTRAR DESPACHO / COMPARTIR VIAJE (Ridesharing) */}
      {showCrearDespacho && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-teal-500/30 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-base font-bold text-white">Despachar Insumos / Compartir Flete</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Informa a la red que estás enviando recursos, permitiendo coordinar espacio de carga disponible.
              </p>
            </div>

            <form onSubmit={handleCrearDespachoSubmit} className="space-y-3">
              
              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Ubicación de Destino (Elige una opción)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="destino_perfil" className="text-[10px] text-zinc-400">A otra Organización / Refugio</Label>
                    <select
                      id="destino_perfil"
                      value={nuevoDespachoForm.destino_perfil_id}
                      onChange={(e) => setNuevoDespachoForm(p => ({ ...p, destino_perfil_id: e.target.value, destino_nodo_id: '' }))}
                      className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                    >
                      <option value="">Selecciona organización...</option>
                      {perfilesRed.filter(p => p.id !== perfil.id).map(p => (
                        <option key={p.id} value={p.id}>{p.nombre_organizacion} ({formatTipoEntidad(p.tipo_entidad)})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="destino_nodo" className="text-[10px] text-zinc-400">A una Zona Geográfica</Label>
                    <select
                      id="destino_nodo"
                      value={nuevoDespachoForm.destino_nodo_id}
                      onChange={(e) => setNuevoDespachoForm(p => ({ ...p, destino_nodo_id: e.target.value, destino_perfil_id: '' }))}
                      className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                    >
                      <option value="">Selecciona zona...</option>
                      {nodos.map(n => (
                        <option key={n.id} value={n.id}>{n.nombre_nodo}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="desp_insumo" className="text-xs text-zinc-300">Carga: ¿Qué llevas?</Label>
                  <Input
                    id="desp_insumo"
                    type="text"
                    placeholder="ej: Desayunos, Agua, Cobijas"
                    value={nuevoDespachoForm.tipo_insumo}
                    onChange={(e) => setNuevoDespachoForm(p => ({ ...p, tipo_insumo: e.target.value }))}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="desp_cant" className="text-xs text-zinc-300">Cantidad</Label>
                  <Input
                    id="desp_cant"
                    type="number"
                    min="1"
                    value={nuevoDespachoForm.cantidad}
                    onChange={(e) => setNuevoDespachoForm(p => ({ ...p, cantidad: Number(e.target.value) }))}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="desp_chofer" className="text-xs text-zinc-300">WhatsApp Chofer</Label>
                  <Input
                    id="desp_chofer"
                    type="text"
                    placeholder="+584121234567"
                    value={nuevoDespachoForm.whatsapp_chofer}
                    onChange={(e) => setNuevoDespachoForm(p => ({ ...p, whatsapp_chofer: e.target.value }))}
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="desp_salida" className="text-xs text-zinc-300">Hora de Salida</Label>
                  <Input
                    id="desp_salida"
                    type="datetime-local"
                    value={nuevoDespachoForm.hora_salida}
                    onChange={(e) => setNuevoDespachoForm(p => ({ ...p, hora_salida: e.target.value }))}
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="desp_encuentro" className="text-xs text-zinc-300">Punto de Encuentro (Salida)</Label>
                <Input
                  id="desp_encuentro"
                  type="text"
                  placeholder="ej: Sede Principal Altamira"
                  value={nuevoDespachoForm.punto_encuentro}
                  onChange={(e) => setNuevoDespachoForm(p => ({ ...p, punto_encuentro: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              {/* RIDESHARE INFO FIELDS */}
              <div className="p-3 bg-white/3 border border-white/5 rounded-2xl space-y-3">
                <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">🚘 ¿Tienes capacidad de carga o asientos libres?</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="desp_cap_carga" className="text-[10px] text-zinc-300">Capacidad Carga (ej: 3 cajas)</Label>
                    <Input
                      id="desp_cap_carga"
                      type="text"
                      placeholder="Tengo espacio para 3 bultos"
                      value={nuevoDespachoForm.capacidad_carga_disponible}
                      onChange={(e) => setNuevoDespachoForm(p => ({ ...p, capacidad_carga_disponible: e.target.value }))}
                      className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="desp_cap_vol" className="text-[10px] text-zinc-300">Voluntarios Extra (Asientos)</Label>
                    <Input
                      id="desp_cap_vol"
                      type="number"
                      min="0"
                      value={nuevoDespachoForm.capacidad_voluntarios_disponible}
                      onChange={(e) => setNuevoDespachoForm(p => ({ ...p, capacidad_voluntarios_disponible: Number(e.target.value) }))}
                      className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setShowCrearDespacho(false)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Registrar e Informar Viaje ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. POSTULARSE A AYUDA PARCIAL (MODAL) */}
      {postulacionTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-sm w-full border border-teal-500/30 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Postulación / Flete Parcial</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Te estás comprometiendo a despachar insumos para cubrir parte de la solicitud de {postulacionTarget.perfiles?.nombre_organizacion}.
              </p>
            </div>

            <form onSubmit={handlePostularseSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="cant_ofrecida_input" className="text-xs text-zinc-300">
                  Cantidad a Ofrecer (Máximo: {postulacionTarget.cantidad_solicitada - postulacionTarget.cantidad_atendida})
                </Label>
                <Input
                  id="cant_ofrecida_input"
                  type="number"
                  min="1"
                  max={postulacionTarget.cantidad_solicitada - postulacionTarget.cantidad_atendida}
                  value={cantidadOfrecida}
                  onChange={(e) => setCantidadOfrecida(Number(e.target.value))}
                  required
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-sm font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => setPostulacionTarget(null)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-5 py-2"
                >
                  Confirmar Postulación 🚛
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. REPORTAR INCIDENCIA VIAL */}
      {showReportarIncidencia && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-teal-500/30 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Reportar Incidencia o Alerta Vial</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Alerta a todos los despachadores de la red sobre trancas, bloqueos o sobrecarga.
              </p>
            </div>

            <form onSubmit={handleCrearIncidenciaSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="inc_nodo" className="text-xs text-zinc-300">Zona Afectada</Label>
                  <select
                    id="inc_nodo"
                    value={nuevaIncidenciaForm.nodo_id}
                    onChange={(e) => setNuevaIncidenciaForm(p => ({ ...p, nodo_id: e.target.value }))}
                    required
                    className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                  >
                    <option value="">Selecciona zona...</option>
                    {nodos.map(n => (
                      <option key={n.id} value={n.id}>{n.nombre_nodo}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="inc_tipo" className="text-xs text-zinc-300">Tipo de Alerta</Label>
                  <select
                    id="inc_tipo"
                    value={nuevaIncidenciaForm.tipo_incidencia}
                    onChange={(e) => setNuevaIncidenciaForm(p => ({ ...p, tipo_incidencia: e.target.value as any }))}
                    className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                  >
                    <option value="transito_bloqueado">🚧 Autopista/Vía Trancada</option>
                    <option value="sobrecarga_recursos">⚠️ Exceso de Ayuda / Recursos</option>
                    <option value="sobrecarga_personas">👥 Exceso de Personas / Colapso</option>
                    <option value="otro">⚠️ Otra Incidencia</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="inc_desc" className="text-xs text-zinc-300">Detalles del Reporte</Label>
                <textarea
                  id="inc_desc"
                  rows={3}
                  placeholder="Detalla la situación (ej: Protesta en la autopista del Este a la altura de Palma Real, tránsito totalmente detenido)"
                  value={nuevaIncidenciaForm.descripcion}
                  onChange={(e) => setNuevaIncidenciaForm(p => ({ ...p, descripcion: e.target.value }))}
                  required
                  className="bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs w-full"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setShowReportarIncidencia(false)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Publicar Alerta Vial ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. HOSPITAL: CREAR SOLICITUD DE TRASLADO */}
      {showCrearTraslado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-sm w-full border border-teal-500/30 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Solicitud de Albergue para Pacientes Dados de Alta</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Registra pacientes convalecientes que ya están de alta pero no disponen de hogar debido al desastre.
              </p>
            </div>

            <form onSubmit={handleCrearTrasladoSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="tras_cant" className="text-xs text-zinc-300">Cantidad de Personas / Grupo Familiar</Label>
                <Input
                  id="tras_cant"
                  type="number"
                  min="1"
                  value={nuevoTrasladoForm.cantidad_personas}
                  onChange={(e) => setNuevoTrasladoForm(p => ({ ...p, cantidad_personas: Number(e.target.value) }))}
                  required
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="tras_obs" className="text-xs text-zinc-300">Observaciones Médicas / Requerimiento especial</Label>
                <textarea
                  id="tras_obs"
                  rows={2}
                  placeholder="Convaleciente de fractura de fémur, requiere planta baja o rampa"
                  value={nuevoTrasladoForm.observaciones}
                  onChange={(e) => setNuevoTrasladoForm(p => ({ ...p, observaciones: e.target.value }))}
                  className="bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs w-full"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setShowCrearTraslado(false)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Publicar Requerimiento ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. CREAR AVISO BOLETÍN */}
      {showCrearAviso && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-teal-500/30 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Publicar Aviso General</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Alerta a todos los voluntarios y organizaciones sobre normativas o requerimientos generales.
              </p>
            </div>

            <form onSubmit={handleCrearAvisoSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="aviso_cat" className="text-xs text-zinc-300">Categoría</Label>
                <select
                  id="aviso_cat"
                  value={nuevoAvisoForm.categoria}
                  onChange={(e) => setNuevoAvisoForm(p => ({ ...p, categoria: e.target.value }))}
                  className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                >
                  <option value="general">📢 General</option>
                  <option value="seguridad">🛡️ Seguridad</option>
                  <option value="logistica">📦 Logística</option>
                  <option value="salud">🩺 Salud</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="aviso_titulo" className="text-xs text-zinc-300">Título del Aviso</Label>
                <Input
                  id="aviso_titulo"
                  type="text"
                  placeholder="ej: Uso obligatorio de tapabocas en Zona Cero"
                  value={nuevoAvisoForm.titulo}
                  onChange={(e) => setNuevoAvisoForm(p => ({ ...p, titulo: e.target.value }))}
                  required
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="aviso_cont" className="text-xs text-zinc-300">Contenido / Instrucciones</Label>
                <textarea
                  id="aviso_cont"
                  rows={4}
                  placeholder="ej: Se requiere que todos los voluntarios que asistan a la zona cero usen tapaboca y vengan identificados con su nombre en la ropa."
                  value={nuevoAvisoForm.contenido}
                  onChange={(e) => setNuevoAvisoForm(p => ({ ...p, contenido: e.target.value }))}
                  required
                  className="bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs w-full"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setShowCrearAviso(false)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Publicar Aviso ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. EDITAR AVISO BOLETÍN */}
      {avisoAEditar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-teal-500/30 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Editar Aviso General</h2>
            </div>

            <form onSubmit={handleEditAvisoSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit_aviso_cat" className="text-xs text-zinc-300">Categoría</Label>
                <select
                  id="edit_aviso_cat"
                  value={avisoAEditar.categoria}
                  onChange={(e) => setAvisoAEditar(p => p ? ({ ...p, categoria: e.target.value }) : null)}
                  className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                >
                  <option value="general">📢 General</option>
                  <option value="seguridad">🛡️ Seguridad</option>
                  <option value="logistica">📦 Logística</option>
                  <option value="salud">🩺 Salud</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_aviso_titulo" className="text-xs text-zinc-300">Título del Aviso</Label>
                <Input
                  id="edit_aviso_titulo"
                  type="text"
                  value={avisoAEditar.titulo}
                  onChange={(e) => setAvisoAEditar(p => p ? ({ ...p, titulo: e.target.value }) : null)}
                  required
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_aviso_cont" className="text-xs text-zinc-300">Contenido / Instrucciones</Label>
                <textarea
                  id="edit_aviso_cont"
                  rows={4}
                  value={avisoAEditar.contenido}
                  onChange={(e) => setAvisoAEditar(p => p ? ({ ...p, contenido: e.target.value }) : null)}
                  required
                  className="bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs w-full"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setAvisoAEditar(null)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Guardar Cambios ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. EDITAR ZONA */}
      {zonaAEditar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-teal-500/30 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Editar Zona Crítica</h2>
            </div>

            <form onSubmit={handleEditZonaSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit_zona_nombre" className="text-xs text-zinc-300">Nombre de la Zona / Comunidad</Label>
                <Input
                  id="edit_zona_nombre"
                  type="text"
                  value={zonaAEditar.nombre_nodo}
                  onChange={(e) => setZonaAEditar(p => p ? ({ ...p, nombre_nodo: e.target.value }) : null)}
                  required
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_zona_dir" className="text-xs text-zinc-300">Dirección Física</Label>
                <Input
                  id="edit_zona_dir"
                  type="text"
                  value={zonaAEditar.direccion || ''}
                  onChange={(e) => setZonaAEditar(p => p ? ({ ...p, direccion: e.target.value }) : null)}
                  required
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_zona_ref" className="text-xs text-zinc-300">Punto de Referencia</Label>
                <Input
                  id="edit_zona_ref"
                  type="text"
                  value={zonaAEditar.punto_referencia || ''}
                  onChange={(e) => setZonaAEditar(p => p ? ({ ...p, punto_referencia: e.target.value }) : null)}
                  required
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_zona_desc" className="text-xs text-zinc-300">Descripción / Detalles</Label>
                <Input
                  id="edit_zona_desc"
                  type="text"
                  value={zonaAEditar.descripcion || ''}
                  onChange={(e) => setZonaAEditar(p => p ? ({ ...p, descripcion: e.target.value }) : null)}
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setZonaAEditar(null)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Guardar Cambios ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. EDITAR SOLICITUD */}
      {solicitudAEditar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-teal-500/30 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Editar Petición de Recursos</h2>
            </div>

            <form onSubmit={handleEditSolicitudSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit_sol_cat" className="text-xs text-zinc-300">Categoría</Label>
                  <select
                    id="edit_sol_cat"
                    value={solicitudAEditar.categoria}
                    onChange={(e) => setSolicitudAEditar(p => p ? ({ ...p, categoria: e.target.value as any }) : null)}
                    className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                  >
                    <option value="comida">🍲 Comida</option>
                    <option value="agua">💧 Agua</option>
                    <option value="ropa">👕 Ropa</option>
                    <option value="medicamentos">💊 Medicamentos</option>
                    <option value="voluntarios">🙋 Voluntarios</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit_sol_mod" className="text-xs text-zinc-300">Modalidad</Label>
                  <select
                    id="edit_sol_mod"
                    value={solicitudAEditar.tipo_solicitud}
                    onChange={(e) => setSolicitudAEditar(p => p ? ({ ...p, tipo_solicitud: e.target.value as any }) : null)}
                    className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                  >
                    <option value="entrega">Necesito Entrega</option>
                    <option value="recogida">Ofrezco Recogida</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="edit_sol_insumo" className="text-xs text-zinc-300">Insumo</Label>
                  <Input
                    id="edit_sol_insumo"
                    type="text"
                    value={solicitudAEditar.tipo_insumo}
                    onChange={(e) => setSolicitudAEditar(p => p ? ({ ...p, tipo_insumo: e.target.value }) : null)}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit_sol_cant" className="text-xs text-zinc-300">Cantidad</Label>
                  <Input
                    id="edit_sol_cant"
                    type="number"
                    min="1"
                    value={solicitudAEditar.cantidad_solicitada}
                    onChange={(e) => setSolicitudAEditar(p => p ? ({ ...p, cantidad_solicitada: Number(e.target.value) }) : null)}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_sol_desc" className="text-xs text-zinc-300">Detalles adicionales</Label>
                <textarea
                  id="edit_sol_desc"
                  rows={2}
                  value={solicitudAEditar.descripcion || ''}
                  onChange={(e) => setSolicitudAEditar(p => p ? ({ ...p, descripcion: e.target.value }) : null)}
                  className="bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs w-full"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setSolicitudAEditar(null)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Guardar Cambios ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. EDITAR DESPACHO */}
      {envioAEditar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-teal-500/30 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-base font-bold text-white">Editar Despacho / Flete</h2>
            </div>

            <form onSubmit={handleEditEnvioSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="edit_env_ins" className="text-xs text-zinc-300">Carga</Label>
                  <Input
                    id="edit_env_ins"
                    type="text"
                    value={envioAEditar.tipo_insumo}
                    onChange={(e) => setEnvioAEditar(p => p ? ({ ...p, tipo_insumo: e.target.value }) : null)}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit_env_cant" className="text-xs text-zinc-300">Cantidad</Label>
                  <Input
                    id="edit_env_cant"
                    type="number"
                    min="1"
                    value={envioAEditar.cantidad}
                    onChange={(e) => setEnvioAEditar(p => p ? ({ ...p, cantidad: Number(e.target.value) }) : null)}
                    required
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit_env_chof" className="text-xs text-zinc-300">WhatsApp Chofer</Label>
                  <Input
                    id="edit_env_chof"
                    type="text"
                    value={envioAEditar.whatsapp_chofer || ''}
                    onChange={(e) => setEnvioAEditar(p => p ? ({ ...p, whatsapp_chofer: e.target.value }) : null)}
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit_env_salida" className="text-xs text-zinc-300">Hora de Salida</Label>
                  <Input
                    id="edit_env_salida"
                    type="datetime-local"
                    value={envioAEditar.hora_salida ? new Date(envioAEditar.hora_salida).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEnvioAEditar(p => p ? ({ ...p, hora_salida: e.target.value }) : null)}
                    className="bg-white/5 border-white/10 rounded-xl h-10 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_env_enc" className="text-xs text-zinc-300">Punto de Encuentro</Label>
                <Input
                  id="edit_env_enc"
                  type="text"
                  value={envioAEditar.punto_encuentro || ''}
                  onChange={(e) => setEnvioAEditar(p => p ? ({ ...p, punto_encuentro: e.target.value }) : null)}
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="p-3 bg-white/3 border border-white/5 rounded-2xl space-y-3">
                <p className="text-[10px] font-bold text-teal-400 uppercase">🚘 Capacidad Compartida</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit_env_cc" className="text-[10px] text-zinc-300">Carga Libre</Label>
                    <Input
                      id="edit_env_cc"
                      type="text"
                      value={envioAEditar.capacidad_carga_disponible || ''}
                      onChange={(e) => setEnvioAEditar(p => p ? ({ ...p, capacidad_carga_disponible: e.target.value }) : null)}
                      className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit_env_cv" className="text-[10px] text-zinc-300">Asientos Libres</Label>
                    <Input
                      id="edit_env_cv"
                      type="number"
                      min="0"
                      value={envioAEditar.capacidad_voluntarios_disponible || 0}
                      onChange={(e) => setEnvioAEditar(p => p ? ({ ...p, capacidad_voluntarios_disponible: Number(e.target.value) }) : null)}
                      className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setEnvioAEditar(null)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Guardar Cambios ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. EDITAR INCIDENCIA */}
      {incidenciaAEditar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-teal-500/30 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Editar Incidencia / Alerta Vial</h2>
            </div>

            <form onSubmit={handleEditIncidenciaSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit_inc_tipo" className="text-xs text-zinc-300">Tipo de Alerta</Label>
                <select
                  id="edit_inc_tipo"
                  value={incidenciaAEditar.tipo_incidencia}
                  onChange={(e) => setIncidenciaAEditar(p => p ? ({ ...p, tipo_incidencia: e.target.value as any }) : null)}
                  className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-xs w-full"
                >
                  <option value="transito_bloqueado">🚧 Autopista/Vía Trancada</option>
                  <option value="sobrecarga_recursos">⚠️ Exceso de Ayuda / Recursos</option>
                  <option value="sobrecarga_personas">👥 Exceso de Personas / Colapso</option>
                  <option value="otro">⚠️ Otra Incidencia</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_inc_desc" className="text-xs text-zinc-300">Detalles del Reporte</Label>
                <textarea
                  id="edit_inc_desc"
                  rows={3}
                  value={incidenciaAEditar.descripcion}
                  onChange={(e) => setIncidenciaAEditar(p => p ? ({ ...p, descripcion: e.target.value }) : null)}
                  required
                  className="bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs w-full"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setIncidenciaAEditar(null)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Guardar Cambios ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 13. EDITAR TRASLADO */}
      {trasladoAEditar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-sm w-full border border-teal-500/30 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Editar Solicitud de Traslado</h2>
            </div>

            <form onSubmit={handleEditTrasladoSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit_tras_cant" className="text-xs text-zinc-300">Cantidad de Personas</Label>
                <Input
                  id="edit_tras_cant"
                  type="number"
                  min="1"
                  value={trasladoAEditar.cantidad_personas}
                  onChange={(e) => setTrasladoAEditar(p => p ? ({ ...p, cantidad_personas: Number(e.target.value) }) : null)}
                  required
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_tras_obs" className="text-xs text-zinc-300">Observaciones Médicas</Label>
                <textarea
                  id="edit_tras_obs"
                  rows={2}
                  value={trasladoAEditar.observaciones || ''}
                  onChange={(e) => setTrasladoAEditar(p => p ? ({ ...p, observaciones: e.target.value }) : null)}
                  className="bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs w-full"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setTrasladoAEditar(null)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl px-4 py-2"
                >
                  Guardar Cambios ✓
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
