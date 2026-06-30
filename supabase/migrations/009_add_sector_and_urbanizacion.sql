-- Migration 009: Agregar campos sector y urbanizacion_residencia para granularidad geográfica

-- 1. Agregar campos a public.perfiles
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS sector TEXT,
ADD COLUMN IF NOT EXISTS urbanizacion_residencia TEXT;

-- 2. Agregar campos a public.nodos_geograficos
ALTER TABLE public.nodos_geograficos
ADD COLUMN IF NOT EXISTS sector TEXT,
ADD COLUMN IF NOT EXISTS urbanizacion_residencia TEXT;
