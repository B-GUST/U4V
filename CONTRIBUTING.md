# Contribuir a Unidos por Venezuela (U4V)
¡Gracias por tu interés en colaborar con U4V! Este proyecto busca canalizar el talento tecnológico para mitigar el impacto del sismo de 2026. Al unirte, estás ayudando directamente a coordinar la ayuda humanitaria en Venezuela.

## Cómo empezar
1. **Reporta Errores / Propón Mejoras**: Abre un Issue describiendo el problema, pasos para reproducir o la sugerencia operativa.
2. **Desarrolla una Solución**:
   - Haz un Fork del repositorio.
   - Crea una rama para tu contribución siguiendo las políticas de ramas:
     - `feature/descripcion` para nuevas funciones.
     - `fix/descripcion` para corrección de bugs.
     - `docs/descripcion` para documentación.
   - Realiza tus cambios y verifica que el proyecto compile sin errores (`npx tsc --noEmit`).
   - Envía tu Pull Request.

## Reglas de Código y Commits
* **Commits Semánticos (Conventional Commits)**: Los mensajes deben estructurarse de la forma `<tipo>(<scope>): <descripción>` (ej. `feat(auth): add offline token validator`). Tipos válidos: `feat`, `fix`, `docs`, `refactor`, `style`, `chore`.
* **Zero Trust**: No confíes en el estado del cliente. Todas las API Routes y Server Actions deben verificar al usuario con `supabase.auth.getUser()`.
* **Seguridad de Inventarios**: No agregues tablas ni campos de stock físico para evitar saqueos en ruta. Toda la estimación debe realizarse mediante manifiestos de despacho e iteraciones Monte Carlo.

## Licencia
Al contribuir al proyecto U4V, aceptas que tus contribuciones se publicarán bajo la Licencia MIT.
