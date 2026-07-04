-- ============================================================
-- U4V — Unidos por Venezuela
-- Migration: 012_add_perfil_id_to_nodos
-- Add: perfil_id FK to link a zone to an organization's profile
-- ============================================================

ALTER TABLE public.nodos_geograficos
  ADD COLUMN perfil_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_nodos_perfil_id ON public.nodos_geograficos(perfil_id);
