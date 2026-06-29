-- ============================================================
-- U4V — Unidos por Venezuela
-- Migration: 003_logistics_network_expansion
-- ============================================================

-- 1. Nuevos tipos ENUM para la red logística
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_entidad_enum') THEN
    CREATE TYPE tipo_entidad_enum AS ENUM ('centro_acopio', 'ong', 'refugio', 'hospital', 'otro');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_racion_enum') THEN
    CREATE TYPE tipo_racion_enum AS ENUM ('comida_bebida', 'solo_comida', 'ninguno');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_solicitud_enum') THEN
    CREATE TYPE tipo_solicitud_enum AS ENUM ('entrega', 'recogida');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_solicitud_enum') THEN
    CREATE TYPE estado_solicitud_enum AS ENUM ('pendiente', 'atendida', 'cancelada');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_envio_enum') THEN
    CREATE TYPE estado_envio_enum AS ENUM ('preparacion', 'camino', 'entregado', 'desviado');
  END IF;
END
$$;

-- 2. Alterar perfiles para agregar capacidades y ubicación
ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS tipo_entidad tipo_entidad_enum NOT NULL DEFAULT 'ong',
  ADD COLUMN IF NOT EXISTS direccion_fisica TEXT,
  ADD COLUMN IF NOT EXISTS capacidad_hospedaje INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capacidad_salud_camas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capacidad_raciones_diarias INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tipo_racion tipo_racion_enum NOT NULL DEFAULT 'ninguno';

COMMENT ON COLUMN public.perfiles.tipo_entidad IS 'Clasificación de la organización para coordinar necesidades.';
COMMENT ON COLUMN public.perfiles.direccion_fisica IS 'Ubicación física o dirección operativa.';
COMMENT ON COLUMN public.perfiles.capacidad_hospedaje IS 'Capacidad de albergue temporal (personas).';
COMMENT ON COLUMN public.perfiles.capacidad_salud_camas IS 'Capacidad de hospitalización/camas de atención.';
COMMENT ON COLUMN public.perfiles.capacidad_raciones_diarias IS 'Raciones de comida preparadas al día.';

-- 3. Tabla de solicitudes de recursos
CREATE TABLE IF NOT EXISTS public.solicitudes_recursos (
  id                  UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id      UUID                  NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  tipo_insumo         TEXT                  NOT NULL,
  cantidad_solicitada INTEGER               NOT NULL CHECK (cantidad_solicitada > 0),
  tipo_solicitud      tipo_solicitud_enum   NOT NULL DEFAULT 'entrega',
  estado              estado_solicitud_enum NOT NULL DEFAULT 'pendiente',
  descripcion         TEXT,
  creado_en           TIMESTAMPTZ           NOT NULL DEFAULT now(),
  actualizado_en      TIMESTAMPTZ           NOT NULL DEFAULT now()
);

-- 4. Tabla de despachos/envíos punto a punto o en camino
CREATE TABLE IF NOT EXISTS public.despachos_intermedios (
  id                  UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  origen_id           UUID                  NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  destino_perfil_id   UUID                  REFERENCES public.perfiles(id) ON DELETE SET NULL,
  destino_nodo_id     UUID                  REFERENCES public.nodos_geograficos(id) ON DELETE SET NULL,
  tipo_insumo         TEXT                  NOT NULL,
  cantidad            INTEGER               NOT NULL CHECK (cantidad > 0),
  estado_envio        estado_envio_enum     NOT NULL DEFAULT 'preparacion',
  whatsapp_chofer     TEXT,
  fecha_salida        TIMESTAMPTZ           NOT NULL DEFAULT now(),
  fecha_entrega       TIMESTAMPTZ,
  creado_en           TIMESTAMPTZ           NOT NULL DEFAULT now(),
  
  CONSTRAINT destino_valido CHECK (destino_perfil_id IS NOT NULL OR destino_nodo_id IS NOT NULL)
);

-- 5. Row Level Security (RLS) para solicitudes
ALTER TABLE public.solicitudes_recursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solicitudes_select_autenticados" ON public.solicitudes_recursos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "solicitudes_insert_propias" ON public.solicitudes_recursos
  FOR INSERT WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "solicitudes_update_propias_o_admin" ON public.solicitudes_recursos
  FOR UPDATE USING (auth.uid() = solicitante_id OR EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin'
  ));

-- 6. Row Level Security (RLS) para despachos intermedios
ALTER TABLE public.despachos_intermedios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "despachos_int_select_autenticados" ON public.despachos_intermedios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "despachos_int_insert" ON public.despachos_intermedios
  FOR INSERT WITH CHECK (auth.uid() = origen_id);

CREATE POLICY "despachos_int_update_owner_o_admin" ON public.despachos_intermedios
  FOR UPDATE USING (auth.uid() = origen_id OR EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin'
  ));

-- 7. Habilitar Realtime para estas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitudes_recursos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.despachos_intermedios;
