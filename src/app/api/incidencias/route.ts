import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit'

const IncidenciaSchema = z.object({
  nodo_id: z.string().uuid("Zona inválida"),
  tipo_incidencia: z.enum(['transito_bloqueado', 'sobrecarga_recursos', 'sobrecarga_personas', 'otro']),
  descripcion: z.string().min(5, "El reporte debe ser detallado (mínimo 5 caracteres)").trim()
})

const EditIncidenciaSchema = z.object({
  id: z.string().uuid(),
  tipo_incidencia: z.enum(['transito_bloqueado', 'sobrecarga_recursos', 'sobrecarga_personas', 'otro']).optional(),
  descripcion: z.string().min(5, "El reporte debe ser detallado (mínimo 5 caracteres)").trim().optional()
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
    await registrarAuditoria('crear_incidencia', result.data)
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating incidencia:', err)
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
    const result = EditIncidenciaSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { id, ...camposAActualizar } = result.data

    // Verificar propiedad o rol admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'admin') {
      const { data: incidencia } = await supabase
        .from('reportes_incidencias')
        .select('autor_id')
        .eq('id', id)
        .single()

      if (incidencia?.autor_id !== user.id) {
        return NextResponse.json({ error: 'No autorizado para modificar este reporte.' }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from('reportes_incidencias')
      .update(camposAActualizar)
      .eq('id', id)

    if (error) throw error
    await registrarAuditoria('editar_incidencia', { id, ...camposAActualizar })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating incidencia:', err)
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
      .from('reportes_incidencias')
      .delete()
      .eq('id', id)

    if (error) throw error

    await registrarAuditoria('eliminar_incidencia', { id })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting incidencia:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
