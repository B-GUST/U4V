// Supabase Edge Function: dispatch-notifier
// Trigger: Cron job al cierre de cada franja horaria
// Franjas: mañana → 12:00, tarde → 18:00, noche → 22:00
//
// NOTA MVP: CallMeBot está desactivado. Esta función registra los tokens
// y puede consultarse manualmente. Activar CallMeBot descomentando la sección
// correspondiente cuando se tenga la API key.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Determina qué franja acaba de cerrarse según la hora UTC
function getFranjaActual(): string | null {
  const horaUTC = new Date().getUTCHours()
  // Ajuste para Venezuela (UTC-4)
  const horaVE = (horaUTC - 4 + 24) % 24

  if (horaVE >= 11 && horaVE < 13) return 'mañana'  // Cierra al mediodía
  if (horaVE >= 17 && horaVE < 19) return 'tarde'    // Cierra a las 6PM
  if (horaVE >= 21 && horaVE < 23) return 'noche'    // Cierra a las 10PM
  return null
}

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Permitir activación manual con ?franja=tarde en la URL
    const url = new URL(req.url)
    const franjaParam = url.searchParams.get('franja')
    const franja = franjaParam ?? getFranjaActual()

    if (!franja) {
      return new Response(
        JSON.stringify({ message: 'No es hora de cierre de franja. Pasa ?franja=mañana|tarde|noche para forzar.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    // Buscar despachos en tránsito de la franja que acaba de cerrar
    const { data: despachos, error } = await supabase
      .from('despachos')
      .select('id, token_reporte, franja, nodo_id, perfiles(telefono_contacto, nombre_organizacion), nodos_geograficos(nombre_nodo)')
      .eq('fecha_operacion', today)
      .eq('franja', franja)
      .eq('estado', 'transito')
      .not('token_reporte', 'is', null)

    if (error) throw error

    if (!despachos || despachos.length === 0) {
      return new Response(
        JSON.stringify({ message: `No hay despachos activos para la franja: ${franja}`, franja }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const baseUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://u4v.vercel.app'
    const callMeBotKey = Deno.env.get('CALLMEBOT_API_KEY')
    const resultados = []

    for (const despacho of despachos) {
      const enlace = `${baseUrl}/reporte/${despacho.token_reporte}`
      const perfil = Array.isArray(despacho.perfiles) ? despacho.perfiles[0] : despacho.perfiles
      const nodo = Array.isArray(despacho.nodos_geograficos) ? despacho.nodos_geograficos[0] : despacho.nodos_geograficos
      const telefono = perfil?.telefono_contacto

      // ── CallMeBot (Activar cuando se tenga API Key) ──────────────────
      // if (callMeBotKey && telefono) {
      //   const mensaje = encodeURIComponent(
      //     `🇻🇪 U4V Logística\nTu despacho en ${nodo?.nombre_nodo} (${franja}) ha cerrado.\nReporta en < 1 min:\n${enlace}\n⏰ Expira en 12h`
      //   )
      //   const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${telefono}&text=${mensaje}&apikey=${callMeBotKey}`
      //   await fetch(apiUrl)
      // }
      // ────────────────────────────────────────────────────────────────

      console.log(`[U4V Worker] Despacho ${despacho.id} · ${nodo?.nombre_nodo} · Enlace: ${enlace}`)
      resultados.push({
        despacho_id: despacho.id,
        nodo: nodo?.nombre_nodo,
        enlace,
        telefono_notificado: callMeBotKey && telefono ? telefono : 'CALLMEBOT_DESACTIVADO',
      })
    }

    return new Response(
      JSON.stringify({ success: true, franja, procesados: resultados.length, resultados }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[U4V Worker] Error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
