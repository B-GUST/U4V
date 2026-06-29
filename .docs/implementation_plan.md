# 🇻🇪 U4V — Unidos por Venezuela
## Plan de Implementación: MVP del Sistema Operativo de Logística Post-Rescate

> **Contexto**: Plataforma logística de crisis humanitaria que coordina oferta y demanda de ayuda en tiempo real. Basada en telemetría anonimizada: sin datos personales de víctimas, sin donaciones monetarias, sin chat interno.

---

## Resumen Ejecutivo

El MVP se construirá sobre **Next.js 14 (App Router)** + **Supabase** (PostgreSQL + Auth + Realtime) + **Tailwind CSS** + **shadcn/ui**, desplegado en **Vercel** con microservicios de notificación en **Cloudflare Workers**. El ciclo de vida completo es: reserva de franja horaria → viaje físico → reporte asíncrono por WhatsApp → recalibración de métricas.

---

## Open Questions

> [!IMPORTANT]
> Las siguientes decisiones requieren tu confirmación antes de ejecutar:

1. **Supabase Project**: ¿Ya tienes un proyecto de Supabase creado? ¿O lo creamos nuevo? Necesito la `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
2. **Dominio**: ¿Tienes un dominio propio para el dashboard? ¿O usamos el subdominio gratuito de Vercel (`u4v.vercel.app`)?
3. **CallMeBot**: ¿Ya tienes una cuenta/API Key de CallMeBot configurada para el número de WhatsApp de despacho?
4. **Cloudflare**: ¿Tienes una cuenta de Cloudflare Workers para los microservicios cron? ¿O los implementamos como **Supabase Edge Functions** (más simple para el MVP)?
5. **Datos Iniciales (Seed)**: ¿Ya tienes una lista de nodos geográficos (zonas cero/refugios) y centros de acopio para poblar la base de datos inicial?
6. **shadcn/ui vs. UI personalizada**: El PRD menciona glasmorfismo y bordes redondeados, pero el TRD mencionó inicialmente "bordes afilados e interfaz industrial". El prompt final del agente cambia a `rounded-2xl/3xl` con glasmorfismo. **¿Confirmamos el estilo final como glasmorfismo oscuro con acento aguamarina?**

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL (Frontend)                       │
│  Next.js 14 App Router                                       │
│  ├── /login          → OTP Magic Link                        │
│  ├── /dashboard      → Torre de Control (SSR + Realtime)     │
│  └── /reporte/[token]→ Sensor de Campo (Mobile-First, SSG)   │
└──────────────────────┬──────────────────────────────────────┘
                       │ Supabase JS Client
┌──────────────────────▼──────────────────────────────────────┐
│                   SUPABASE (Backend)                         │
│  ├── PostgreSQL (4 tablas core + ENUMs + RLS)                │
│  ├── Auth (Magic Link / OTP — sin registro abierto)          │
│  └── Realtime (suscripciones en despachos + nodos)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│           CLOUDFLARE WORKERS / SUPABASE EDGE FN              │
│  Cron Job al cierre de cada franja horaria:                  │
│  ├── Busca despachos "En Tránsito" del bloque                │
│  ├── Genera UUID token (12h TTL) por despacho                │
│  └── POST → CallMeBot API → WhatsApp al chofer               │
└─────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### Fase 1 — Setup e Infraestructura (Día 1)

---

#### [NEW] Proyecto Next.js en `/home/august/code/U4V/`

Inicialización con flags precisos para reproducibilidad:

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git
```

**Dependencias a instalar:**
- `@supabase/supabase-js` — Cliente JS oficial
- `@supabase/ssr` — Helper para cookies en App Router
- `shadcn/ui` — Componentes (estilo `new-york`, base `slate`, dark mode forzado)
- `lucide-react` — Iconos (incluido con shadcn)
- `date-fns` — Manejo de fechas para franjas horarias
- `zod` — Validación de esquemas en formularios

