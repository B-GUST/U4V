import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as fs from 'fs'

// Cargador manual de variables de entorno sin dependencias externas
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  for (const file of ['.env.local', '.env']) {
    const envPath = path.resolve(process.cwd(), file)
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        if (match) {
          const key = match[1]
          let value = match[2] || ''
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1)
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1)
          }
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      })
      break
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function run() {
  console.log('=== U4V Reminders Generator ===')
  console.log('Consultando despachos activos (en tránsito) en la base de datos...')

  const { data: despachos, error } = await supabase
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

  if (error) {
    console.error('Error al realizar la consulta:', error.message)
    process.exit(1)
  }

  if (!despachos || despachos.length === 0) {
    console.log('✅ No hay despachos pendientes de reporte en tránsito.')
    return
  }

  console.log(`\nSe encontraron ${despachos.length} despachos activos. Generando notificaciones...\n`)

  despachos.forEach((d: any, index: number) => {
    const org = d.perfiles?.nombre_organizacion || 'Organización Desconocida'
    const contacto = d.perfiles?.nombre_contacto || 'Coordinador'
    const whatsapp = (d.perfiles?.whatsapp || '').replace(/\D/g, '')
    const sms = (d.perfiles?.sms || '').replace(/\D/g, '')
    const nodo = d.nodos_geograficos?.nombre_nodo || 'Nodo Desconocido'
    const link = `${host}/reporte/${d.token_reporte}`

    const mensaje = `Hola ${contacto} de ${org}. Su despacho de ${d.tipo_insumo} en ${nodo} de la franja ${d.franja} ha cerrado. Por favor reporte las entregas reales en: ${link} (El enlace expira en 12h).`
    const waUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`

    console.log(`--------------------------------------------------`)
    console.log(`[${index + 1}] Organización: ${org}`)
    console.log(`    Contacto: ${contacto}`)
    console.log(`    WhatsApp: +${whatsapp}`)
    console.log(`    SMS: +${sms}`)
    console.log(`\n💬 ENLACE WHATSAPP (Abre en tu navegador para enviar sin API):`)
    console.log(`   ${waUrl}`)
    console.log(`\n📱 PLANTILLA SMS:`)
    console.log(`   ${mensaje}`)
    console.log(`--------------------------------------------------\n`)
  })
}

run().catch(err => {
  console.error('Error fatal al ejecutar el generador:', err)
})
