import { describe, it, expect, vi } from 'vitest'
import { generarTokenOffline } from './totp'

describe('generarTokenOffline', () => {
  const seed = 'test-operator-uuid-12345'

  it('debe generar un token de exactamente 6 caracteres', () => {
    const token = generarTokenOffline(seed)
    expect(token).toHaveLength(6)
  })

  it('debe ser determinista para la misma semilla y ventana de tiempo', () => {
    const token1 = generarTokenOffline(seed)
    const token2 = generarTokenOffline(seed)
    expect(token1).toBe(token2)
  })

  it('debe cambiar el token cuando cambia la ventana de tiempo (offset)', () => {
    const tokenActual = generarTokenOffline(seed, 0)
    const tokenSiguiente = generarTokenOffline(seed, 1)
    expect(tokenActual).not.toBe(tokenSiguiente)
  })

  it('debe utilizar únicamente caracteres válidos del alfabeto (evitando confusión visual)', () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const token = generarTokenOffline(seed)
    for (const char of token) {
      expect(alphabet).toContain(char)
    }
  })

  it('debe mantener la estabilidad temporal dentro de la misma franja de 4 horas', () => {
    const windowSize = 4 * 60 * 60 * 1000
    const baseTime = Math.floor(1770000000000 / windowSize) * windowSize // Alineado al inicio exacto de una ventana
    
    vi.useFakeTimers()
    vi.setSystemTime(new Date(baseTime + 1000)) // 1 segundo después del inicio de la ventana
    const token1 = generarTokenOffline(seed)

    // Avanzar 2 horas (dentro de la misma ventana de 4 horas)
    vi.setSystemTime(new Date(baseTime + 2 * 60 * 60 * 1000))
    const token2 = generarTokenOffline(seed)
    expect(token1).toBe(token2)

    // Avanzar 5 horas (cruza el límite de la ventana de 4 horas)
    vi.setSystemTime(new Date(baseTime + 5 * 60 * 60 * 1000))
    const token3 = generarTokenOffline(seed)
    expect(token1).not.toBe(token3)

    vi.useRealTimers()
  })
})
