-- ============================================================
-- U4V — Unidos por Venezuela
-- MVP: Sistema Operativo de Logística Post-Rescate
-- Migration: 001_initial_schema
-- ============================================================

-- ============================================================
-- ENUMS — Variables controladas para métricas limpias
-- ============================================================

CREATE TYPE rol_usuario AS ENUM ('admin', 'primera_linea', 'retaguardia');
CREATE TYPE bloque_tiempo AS ENUM ('mañana', 'tarde', 'noche');
CREATE TYPE estado_despacho AS ENUM ('transito', 'completado', 'cancelado');
CREATE TYPE nivel_urgencia AS ENUM ('verde', 'amarillo', 'rojo');

-- ============================================================
-- TABLA 1: perfiles
-- Extiende auth.users de Supabase.
-- Controla quién opera sin manejar datos de víctimas.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.perfiles (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_organizacion  TEXT        NOT NULL,
  rol                  rol_usuario NOT NULL DEFAULT 'primera_linea',
  telefono_contacto    TEXT,
  terminos_aceptados   BOOLEAN     NOT NULL DEFAULT false,
  creado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.perfiles IS 'Centros de acopio y coordinadores. Sin datos de víctimas.';
COMMENT ON COLUMN public.perfiles.terminos_aceptados IS 'Candado legal. Si false, la DB rechaza inserciones de despachos.';

-- ============================================================
-- TABLA 2: nodos_geograficos
-- Zonas cero y refugios. Métricas en vivo de déficit.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.nodos_geograficos (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_nodo               TEXT        NOT NULL,
  descripcion               TEXT,
  poblacion_estimada        INTEGER     NOT NULL DEFAULT 0,
  deficit_diario_raciones   INTEGER     NOT NULL DEFAULT 0,
  deficit_diario_agua_litros INTEGER    NOT NULL DEFAULT 0,
  semaforo_medico           nivel_urgencia NOT NULL DEFAULT 'verde',
  activo                    BOOLEAN     NOT NULL DEFAULT true,
  ultima_actualizacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
  creado_en                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.nodos_geograficos IS 'Nodos lógicos geográficos predefinidos (sin polígonos complejos en MVP).';
COMMENT ON COLUMN public.nodos_geograficos.deficit_diario_raciones IS 'Unidad: raciones de comida. Se recalcula al recibir reportes de terreno.';

-- ============================================================
-- TABLA 3: despachos
-- El Libro Mayor de transacciones logísticas.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.despachos (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_id           UUID           NOT NULL REFERENCES public.perfiles(id),
  nodo_id             UUID           NOT NULL REFERENCES public.nodos_geograficos(id),
  fecha_operacion     DATE           NOT NULL DEFAULT CURRENT_DATE,
  franja              bloque_tiempo  NOT NULL,
  estado              estado_despacho NOT NULL DEFAULT 'transito',
  tipo_insumo         TEXT           NOT NULL,
  cantidad_declarada  INTEGER        NOT NULL CHECK (cantidad_declarada > 0),
  token_reporte       UUID           UNIQUE DEFAULT gen_random_uuid(),
  token_creado_en     TIMESTAMPTZ    DEFAULT now(),
  creado_en           TIMESTAMPTZ    NOT NULL DEFAULT now(),
  actualizado_en      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Constraint vital: evita colisiones de franjas horarias
-- Si dos ONGs intentan reservar el mismo slot al mismo milisegundo, solo una gana.
ALTER TABLE public.despachos
  ADD CONSTRAINT unique_slot UNIQUE (nodo_id, fecha_operacion, franja);

COMMENT ON TABLE public.despachos IS 'Registro de intenciones de despacho. NO inventarios completos.';
COMMENT ON COLUMN public.despachos.token_reporte IS 'UUID único para el enlace de WhatsApp. Se anula (NULL) tras el primer uso.';

-- ============================================================
-- TABLA 4: reportes_terreno
-- Cierre del ciclo. Datos de choferes desde la zona cero.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reportes_terreno (
  id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  despacho_id              UUID          NOT NULL UNIQUE REFERENCES public.despachos(id),
  cantidad_entregada_real  INTEGER       NOT NULL CHECK (cantidad_entregada_real >= 0),
  nueva_poblacion_estimada INTEGER,
  semaforo_observado       nivel_urgencia NOT NULL DEFAULT 'verde',
  falta_agua               BOOLEAN       NOT NULL DEFAULT false,
  falta_comida             BOOLEAN       NOT NULL DEFAULT false,
  emergencia_medica        BOOLEAN       NOT NULL DEFAULT false,
  observacion_urgente      TEXT,
  creado_en                TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reportes_terreno IS 'Datos inyectados asincrónicamente desde el campo. Token de un solo uso.';

-- ============================================================
-- ROW LEVEL SECURITY — Gobernanza a nivel de fila
-- ============================================================

ALTER TABLE public.perfiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodos_geograficos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despachos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes_terreno  ENABLE ROW LEVEL SECURITY;

-- --- PERFILES ---

-- Lectura: todos los usuarios autenticados ven los centros activos
CREATE POLICY "perfiles_select_autenticados"
  ON public.perfiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Inserción: solo service_role (admin crea perfiles desde el panel)
CREATE POLICY "perfiles_insert_service"
  ON public.perfiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Actualización: un usuario solo actualiza su propia fila (para aceptar ToS)
CREATE POLICY "perfiles_update_propio"
  ON public.perfiles FOR UPDATE
  USING (auth.uid() = id);

-- --- NODOS GEOGRÁFICOS ---

-- Lectura: todos los autenticados
CREATE POLICY "nodos_select_autenticados"
  ON public.nodos_geograficos FOR SELECT
  USING (auth.role() = 'authenticated');

-- Actualización: solo service_role (Edge Functions recalculan métricas)
CREATE POLICY "nodos_update_service"
  ON public.nodos_geograficos FOR UPDATE
  USING (auth.role() = 'service_role');

-- --- DESPACHOS ---

-- Lectura: todos los autenticados (visibilidad total para coordinación)
CREATE POLICY "despachos_select_autenticados"
  ON public.despachos FOR SELECT
  USING (auth.role() = 'authenticated');

-- Inserción: CANDADO DOBLE
--   1. El usuario que inserta debe ser el dueño (centro_id = auth.uid())
--   2. El usuario debe tener terminos_aceptados = true
CREATE POLICY "despachos_insert_con_tos"
  ON public.despachos FOR INSERT
  WITH CHECK (
    auth.uid() = centro_id
    AND EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid()
      AND terminos_aceptados = true
    )
  );

-- Cancelación: solo el dueño puede cancelar su propio despacho
CREATE POLICY "despachos_update_propio"
  ON public.despachos FOR UPDATE
  USING (auth.uid() = centro_id);

-- --- REPORTES DE TERRENO ---

-- Inserción: solo service_role (Edge Function valida token y hace el INSERT)
CREATE POLICY "reportes_insert_service"
  ON public.reportes_terreno FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Lectura: todos los autenticados
CREATE POLICY "reportes_select_autenticados"
  ON public.reportes_terreno FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- REALTIME — Habilitar publicación para suscripciones en vivo
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.despachos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nodos_geograficos;

-- ============================================================
-- SEED: Datos ficticios realistas para el MVP
-- ============================================================

-- Nodos geográficos (zonas cero del estado Vargas / La Guaira)
INSERT INTO public.nodos_geograficos
  (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico)
VALUES
  ('Residencias Macuto - Punto A', 'Conjunto habitacional en baja, acceso por Av. La Playa', 340, 700, 1200, 'rojo'),
  ('Sector Caraballeda - Centro', 'Plaza Bolívar y calles adyacentes, punto de reunión principal', 215, 430, 800,  'amarillo'),
  ('Urbanización Caribe - Punto B', 'Acceso por vía alterna, requiere 4x4', 180, 360, 600,  'amarillo'),
  ('Liceo Juan Bautista Dalla Costa', 'Refugio temporal habilitado en el liceo municipal', 520, 1040, 1800, 'rojo'),
  ('Sector Los Corales - Bajo', 'Zona inundada parcialmente, acceso limitado', 95,  190,  320,  'rojo'),
  ('Parque Caraballeda - Cancha', 'Zona abierta usada como punto de acopio comunitario', 160, 320, 540,  'verde'),
  ('Residencias Playa Grande', 'Torre A y B sin agua potable desde hace 48h', 280, 560, 980,  'amarillo'),
  ('Centro Comercial La Guaira (Refugio)', 'Habilitado como refugio de emergencia, 3 pisos activos', 410, 820, 1400, 'amarillo');
