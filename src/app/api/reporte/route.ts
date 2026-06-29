import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NivelUrgencia } from '@/types/database'

// Usamos service_role key para poder:
// 1. Validar el token
// 2. Insertar el reporte (RLS lo requiere por service_role)
// 3. Anular el token (evitar reutilización)
// 4. Recalcular métricas del nodo
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      despachoId,
      token,
      cantidad_entregada_real,
      nueva_poblacion_estimada,
      falta_agua,
      falta_comida,
      emergencia_medica,
      observacion_urgente,
      semaforo_observado,
    } = body

    // Validación básica
    if (!despachoId || !token || cantidad_entregada_real === undefined) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Verificar que el token sea válido y el despacho esté en tránsito
    const { data: despacho, error: despachoError } = await supabase
      .from('despachos')
      .select('id, nodo_id, cantidad_declarada, token_reporte, estado')
      .eq('id', despachoId)
      .eq('token_reporte', token)
      .eq('estado', 'transito')
      .single()

    if (despachoError || !despacho) {
      return NextResponse.json(
        { error: 'Token inválido, ya utilizado, o despacho no encontrado.' },
        { status: 403 }
      )
    }

    // 2. Insertar el reporte de terreno
    const { error: insertError } = await supabase
      .from('reportes_terreno')
      .insert({
        despacho_id: despachoId,
        cantidad_entregada_real,
        nueva_poblacion_estimada: nueva_poblacion_estimada ?? null,
        semaforo_observado: semaforo_observado as NivelUrgencia,
        falta_agua: falta_agua ?? false,
        falta_comida: falta_comida ?? false,
        emergencia_medica: emergencia_medica ?? false,
        observacion_urgente: observacion_urgente ?? null,
      })

    if (insertError) {
      console.error('Error insertando reporte:', insertError)
      return NextResponse.json({ error: 'Error al guardar el reporte.' }, { status: 500 })
    }

    // 3. Cerrar el despacho e invalidar el token (token_reporte = NULL)
    await supabase
      .from('despachos')
      .update({
        estado: 'completado',
        token_reporte: null,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', despachoId)

    // 4. Recalcular déficit del nodo
    // Diferencia entre lo declarado y lo realmente entregado
    const diferencia = (despacho.cantidad_declarada ?? 0) - cantidad_entregada_real

    // Solo actualizar si hay diferencia significativa o hay nueva población
    const { data: nodo } = await supabase
      .from('nodos_geograficos')
      .select('deficit_diario_raciones, poblacion_estimada')
      .eq('id', despacho.nodo_id)
      .single()

    if (nodo) {
      const nuevoDeficit = Math.max(0, (nodo.deficit_diario_raciones ?? 0) + diferencia)
      const nuevaPoblacion = nueva_poblacion_estimada ?? nodo.poblacion_estimada

      await supabase
        .from('nodos_geograficos')
        .update({
          deficit_diario_raciones: nuevoDeficit,
          poblacion_estimada: nuevaPoblacion,
          semaforo_medico: semaforo_observado as NivelUrgencia,
          ultima_actualizacion: new Date().toISOString(),
        })
        .eq('id', despacho.nodo_id)
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err) {
    console.error('Error en /api/reporte:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
