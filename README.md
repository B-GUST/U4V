# 🇻🇪 U4V — Unidos por Venezuela
## Sistema Operativo de Logística y Auxilio Civil Post-Rescate (Sismo 2026)

**Unidos por Venezuela (U4V)** es una plataforma descentralizada, colaborativa y sin fines de lucro diseñada para mitigar el impacto logístico derivado de la contingencia civil y hospitalaria tras el sismo de 2026. 

La plataforma unifica en un **Libro Mayor en Tiempo Real** a los centros de acopio, ONGs, refugios, hospitales y sensores de campo para optimizar la distribución de recursos (alimentos, agua, ropa, medicamentos y voluntarios), gestionar las altas médicas y reportar alertas de tráfico e incidencias viales en las zonas afectadas de Venezuela.

---

## 🧭 Documentación Legal y Descargo de Responsabilidad
Para garantizar el cumplimiento de normativas de privacidad y la seguridad física de las operaciones, consulte los siguientes documentos contractuales obligatorios antes de utilizar el sistema:
* 📜 **[Términos de Servicio (ToS)](file:///home/august/code/U4V/TERMINOS.md)**: Reglas de uso aceptable, prohibiciones de revelación de stock y resolución de disputas bajo las leyes de la República Bolivariana de Venezuela.
* 🔒 **[Política de Privacidad](file:///home/august/code/U4V/PRIVACIDAD.md)**: Detalles sobre el principio de minimización de datos personales y arquitectura Zero Trust.
* ⚠️ **[Descargo de Responsabilidad (Waiver)](file:///home/august/code/U4V/DISCLAIMER.md)**: Declaración de calidad de datos bajo la norma **ISO 8000** y protección de datos conforme a **ISO/IEC 27001**.

---

## 🛠️ Stack Tecnológico
* **Frontend / SSR**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
* **Motor Gráfico & Data Science**: Chart.js, Proyección Estocástica (Simulación de Monte Carlo con 500 iteraciones en navegador)
* **Base de Datos**: PostgreSQL en Supabase con RLS (Row Level Security) estricto
* **Realtime**: Supabase Broadcast & Channels para actualización inmediata de slots en el Libro Mayor
* **Cron Logístico**: Bun / TypeScript para expiración automática de despachos colgados a las 24h y Data Staleness Index (DSI) vía WhatsApp.

---

## 🚀 Guía de Inicio Rápido (Setup Local)

### 1. Requisitos Previos
* [Node.js / Bun](https://bun.sh) instalado.
* Instancia activa de [Supabase](https://supabase.com).

### 2. Configurar Variables de Entorno
Copia el archivo de ejemplo y completa los parámetros de conexión de tu instancia de Supabase:
```bash
cp .env.local.example .env.local
```

### 3. Aplicar Esquema y Migraciones de Base de Datos
Ejecuta los scripts SQL contenidos en la carpeta `supabase/migrations/` en el **SQL Editor de Supabase** en orden ascendente (001 a 008) para construir las tablas de perfiles, nodos geográficos, despachos, traslados, incidencias y boletín, incluyendo los triggers y enums correspondientes.

### 4. Instalar Dependencias e Iniciar
```bash
npm install
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 👥 Colaboración y Comunidad
U4V es un proyecto abierto a la comunidad de desarrolladores y voluntarios. Revisa nuestras directrices de aportación en **[CONTRIBUTING.md](file:///home/august/code/U4V/CONTRIBUTING.md)** y la licencia MIT en **[LICENSE](file:///home/august/code/U4V/LICENSE)**.

---
© 2026 BGUST — *La vida es más alegre cuando vives para servir.* Hecho con amor para mi Venezuela 🇻🇪
