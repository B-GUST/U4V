import Link from 'next/link'

export default function TerminosPage() {
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
        <div>
          <Link
            href="/"
            className="text-xs bg-zinc-900 border border-white/10 hover:bg-white/5 text-white font-bold px-4 py-2 rounded-xl transition-all"
          >
            ← Volver al Inicio
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 z-10 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Términos de Servicio
          </h2>
          <p className="text-xs text-zinc-400">
            Última actualización: 29 de junio de 2026
          </p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/8 space-y-6 leading-relaxed text-zinc-300">
          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">1.</span> Aceptación de los Términos
            </h3>
            <p className="text-sm">
              Al registrarse, iniciar sesión o utilizar la plataforma <strong className="text-white">Unidos por Venezuela (U4V)</strong>, usted acepta de manera irrevocable estos Términos de Servicio. Si no está de acuerdo con alguna de las disposiciones aquí establecidas, no deberá acceder ni hacer uso del sistema.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">2.</span> Descripción del Servicio y Propósito Humanitario
            </h3>
            <p className="text-sm">
              U4V es un sistema colaborativo descentralizado de código abierto y sin fines de lucro diseñado exclusivamente para la coordinación logística de ayuda humanitaria, alojamiento, traslado de pacientes dados de alta y reporte de incidencias en respuesta a emergencias civiles y de desastre natural (contingencia por el sismo de 2026 en Venezuela).
            </p>
            <p className="text-sm text-zinc-400">
              El servicio se proporciona de forma gratuita. Los administradores se reservan el derecho de modificar, suspender o interrumpir temporal o definitivamente cualquier funcionalidad para salvaguardar la integridad de las operaciones en campo.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">3.</span> Registro y Cuentas de Coordinación
            </h3>
            <p className="text-sm">
              El uso de U4V está reservado para coordinadores de ONGs, centros de acopio, refugios oficiales y centros de salud (hospitales y ambulatorios) previamente validados en la red.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-400">
              <li><strong className="text-zinc-200">Seguridad de la Cuenta:</strong> Cada usuario es responsable de mantener la confidencialidad de sus credenciales.</li>
              <li><strong className="text-zinc-200">Veracidad del Registro:</strong> Se exige que la información geográfica del perfil (estado, ciudad, municipio, parroquia) sea real y precisa para garantizar el funcionamiento del algoritmo de cercanía geo-logística.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">4.</span> Normativa de Seguridad Crítica y Prohibición de Inventario
            </h3>
            <p className="text-sm">
              Para resguardar la seguridad física de los convoyes de ayuda y prevenir ataques o secuestros de insumos en ruta:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-400">
              <li>
                <strong className="text-zinc-200">Prohibición de Inventario Físico:</strong> Queda estrictamente prohibido registrar, publicar o almacenar datos que revelen el volumen acumulado de stock físico remanente en almacenes, centros de acopio u ONGs.
              </li>
              <li>
                <strong className="text-zinc-200">Medición Logística:</strong> El cálculo de necesidades se realizará exclusivamente mediante la proyección estocástica y la agregación de manifiestos de despacho emitidos de forma consolidada.
              </li>
              <li>
                <strong className="text-zinc-200">Uso Aceptable:</strong> Se prohíbe el uso de la plataforma para fines comerciales, proselitismo político, spam o para difundir información falsa que pueda causar alarma o pánico civil.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">5.</span> Cierre y Confirmación (Token de Cierre TOTP Desconectado)
            </h3>
            <p className="text-sm">
              Para certificar las entregas, la plataforma implementa una palabra clave ("salto y seña") temporal de 1 minuto de validez que los sensores y receptores pueden generar de forma desconectada a internet para validar el manifiesto de despacho. El uso indebido de los tokens de cierre para simular entregas ficticias resultará en la exclusión inmediata de la organización de la red.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">6.</span> Limitación de Responsabilidad
            </h3>
            <p className="text-sm">
              La plataforma se ofrece <strong className="text-white">"tal cual es" (as-is)</strong> y <strong className="text-white">"según disponibilidad"</strong>. Los desarrolladores, coordinadores de la iniciativa y personal de voluntariado de datos no otorgan garantías de ningún tipo sobre la exactitud de los reportes viales, capacidad de camas o requerimientos de auxilio en el Libro Mayor. No nos hacemos responsables por fallos de infraestructura, daños indirectos, fallas en los envíos de ayuda o decisiones médicas tomadas en base a la información desplegada.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">7.</span> Jurisdicción y Ley Aplicable
            </h3>
            <p className="text-sm">
              Cualquier disputa o reclamación relacionada con el uso de la plataforma se regirá por las leyes de la <strong className="text-white">República Bolivariana de Venezuela</strong> y será sometida a la jurisdicción exclusiva de los tribunales competentes en la ciudad de Caracas.
            </p>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="glass border-t border-white/8 px-6 py-6 text-center text-xs text-zinc-500 z-10">
        <p>© 2026 BGUST · Hecho con amor para mi Venezuela 🇻🇪</p>
      </footer>
    </div>
  )
}
