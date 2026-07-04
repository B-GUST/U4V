'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Perfil } from '@/types/database'

interface TermsModalProps {
  perfil: Perfil
  onAccepted: () => void
}

export function TermsModal({ perfil, onAccepted }: TermsModalProps) {
  const [loading, setLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleAccept() {
    setLoading(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('perfiles')
      .update({ terminos_aceptados: true })
      .eq('id', perfil.id)
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    onAccepted()
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50
    if (isAtBottom) setScrolled(true)
  }

  return (
    /* Overlay que bloquea toda la interfaz */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'oklch(0.076 0.007 285.75 / 0.92)' }}>
      <div className="w-full max-w-lg glass-strong rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <span className="text-base">⚖️</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">Descargo de Responsabilidad Logística</h2>
              <p className="text-xs text-muted-foreground">Lectura obligatoria · {perfil.nombre_organizacion}</p>
            </div>
          </div>
        </div>

        {/* Contenido legal — scrollable */}
        <div
          className="px-6 py-4 h-72 overflow-y-auto text-sm text-muted-foreground space-y-4 leading-relaxed"
          onScroll={handleScroll}
        >
          <p className="text-foreground font-medium">
            Al utilizar el Sistema Operativo de Logística de U4V (Unidos por Venezuela), usted
            declara expresamente lo siguiente:
          </p>

          <div className="space-y-3">
            <div className="flex gap-2">
              <span className="text-teal-400 font-bold shrink-0">1.</span>
              <p><strong className="text-foreground">Autonomía operativa:</strong> Las decisiones logísticas registradas en esta plataforma son responsabilidad exclusiva de la organización o individuo que las ejecuta. U4V actúa únicamente como herramienta de coordinación de información, sin participación directa en las operaciones físicas de rescate, transporte o distribución de ayuda.</p>
            </div>

            <div className="flex gap-2">
              <span className="text-teal-400 font-bold shrink-0">2.</span>
              <p><strong className="text-foreground">Exoneración de responsabilidad:</strong> Los desarrolladores y administradores de la plataforma U4V quedan exonerados de toda responsabilidad civil, penal o moral derivada de acciones físicas, accidentes, pérdidas de bienes, o cualquier consecuencia directa o indirecta de las operaciones logísticas coordinadas a través de este sistema.</p>
            </div>

            <div className="flex gap-2">
              <span className="text-teal-400 font-bold shrink-0">3.</span>
              <p><strong className="text-foreground">Precisión de datos:</strong> El usuario se compromete a registrar información verídica y actualizada. La manipulación deliberada de métricas de déficit, inventario o estado de zonas constituye una falta grave que puede resultar en la revocación inmediata del acceso.</p>
            </div>

            <div className="flex gap-2">
              <span className="text-teal-400 font-bold shrink-0">4.</span>
              <p><strong className="text-foreground">Privacidad de datos:</strong> Esta plataforma opera bajo un principio estricto de telemetría anonimizada. Está terminantemente prohibido registrar datos personales identificables de las personas afectadas (nombres, cédulas, datos biométricos o médicos específicos).</p>
            </div>

            <div className="flex gap-2">
              <span className="text-teal-400 font-bold shrink-0">5.</span>
              <p><strong className="text-foreground">Uso exclusivo de emergencia:</strong> Este sistema está diseñado para ser utilizado únicamente en contextos de emergencia humanitaria activa. Su uso con fines distintos, comerciales, políticos o de vigilancia, queda expresamente prohibido.</p>
            </div>

            <div className="flex gap-2">
              <span className="text-teal-400 font-bold shrink-0">6.</span>
              <p><strong className="text-foreground">Acceso privilegiado:</strong> El acceso a esta plataforma fue otorgado de forma voluntaria por el equipo administrador de U4V y puede ser revocado en cualquier momento ante uso indebido o información falsa.</p>
            </div>
          </div>

          <p className="text-foreground/70 text-xs border-t border-white/8 pt-3">
            Al hacer clic en &quot;Acepto y Comprendo&quot;, confirmo haber leído, comprendido y aceptado 
            en su totalidad los términos anteriores en representación de{' '}
            <strong className="text-foreground">{perfil.nombre_organizacion}</strong>.
          </p>
        </div>

        {/* Footer de acción */}
        <div className="px-6 pb-6 pt-4 border-t border-white/8">
          {!scrolled && (
            <p className="text-xs text-muted-foreground text-center mb-3 flex items-center justify-center gap-1">
              <span className="text-amber-400">↓</span>
              Desplázate hasta el final para continuar
            </p>
          )}
          {error && (
            <p className="text-xs text-red-400 text-center mb-3 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <Button
            onClick={handleAccept}
            disabled={loading || !scrolled}
            id="btn-aceptar-terminos"
            className="w-full h-12 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Registrando aceptación...' : '✓ Acepto y Comprendo — Ingresar al Sistema'}
          </Button>
        </div>
      </div>
    </div>
  )
}
