export type RolUsuario = 'admin' | 'primera_linea' | 'retaguardia'
export type BloquesTiempo = 'mañana' | 'tarde' | 'noche'
export type EstadoDespacho = 'transito' | 'completado' | 'cancelado'
export type NivelUrgencia = 'verde' | 'amarillo' | 'rojo'

export type TipoEntidad = 'centro_acopio' | 'ong' | 'refugio' | 'hospital' | 'otro'
export type TipoRacion = 'comida_bebida' | 'solo_comida' | 'ninguno'
export type TipoSolicitud = 'entrega' | 'recogida'
export type EstadoSolicitud = 'pendiente' | 'atendida' | 'cancelada'
export type EstadoEnvio = 'preparacion' | 'camino' | 'entregado' | 'desviado'

export type CategoriaInsumo = 'comida' | 'agua' | 'ropa' | 'medicamentos' | 'voluntarios'
export type TipoIncidencia = 'transito_bloqueado' | 'sobrecarga_recursos' | 'sobrecarga_personas' | 'otro'
export type EstadoTraslado = 'pendiente' | 'asignado' | 'completado'

export interface Perfil {
  id: string
  nombre_organizacion: string
  nombre_contacto: string | null
  rol: RolUsuario
  telefono_contacto: string | null
  whatsapp?: string | null
  sms?: string | null
  instagram?: string | null
  terminos_aceptados: boolean
  tipo_entidad: TipoEntidad
  direccion_fisica: string | null
  estado?: string | null
  ciudad?: string | null
  municipio?: string | null
  parroquia?: string | null
  sector?: string | null
  urbanizacion_residencia?: string | null
  calle_casa?: string | null
  punto_referencia?: string | null
  capacidad_hospedaje: number
  capacidad_salud_camas: number
  capacidad_raciones_diarias: number
  tipo_racion: TipoRacion
  vacantes_disponibles: number
  descripcion_tareas: string | null
  creado_en: string
  actualizado_en: string
}

export interface NodoGeografico {
  id: string
  nombre_nodo: string
  descripcion: string | null
  poblacion_estimada: number
  deficit_diario_raciones: number
  deficit_diario_agua_litros: number
  semaforo_medico: NivelUrgencia
  activo: boolean
  direccion: string | null
  punto_referencia: string | null
  estado?: string | null
  ciudad?: string | null
  municipio?: string | null
  parroquia?: string | null
  sector?: string | null
  urbanizacion_residencia?: string | null
  calle_casa?: string | null
  ultimo_reporte_timestamp?: string
  creador_id: string | null
  perfil_id: string | null
  ultima_actualizacion: string
  creado_en: string
}

export interface Despacho {
  id: string
  centro_id: string
  nodo_id: string
  fecha_operacion: string
  franja: BloquesTiempo
  estado: EstadoDespacho
  tipo_insumo: string
  cantidad_declarada: number
  token_reporte: string | null
  token_creado_en: string | null
  creado_en: string
  actualizado_en: string
  // Joins
  perfiles?: Perfil
  nodos_geograficos?: NodoGeografico
}

export interface ReporteTereno {
  id: string
  despacho_id: string
  cantidad_entregada_real: number
  nueva_poblacion_estimada: number | null
  semaforo_observado: NivelUrgencia
  falta_agua: boolean
  falta_comida: boolean
  emergencia_medica: boolean
  observacion_urgente: string | null
  creado_en: string
}

export interface SolicitudRecurso {
  id: string
  solicitante_id: string
  tipo_insumo: string
  cantidad_solicitada: number
  tipo_solicitud: TipoSolicitud
  estado: EstadoSolicitud
  descripcion: string | null
  categoria: CategoriaInsumo
  cantidad_atendida: number
  creado_en: string
  actualizado_en: string
  perfiles?: Perfil
  postulaciones?: PostulacionSolicitud[]
}

export interface DespachoIntermedio {
  id: string
  origen_id: string
  destino_perfil_id: string | null
  destino_nodo_id: string | null
  tipo_insumo: string
  cantidad: number
  estado_envio: EstadoEnvio
  whatsapp_chofer: string | null
  fecha_salida: string
  fecha_entrega: string | null
  creado_en: string
  capacidad_carga_disponible?: string | null
  capacidad_voluntarios_disponible?: number
  punto_encuentro?: string | null
  hora_salida?: string | null
  perfil_origen?: Perfil
  perfil_destino?: Perfil
  nodo_destino?: NodoGeografico
}

export interface PostulacionSolicitud {
  id: string
  solicitud_id: string
  voluntario_id: string
  cantidad_ofrecida: number
  estado: EstadoSolicitud
  creado_en: string
  voluntario_perfil?: Perfil
}

