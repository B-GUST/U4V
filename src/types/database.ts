export type RolUsuario = 'admin' | 'primera_linea' | 'retaguardia'
export type BloquesTiempo = 'mañana' | 'tarde' | 'noche'
export type EstadoDespacho = 'transito' | 'completado' | 'cancelado'
export type NivelUrgencia = 'verde' | 'amarillo' | 'rojo'

export interface Perfil {
  id: string
  nombre_organizacion: string
  rol: RolUsuario
  telefono_contacto: string | null
  terminos_aceptados: boolean
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      rol_usuario: RolUsuario
      bloque_tiempo: BloquesTiempo
      estado_despacho: EstadoDespacho
      nivel_urgencia: NivelUrgencia
    }
  }
}
