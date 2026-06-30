import type { Perfil } from '@/types/database'

/**
 * Calcula un puntaje de proximidad geográfica entre dos perfiles operativos
 * basado en la coincidencia atómica de subcampos geográficos estándar.
 * Max score: 100
 */
export function calcularPuntosCercania(perfilActual: Perfil, p: Perfil): number {
  let score = 0
  
  if (p.estado && perfilActual.estado && p.estado.trim().toLowerCase() === perfilActual.estado.trim().toLowerCase()) {
    score += 20
    if (p.municipio && perfilActual.municipio && p.municipio.trim().toLowerCase() === perfilActual.municipio.trim().toLowerCase()) {
      score += 20
      if (p.parroquia && perfilActual.parroquia && p.parroquia.trim().toLowerCase() === perfilActual.parroquia.trim().toLowerCase()) {
        score += 20
        if (p.sector && perfilActual.sector && p.sector.trim().toLowerCase() === perfilActual.sector.trim().toLowerCase()) {
          score += 20
          if (p.urbanizacion_residencia && perfilActual.urbanizacion_residencia && p.urbanizacion_residencia.trim().toLowerCase() === perfilActual.urbanizacion_residencia.trim().toLowerCase()) {
            score += 20
          }
        }
      }
    }
  }
  return score
}
