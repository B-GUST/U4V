# U4V — Walkthrough de Implementación MVP

> **Build**: ✅ `npm run build` exitoso · Next.js 16.2.9 · 7 rutas compiladas
> **Dev server**: http://localhost:3000

---

## Qué se construyó

### Rutas del sistema

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | Static | Redirect automático según sesión |
| `/login` | Static | OTP glasmórfico, sin registro público |
| `/dashboard` | Dynamic SSR | El Libro Mayor con Realtime |
| `/api/reporte` | API Route | Procesa reportes de campo con service_role |
| `/reporte/[token]` | Dynamic SSR | Sensor de Campo mobile-first |

### Archivos creados

```
U4V/
├── middleware.ts                          # Protección de rutas
├── tsconfig.json                          # Excluye supabase/functions (Deno)
├── .env.local.example                     # Template de variables
├── supabase/
│   ├── migrations/001_initial_schema.sql  # 4 tablas + RLS + 8 nodos seed
│   └── functions/dispatch-notifier/       # Edge Function (CallMeBot stub)
└── src/
    ├── app/
    │   ├── layout.tsx                     # Dark mode forzado, fuente Inter
    │   ├── login/page.tsx                 # Login OTP 2-pasos
    │   ├── dashboard/
    │   │   ├── page.tsx                   # Server Component con fetch inicial
    │   │   └── DashboardClient.tsx        # Realtime + filtros + modales
    │   ├── reporte/[token]/page.tsx       # Valida token, renderiza formulario
    │   └── api/reporte/route.ts           # POST: valida→inserta→invalida→recalcula
    ├── components/
    │   ├── auth/TermsModal.tsx            # Bloqueo legal (sin X, scroll obligatorio)
    │   ├── dashboard/
    │   │   ├── NodeTable.tsx             # Grid de nodos + barras de déficit
    │   │   ├── TimeSlotCell.tsx          # Celda libre/ocupada de franja
    │   │   └── DispatchModal.tsx         # Modal Manifiesto (2 campos)
    │   └── field/FieldReportForm.tsx      # Formulario mobile-first del chofer
    ├── lib/supabase/
    │   ├── client.ts                      # createBrowserClient
    │   └── server.ts                      # createServerClient (SSR cookies)
    └── types/database.ts                  # Tipos TS: Perfil, Nodo, Despacho, Reporte
```

---

## Próximo paso obligatorio: Conectar Supabase

### 1. Crear proyecto en Supabase
Ve a [supabase.com](https://supabase.com) → New Project → anota la URL y las keys.

### 2. Ejecutar la migración SQL
En tu proyecto Supabase → **SQL Editor** → pega y ejecuta:
```
/home/august/code/U4V/supabase/migrations/001_initial_schema.sql
```
Esto crea: 4 ENUMs, 4 tablas, constraints, RLS policies y 8 nodos geográficos de seed.

### 3. Configurar variables de entorno
```bash
cp /home/august/code/U4V/.env.local.example /home/august/code/U4V/.env.local
```
Edita `.env.local` con tus valores reales:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Habilitar Realtime en Supabase
Dashboard → **Database** → **Replication** → activar para `despachos` y `nodos_geograficos`.

### 5. Pre-registrar el primer usuario (Admin)
En Supabase Dashboard → **Authentication** → **Users** → Invite user (correo del admin).
Luego en SQL Editor:
```sql
INSERT INTO public.perfiles (id, nombre_organizacion, rol)
VALUES ('<UUID-del-usuario>', 'Torre de Control U4V', 'admin');
```

---

## Flujos verificables (manual)

| Flujo | Cómo probarlo |
|---|---|
| Login OTP | `/login` → correo pre-registrado → código → dashboard |
| Bloqueo ToS | Primer login con `terminos_aceptados=false` → modal aparece, sin X |
| Manifiesto | Click en franja libre → modal → 2 campos → confirmar → slot pintado en todos los tabs |
| Anti-colisión | 2 tabs en la misma franja → solo uno triunfa (error 409) |
| Sensor de campo | `/reporte/<token-válido>` → formulario mobile → enviar → token anulado |
| Recálculo | Reporte con menos raciones → déficit del nodo aumenta |

---

## Deploy en Vercel

```bash
# Desde el directorio del proyecto
npx vercel --prod
```

Configura las variables de entorno en el dashboard de Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Activar notificaciones WhatsApp (cuando tengas CallMeBot)

1. Obtén tu API Key de [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/)
2. Añade `CALLMEBOT_API_KEY=<tu-key>` al `.env.local`
3. En `supabase/functions/dispatch-notifier/index.ts` descomenta el bloque CallMeBot (líneas ~57-65)
4. Deploy de la Edge Function:
   ```bash
   npx supabase functions deploy dispatch-notifier
   ```
5. Configura el cron en Supabase Dashboard → Edge Functions → dispatch-notifier → Schedule:
   `0 12,18,22 * * *` (UTC) → equivale a 8AM, 2PM, 6PM Venezuela (UTC-4)

---

## Notas técnicas

- **`middleware.ts`** está en la raíz del proyecto (no en `/src`) — requerido por Next.js 16
- **`supabase/functions/`** está excluido del `tsconfig.json` — son archivos Deno con su propio runtime
- **Select nativo** en `DispatchModal` — `@base-ui/react/select` (instalado por shadcn) tiene API diferente a Radix; se usó `<select>` HTML nativo estilizado
- **Sin Database generic** en los clientes Supabase — los tipos del cliente se manejan con cast explícito en los componentes para evitar conflictos con la versión de `@supabase/ssr`
