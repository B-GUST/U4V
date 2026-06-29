import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ZonaSchema = z.object({
  nombre_nodo: z.string().min(3, "El nombre de la zona debe tener al menos 3 caracteres").max(100).trim(),
  descripcion: z.string().optional().nullable(),
  direccion: z.string().min(5, "La dirección debe ser descriptiva").trim(),
  punto_referencia: z.string().min(3, "El punto de referencia debe ser más claro").trim()
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('nodos_geograficos')
      .select('*')
      .eq('activo', true)
      .order('nombre_nodo', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error fetching zonas:', err)
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
    const result = ZonaSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { nombre_nodo, descripcion, direccion, punto_referencia } = result.data

    // Verificar si ya existe una zona con ese nombre
    const { data: existe } = await supabase
      .from('nodos_geograficos')
      .select('id')
      .eq('nombre_nodo', nombre_nodo)
      .maybeSingle()

    if (existe) {
      return NextResponse.json({ error: 'Esa zona o ubicación ya está registrada en la red.' }, { status: 409 })
    }

    const { error } = await supabase
      .from('nodos_geograficos')
      .insert({
        nombre_nodo,
        descripcion,
        direccion,
        punto_referencia,
        poblacion_estimada: 0,
        deficit_diario_raciones: 0,
        deficit_diario_agua_litros: 0,
        semaforo_medico: 'verde',
        activo: true,
        creador_id: user.id,
        ultima_actualizacion: new Date().toISOString()
      })

    if (error) throw error
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating zona:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