export interface ReporteIncidencia {
  id: string
  nodo_id: string
  autor_id: string
  tipo_incidencia: TipoIncidencia
  descripcion: string
  creado_en: string
  perfil_autor?: Perfil
  nodo?: NodoGeografico
}

export interface TrasladoPaciente {
  id: string
  hospital_id: string
  refugio_id: string | null
  cantidad_personas: number
  observaciones: string | null
  estado: EstadoTraslado
  creado_en: string
  actualizado_en: string
  hospital_perfil?: Perfil
  refugio_perfil?: Perfil
}

export interface BoletinAviso {
  id: string
  autor_id: string
  titulo: string
  contenido: string
  categoria: string
  creado_en: string
  perfil_autor?: Perfil
}

// Tipo compuesto para el Libro Mayor (dashboard)
export interface NodoConDespachos extends NodoGeografico {
  despachos_hoy: {
    mañana: Despacho | null
    tarde: Despacho | null
    noche: Despacho | null
  }
}

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: Perfil
        Insert: Omit<Perfil, 'creado_en' | 'actualizado_en'> & {
          creado_en?: string
          actualizado_en?: string
        }
        Update: Partial<Omit<Perfil, 'id' | 'creado_en'>>
      }
      nodos_geograficos: {
        Row: NodoGeografico
        Insert: Omit<NodoGeografico, 'id' | 'creado_en' | 'ultima_actualizacion'> & {
          id?: string
          creado_en?: string
          ultima_actualizacion?: string
        }
        Update: Partial<Omit<NodoGeografico, 'id' | 'creado_en'>>
      }
      despachos: {
        Row: Despacho
        Insert: Omit<
          Despacho,
          'id' | 'creado_en' | 'actualizado_en' | 'perfiles' | 'nodos_geograficos' | 'token_reporte' | 'token_creado_en'
        > & {
          id?: string
          creado_en?: string
          actualizado_en?: string
          token_reporte?: string | null
          token_creado_en?: string | null
        }
        Update: Partial<Omit<Despacho, 'id' | 'creado_en' | 'perfiles' | 'nodos_geograficos'>>
      }
      reportes_terreno: {
        Row: ReporteTereno
        Insert: Omit<ReporteTereno, 'id' | 'creado_en'> & {
          id?: string
          creado_en?: string
        }
        Update: Partial<Omit<ReporteTereno, 'id' | 'creado_en'>>
      }
      solicitudes_recursos: {
        Row: SolicitudRecurso
        Insert: Omit<SolicitudRecurso, 'id' | 'creado_en' | 'actualizado_en'> & {
          id?: string
          creado_en?: string
          actualizado_en?: string
        }
        Update: Partial<Omit<SolicitudRecurso, 'id' | 'creado_en'>>
      }
      despachos_intermedios: {
        Row: DespachoIntermedio
        Insert: Omit<DespachoIntermedio, 'id' | 'creado_en'> & {
          id?: string
          creado_en?: string
        }
        Update: Partial<Omit<DespachoIntermedio, 'id' | 'creado_en'>>
      }
      postulaciones_solicitudes: {
        Row: PostulacionSolicitud
        Insert: Omit<PostulacionSolicitud, 'id' | 'creado_en'> & {
          id?: string
          creado_en?: string
        }
        Update: Partial<Omit<PostulacionSolicitud, 'id' | 'creado_en'>>
      }
      reportes_incidencias: {
        Row: ReporteIncidencia
        Insert: Omit<ReporteIncidencia, 'id' | 'creado_en'> & {
          id?: string
          creado_en?: string
        }
        Update: Partial<Omit<ReporteIncidencia, 'id' | 'creado_en'>>
      }
      traslados_pacientes: {
        Row: TrasladoPaciente
        Insert: Omit<TrasladoPaciente, 'id' | 'creado_en' | 'actualizado_en'> & {
          id?: string
          creado_en?: string
          actualizado_en?: string
        }
        Update: Partial<Omit<TrasladoPaciente, 'id' | 'creado_en'>>
      }
      boletin_avisos: {
        Row: BoletinAviso
        Insert: Omit<BoletinAviso, 'id' | 'creado_en'> & {
          id?: string
          creado_en?: string
        }
        Update: Partial<Omit<BoletinAviso, 'id' | 'creado_en'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      rol_usuario: RolUsuario
      bloque_tiempo: BloquesTiempo
      estado_despacho: EstadoDespacho
      nivel_urgencia: NivelUrgencia
      tipo_entidad: TipoEntidad
      tipo_racion: TipoRacion
      tipo_solicitud: TipoSolicitud
      estado_solicitud: EstadoSolicitud
      estado_envio: EstadoEnvio
      categoria_insumo: CategoriaInsumo
      tipo_incidencia: TipoIncidencia
      estado_traslado: EstadoTraslado
    }
  }
}
