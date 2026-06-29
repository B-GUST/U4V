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

  return (
    <DashboardClient
      perfil={perfil}
      nodos={nodos ?? []}
      despachosHoy={despachosHoy ?? []}
    />
  )
}
