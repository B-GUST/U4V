import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as fs from 'fs'

// Cargador manual de variables de entorno
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
  console.error('Error: Faltan variables de entorno para Supabase.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function run() {
  console.log('=== U4V Cron Job: Gestión de Manifiestos y DSI ===\n')

  const limite24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const limite23Horas = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()

  // -------------------------------------------------------------
  // 1. Cierre Automático de Manifiestos Colgados (>24h)
  // -------------------------------------------------------------
  console.log('⏳ Buscando envíos en camino/tránsito estancados por más de 24 horas...')
  
  // A. Despachos Intermedios (Punto a Punto)
  const { data: enviosCerrados, error: errEnvios } = await supabase
    .from('despachos_intermedios')
    .update({ estado_envio: 'desviado' })
    .eq('estado_envio', 'camino')
    .lt('fecha_salida', limite24Horas)
    .select('id, tipo_insumo, cantidad')

  if (errEnvios) {
    console.error('Error cerrando despachos intermedios:', errEnvios.message)
  } else if (enviosCerrados && enviosCerrados.length > 0) {
    console.log(`🧹 Auto-archivados ${enviosCerrados.length} despachos intermedios colgados.`)
    enviosCerrados.forEach(e => console.log(`   - Envio ID: ${e.id} (${e.cantidad} de ${e.tipo_insumo})`))
  } else {
    console.log('✅ No se encontraron despachos intermedios estancados.')
  }

  // B. Despachos (Libro Mayor)
  const { data: despachosCerrados, error: errDespachos } = await supabase
    .from('despachos')
    .update({ estado: 'cancelado' })
    .eq('estado', 'transito')
    .lt('creado_en', limite24Horas)
    .select('id, tipo_insumo, cantidad_declarada')

  if (errDespachos) {
    console.error('Error cerrando despachos del libro mayor:', errDespachos.message)
  } else if (despachosCerrados && despachosCerrados.length > 0) {
    console.log(`🧹 Auto-cancelados ${despachosCerrados.length} despachos del libro mayor.`)
    despachosCerrados.forEach(d => console.log(`   - Despacho ID: ${d.id} (${d.cantidad_declarada} de ${d.tipo_insumo})`))
  } else {
    console.log('✅ No se encontraron despachos del libro mayor estancados.')
  }

  // -------------------------------------------------------------
  // 2. Alertas de Actualización de Reporte Terreno (DSI / 24h)
  // -------------------------------------------------------------
  console.log('\n📡 Evaluando Índice de Antigüedad del Dato (DSI) en Nodos...')
  
  // Buscar nodos geográficos cuyo último reporte de terreno esté cerca de las 24 horas (creado_en o ultimo_reporte_timestamp)
  const { data: nodosViejos, error: errNodos } = await supabase
    .from('nodos_geograficos')
    .select(`
      id,
      nombre_nodo,
      ultimo_reporte_timestamp,
      creador_id
    `)
    .lt('ultimo_reporte_timestamp', limite23Horas)
    .eq('activo', true)

  if (errNodos) {
    console.error('Error consultando nodos:', errNodos.message)
  } else if (nodosViejos && nodosViejos.length > 0) {
    console.log(`⚠️ Se detectaron ${nodosViejos.length} zonas críticas con reportes obsoletos (cerca de 24h sin actualización):`)
    
    for (const nodo of nodosViejos) {
      if (!nodo.creador_id) continue

      // Buscar perfil del sensor de campo (creador del nodo)
      const { data: creador } = await supabase
        .from('perfiles')
        .select('nombre_contacto, telefono_contacto, nombre_organizacion')
        .eq('id', nodo.creador_id)
        .single()

      if (creador && creador.telefono_contacto) {
        const telefono = creador.telefono_contacto.replace(/\D/g, '')
        const msg = `Alerta U4V: El reporte de terreno para la zona "${nodo.nombre_nodo}" tiene más de 23h de antigüedad y está por vencerse. Por favor actualice el estado de víctimas, agua y salud a la brevedad: ${host}/dashboard`
        const waUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`
        
        console.log(`   - Alerta para: ${creador.nombre_contacto} (${creador.nombre_organizacion})`)
        console.log(`     Zona: ${nodo.nombre_nodo}`)
        console.log(`     WhatsApp: +${telefono}`)
        console.log(`     URL: ${waUrl}\n`)
      }
    }
  } else {
    console.log('✅ Todos los nodos geográficos están actualizados (DSI óptimo).')
  }

  // -------------------------------------------------------------
  // 3. Notificación de Despachos Activos (Reminders Originales)
  // -------------------------------------------------------------
  console.log('\n📋 Generando recordatorios de confirmación para choferes...')
  const { data: despachosActivos, error: errActivos } = await supabase
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
        telefono_contacto
      )
    `)
    .eq('estado', 'transito')

  if (errActivos) {
    console.error('Error al obtener despachos activos:', errActivos.message)
  } else if (despachosActivos && despachosActivos.length > 0) {
    despachosActivos.forEach((d: any, index: number) => {
      const org = d.perfiles?.nombre_organizacion || 'Organización'
      const contacto = d.perfiles?.nombre_contacto || 'Coordinador'
      const tel = (d.perfiles?.telefono_contacto || '').replace(/\D/g, '')
      const nodo = d.nodos_geograficos?.nombre_nodo || 'Zona Cero'
      const link = `${host}/reporte/${d.token_reporte}`

      const mensaje = `Hola ${contacto} de ${org}. Su despacho de ${d.tipo_insumo} a ${nodo} programado ha cerrado. Reporte la entrega real aquí: ${link}`
      const waUrl = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`

      console.log(`   [Recordatorio ${index + 1}] Destinatario: ${contacto} (WhatsApp: +${tel})`)
      console.log(`     Enlace: ${waUrl}`)
    })
  } else {
    console.log('✅ No hay despachos activos pendientes de reporte inicial.')
  }
}

run().catch(err => {
  console.error('Error fatal al ejecutar el cron de U4V:', err)
})
