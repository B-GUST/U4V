export type RolUsuario = 'admin' | 'primera_linea' | 'retaguardia'
export type BloquesTiempo = 'mañana' | 'tarde' | 'noche'
export type EstadoDespacho = 'transito' | 'completado' | 'cancelado'
export type NivelUrgencia = 'verde' | 'amarillo' | 'rojo'

export type TipoEntidad = 'centro_acopio' | 'ong' | 'refugio' | 'hospital' | 'otro'
export type TipoRacion = 'comida_bebida' | 'solo_comida' | 'ninguno'
export type TipoSolicitud = 'entrega' | 'recogida'
export type EstadoSolicitud = 'pendiente' | 'atendida' | 'cancelada'
export type EstadoEnvio = 'preparacion' | 'camino' | 'entregado' | 'desviado'

export interface Perfil {
  id: string
  nombre_organizacion: string
  nombre_contacto: string | null
  rol: RolUsuario
  telefono_contacto: string | null
  whatsapp?: string | null
  sms?: string | null
  terminos_aceptados: boolean
  tipo_entidad: TipoEntidad
  direccion_fisica: string | null
  capacidad_hospedaje: number
  capacidad_salud_camas: number
  capacidad_raciones_diarias: number
  tipo_racion: TipoRacion
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
  creado_en: string
  actualizado_en: string
  perfiles?: Perfil
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
  perfil_origen?: Perfil
  perfil_destino?: Perfil
  nodo_destino?: NodoGeografico
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
    }
  }
}
