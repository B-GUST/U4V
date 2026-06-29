-- ============================================================
-- U4V — Unidos por Venezuela
-- Migration: 002_add_registration_fields
-- ============================================================

-- Agregar campos a perfiles
ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS nombre_contacto TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS sms TEXT;

-- Comentarios explicativos
COMMENT ON COLUMN public.perfiles.nombre_contacto IS 'Nombre de la persona de contacto en la organización.';
COMMENT ON COLUMN public.perfiles.whatsapp IS 'Número de WhatsApp de la organización (formato internacional numérico).';
COMMENT ON COLUMN public.perfiles.sms IS 'Número de SMS para notificaciones (formato internacional numérico).';
