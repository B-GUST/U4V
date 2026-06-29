import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClientIp, isIpBlocked, recordFailedAttempt, resetAttempts } from '@/lib/security'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email("Correo inválido").trim().toLowerCase(),
  password: z.string().min(1, "La contraseña es requerida")
})

export async function POST(request: NextRequest) {
  const ip = await getClientIp()

  // 1. Ocultar endpoint si la IP está bloqueada
  if (isIpBlocked(ip)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const body = await request.json()
    const result = LoginSchema.safeParse(body)
    
    if (!result.success) {
      recordFailedAttempt(ip)
      return NextResponse.json({ error: 'Credenciales de acceso incorrectas.' }, { status: 401 })
    }

    const { email, password } = result.data
    const supabase = await createClient()

    // 2. Intentar autenticación
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      recordFailedAttempt(ip)
      return NextResponse.json({ error: 'Credenciales de acceso incorrectas.' }, { status: 401 })
    }

    // 3. Validar Rol Admin (Zero Trust)
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', authData.user.id)
      .single()

    if (perfilError || !perfil || perfil.rol !== 'admin') {
      // Cerrar sesión inmediatamente si el rol no es admin
      await supabase.auth.signOut()
      recordFailedAttempt(ip)
      return NextResponse.json({ error: 'Credenciales de acceso incorrectas.' }, { status: 401 })
    }

    // 4. Éxito: limpiar registro de bloqueos para esta IP
    resetAttempts(ip)
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err) {
    console.error('Error en login administrativo:', err)
    recordFailedAttempt(ip)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
