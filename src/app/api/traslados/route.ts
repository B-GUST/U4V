import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit'

const TrasladoSchema = z.object({
  cantidad_personas: z.number().int().min(1, "Debe ser al menos 1 persona"),
  observaciones: z.string().optional().nullable()
})

const UpdateTrasladoSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['pendiente', 'asignado', 'completado']).optional(),
  refugio_id: z.string().uuid().optional().nullable(),
  cantidad_personas: z.number().int().min(1, "Debe ser al menos 1 persona").optional(),
  observaciones: z.string().optional().nullable()
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('traslados_pacientes')
      .select(`
        *,
        hospital_perfil:hospital_id(nombre_organizacion, nombre_contacto, whatsapp),
        refugio_perfil:refugio_id(nombre_organizacion, nombre_contacto, whatsapp)
      `)
      .order('creado_en', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error fetching traslados:', err)
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

    // Validar que el creador sea hospital, centro de acopio o admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('tipo_entidad, rol')
      .eq('id', user.id)
      .single()

    if (!perfil) {
      return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 })
    }

    if (perfil.rol !== 'admin' && !['hospital', 'centro_acopio'].includes(perfil.tipo_entidad)) {
      return NextResponse.json({ error: 'Solo hospitales y centros de acopio pueden emitir traslados.' }, { status: 403 })
    }

    const body = await request.json()
    const result = TrasladoSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { data: nuevoRegistro, error } = await supabase
      .from('traslados_pacientes')
      .insert({
        hospital_id: user.id,
        cantidad_personas: result.data.cantidad_personas,
        observaciones: result.data.observaciones || null,
        estado: 'pendiente'
      })
      .select('*, hospital_perfil:hospital_id(nombre_organizacion, nombre_contacto, whatsapp), refugio_perfil:refugio_id(nombre_organizacion, nombre_contacto, whatsapp)')
      .single()

    if (error) throw error
    await registrarAuditoria('crear_traslado', { cantidad_personas: result.data.cantidad_personas, observaciones: result.data.observaciones })
    return NextResponse.json(nuevoRegistro, { status: 201 })
  } catch (err: any) {
    console.error('Error creating traslado:', err)
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
    const result = UpdateTrasladoSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { id, estado, refugio_id, cantidad_personas, observaciones } = result.data

    // Obtener los datos del traslado antes de actualizar
    const { data: traslado, error: getError } = await supabase
      .from('traslados_pacientes')
      .select('*')
      .eq('id', id)
      .single()

    if (getError || !traslado) {
      return NextResponse.json({ error: 'No se encontró el traslado especificado.' }, { status: 404 })
    }

    // 1. Si se intenta modificar cantidad_personas o observaciones, validar que sea el hospital origen o admin
    if (cantidad_personas !== undefined || observaciones !== undefined) {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (traslado.hospital_id !== user.id && perfil?.rol !== 'admin') {
        return NextResponse.json({ error: 'No autorizado para modificar los datos de este traslado.' }, { status: 403 })
      }
    }

    // 2. Si el estado cambia a asignado, descontamos las vacantes en el refugio correspondiente
    if (estado === 'asignado' && refugio_id) {
      const { data: refugio } = await supabase
        .from('perfiles')
        .select('vacantes_disponibles, tipo_entidad')
        .eq('id', refugio_id)
        .single()

      if (refugio) {
        const cant = cantidad_personas !== undefined ? cantidad_personas : traslado.cantidad_personas
        const nuevasVacantes = Math.max(0, refugio.vacantes_disponibles - cant)
        
        await supabase
          .from('perfiles')
          .update({ vacantes_disponibles: nuevasVacantes })
          .eq('id', refugio_id)
      }
    }

    const updates: any = {
      actualizado_en: new Date().toISOString()
    }
    if (estado !== undefined) updates.estado = estado
    if (refugio_id !== undefined) updates.refugio_id = refugio_id
    if (cantidad_personas !== undefined) updates.cantidad_personas = cantidad_personas
    if (observaciones !== undefined) updates.observaciones = observaciones

    const { error } = await supabase
      .from('traslados_pacientes')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    await registrarAuditoria('editar_traslado', { id, estado, refugio_id, cantidad_personas, observaciones })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating traslado:', err)
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
      .from('traslados_pacientes')
      .delete()
      .eq('id', id)

    if (error) throw error

    await registrarAuditoria('eliminar_traslado', { id })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting traslado:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
