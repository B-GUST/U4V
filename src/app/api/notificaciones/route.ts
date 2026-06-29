import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper to create the Supabase client for session checks
async function createSupabaseClient(cookieStore: any) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createSupabaseClient(cookieStore)

    // 1. Zero Trust: Verificar autenticación del usuario mediante getUser()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 })
    }

    // 2. Mínimo Privilegio: Verificar que el usuario tenga el rol de 'admin'
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfilError || !perfil || perfil.rol !== 'admin') {
      return NextResponse.json({ error: 'Prohibido. Solo administradores pueden ver notificaciones.' }, { status: 403 })
    }

    // 3. Buscar despachos activos (en tránsito) y hacer join con perfiles y nodos
    const { data: despachos, error: despachosError } = await supabase
      .from('despachos')
      .select(`
        id,
        tipo_insumo,
        cantidad_declarada,
        franja,
        token_reporte,
        nodos_geograficos (
          nombre_nodo
        ),
        perfiles (
          nombre_organizacion,
          nombre_contacto,
          whatsapp,
          sms
        )
      `)
      .eq('estado', 'transito')

    if (despachosError) {
      console.error('Error al consultar despachos:', despachosError)
      return NextResponse.json({ error: 'Error al consultar despachos.' }, { status: 500 })
    }

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.nextUrl.protocol

    // 4. Construir las plantillas de notificación e invalidación local
    const recordatorios = despachos.map((d: any) => {
      const nodoNombre = d.nodos_geograficos?.nombre_nodo || 'Nodo Desconocido'
      const orgNombre = d.perfiles?.nombre_organizacion || 'Organización'
      const contacto = d.perfiles?.nombre_contacto || 'Coordinador'
      
      // Limpiar números telefónicos (solo dígitos)
      const whatsappRaw = (d.perfiles?.whatsapp || '').replace(/\D/g, '')
      const smsRaw = (d.perfiles?.sms || '').replace(/\D/g, '')
      
      const token = d.token_reporte
      const linkReporte = `${protocol}//${host}/reporte/${token}`
      
      // Texto del mensaje
      const mensaje = `Hola ${contacto} de ${orgNombre}. Su despacho de ${d.tipo_insumo} en ${nodoNombre} de la franja ${d.franja} ha cerrado. Por favor reporte las entregas reales en: ${linkReporte} (El enlace expira en 12h).`
      
      // URL de WhatsApp wa.me
      const whatsappUrl = `https://wa.me/${whatsappRaw}?text=${encodeURIComponent(mensaje)}`

      return {
        despacho_id: d.id,
        organizacion: orgNombre,
        contacto,
        whatsapp: d.perfiles?.whatsapp || '',
        sms: d.perfiles?.sms || '',
        whatsapp_url: whatsappUrl,
        sms_template: mensaje,
        enlace_reporte: linkReporte
      }
    })

    return NextResponse.json({ recordatorios }, { status: 200 })

  } catch (err) {
    console.error('Error en API /api/notificaciones:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
