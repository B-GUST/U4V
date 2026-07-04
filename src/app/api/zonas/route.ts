import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit'

const ZonaSchema = z.object({
  nombre_nodo: z.string().min(3, "El nombre de la zona debe tener al menos 3 caracteres").max(100).trim(),
  descripcion: z.string().optional().nullable(),
  estado: z.string().min(2, "El estado es requerido").trim(),
  ciudad: z.string().min(2, "La ciudad es requerida").trim(),
  municipio: z.string().min(2, "El municipio es requerido").trim(),
  parroquia: z.string().min(2, "La parroquia es requerida").trim(),
  sector: z.string().min(2, "El sector es requerido").trim(),
  urbanizacion_residencia: z.string().min(2, "La urbanización o residencia es requerida").trim(),
  calle_casa: z.string().min(2, "La calle/av/casa/apto es requerida").trim(),
  punto_referencia: z.string().min(3, "El punto de referencia debe ser más claro").trim()
})

const EditZonaSchema = z.object({
  id: z.string().uuid(),
  nombre_nodo: z.string().min(3, "El nombre de la zona debe tener al menos 3 caracteres").max(100).trim().optional(),
  descripcion: z.string().optional().nullable(),
  estado: z.string().min(2).trim().optional(),
  ciudad: z.string().min(2).trim().optional(),
  municipio: z.string().min(2).trim().optional(),
  parroquia: z.string().min(2).trim().optional(),
  sector: z.string().min(2).trim().optional(),
  urbanizacion_residencia: z.string().min(2).trim().optional(),
  calle_casa: z.string().min(2).trim().optional(),
  punto_referencia: z.string().min(3).trim().optional()
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

    // Validar que el creador sea de primera línea o admin (coordinadores de zona)
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!perfil) {
      return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 })
    }

    if (perfil.rol !== 'admin' && perfil.rol !== 'primera_linea') {
      return NextResponse.json({ error: 'Solo coordinadores de primera línea pueden registrar nuevas zonas.' }, { status: 403 })
    }

    const body = await request.json()
    const result = ZonaSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { nombre_nodo, descripcion, estado, ciudad, municipio, parroquia, sector, urbanizacion_residencia, calle_casa, punto_referencia } = result.data
    const direccion = `${calle_casa}, ${urbanizacion_residencia}, Sector ${sector}, Parroquia ${parroquia}, Municipio ${municipio}, ${ciudad}, Estado ${estado}`

    // Verificar si ya existe una zona con ese nombre
    const { data: existe } = await supabase
      .from('nodos_geograficos')
      .select('id')
      .eq('nombre_nodo', nombre_nodo)
      .maybeSingle()

    if (existe) {
      return NextResponse.json({ error: 'Esa zona o ubicación ya está registrada en la red.' }, { status: 409 })
    }

    const { data: nuevoRegistro, error } = await supabase
      .from('nodos_geograficos')
      .insert({
        nombre_nodo,
        descripcion,
        direccion,
        punto_referencia,
        estado,
        ciudad,
        municipio,
        parroquia,
        sector,
        urbanizacion_residencia,
        calle_casa,
        poblacion_estimada: 0,
        deficit_diario_raciones: 0,
        deficit_diario_agua_litros: 0,
        semaforo_medico: 'verde',
        activo: true,
        creador_id: user.id,
        ultima_actualizacion: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) throw error
    await registrarAuditoria('crear_zona', { nombre_nodo, direccion, punto_referencia })
    return NextResponse.json(nuevoRegistro, { status: 201 })
  } catch (err: any) {
    console.error('Error creating zona:', err)
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
    const result = EditZonaSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { id, ...camposAActualizar } = result.data

    // Cualquier usuario autenticado puede sugerir ediciones (Sugerir edición)
    // El control de spam básico se maneja mediante auditoría
    const { error } = await supabase
      .from('nodos_geograficos')
      .update({
        ...camposAActualizar,
        ultima_actualizacion: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
    await registrarAuditoria('editar_zona', { id, usuario: user.id, ...camposAActualizar })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating zona:', err)
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
      .from('nodos_geograficos')
      .delete()
      .eq('id', id)

    if (error) throw error

    await registrarAuditoria('eliminar_zona', { id })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting zona:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
