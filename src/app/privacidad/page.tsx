import Link from 'next/link'

export default function PrivacidadPage() {
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
            Política de Privacidad
          </h2>
          <p className="text-xs text-zinc-400">
            Última actualización: 29 de junio de 2026
          </p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/8 space-y-6 leading-relaxed text-zinc-300">
          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">1.</span> Responsable del Tratamiento
            </h3>
            <p className="text-sm">
              La iniciativa de voluntariado de datos <strong className="text-white">Unidos por Venezuela (U4V)</strong> es responsable del tratamiento y resguardo de la información recopilada en esta plataforma. Contacto de soporte y consultas: <code className="text-teal-300 bg-white/5 px-1.5 py-0.5 rounded">augustbenitogroup@gmail.com</code>.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">2.</span> Datos Recopilados y Propósito
            </h3>
            <p className="text-sm">
              Bajo el principio de <strong className="text-white">minimización de datos</strong>, recopilamos únicamente la información técnica y de contacto estrictamente indispensable para orquestar la asistencia civil:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-400">
              <li>
                <strong className="text-zinc-200">Datos del Perfil:</strong> Nombre de la organización, nombre del coordinador responsable, número de teléfono (SMS), enlace de WhatsApp e Instagram corporativo.
              </li>
              <li>
                <strong className="text-zinc-200">Estructura Geográfica:</strong> Estado, ciudad, municipio, parroquia, calle/casa y punto de referencia para ordenar geográficamente los centros más cercanos y programar los despachos logísticos.
              </li>
              <li>
                <strong className="text-zinc-200">Capacidades Operativas:</strong> Capacidad de alojamiento (refugios), camas de emergencia (hospitales) y raciones diarias de comida (acopios/ONGs). No recopilamos datos clínicos detallados de pacientes.
              </li>
              <li>
                <strong className="text-zinc-200">Datos de Navegación:</strong> Dirección IP de conexión y logs del sistema para auditorías internas de seguridad e integridad de la red.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">3.</span> Seguridad y Verificación (Arquitectura Zero Trust)
            </h3>
            <p className="text-sm">
              Para proteger la base de datos contra accesos no autorizados y manipulación de información:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-400">
              <li>
                <strong className="text-zinc-200">Verificación Estricta:</strong> Cada transacción, API Route y consulta de página se valida del lado del servidor utilizando <code className="text-teal-300 bg-white/5 px-1.5 py-0.5 rounded">supabase.auth.getUser()</code>. Nunca se confía en el estado del cliente.
              </li>
              <li>
                <strong className="text-zinc-200">Cifrado de Datos:</strong> Toda la comunicación se realiza bajo canales HTTPS seguros. Las credenciales de acceso se almacenan cifradas en los servidores de autenticación.
              </li>
              <li>
                <strong className="text-zinc-200">Acceso de Super Admin:</strong> Únicamente los superadministradores validados tienen acceso al CRUD de control de usuarios para dar de baja o revocar accesos en caso de comportamiento irregular.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">4.</span> Proveedores y Subprocesadores de Datos
            </h3>
            <p className="text-sm">
              La información recogida es procesada a través de las siguientes plataformas de terceros que actúan como subprocesadores:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-zinc-400">
              <li><strong className="text-zinc-200">Supabase Inc.</strong> (Alojamiento de Base de Datos y Autenticación de Usuarios).</li>
              <li><strong className="text-zinc-200">Vercel Inc.</strong> (Alojamiento del Servidor de Aplicación Next.js).</li>
              <li><strong className="text-zinc-200">Twilio / Meta (WhatsApp Business API)</strong> (Envío automatizado de recordatorios del Data Staleness Index y validación de despachos).</li>
            </ol>
            <p className="text-sm mt-2 text-zinc-300">
              No vendemos, alquilamos ni cedemos sus datos a terceros con fines comerciales o de marketing.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">5.</span> Derechos de los Usuarios (Acceso y Supresión)
            </h3>
            <p className="text-sm">
              Usted tiene derecho a acceder, corregir, actualizar o solicitar la eliminación total de sus datos de la red. Puede realizar actualizaciones directamente desde la pestaña <strong className="text-white">"Mi Perfil Operativo"</strong> en el Dashboard, o solicitar la baja completa de la cuenta escribiendo a soporte. El borrado de una cuenta se efectúa de manera definitiva en cascada (tanto en autenticación como en registros de perfil).
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
