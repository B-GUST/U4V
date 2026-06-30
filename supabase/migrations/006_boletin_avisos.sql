-- ============================================================
-- U4V — Unidos por Venezuela
-- Migration: 006_boletin_avisos
-- ============================================================

-- Crear tabla de Boletín de Avisos y Alertas Logísticas Generales
CREATE TABLE IF NOT EXISTS public.boletin_avisos (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id    UUID          NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  titulo      TEXT          NOT NULL,
  contenido   TEXT          NOT NULL,
  categoria   TEXT          NOT NULL DEFAULT 'general', -- general, seguridad, logistica, salud
  creado_en   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.boletin_avisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boletin_select_autenticados" ON public.boletin_avisos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "boletin_insert" ON public.boletin_avisos
  FOR INSERT WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "boletin_update" ON public.boletin_avisos
  FOR UPDATE USING (auth.uid() = autor_id OR EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin'
  ));

CREATE POLICY "boletin_delete" ON public.boletin_avisos
  FOR DELETE USING (auth.uid() = autor_id OR EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin'
  ));

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.boletin_avisos;
