import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PostulacionSchema = z.object({
  solicitud_id: z.string().uuid("Solicitud inválida"),
  cantidad_ofrecida: z.number().int().min(1, "Debe ofrecer al menos 1 insumo")
})

const UpdatePostulacionSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['pendiente', 'atendida', 'cancelada'])
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const result = PostulacionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { solicitud_id, cantidad_ofrecida } = result.data

    // 1. Obtener los detalles de la solicitud de auxilio
    const { data: solicitud, error: solError } = await supabase
      .from('solicitudes_recursos')
      .select('*')
      .eq('id', solicitud_id)
      .single()

    if (solError || !solicitud) {
      return NextResponse.json({ error: 'No se encontró la solicitud de ayuda.' }, { status: 404 })
    }

    const maxPermitido = solicitud.cantidad_solicitada - solicitud.cantidad_atendida
    if (cantidad_ofrecida > maxPermitido) {
      return NextResponse.json({ error: `La cantidad ofrecida excede la necesidad restante (${maxPermitido}).` }, { status: 400 })
    }

    // 2. Crear la postulación
    const { data: nuevaPostulacion, error: postError } = await supabase
      .from('postulaciones_solicitudes')
      .insert({
        solicitud_id,
        voluntario_id: user.id,
        cantidad_ofrecida,
        estado: 'pendiente'
      })
      .select()
      .single()

    if (postError) throw postError

    // 3. Actualizar la cantidad acumulada en la solicitud
    const nuevaCantidadAtendida = solicitud.cantidad_atendida + cantidad_ofrecida
    await supabase
      .from('solicitudes_recursos')
      .update({ cantidad_atendida: nuevaCantidadAtendida })
      .eq('id', solicitud_id)

    // 4. Automatizar creación de flete/despacho en tránsito en preparación hacia el solicitante
    await supabase
      .from('despachos_intermedios')
      .insert({
        origen_id: user.id,
        destino_perfil_id: solicitud.solicitante_id,
        tipo_insumo: solicitud.tipo_insumo,
        cantidad: cantidad_ofrecida,
        estado_envio: 'preparacion',
        fecha_salida: new Date().toISOString()
      })

    return NextResponse.json({ success: true, data: nuevaPostulacion }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating postulacion:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const result = UpdatePostulacionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { id, estado } = result.data

    // Obtener la postulación y su solicitud asociada
    const { data: postulacion, error: getError } = await supabase
      .from('postulaciones_solicitudes')
      .select('*, solicitudes_recursos(*)')
      .eq('id', id)
      .single()

    if (getError || !postulacion) {
      return NextResponse.json({ error: 'No se encontró la postulación.' }, { status: 404 })
    }

    // Validar que quien confirma el recibo ('atendida') sea el creador de la solicitud original
    const solicitudOriginal = postulacion.solicitudes_recursos as any
    if (estado === 'atendida' && solicitudOriginal.solicitante_id !== user.id) {
      return NextResponse.json({ error: 'Solo la organización receptora que creó la solicitud puede confirmar la entrega.' }, { status: 403 })
    }

    // 1. Actualizar la postulación
    const { error: patchError } = await supabase
      .from('postulaciones_solicitudes')
      .update({ estado })
      .eq('id', id)

    if (patchError) throw patchError

    // 2. Si se confirmó el recibo, marcar los despachos en camino correspondientes a este origen/destino como entregados
    if (estado === 'atendida') {
      await supabase
        .from('despachos_intermedios')
        .update({
          estado_envio: 'entregado',
          fecha_entrega: new Date().toISOString()
        })
        .eq('origen_id', postulacion.voluntario_id)
        .eq('destino_perfil_id', solicitudOriginal.solicitante_id)
        .eq('tipo_insumo', solicitudOriginal.tipo_insumo)
        .eq('estado_envio', 'camino') // solo los que estaban de camino
    }

    // 3. Comprobar si la solicitud ya está totalmente cubierta y todas las postulaciones están atendidas
    const { data: todasPostulaciones } = await supabase
      .from('postulaciones_solicitudes')
      .select('estado, cantidad_ofrecida')
      .eq('solicitud_id', solicitudOriginal.id)

    if (todasPostulaciones) {
      const todasEntregadas = todasPostulaciones.every(p => p.estado === 'atendida')
      const totalOfrecido = todasPostulaciones.reduce((sum, p) => sum + p.cantidad_ofrecida, 0)

      if (todasEntregadas && totalOfrecido >= solicitudOriginal.cantidad_solicitada) {
        // La solicitud de auxilio se marca como atendida y desaparecerá de la sábana general
        await supabase
          .from('solicitudes_recursos')
          .update({ estado: 'atendida', actualizado_en: new Date().toISOString() })
          .eq('id', solicitudOriginal.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating postulacion:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
