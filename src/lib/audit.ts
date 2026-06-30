import { createClient } from '@/lib/supabase/server'

export async function registrarAuditoria(
  accion: string,
  detalles: any = {}
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Obtener rol del usuario
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    const rol = perfil?.rol || 'coordinador'
    
    // Capturar la IP de origen a partir de los headers de Next.js
    let ip = 'unknown'
    try {
      const { headers } = await import('next/headers')
      const heads = await headers()
      ip = heads.get('x-forwarded-for') || heads.get('x-real-ip') || '127.0.0.1'
    } catch {
      // Ignorar si se ejecuta fuera de contexto HTTP
    }

    await supabase
      .from('registro_auditoria')
      .insert({
        usuario_id: user.id,
        rol_usuario: rol,
        accion,
        ip_origen: ip,
        detalles
      })
  } catch (err) {
    console.error('Error logging audit:', err)
  }
}
