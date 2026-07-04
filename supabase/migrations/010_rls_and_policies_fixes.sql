-- ============================================================
-- U4V — Unidos por Venezuela
-- Migration: 010_rls_and_policies_fixes
-- Fix: RLS policies con WITH CHECK explícito + Realtime faltante
-- ============================================================

-- 1. perfiles_update_propio: agregar WITH CHECK explícito
--    Previene escalación de columnas no autorizadas
DROP POLICY IF EXISTS "perfiles_update_propio" ON public.perfiles;
CREATE POLICY "perfiles_update_propio"
  ON public.perfiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. nodos_geograficos: permitir update al creador del nodo o admin
--    Antes solo service_role podía actualizar
DROP POLICY IF EXISTS "nodos_update_service" ON public.nodos_geograficos;
CREATE POLICY "nodos_update_creator_or_admin"
  ON public.nodos_geograficos FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR auth.uid() = creador_id
    OR EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid()
      AND rol = 'admin'
    )
  );

-- 3. Realtime: agregar tablas a la publicación si no son miembros
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'solicitudes_recursos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitudes_recursos;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'despachos_intermedios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.despachos_intermedios;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'reportes_incidencias'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reportes_incidencias;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'traslados_pacientes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.traslados_pacientes;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'boletin_avisos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.boletin_avisos;
  END IF;
END;
$$;
