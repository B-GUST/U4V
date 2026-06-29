import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Phone validation regex: international format, digits only, optional plus
const phoneRegex = /^\+?[1-9]\d{10,14}$/

const RegistroSchema = z.object({
  nombre_organizacion: z.string()
    .min(3, "El nombre de la organización es muy corto")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  nombre_contacto: z.string()
    .min(3, "El nombre del contacto es muy corto")
    .max(100, "El nombre del contacto no puede exceder 100 caracteres")
    .trim(),
  email: z.string().email("Correo electrónico inválido").trim().toLowerCase(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  whatsapp: z.string().regex(phoneRegex, {
    message: "El teléfono de WhatsApp debe tener formato internacional numérico (ej: +584121234567) sin espacios ni letras."
  }),
  sms: z.string().regex(phoneRegex, {
    message: "El teléfono SMS debe tener formato internacional numérico (ej: +584121234567) sin espacios ni letras."
  }),
  tipo_entidad: z.enum(['centro_acopio', 'ong', 'refugio', 'hospital', 'otro']),
  direccion_fisica: z.string().min(5, "La dirección física debe ser más descriptiva").trim(),
  capacidad_hospedaje: z.number().int().min(0).default(0),
  capacidad_salud_camas: z.number().int().min(0).default(0),
  capacidad_raciones_diarias: z.number().int().min(0).default(0),
  tipo_racion: z.enum(['comida_bebida', 'solo_comida', 'ninguno']).default('ninguno'),
})

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 1. Validar cuerpo con Zod (Previene inyección de datos maliciosos y tipos incorrectos)
    const result = RegistroSchema.safeParse(body)
    if (!result.success) {
      const errorMsg = result.error.issues.map(e => e.message).join('. ')
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    const { 
      nombre_organizacion, 
      nombre_contacto, 
      email, 
      password, 
      whatsapp, 
      sms,
      tipo_entidad,
      direccion_fisica,
      capacidad_hospedaje,
      capacidad_salud_camas,
      capacidad_raciones_diarias,
      tipo_racion
    } = result.data

    const supabase = createServiceClient()

    // 2. Verificar si el correo ya está registrado en perfiles
    const { data: perfilExistente } = await supabase
      .from('perfiles')
      .select('id')
      .eq('nombre_organizacion', nombre_organizacion)
      .maybeSingle()

    if (perfilExistente) {
      return NextResponse.json(
        { error: 'El nombre de esta organización ya está registrado.' },
        { status: 409 }
      )
    }

    // 3. Crear el usuario en Supabase Auth mediante admin API (auto-confirmando email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error('Error al crear usuario auth:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Error al registrar el usuario en el sistema de autenticación.' },
        { status: 500 }
      )
    }

    // 4. Crear el perfil correspondiente (Usa consultas parametrizadas de Supabase, evitando inyecciones SQL)
    const { error: profileError } = await supabase
      .from('perfiles')
      .insert({
        id: authData.user.id,
        nombre_organizacion,
        nombre_contacto,
        whatsapp,
        sms,
        rol: 'primera_linea',
        terminos_aceptados: false,
        tipo_entidad,
        direccion_fisica,
        capacidad_hospedaje,
        capacidad_salud_camas,
        capacidad_raciones_diarias,
        tipo_racion
      })

    if (profileError) {
      console.error('Error al insertar perfil:', profileError)
      // Limpieza preventiva si falla la creación del perfil
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: 'Error al registrar los datos de la organización.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })

  } catch (err) {
    console.error('Error en /api/registro:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
