# U4V — Task Tracker

## Fase 1 — Setup e Infraestructura
- [x] Inicializar proyecto Next.js 16 en `/home/august/code/U4V/`
- [x] Instalar dependencias (Supabase, shadcn, date-fns, zod)
- [x] Inicializar shadcn/ui (estilo New York, base Slate, dark mode)
- [x] Configurar `globals.css` con sistema de diseño
- [x] Crear estructura de carpetas `/src/`
- [x] Crear `.env.local.example`
- [x] Crear script SQL `/supabase/migrations/001_initial_schema.sql`
- [x] Crear archivo de tipos TypeScript `/src/types/database.ts`

## Fase 2 — Auth y Seguridad
- [x] Crear clientes Supabase (`/src/lib/supabase/client.ts` y `server.ts`)
- [x] Crear `middleware.ts` (protección de rutas, en raíz del proyecto)
- [x] Crear `/src/app/login/page.tsx` (OTP glasmórfico)
- [x] Crear `TermsModal.tsx` (bloqueo legal, sin X de cierre)

## Fase 3 — Dashboard Operativo
- [x] Crear layout de dashboard con TopBar + panel de filtros
- [x] Crear `NodeTable.tsx` (Data Grid con Realtime)
- [x] Crear `TimeSlotCell.tsx` (celdas de franja horaria)
- [x] Crear `DispatchModal.tsx` (modal de Manifiesto)
- [x] Conectar suscripciones Realtime de Supabase

## Fase 4 — Sensor de Campo
- [x] Crear `/src/app/reporte/[token]/page.tsx`
- [x] Crear `FieldReportForm.tsx` (formulario mobile-first)
- [x] Crear API Route `/api/reporte` (valida token, inserta, invalida, recalcula)
- [x] Crear pantalla de éxito post-envío

## Fase 5 — Edge Function Notificaciones
- [x] Crear Supabase Edge Function `dispatch-notifier` (stub, listo para CallMeBot)
- [ ] Configurar cron schedule en Supabase dashboard

## Fase 6 — QA y Deploy
- [x] Seed de datos ficticios incluido en el SQL de migración (8 nodos reales)
- [x] `npm run build` — ✅ Build limpio, todas las rutas compiladas
- [ ] Configurar Vercel deployment
- [ ] Documentar instrucciones para conectar Supabase real
