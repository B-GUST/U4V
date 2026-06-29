-- ============================================================
-- U4V — Unidos por Venezuela
-- Migration: 005_nodos_geograficos_insert_policy
-- ============================================================

-- Agregar política de inserción para nodos geográficos (zonas) por usuarios coordinadores
CREATE POLICY "nodos_insert_autenticados" ON public.nodos_geograficos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
