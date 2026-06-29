# U4V — Unidos por Venezuela
## Sistema Operativo de Logística Post-Rescate

### Setup

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia `.env.local.example` a `.env.local` y rellena las variables:
   ```bash
   cp .env.local.example .env.local
   ```
3. Ejecuta el SQL de migración en el **SQL Editor de Supabase**:
   - Archivo: `supabase/migrations/001_initial_schema.sql`
4. Instala dependencias y arranca el servidor:
   ```bash
   npm install
   npm run dev
   ```

### Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Deploy**: Vercel

### Pre-registrar Centros de Acopio (Admin)

Solo el admin puede crear cuentas. En el SQL Editor de Supabase:

```sql
-- 1. Invitar al usuario vía Supabase Auth (usa el dashboard o la API)
-- 2. Luego insertar su perfil:
INSERT INTO public.perfiles (id, nombre_organizacion, rol, telefono_contacto)
VALUES (
  '<UUID del usuario de auth.users>',
  'ONG Rescate Caracas',
  'primera_linea',
  '+58412XXXXXXX'
);
```
