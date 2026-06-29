import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { FieldReportForm } from '@/components/field/FieldReportForm'
import type { BloquesTiempo } from '@/types/database'

interface Props {
  params: Promise<{ token: string }>
}

interface DespachoConNodo {
  id: string
  franja: BloquesTiempo
  cantidad_declarada: number
  nodos_geograficos: {
    nombre_nodo: string
    deficit_diario_raciones: number
    poblacion_estimada: number
  } | null
}

export const metadata: Metadata = {
  title: 'Reporte de Campo — U4V',
  description: 'Formulario de reporte rápido de métricas de zona. Acceso por enlace temporal.',
}

export default async function ReportePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  // Validar token contra la base de datos
  const { data, error } = await supabase
    .from('despachos')
    .select('id, franja, cantidad_declarada, nodos_geograficos(nombre_nodo, deficit_diario_raciones, poblacion_estimada)')
    .eq('token_reporte', token)
    .eq('estado', 'transito')
    .single()

  // Token inválido, ya usado, o despacho no en tránsito
  if (error || !data) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="text-5xl">🔒</div>
          <h1 className="text-xl font-bold">Enlace no válido</h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Este enlace ya fue utilizado, expiró o no existe.
            Contacta a tu coordinador si necesitas reportar nuevamente.
          </p>
        </div>
      </div>
    )
  }

  const despacho = data as unknown as DespachoConNodo
  const nodo = despacho.nodos_geograficos

  return (
    <FieldReportForm
      despachoId={despacho.id}
      token={token}
      nombreNodo={nodo?.nombre_nodo ?? 'Zona desconocida'}
      franja={despacho.franja}
      cantidadDeclarada={despacho.cantidad_declarada}
    />
  )
}
