import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const TrasladoSchema = z.object({
  cantidad_personas: z.number().int().min(1, "Debe ser al menos 1 persona"),
  observaciones: z.string().optional().nullable()
})

const UpdateTrasladoSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['pendiente', 'asignado', 'completado']),
  refugio_id: z.string().uuid().optional().nullable()
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

    // Validar que el creador sea de tipo hospital o admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('tipo_entidad')
      .eq('id', user.id)
      .single()

    if (perfil?.tipo_entidad !== 'hospital' && perfil?.tipo_entidad !== 'otro') {
      return NextResponse.json({ error: 'Solo entidades médicas u hospitales pueden emitir traslados.' }, { status: 403 })
    }

    const body = await request.json()
    const result = TrasladoSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { error } = await supabase
      .from('traslados_pacientes')
      .insert({
        hospital_id: user.id,
        cantidad_personas: result.data.cantidad_personas,
        observaciones: result.data.observaciones || null,
        estado: 'pendiente'
      })

    if (error) throw error
    return NextResponse.json({ success: true }, { status: 201 })
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

    const { id, estado, refugio_id } = result.data

    // Obtener los datos del traslado antes de actualizar
    const { data: traslado, error: getError } = await supabase
      .from('traslados_pacientes')
      .select('*')
      .eq('id', id)
      .single()

    if (getError || !traslado) {
      return NextResponse.json({ error: 'No se encontró el traslado especificado.' }, { status: 404 })
    }

    // 1. Si el estado cambia a asignado, descontamos las vacantes en el refugio correspondiente
    if (estado === 'asignado' && refugio_id) {
      // Obtener el perfil del refugio para comprobar vacantes
      const { data: refugio } = await supabase
        .from('perfiles')
        .select('vacantes_disponibles, tipo_entidad')
        .eq('id', refugio_id)
        .single()

      if (refugio) {
        const nuevasVacantes = Math.max(0, refugio.vacantes_disponibles - traslado.cantidad_personas)
        
        // Actualizar vacantes del refugio
        await supabase
          .from('perfiles')
          .update({ vacantes_disponibles: nuevasVacantes })
          .eq('id', refugio_id)
      }
    }

    // 2. Si el estado anterior era asignado y cambia a completado o pendiente, o se cancela, se puede liberar o re-ajustar.
    // (Por simplicidad y robustez, al completarse el traslado se asume que las plazas ya se ocuparon de forma permanente)

    const { error } = await supabase
      .from('traslados_pacientes')
      .update({
        estado,
        refugio_id: refugio_id || null,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating traslado:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
