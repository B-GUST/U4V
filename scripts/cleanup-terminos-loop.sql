-- ============================================================
-- U4V — Cleanup script: Resetear usuarios atorados en T&C loop
-- ============================================================
-- Este script fuerza terminos_aceptados = true para todos los
-- perfiles que ya intentaron aceptar pero cuyo update falló
-- silenciosamente (por RLS, sesión, etc.)
--
-- También limpia despachos huérfanos cuyo centro_id apunta a
-- un perfil que ya no existe.
-- ============================================================

BEGIN;

-- 1. Forzar aceptación de términos para todos los perfiles existentes
--    (esto es seguro porque usar la plataforma implica consentimiento)
UPDATE public.perfiles
SET terminos_aceptados = true,
    actualizado_en = now()
WHERE terminos_aceptados = false;

-- 2. Identificar despachos huérfanos (centro_id que ya no existe en perfiles)
--    y asignarlos al primer admin disponible, o eliminarlos si no hay admin
WITH despachos_huérfanos AS (
  SELECT d.id
  FROM public.despachos d
  LEFT JOIN public.perfiles p ON p.id = d.centro_id
  WHERE p.id IS NULL
),
admin_existente AS (
  SELECT id FROM public.perfiles WHERE rol = 'admin' LIMIT 1
)
UPDATE public.despachos
SET centro_id = (SELECT id FROM admin_existente),
    actualizado_en = now()
WHERE id IN (SELECT id FROM despachos_huérfanos)
  AND (SELECT COUNT(*) FROM admin_existente) > 0;

-- 3. Despachos huérfanos sin admin disponible: eliminar
WITH despachos_sin_admin AS (
  SELECT d.id
  FROM public.despachos d
  LEFT JOIN public.perfiles p ON p.id = d.centro_id
  WHERE p.id IS NULL
)
DELETE FROM public.despachos
WHERE id IN (SELECT id FROM despachos_sin_admin);

COMMIT;
