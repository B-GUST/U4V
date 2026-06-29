import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verificar sesión
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  // Obtener perfil del coordinador
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  // Obtener nodos geográficos
  const { data: nodos } = await supabase
    .from('nodos_geograficos')
    .select('*')
    .eq('activo', true)
    .order('semaforo_medico', { ascending: false })

  // Obtener despachos de hoy
  const today = new Date().toISOString().split('T')[0]
  const { data: despachosHoy } = await supabase
    .from('despachos')
    .select('*, perfiles(nombre_organizacion)')
    .eq('fecha_operacion', today)
    .neq('estado', 'cancelado')

  // Obtener otros perfiles de la red para destinos
  const { data: perfilesRed } = await supabase
    .from('perfiles')
    .select('id, nombre_organizacion, tipo_entidad, direccion_fisica')

  // Obtener solicitudes de recursos activas
  const { data: solicitudes } = await supabase
    .from('solicitudes_recursos')
    .select('*, perfiles(nombre_organizacion, nombre_contacto, whatsapp)')
    .order('creado_en', { ascending: false })

  // Obtener despachos intermedios activos
  const { data: despachosIntermedios } = await supabase
    .from('despachos_intermedios')
    .select(`
      *,
      perfil_origen:origen_id(nombre_organizacion, nombre_contacto, whatsapp),
      perfil_destino:destino_perfil_id(nombre_organizacion, nombre_contacto, whatsapp, direccion_fisica),
      nodo_destino:destino_nodo_id(nombre_nodo)
    `)
    .order('fecha_salida', { ascending: false })

  return (
    <DashboardClient
      perfil={perfil}
      nodos={nodos ?? []}
      despachosHoy={despachosHoy ?? []}
      perfilesRed={perfilesRed ?? []}
      solicitudesIniciales={solicitudes ?? []}
      despachosIntermediosIniciales={despachosIntermedios ?? []}
    />
  )
}
