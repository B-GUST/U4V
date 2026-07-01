import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Fondo de Luces Difusas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      {/* TOP NAVIGATION */}
      <header className="glass border-b border-white/8 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🇻🇪</span>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">U4V · Unidos por Venezuela</h1>
            <p className="text-[10px] text-teal-400 uppercase tracking-widest leading-none mt-0.5">Red Logística Humanitaria</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-4 py-2 rounded-xl transition-all"
            >
              Ir a mi Consola ➔
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs text-zinc-300 hover:text-white px-3 py-2 transition-all"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className="text-xs bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-4 py-2 rounded-xl transition-all"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 z-10 space-y-16">
        <section className="text-center space-y-6 max-w-2xl mx-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-teal-300">
            <span>⚡ Coordination Logística Descentralizada</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Coordinación y Distribución de Ayuda en Tiempos de Crisis
          </h2>
          <p className="text-zinc-400 text-base">
            U4V es una plataforma colaborativa y autónoma diseñada para que ONGs, depósitos, refugios y hospitales de Venezuela coordinen esfuerzos de auxilio en tiempo real, previniendo el desabastecimiento o la sobrecarga de insumos.
          </p>
          <div className="flex gap-4 justify-center pt-2">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-extrabold px-6 py-3 rounded-2xl transition-all text-sm shadow-lg shadow-teal-500/10"
              >
                Abrir Panel de Control
              </Link>
            ) : (
              <>
                <Link
                  href="/registro"
                  className="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-extrabold px-6 py-3 rounded-2xl transition-all text-sm shadow-lg shadow-teal-500/10"
                >
                  Registrar mi Organización
                </Link>
                <Link
                  href="/login"
                  className="bg-zinc-900 border border-white/10 hover:bg-white/5 text-white font-semibold px-6 py-3 rounded-2xl transition-all text-sm"
                >
                  Acceder
                </Link>
              </>
            )}
          </div>
        </section>

        {/* CÓMO FUNCIONA EL SISTEMA (GUÍA INTERACTIVA MOCKED EN AESTHETICS) */}
        <section className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">Manual del Operador U4V</h3>
            <p className="text-zinc-400 text-xs mt-1">Cómo se unifican los esfuerzos para una red de auxilio eficiente</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Paso 1 */}
            <div className="glass p-6 rounded-2xl border border-white/5 hover:border-teal-500/20 transition-all space-y-3">
              <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center text-lg">
                📋
              </div>
              <h4 className="text-sm font-bold text-white">1. El Libro Mayor de Zonas</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mapea las ubicaciones del desastre. Los coordinadores de la red pueden registrar nuevas zonas críticas (ej. Residencias Palma Real) indicando punto de referencia y dirección física. Sirve de guía para saber a dónde dirigir cargamentos de ayuda.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="glass p-6 rounded-2xl border border-white/5 hover:border-teal-500/20 transition-all space-y-3">
              <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center text-lg">
                🚨
              </div>
              <h4 className="text-sm font-bold text-white">2. Sábana de Solicitudes y Postulaciones</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Los refugios y centros solicitan insumos categorizados (Comida, Agua, Ropa, Medicinas, Voluntarios). Las ONGs pueden postularse para cubrir cantidades parciales del déficit. Cuando la entrega es recibida y confirmada por el solicitante, el requerimiento desaparece del tablero.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="glass p-6 rounded-2xl border border-white/5 hover:border-teal-500/20 transition-all space-y-3">
              <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center text-lg">
                🚛
              </div>
              <h4 className="text-sm font-bold text-white">3. Viajes Logísticos y Ridesharing</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Al despachar insumos, las organizaciones declaran si tienen espacio libre en sus camiones para transportar cajas o trasladar voluntarios de otros grupos. Incluye punto de encuentro y hora de salida para optimizar los fletes.
              </p>
            </div>

            {/* Paso 4 */}
            <div className="glass p-6 rounded-2xl border border-white/5 hover:border-teal-500/20 transition-all space-y-3">
              <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center text-lg">
                🏥
              </div>
              <h4 className="text-sm font-bold text-white">4. Altas Médicas y Reubicación</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Permite la coordinación directa entre hospitales y refugios. Las entidades de salud publican la cantidad de personas dadas de alta que requieren techo, y los refugios las asignan a sus instalaciones según el cupo de vacantes disponibles que manejan en tiempo real.
              </p>
            </div>

            {/* Paso 5 */}
            <div className="glass p-6 rounded-2xl border border-white/5 hover:border-teal-500/20 transition-all space-y-3">
              <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center text-lg">
                🚧
              </div>
              <h4 className="text-sm font-bold text-white">5. Reporte de Alertas Viales</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Los transportistas y coordinadores pueden notificar en vivo sobre incidencias viales tales como autopistas obstaculizadas o trancas, evitando que los cargamentos de suministros queden atrapados o se retrasen.
              </p>
            </div>

            {/* Paso 6 */}
            <div className="glass p-6 rounded-2xl border border-white/5 hover:border-teal-500/20 transition-all space-y-3">
              <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center text-lg">
                🤝
              </div>
              <h4 className="text-sm font-bold text-white">6. Vinculación Autónoma Directa</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                U4V no requiere la aprobación o intervención manual de un administrador para operar. Cada organización cuenta con su número telefónico de coordinación y enlace de Instagram expuesto para que los grupos coordinen llamadas o fletes directamente.
              </p>
            </div>

          </div>
        </section>

        {/* METRICAS DE DISEÑO */}
        <section className="glass rounded-3xl p-8 border border-white/5 text-center grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-teal-400 font-mono">100%</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Colaborativo</p>
          </div>
          <div className="border-x border-white/5">
            <p className="text-2xl font-bold text-teal-400 font-mono">Realtime</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Sincronizado</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-teal-400 font-mono">0%</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Intermediarios</p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="glass border-t border-white/8 px-6 py-8 text-center text-zinc-500 z-10 flex flex-col items-center gap-4">
        <div className="flex gap-4 text-xs font-medium text-zinc-400">
          <Link href="/privacidad" className="hover:text-teal-400 transition-colors">
            Política de Privacidad
          </Link>
          <span className="text-zinc-700">•</span>
          <Link href="/terminos" className="hover:text-teal-400 transition-colors">
            Términos de Servicio
          </Link>
        </div>
        <div className="mt-2 text-center">
          <p className="text-[10px] text-zinc-400 leading-normal">
            © 2026 BGUST
          </p>
          <p className="text-[10px] text-zinc-500 leading-normal mt-0.5 italic">
            "La vida es más alegre cuando vives para servir"
          </p>
          <p className="text-[9px] text-teal-500/70 leading-normal mt-0.5 font-medium">
            Hecho con amor para mi Venezuela 🇻🇪
          </p>
        </div>
      </footer>
    </div>
  )
}
