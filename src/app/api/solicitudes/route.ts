import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit'

const SolicitudSchema = z.object({
  tipo_insumo: z.string().min(1, "El tipo de insumo es requerido").trim(),
  cantidad_solicitada: z.number().int().min(1, "La cantidad debe ser mayor a 0"),
  tipo_solicitud: z.enum(['entrega', 'recogida']),
  categoria: z.enum(['comida', 'agua', 'ropa', 'medicamentos', 'voluntarios']).default('comida'),
  descripcion: z.string().optional().nullable()
})

const EditSolicitudSchema = z.object({
  id: z.string().uuid(),
  tipo_insumo: z.string().min(1, "El tipo de insumo es requerido").trim().optional(),
  cantidad_solicitada: z.number().int().min(1, "La cantidad debe ser mayor a 0").optional(),
  tipo_solicitud: z.enum(['entrega', 'recogida']).optional(),
  categoria: z.enum(['comida', 'agua', 'ropa', 'medicamentos', 'voluntarios']).optional(),
  descripcion: z.string().optional().nullable(),
  estado: z.enum(['pendiente', 'atendida', 'cancelada']).optional()
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('solicitudes_recursos')
      .select(`
        *,
        perfiles(nombre_organizacion, nombre_contacto, whatsapp, instagram, direccion_fisica, tipo_entidad),
        postulaciones:postulaciones_solicitudes(*, voluntario_perfil:perfiles(nombre_organizacion, whatsapp))
      `)
      .order('creado_en', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error fetching solicitudes:', err)
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
    const result = SolicitudSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { data: nuevoRegistro, error } = await supabase
      .from('solicitudes_recursos')
      .insert({
        solicitante_id: user.id,
        ...result.data,
        estado: 'pendiente'
      })
      .select('*, perfiles(nombre_organizacion, nombre_contacto, whatsapp, instagram, direccion_fisica, tipo_entidad), postulaciones:postulaciones_solicitudes(*)')
      .single()

    if (error) throw error
    await registrarAuditoria('crear_solicitud', result.data)
    return NextResponse.json(nuevoRegistro, { status: 201 })
  } catch (err: any) {
    console.error('Error creating solicitud:', err)
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
    const result = EditSolicitudSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { id, ...camposAActualizar } = result.data

    // Verificar permisos: ser dueño de la solicitud o administrador
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'admin') {
      const { data: solicitud } = await supabase
        .from('solicitudes_recursos')
        .select('solicitante_id')
        .eq('id', id)
        .single()

      if (solicitud?.solicitante_id !== user.id) {
        return NextResponse.json({ error: 'No autorizado para modificar esta solicitud' }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from('solicitudes_recursos')
      .update({
        ...camposAActualizar,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
    await registrarAuditoria('editar_solicitud', { id, ...camposAActualizar })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating solicitud:', err)
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
      .from('solicitudes_recursos')
      .delete()
      .eq('id', id)

    if (error) throw error

    await registrarAuditoria('eliminar_solicitud', { id })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting solicitud:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
