-- Migration 007: Registro de Auditoría Inmutable
CREATE TABLE IF NOT EXISTS public.registro_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    rol_usuario VARCHAR(50) NOT NULL,
    accion VARCHAR(255) NOT NULL,
    ip_origen VARCHAR(45) NOT NULL,
    detalles JSONB DEFAULT '{}'::jsonb
);

-- Habilitar RLS
ALTER TABLE public.registro_auditoria ENABLE ROW LEVEL SECURITY;

-- Crear política de solo inserción (INSERT) para usuarios autenticados
CREATE POLICY "Permitir insercion a usuarios autenticados" 
ON public.registro_auditoria 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Crear política de lectura (SELECT) para administradores o propio usuario
CREATE POLICY "Permitir lectura a administradores o propio usuario"
ON public.registro_auditoria
FOR SELECT
TO authenticated
USING (
    (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'admin' OR
    usuario_id = auth.uid()
);
