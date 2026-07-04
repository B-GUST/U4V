-- ============================================================
-- U4V — Unidos por Venezuela
-- Migration: 011_add_descripcion_tareas
-- Agrega campo para descripción de tareas/misiones a perfiles
-- ============================================================

ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS descripcion_tareas TEXT;

COMMENT ON COLUMN public.perfiles.descripcion_tareas IS
  'Descripción libre de las tareas que realiza la organización (ej: recolección de insumos médicos, alimentos no perecederos, etc.)';
