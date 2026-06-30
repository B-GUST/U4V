import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const AvisoSchema = z.object({
  titulo: z.string().min(3, "El título del aviso debe tener al menos 3 caracteres").max(150).trim(),
  contenido: z.string().min(5, "El contenido del aviso debe ser más descriptivo").trim(),
  categoria: z.string().default('general')
})

const UpdateAvisoSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().min(3, "El título del aviso debe tener al menos 3 caracteres").max(150).trim(),
  contenido: z.string().min(5, "El contenido del aviso debe ser más descriptivo").trim(),
  categoria: z.string().default('general')
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('boletin_avisos')
      .select(`
        *,
        perfil_autor:autor_id(nombre_organizacion, nombre_contacto)
      `)
      .order('creado_en', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error fetching boletin:', err)
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
    const result = AvisoSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { error } = await supabase
      .from('boletin_avisos')
      .insert({
        ...result.data,
        autor_id: user.id
      })

    if (error) throw error
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating aviso:', err)
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
    const result = UpdateAvisoSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { id, titulo, contenido, categoria } = result.data

    // Verificar propiedad o rol admin
    const { data: existente } = await supabase
      .from('boletin_avisos')
      .select('autor_id')
      .eq('id', id)
      .single()

    if (!existente) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 })
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    const esAdmin = perfil?.rol === 'admin'
    if (existente.autor_id !== user.id && !esAdmin) {
      return NextResponse.json({ error: 'Prohibido. No eres el creador de este aviso.' }, { status: 403 })
    }

    const { error } = await supabase
      .from('boletin_avisos')
      .update({ titulo, contenido, categoria })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating aviso:', err)
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Verificar propiedad o rol admin
    const { data: existente } = await supabase
      .from('boletin_avisos')
      .select('autor_id')
      .eq('id', id)
      .single()

    if (!existente) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 })
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    const esAdmin = perfil?.rol === 'admin'
    if (existente.autor_id !== user.id && !esAdmin) {
      return NextResponse.json({ error: 'Prohibido. No puedes eliminar este aviso.' }, { status: 403 })
    }

    const { error } = await supabase
      .from('boletin_avisos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting aviso:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
