import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit'
import { generarTokenOffline } from '@/lib/totp'

const EnvioSchema = z.object({
  destino_perfil_id: z.string().uuid().optional().nullable(),
  destino_nodo_id: z.string().uuid().optional().nullable(),
  tipo_insumo: z.string().min(1, "El tipo de insumo es requerido").trim(),
  cantidad: z.number().int().min(1, "La cantidad debe ser mayor a 0"),
  whatsapp_chofer: z.string().optional().nullable(),
  capacidad_carga_disponible: z.string().optional().nullable(),
  capacidad_voluntarios_disponible: z.number().int().min(0).default(0),
  punto_encuentro: z.string().optional().nullable(),
  hora_salida: z.string().optional().nullable()
})

const EditEnvioSchema = z.object({
  id: z.string().uuid(),
  destino_perfil_id: z.string().uuid().optional().nullable(),
  destino_nodo_id: z.string().uuid().optional().nullable(),
  tipo_insumo: z.string().min(1, "El tipo de insumo es requerido").trim().optional(),
  cantidad: z.number().int().min(1, "La cantidad debe ser mayor a 0").optional(),
  whatsapp_chofer: z.string().optional().nullable(),
  capacidad_carga_disponible: z.string().optional().nullable(),
  capacidad_voluntarios_disponible: z.number().int().min(0).optional(),
  punto_encuentro: z.string().optional().nullable(),
  hora_salida: z.string().optional().nullable(),
  estado_envio: z.enum(['preparacion', 'camino', 'entregado', 'desviado']).optional(),
  token_entrega: z.string().optional()
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('despachos_intermedios')
      .select(`
        *,
        perfil_origen:origen_id(nombre_organizacion, nombre_contacto, whatsapp),
        perfil_destino:destino_perfil_id(nombre_organizacion, nombre_contacto, whatsapp, direccion_fisica),
        nodo_destino:destino_nodo_id(nombre_nodo)
      `)
      .order('fecha_salida', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error fetching envios:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const result = EnvioSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const data = result.data

    if (!data.destino_perfil_id && !data.destino_nodo_id) {
      return NextResponse.json({ error: 'Debes especificar un destino (un centro registrado o una zona geográfica)' }, { status: 400 })
    }

    const { error } = await supabase
      .from('despachos_intermedios')
      .insert({
        origen_id: user.id,
        destino_perfil_id: data.destino_perfil_id || null,
        destino_nodo_id: data.destino_nodo_id || null,
        tipo_insumo: data.tipo_insumo,
        cantidad: data.cantidad,
        estado_envio: 'preparacion',
        whatsapp_chofer: data.whatsapp_chofer || null,
        capacidad_carga_disponible: data.capacidad_carga_disponible || null,
        capacidad_voluntarios_disponible: data.capacidad_voluntarios_disponible,
        punto_encuentro: data.punto_encuentro || null,
        hora_salida: data.hora_salida || null,
        fecha_salida: new Date().toISOString()
      })

    if (error) throw error
    await registrarAuditoria('crear_despacho', result.data)
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating envio:', err)
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
    const result = EditEnvioSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { id, ...camposAActualizar } = result.data

    // Verificar permisos: ser origen, destino, o administrador
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    const { data: envio } = await supabase
      .from('despachos_intermedios')
      .select('origen_id, destino_perfil_id, destino_nodo_id')
      .eq('id', id)
      .single()

    if (perfil?.rol !== 'admin') {
      if (envio?.origen_id !== user.id && envio?.destino_perfil_id !== user.id) {
        return NextResponse.json({ error: 'No autorizado para modificar este despacho' }, { status: 403 })
      }
    }

    // Validar token de entrega ("Salto y Seña") si se marca como entregado
    if (camposAActualizar.estado_envio === 'entregado') {
      const seed = envio?.destino_perfil_id || envio?.destino_nodo_id
      if (seed && perfil?.rol !== 'admin') {
        const token1 = generarTokenOffline(seed, 0)
        const token2 = generarTokenOffline(seed, -1)
        const tokenIngresado = (camposAActualizar.token_entrega || '').trim().toUpperCase()

        if (tokenIngresado !== token1 && tokenIngresado !== token2) {
          return NextResponse.json({ 
            error: 'El Salto y Seña de entrega (token offline) no es válido o ya expiró. Solicita el token activo de 6 dígitos al receptor.' 
          }, { status: 400 })
        }
      }
    }

    const updatePayload: any = { ...camposAActualizar }
    delete updatePayload.token_entrega

    if (camposAActualizar.estado_envio === 'entregado') {
      updatePayload.fecha_entrega = new Date().toISOString()
    }

    const { error } = await supabase
      .from('despachos_intermedios')
      .update(updatePayload)
      .eq('id', id)

    if (error) throw error
    await registrarAuditoria('editar_despacho', { id, ...camposAActualizar })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating envio:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden eliminar registros.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del registro a eliminar.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('despachos_intermedios')
      .delete()
      .eq('id', id)

    if (error) throw error

    await registrarAuditoria('eliminar_despacho', { id })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting envio:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
