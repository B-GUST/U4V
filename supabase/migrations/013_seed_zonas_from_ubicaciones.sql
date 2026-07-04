-- ============================================================
-- U4V — Unidos por Venezuela
-- Migration: 013_seed_zonas_from_ubicaciones
-- Seed: 41 ubicaciones from ubicaciones.md as nodos_geograficos
-- Skip any that already exist (by normalized name match)
-- ============================================================

DO $$
DECLARE
  v_count integer := 0;
BEGIN

  -- ==================== HOSPITALES (17) ====================
  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital Pérez Carreño', 'Hospital general', 0, 0, 0, 'rojo', true, 'Distrito Capital', 'Caracas', 'Parroquia El Paraíso'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Pérez Carreño%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital Pérez Carreño'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital Vargas de Caracas', 'También conocido como Hospital Dr. José María Vargas (La Guaira)', 0, 0, 0, 'rojo', true, 'La Guaira', 'La Guaira', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Vargas%') OR LOWER(nombre_nodo) LIKE LOWER('%José María Vargas%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital Vargas de Caracas'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital Dr. Domingo Luciani', 'También conocido como Hospital Domingo Luciani (El Llanito)', 0, 0, 0, 'rojo', true, 'Distrito Capital', 'Caracas', 'El Llanito'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Domingo Luciani%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital Dr. Domingo Luciani'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital Militar Dr. Carlos Arvelo', 'Hospital militar', 0, 0, 0, 'rojo', true, 'Distrito Capital', 'Caracas', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Carlos Arvelo%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital Militar Dr. Carlos Arvelo'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital de Catia', 'También conocido como H. Periférico Catia (Baquero González)', 0, 0, 0, 'rojo', true, 'Distrito Capital', 'Caracas', 'Catia'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Catia%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital de Catia'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital Universitario de Caracas', 'Hospital universitario', 0, 0, 0, 'rojo', true, 'Distrito Capital', 'Caracas', 'Ciudad Universitaria'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Universitario de Caracas%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital Universitario de Caracas'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital General Dr. Jesús Yerena', '', 0, 0, 0, 'rojo', true, NULL, NULL, ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Jesús Yerena%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital General Dr. Jesús Yerena'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Clínica El Ávila', 'Clínica privada', 0, 0, 0, 'amarillo', true, 'Distrito Capital', 'Caracas', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Clínica El Ávila%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Clínica El Ávila'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital José Gregorio Hernández', '', 0, 0, 0, 'rojo', true, 'Distrito Capital', 'Caracas', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%José Gregorio Hernández%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital José Gregorio Hernández'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital Temporal (Piso 1)', 'Hospital temporal', 0, 0, 0, 'amarillo', true, NULL, NULL, ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Hospital Temporal%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital Temporal (Piso 1)'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital Temporal (Pared Azul)', 'Hospital temporal', 0, 0, 0, 'amarillo', true, NULL, NULL, ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Pared Azul%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital Temporal (Pared Azul)'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Cruz Roja - Sede Caracas', 'Sede de la Cruz Roja Venezolana', 0, 0, 0, 'verde', true, 'Distrito Capital', 'Caracas', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Cruz Roja%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Cruz Roja'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital Ciudad Caribia', '', 0, 0, 0, 'amarillo', true, 'Distrito Capital', 'Caracas', 'Caribia'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Ciudad Caribia%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital Ciudad Caribia'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital Victorino Santaella (Los Teques)', '', 0, 0, 0, 'rojo', true, 'Miranda', 'Los Teques', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Victorino Santaella%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital Victorino Santaella'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital JM de los Ríos', 'Hospital infantil', 0, 0, 0, 'rojo', true, 'Distrito Capital', 'Caracas', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%JM de los Ríos%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital JM de los Ríos'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Hospital Materno Infantil / Emergencia Pediátrica', '', 0, 0, 0, 'rojo', true, 'Distrito Capital', 'Caracas', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Materno Infantil%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hospital Materno Infantil'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Clínica Leopoldo', 'Clínica privada', 0, 0, 0, 'verde', true, 'Distrito Capital', 'Caracas', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Clínica Leopoldo%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Clínica Leopoldo'; END IF;

  -- ==================== REFUGIOS (3) ====================
  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Refugio Oeste', 'Refugio temporal en el oeste del área metropolitana', 196, 0, 0, 'rojo', true, 'Distrito Capital', 'Caracas', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Refugio Oeste%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Refugio Oeste'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Refugio Golf - Playa Los Cocos', 'Campamento temporal en Caraballeda. También Refugio Campo de Golf Playa Los Cocos', 492, 0, 0, 'rojo', true, 'La Guaira', 'Caraballeda', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Playa Los Cocos%') OR LOWER(nombre_nodo) LIKE LOWER('%Golf%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Refugio Golf - Playa Los Cocos'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Refugio de Desplazados', 'Refugio genérico para desplazados', 0, 0, 0, 'rojo', true, NULL, NULL, ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Refugio de Desplazados%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Refugio de Desplazados'; END IF;

  -- ==================== CENTROS DE ACOPIO (1) ====================
  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad, direccion)
  SELECT 'Centro de Acopio Caraballeda', 'Centro de recolección de ayuda en Caraballeda', 7, 0, 0, 'amarillo', true, 'La Guaira', 'Caraballeda', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Centro de Acopio Caraballeda%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Centro de Acopio Caraballeda'; END IF;

  -- ==================== OTRAS UBICACIONES (2) ====================
  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo)
  SELECT 'Centro de Asistencia Ministerio de Salud', 'Personas registradas por el Ministerio de Salud', 0, 0, 0, 'verde', true
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Ministerio de Salud%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Centro de Asistencia Ministerio de Salud'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo)
  SELECT 'Otros / Sin Clasificar', 'Categoría comodín para personas sin ubicación definida', 109, 0, 0, 'verde', true
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) = 'otros / sin clasificar');
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Otros / Sin Clasificar'; END IF;

  -- ==================== ZONAS DE ORIGEN (18) ====================
  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'La Guaira', 'Zona de procedencia — Estado La Guaira', 1345, 0, 0, 'rojo', true, 'La Guaira', 'La Guaira'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%La Guaira%') AND LOWER(nombre_nodo) NOT LIKE LOWER('%Centro%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: La Guaira'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Caracas', 'Zona de procedencia — Distrito Capital', 562, 0, 0, 'rojo', true, 'Distrito Capital', 'Caracas'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) = 'caracas');
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Caracas'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Catia', 'Zona de procedencia — Parroquia de Caracas', 212, 0, 0, 'rojo', true, 'Distrito Capital', 'Caracas'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) = 'catia');
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Catia'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Caribe', 'Zona de procedencia — Sector/Urbanización en La Guaira', 82, 0, 0, 'amarillo', true, 'La Guaira', 'Caribe'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) = 'caribe');
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Caribe'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Los Teques', 'Zona de procedencia — Ciudad del Estado Miranda', 34, 0, 0, 'amarillo', true, 'Miranda', 'Los Teques'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Los Teques%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Los Teques'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Caraballeda', 'Zona de procedencia — Ciudad/Parroquia de La Guaira', 31, 0, 0, 'amarillo', true, 'La Guaira', 'Caraballeda'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) = 'caraballeda');
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Caraballeda'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Petare', 'Zona de procedencia — Municipio del Estado Miranda', 13, 0, 0, 'amarillo', true, 'Miranda', 'Petare'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) = 'petare');
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Petare'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Catia La Mar', 'Zona de procedencia — Ciudad de La Guaira', 9, 0, 0, 'amarillo', true, 'La Guaira', 'Catia La Mar'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Catia La Mar%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Catia La Mar'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Macuto', 'Zona de procedencia — Ciudad de La Guaira', 7, 0, 0, 'amarillo', true, 'La Guaira', 'Macuto'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) = 'macuto');
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Macuto'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Baruta', 'Zona de procedencia — Municipio del Estado Miranda', 6, 0, 0, 'verde', true, 'Miranda', 'Baruta'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) = 'baruta');
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Baruta'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Maiquetía', 'Zona de procedencia — Ciudad/Aeropuerto de La Guaira', 4, 0, 0, 'verde', true, 'La Guaira', 'Maiquetía'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) = 'maiquetía');
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Maiquetía'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Altamira', 'Zona de procedencia — Urbanización de Caracas', 4, 0, 0, 'verde', true, 'Distrito Capital', 'Caracas'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) = 'altamira');
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Altamira'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Hoyo de la Puerta', 'Zona de procedencia — Sector entre Miranda y Caracas', 2, 0, 0, 'verde', true, 'Miranda', 'Caracas'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Hoyo de la Puerta%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Hoyo de la Puerta'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Sabana Grande', 'Zona de procedencia — Urbanización de Caracas', 1, 0, 0, 'verde', true, 'Distrito Capital', 'Caracas'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Sabana Grande%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Sabana Grande'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Los Caracas', 'Zona de procedencia — Poblado de La Guaira', 0, 0, 0, 'verde', true, 'La Guaira', 'Los Caracas'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%Los Caracas%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Los Caracas'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'Antímano', 'Zona de procedencia — Parroquia de Caracas', 0, 0, 0, 'verde', true, 'Distrito Capital', 'Caracas'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) = 'antímano');
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: Antímano'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'La Pastora', 'Zona de procedencia — Parroquia de Caracas', 0, 0, 0, 'verde', true, 'Distrito Capital', 'Caracas'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%La Pastora%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: La Pastora'; END IF;

  INSERT INTO public.nodos_geograficos (nombre_nodo, descripcion, poblacion_estimada, deficit_diario_raciones, deficit_diario_agua_litros, semaforo_medico, activo, estado, ciudad)
  SELECT 'La Mamera', 'Zona de procedencia — Sector de Caracas', 0, 0, 0, 'verde', true, 'Distrito Capital', 'Caracas'
  WHERE NOT EXISTS (SELECT 1 FROM public.nodos_geograficos WHERE LOWER(nombre_nodo) LIKE LOWER('%La Mamera%'));
  GET DIAGNOSTICS v_count = ROW_COUNT; IF v_count > 0 THEN RAISE NOTICE 'Inserted: La Mamera'; END IF;

  RAISE NOTICE 'Seed migration 013 completed successfully.';

END;
$$;
