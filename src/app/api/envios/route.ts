import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const EnvioSchema = z.object({
  destino_perfil_id: z.string().uuid().optional().nullable(),
  destino_nodo_id: z.string().uuid().optional().nullable(),
  tipo_insumo: z.string().min(1, "El tipo de insumo es requerido").trim(),
  cantidad: z.number().int().min(1, "La cantidad debe ser mayor a 0"),
  whatsapp_chofer: z.string().optional().nullable()
})

const UpdateEnvioStatusSchema = z.object({
  id: z.string().uuid(),
  estado_envio: z.enum(['preparacion', 'camino', 'entregado', 'desviado'])
})

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Traer todos los despachos intermedios con las relaciones correspondientes
    // perfil_origen, perfil_destino y nodo_destino
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
        fecha_salida: new Date().toISOString()
      })

    if (error) throw error
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
    const result = UpdateEnvioStatusSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { id, estado_envio } = result.data

    // Verificar permisos: ser origen, destino, o administrador
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'admin') {
      const { data: envio } = await supabase
        .from('despachos_intermedios')
        .select('origen_id, destino_perfil_id')
        .eq('id', id)
        .single()

      if (envio?.origen_id !== user.id && envio?.destino_perfil_id !== user.id) {
        return NextResponse.json({ error: 'No autorizado para modificar este despacho' }, { status: 403 })
      }
    }

    const updatePayload: any = { estado_envio }
    if (estado_envio === 'entregado') {
      updatePayload.fecha_entrega = new Date().toISOString()
    }

    const { error } = await supabase
      .from('despachos_intermedios')
      .update(updatePayload)
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating envio:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
