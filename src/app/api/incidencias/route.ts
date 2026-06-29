import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const IncidenciaSchema = z.object({
  nodo_id: z.string().uuid("Zona inválida"),
  tipo_incidencia: z.enum(['transito_bloqueado', 'sobrecarga_recursos', 'sobrecarga_personas', 'otro']),
  descripcion: z.string().min(5, "El reporte debe ser detallado (mínimo 5 caracteres)").trim()
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('reportes_incidencias')
      .select(`
        *,
        perfil_autor:autor_id(nombre_organizacion, nombre_contacto),
        nodo:nodo_id(nombre_nodo)
      `)
      .order('creado_en', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error fetching incidencias:', err)
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
    const result = IncidenciaSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { error } = await supabase
      .from('reportes_incidencias')
      .insert({
        ...result.data,
        autor_id: user.id
      })

    if (error) throw error
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating incidencia:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