**Variables de entorno requeridas (`.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Solo server-side, para validar tokens de reporte
CALLMEBOT_API_KEY=
```

---

#### [NEW] Estructura de carpetas (`/src/`)

```
src/
├── app/
│   ├── layout.tsx              # Root layout (dark mode, fuente Inter)
│   ├── login/page.tsx          # Pantalla OTP
│   ├── dashboard/
│   │   ├── layout.tsx          # Middleware auth + check terms_accepted
│   │   └── page.tsx            # El Libro Mayor (Data Grid + Realtime)
│   └── reporte/
│       └── [token]/page.tsx    # Sensor de Campo (mobile-first)
├── components/
│   ├── ui/                     # Componentes shadcn auto-generados
│   ├── dashboard/
│   │   ├── NodeTable.tsx       # Data Grid de nodos geográficos
│   │   ├── TimeSlotCell.tsx    # Celda de franja horaria (botón/bloqueado)
│   │   └── DispatchModal.tsx   # Modal para crear Manifiesto
│   ├── auth/
│   │   ├── LoginForm.tsx       # Formulario OTP con glasmorfismo
│   │   └── TermsModal.tsx      # Modal bloqueante de Descargo
│   └── field/
│       └── FieldReportForm.tsx # Formulario móvil del chofer
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # createBrowserClient
│   │   ├── server.ts           # createServerClient (cookies)
│   │   └── middleware.ts       # refreshSession helper
│   └── utils.ts                # cn() y helpers de fecha
├── types/
│   └── database.ts             # Tipos TypeScript auto-generados del schema
└── middleware.ts               # Protección de rutas + redirect logic
```

---

### Fase 2 — Base de Datos Supabase (Día 1-2)

---

#### [NEW] Script SQL completo (`/supabase/migrations/001_initial_schema.sql`)

**ENUMs:**
```sql
CREATE TYPE rol_usuario    AS ENUM ('admin', 'primera_linea', 'retaguardia');
CREATE TYPE bloque_tiempo  AS ENUM ('mañana', 'tarde', 'noche');
CREATE TYPE estado_despacho AS ENUM ('transito', 'completado', 'cancelado');
CREATE TYPE nivel_urgencia  AS ENUM ('verde', 'amarillo', 'rojo');
```

**Tablas:**

| Tabla | Descripción | Filas clave |
|---|---|---|
| `perfiles` | Extiende `auth.users`, centros de acopio | `rol`, `terminos_aceptados`, `telefono_contacto` |
| `nodos_geograficos` | Zonas receptoras + métricas en vivo | `deficit_diario_raciones`, `semaforo_medico`, `ultima_actualizacion` |
| `despachos` | El Libro Mayor de transacciones | `franja`, `estado`, `token_reporte` (UUID único), `cantidad_declarada` |
| `reportes_terreno` | Cierre del ciclo por choferes | `cantidad_entregada_real`, `semaforo_observado`, `observacion_urgente` |

**Constraint vital** (anti-colisión de franjas horarias):
```sql
ALTER TABLE despachos
ADD CONSTRAINT unique_slot UNIQUE (nodo_id, fecha_operacion, franja);
```

**RLS Policies:**

| Tabla | Operación | Política |
|---|---|---|
| `perfiles` | SELECT | Autenticados |
| `perfiles` | UPDATE | Solo `auth.uid() = id` |
| `despachos` | SELECT | Autenticados |
| `despachos` | INSERT | `auth.uid() = centro_id` AND `terminos_aceptados = true` |
| `despachos` | UPDATE | Solo el dueño (`centro_id = auth.uid()`) |
| `reportes_terreno` | INSERT | Via service_role (Edge Function valida token) |

---

### Fase 3 — Autenticación y Seguridad (Día 2)

---

#### [NEW] `src/app/login/page.tsx` — Pantalla OTP

- Tarjeta glasmórfica centrada (`bg-white/5 backdrop-blur-md border-white/10`)
- Input de email/teléfono → botón "Enviar Código"
- Input de 6 dígitos OTP (o clic en Magic Link)
- **Sin botón "Registrarse"** — acceso solo por invitación del admin

#### [NEW] `src/middleware.ts` — Guardián de Rutas

```
/login          → Pública
/reporte/[token]→ Pública (auth por token en URL)
/dashboard/**   → Requiere: sesión activa + terminos_aceptados = true
/              → Redirect a /dashboard si autenticado, /login si no
```

#### [NEW] `src/components/auth/TermsModal.tsx` — Bloqueo Legal

- Modal con `z-50` y `backdrop-blur-xl`
- Texto completo del Descargo de Responsabilidad
- Botón "Acepto y Comprendo" → `UPDATE perfiles SET terminos_aceptados = true`
- **No tiene botón de cerrar (X)** — es obligatorio
- Reaparece en cada sesión hasta que sea aceptado

---

### Fase 4 — Dashboard Operativo (Día 3)

---

#### [NEW] `src/app/dashboard/page.tsx` + `NodeTable.tsx`

**Layout 3-paneles:**
```
┌─────────────────────────────────────────────────────┐
│ TOP BAR: [Logo U4V] [Nombre ONG] [🟢 Realtime] [↪] │
├──────────┬──────────────────────────────────────────┤
│ FILTROS  │           EL LIBRO MAYOR                 │
│ (20%)    │  Zona | Déficit | Mañana | Tarde | Noche │
│          │  ──────┼─────────┼────────┼───────┼───── │
│ 🔴 Rojas │  Macuto│ 700 rac.│ [ONG A]│  LIBRE│LIBRE │
│ 📍 Cerca │  Vargas│ 300 rac.│  LIBRE │ [ONG B]│LIBRE│
│ 🕐 Libres│  ...   │  ...    │  ...   │  ...  │ ... │
└──────────┴──────────────────────────────────────────┘
```

**Suscripción Realtime:**
```typescript
supabase.channel('logistica')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'despachos' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'nodos_geograficos' }, handler)
  .subscribe()
```

#### [NEW] `src/components/dashboard/DispatchModal.tsx`

- `Dialog` de shadcn con `rounded-3xl`
- Muestra: Zona seleccionada + Franja horaria
- 2 únicos campos: `tipo_insumo` (Select) + `cantidad_declarada` (Input numérico)
- Al guardar: `INSERT INTO despachos` → la UI se actualiza via Realtime instantáneamente

---

### Fase 5 — Sensor de Campo (Día 4)

---

#### [NEW] `src/app/reporte/[token]/page.tsx` — Mobile-First

**Estructura:**
```
┌─────────────────────────────────┐
│  REPORTE DE SALIDA              │
│  Residencias Macuto · Tarde     │
│─────────────────────────────────│
│  Raciones entregadas:           │
│  [−]        [  300  ]       [+] │
│─────────────────────────────────│
│  Personas estimadas (opcional): │
│  [     ________________     ]   │
│─────────────────────────────────│
│  Estado de la Zona:             │
│  [💧 FALTA AGUA] [🍽 FALTA COMIDA]│
│  [🚨 EMERGENCIA MÉDICA]          │
│─────────────────────────────────│
│                                 │
│  ┌───────────────────────────┐  │
│  │   ENVIAR REPORTE Y        │  │
│  │   CERRAR DESPACHO         │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Lógica del token:**
1. `GET /reporte/[token]` → Server Component valida token contra `despachos.token_reporte`
2. Si válido: renderiza formulario con datos del nodo pre-cargados
3. Si inválido/expirado: pantalla de error clara
4. Al enviar: Server Action llama Edge Function con `service_role` para:
   - `INSERT INTO reportes_terreno`
   - `UPDATE despachos SET estado = 'completado', token_reporte = NULL`
   - `UPDATE nodos_geograficos` (recalcula déficit según diferencia declarado vs. real)
   - Si `semaforo_observado = 'rojo'` → dispara alerta a centros de Retaguardia

---

### Fase 6 — Worker de Notificaciones (Día 4)

---

#### [NEW] Supabase Edge Function: `dispatch-notifier`

> [!NOTE]
> Propongo implementarlo como **Supabase Edge Function** en lugar de Cloudflare Worker para el MVP, ya que tiene acceso directo a la DB y reduce la complejidad de despliegue. Si se requiere escala masiva, se migra a Cloudflare después.

**Trigger:** Cron job `0 12,18,22 * * *` (al cierre de cada franja: mediodía, 6PM, 10PM)

**Lógica:**
```typescript
// 1. Query despachos en 'transito' del bloque que acaba de cerrar
// 2. Para cada despacho:
//    a. Generar UUID token (ya está en DB desde el INSERT)
//    b. POST a CallMeBot:
//       "U4V Logistica: Tu despacho en [Zona] ha cerrado.
//        Reporta en: https://u4v.app/reporte/[token]
//        (Expira en 12h)"
// 3. Registrar envío (opcional, para audit trail)
```

---

## Diseño Visual (Sistema de Tokens)

| Token | Valor | Uso |
|---|---|---|
| Background base | `bg-slate-950` (`#0f172a`) | Fondo global |
| Superficie cards | `bg-white/5 backdrop-blur-md` | Glasmorfismo |
| Borde cards | `border border-white/10` | Separadores sutiles |
| Acento principal | `teal-400 / teal-500` | Botones activos, CTA |
| Urgencia roja | `red-500` | Déficit crítico |
| Urgencia ámbar | `amber-500` | Alertas moderadas |
| Confirmado | `emerald-500` | Despachos activos |
| Tipografía | `Inter` (Google Fonts) | Todo el texto |
| Radio de bordes | `rounded-2xl / rounded-3xl` | Cards y modales |

---

## Verification Plan

### Automatizado
- `npm run build` — Verificación de types TypeScript y compilación
- `npm run lint` — ESLint sobre toda la codebase

### Manual (por flujo)

| Flujo | Paso de Verificación |
|---|---|
| Autenticación | Intentar acceder a `/dashboard` sin sesión → redirige a `/login` |
| Bloqueo legal | Login con `terminos_aceptados = false` → modal aparece, dashboard bloqueado |
| Manifiesto | Crear despacho en Zona A, Franja Tarde → otro tab ve el bloque ocupado inmediatamente |
| Anti-colisión | Dos navegadores intentan el mismo slot → solo uno triunfa (DB constraint) |
| Token de campo | Abrir URL `/reporte/[token-válido]` → formulario carga con datos del nodo |
| Token inválido | Abrir URL `/reporte/[token-inexistente]` → pantalla de error |
| Token agotado | Enviar reporte → recargar la misma URL → bloqueo por token nulo |
| Recálculo | Reporte con 200 de 300 declaradas → déficit del nodo aumenta correctamente |

---

## Timeline Estimado

| Día | Fases | Entregables |
|---|---|---|
| **Día 1** | Setup + DB | Proyecto Next.js corriendo, schema SQL en Supabase, RLS activo |
| **Día 2** | Auth + Seguridad | Login OTP funcional, middleware de rutas, modal de ToS |
| **Día 3** | Dashboard | Libro Mayor con Realtime, modal de Manifiesto |
| **Día 4** | Campo + Worker | Formulario móvil con token, Edge Function de notificaciones |
| **Día 5** | QA + Deploy | Build limpio, deploy en Vercel, seed de datos iniciales |

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| CallMeBot tiene límites de rate | Encolar notificaciones, no enviar en paralelo masivo |
| Conexión lenta del chofer | `/reporte` como ruta SSG estática + form de mínimo JS |
| Colisión de franjas simultáneas | Constraint `UNIQUE(nodo_id, fecha, franja)` + manejo de error 409 en UI |
| Token reutilizable | `SET token_reporte = NULL` inmediatamente al recibir el reporte |
| Admin sin acceso a Supabase UI | Script SQL de seed para pre-registrar primeros usuarios |
