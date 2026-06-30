-- Migration 008: Estandarización de Direcciones y Data Staleness Index (DSI)

-- 1. Agregar campos de dirección a public.perfiles
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS municipio TEXT,
ADD COLUMN IF NOT EXISTS parroquia TEXT,
ADD COLUMN IF NOT EXISTS calle_casa TEXT,
ADD COLUMN IF NOT EXISTS punto_referencia TEXT;

-- 2. Agregar campos de dirección e índice de antigüedad a public.nodos_geograficos
ALTER TABLE public.nodos_geograficos
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS municipio TEXT,
ADD COLUMN IF NOT EXISTS parroquia TEXT,
ADD COLUMN IF NOT EXISTS calle_casa TEXT,
ADD COLUMN IF NOT EXISTS punto_referencia TEXT,
ADD COLUMN IF NOT EXISTS ultimo_reporte_timestamp TIMESTAMPTZ DEFAULT now();
