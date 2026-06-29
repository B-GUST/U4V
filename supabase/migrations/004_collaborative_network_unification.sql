-- ============================================================
-- U4V — Unidos por Venezuela
-- Migration: 004_collaborative_network_unification
-- ============================================================

-- 1. Nuevos tipos ENUM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_insumo_enum') THEN
    CREATE TYPE categoria_insumo_enum AS ENUM ('comida', 'agua', 'ropa', 'medicamentos', 'voluntarios');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_incidencia_enum') THEN
    CREATE TYPE tipo_incidencia_enum AS ENUM ('transito_bloqueado', 'sobrecarga_recursos', 'sobrecarga_personas', 'otro');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_traslado_enum') THEN
    CREATE TYPE estado_traslado_enum AS ENUM ('pendiente', 'asignado', 'completado');
  END IF;
END
$$;

-- 2. Alterar perfiles
ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS vacantes_disponibles INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.perfiles.instagram IS 'Instagram de la organización para vinculación directa.';
COMMENT ON COLUMN public.perfiles.vacantes_disponibles IS 'Número actual de plazas de alojamiento libres en el refugio.';

-- 3. Alterar nodos_geograficos para permitir creación por usuarios
ALTER TABLE public.nodos_geograficos
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS punto_referencia TEXT,
  ADD COLUMN IF NOT EXISTS creador_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL;

-- 4. Alterar solicitudes_recursos para soportar categorías y progreso de atención
ALTER TABLE public.solicitudes_recursos
  ADD COLUMN IF NOT EXISTS categoria categoria_insumo_enum NOT NULL DEFAULT 'comida',
  ADD COLUMN IF NOT EXISTS cantidad_atendida INTEGER NOT NULL DEFAULT 0;

-- 5. Alterar despachos_intermedios para añadir capacidad de transporte (ridesharing)
ALTER TABLE public.despachos_intermedios
  ADD COLUMN IF NOT EXISTS capacidad_carga_disponible TEXT,
  ADD COLUMN IF NOT EXISTS capacidad_voluntarios_disponible INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS punto_encuentro TEXT,
  ADD COLUMN IF NOT EXISTS hora_salida TIMESTAMPTZ;

-- 6. Crear tabla de postulaciones de ayuda parcial
CREATE TABLE IF NOT EXISTS public.postulaciones_solicitudes (
  id                UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id      UUID                  NOT NULL REFERENCES public.solicitudes_recursos(id) ON DELETE CASCADE,
  voluntario_id     UUID                  NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  cantidad_ofrecida INTEGER               NOT NULL CHECK (cantidad_ofrecida > 0),
  estado            estado_solicitud_enum NOT NULL DEFAULT 'pendiente', -- pendiente, atendida
  creado_en         TIMESTAMPTZ           NOT NULL DEFAULT now()
);

-- RLS para postulaciones
ALTER TABLE public.postulaciones_solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "postulaciones_select_autenticados" ON public.postulaciones_solicitudes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "postulaciones_insert" ON public.postulaciones_solicitudes
  FOR INSERT WITH CHECK (auth.uid() = voluntario_id);

CREATE POLICY "postulaciones_update_owner_o_admin" ON public.postulaciones_solicitudes
  FOR UPDATE USING (auth.uid() = voluntario_id OR EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin'
  ));

-- 7. Crear tabla de incidencias en zonas
CREATE TABLE IF NOT EXISTS public.reportes_incidencias (
  id                UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  nodo_id           UUID                  NOT NULL REFERENCES public.nodos_geograficos(id) ON DELETE CASCADE,
  autor_id          UUID                  NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  tipo_incidencia   tipo_incidencia_enum  NOT NULL DEFAULT 'otro',
  descripcion       TEXT                  NOT NULL,
  creado_en         TIMESTAMPTZ           NOT NULL DEFAULT now()
);

-- RLS para incidencias
ALTER TABLE public.reportes_incidencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incidencias_select_autenticados" ON public.reportes_incidencias
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "incidencias_insert" ON public.reportes_incidencias
  FOR INSERT WITH CHECK (auth.uid() = autor_id);

-- 8. Crear tabla de traslados de pacientes dados de alta
CREATE TABLE IF NOT EXISTS public.traslados_pacientes (
  id                  UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id         UUID                  NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  refugio_id          UUID                  REFERENCES public.perfiles(id) ON DELETE SET NULL,
  cantidad_personas   INTEGER               NOT NULL CHECK (cantidad_personas > 0),
  observaciones       TEXT,
  estado              estado_traslado_enum  NOT NULL DEFAULT 'pendiente',
  creado_en           TIMESTAMPTZ           NOT NULL DEFAULT now(),
  actualizado_en      TIMESTAMPTZ           NOT NULL DEFAULT now()
);

-- RLS para traslados
ALTER TABLE public.traslados_pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "traslados_select_autenticados" ON public.traslados_pacientes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "traslados_insert_hospital" ON public.traslados_pacientes
  FOR INSERT WITH CHECK (auth.uid() = hospital_id);

CREATE POLICY "traslados_update_coordinacion" ON public.traslados_pacientes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 9. Habilitar Realtime para las nuevas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE public.postulaciones_solicitudes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reportes_incidencias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.traslados_pacientes;
