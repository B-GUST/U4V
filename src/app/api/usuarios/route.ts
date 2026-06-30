import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createDirectClient } from '@supabase/supabase-js'
import { registrarAuditoria } from '@/lib/audit'
import { z } from 'zod'

const EditUserSchema = z.object({
  id: z.string().uuid(),
  rol: z.enum(['admin', 'primera_linea', 'retaguardia']).optional(),
  nombre_organizacion: z.string().min(2).optional(),
  tipo_entidad: z.string().optional()
})

// GET: Listar todos los perfiles de usuario (Solo Admins)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar rol de admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 403 })
    }

    const { data: usuarios, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('creado_en', { ascending: false })

    if (error) throw error
    return NextResponse.json(usuarios)
  } catch (err: any) {
    console.error('Error fetching users:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH: Actualizar rol u organización (Solo Admins)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar rol de admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 403 })
    }

    const body = await request.json()
    const result = EditUserSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues.map(e => e.message).join('. ') }, { status: 400 })
    }

    const { id, ...campos } = result.data

    const { error } = await supabase
      .from('perfiles')
      .update(campos)
      .eq('id', id)

    if (error) throw error

    await registrarAuditoria('admin_editar_usuario', { target_id: id, ...campos })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating user:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE: Eliminar perfil y cuenta Auth (Solo Admins)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar rol de admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('id')

    if (!targetUserId) {
      return NextResponse.json({ error: 'Falta el ID del usuario a eliminar.' }, { status: 400 })
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta de administrador.' }, { status: 400 })
    }

    // Cliente directo con Service Role para eliminar de Auth
    const serviceClient = createDirectClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Eliminar de auth.users (borrado en cascada configurado en perfiles)
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(targetUserId)

    if (deleteError) throw deleteError

    await registrarAuditoria('admin_eliminar_usuario', { target_id: targetUserId })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting user:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
