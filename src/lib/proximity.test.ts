import { describe, it, expect } from 'vitest'
import { calcularPuntosCercania } from './proximity'
import type { Perfil } from '@/types/database'

describe('calcularPuntosCercania', () => {
  const baseProfile: Partial<Perfil> = {
    id: 'user-1',
    estado: 'Distrito Capital',
    ciudad: 'Caracas',
    municipio: 'Libertador',
    parroquia: 'Catedral',
    sector: 'La Hoyada',
    urbanizacion_residencia: 'Residencias Centro'
  }

  it('debe devolver 0 si los estados son diferentes', () => {
    const p2: Partial<Perfil> = {
      ...baseProfile,
      id: 'user-2',
      estado: 'Zulia',
      municipio: 'Libertador' // Mismo municipio pero en estado diferente no debe acumular puntos
    }
    const score = calcularPuntosCercania(baseProfile as Perfil, p2 as Perfil)
    expect(score).toBe(0)
  })

  it('debe devolver 20 puntos si solo coincide el estado', () => {
    const p2: Partial<Perfil> = {
      ...baseProfile,
      id: 'user-2',
      municipio: 'Chacao', // Municipio diferente
      parroquia: 'Altamira'
    }
    const score = calcularPuntosCercania(baseProfile as Perfil, p2 as Perfil)
    expect(score).toBe(20)
  })

  it('debe devolver 40 puntos si coinciden estado y municipio', () => {
    const p2: Partial<Perfil> = {
      ...baseProfile,
      id: 'user-2',
      parroquia: 'El Recreo' // Parroquia diferente
    }
    const score = calcularPuntosCercania(baseProfile as Perfil, p2 as Perfil)
    expect(score).toBe(40)
  })

  it('debe devolver 60 puntos si coinciden estado, municipio y parroquia', () => {
    const p2: Partial<Perfil> = {
      ...baseProfile,
      id: 'user-2',
      sector: 'San Agustín' // Sector diferente
    }
    const score = calcularPuntosCercania(baseProfile as Perfil, p2 as Perfil)
    expect(score).toBe(60)
  })

  it('debe devolver 80 puntos si coinciden hasta el sector', () => {
    const p2: Partial<Perfil> = {
      ...baseProfile,
      id: 'user-2',
      urbanizacion_residencia: 'Residencias Parque' // Residencia diferente
    }
    const score = calcularPuntosCercania(baseProfile as Perfil, p2 as Perfil)
    expect(score).toBe(80)
  })

  it('debe devolver 100 puntos si coinciden todos los campos geográficos (misma urbanización/residencia)', () => {
    const p2: Partial<Perfil> = {
      ...baseProfile,
      id: 'user-2'
    }
    const score = calcularPuntosCercania(baseProfile as Perfil, p2 as Perfil)
    expect(score).toBe(100)
  })

  it('debe manejar valores nulos u omitidos con gracia sin arrojar errores', () => {
    const p2: Partial<Perfil> = {
      id: 'user-2',
      estado: null,
      municipio: null
    }
    const score = calcularPuntosCercania(baseProfile as Perfil, p2 as Perfil)
    expect(score).toBe(0)
  })
})
