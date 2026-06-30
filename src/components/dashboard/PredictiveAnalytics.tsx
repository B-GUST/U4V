'use client'

import { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import type { Perfil, NodoGeografico, DespachoIntermedio, TrasladoPaciente } from '@/types/database'
import { Button } from '@/components/ui/button'
import { calcularPuntosCercania } from '@/lib/proximity'

Chart.register(...registerables)

interface PredictiveAnalyticsProps {
  nodos: NodoGeografico[]
  despachos: any[] // Libro Mayor
  envios: DespachoIntermedio[] // Envíos activos
  traslados: TrasladoPaciente[] // Traslados hospitalarios
  perfilActual: Perfil
  perfilesRed: Perfil[]
}

export function PredictiveAnalytics({
  nodos,
  despachos,
  envios,
  traslados,
  perfilActual,
  perfilesRed,
}: PredictiveAnalyticsProps) {
  const [nodoSeleccionado, setNodoSeleccionado] = useState<string>('')
  
  const chartGeneralRef = useRef<HTMLCanvasElement | null>(null)
  const chartSimulacionRef = useRef<HTMLCanvasElement | null>(null)
  
  const chartGeneralInstance = useRef<Chart | null>(null)
  const chartSimulacionInstance = useRef<Chart | null>(null)

  // 1. Calcular acopios más cercanos por distancia topológica/parroquial
  const acopiosCercanos = perfilesRed
    .filter(p => p.id !== perfilActual.id && (p.tipo_entidad === 'centro_acopio' || p.tipo_entidad === 'ong'))
    .map(p => ({
      perfil: p,
      score: calcularPuntosCercania(perfilActual, p)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  // Seleccionar primer nodo por defecto
  useEffect(() => {
    if (nodos.length > 0 && !nodoSeleccionado) {
      setNodoSeleccionado(nodos[0].id)
    }
  }, [nodos, nodoSeleccionado])

  // Obtener datos del nodo seleccionado
  const nodoData = nodos.find(n => n.id === nodoSeleccionado)
  
  // Demanda Base de Comida = Población Estimada * 1.5 raciones diarias
  const poblacionBase = nodoData?.poblacion_estimada || 0
  let demandaBaseRaciones = Math.round(poblacionBase * 1.5)

  // Modulador de Demanda por Alojamiento/Traslados Aceptados
  // Si hay traslados asignados o completados a esta zona, aumentamos la demanda de insumos proporcionalmente
  const personasRehospedadas = traslados
    .filter(t => (t.estado === 'asignado' || t.estado === 'completado') && t.refugio_id)
    .filter(t => {
      const refugio = perfilesRed.find(p => p.id === t.refugio_id)
      if (!refugio || !nodoData) return false
      return (
        (refugio.urbanizacion_residencia && refugio.urbanizacion_residencia.trim().toLowerCase() === nodoData.urbanizacion_residencia?.trim().toLowerCase()) ||
        (refugio.sector && refugio.sector.trim().toLowerCase() === nodoData.sector?.trim().toLowerCase()) ||
        (refugio.parroquia && refugio.parroquia.trim().toLowerCase() === nodoData.parroquia?.trim().toLowerCase()) ||
        (refugio.municipio && refugio.municipio.trim().toLowerCase() === nodoData.municipio?.trim().toLowerCase())
      )
    })
    .reduce((sum, t) => sum + (t.cantidad_personas || 0), 0)

  // Aumentar la demanda: cada persona adicional consume 2 raciones diarias
  demandaBaseRaciones += (personasRehospedadas * 2)

  // Sumatoria de Raciones Despachadas Hoy a esta zona (sin revelar inventarios de stock físico)
  const racionesDespachadasHoy = despachos
    .filter(d => d.nodo_id === nodoSeleccionado && d.estado !== 'cancelado')
    .reduce((sum, d) => sum + (d.cantidad_declarada || 0), 0)

  // Simulación estocástica de Monte Carlo (500 iteraciones)
  const totalIteraciones = 500
  let deficits = 0
  let saturaciones = 0
  const puntosSimulados: number[] = []

  for (let i = 0; i < totalIteraciones; i++) {
    // Ruido de volatilidad de demanda del ±20%
    const variacion = 1 + (Math.random() * 0.4 - 0.2)
    const demandaSimulada = demandaBaseRaciones * variacion
    puntosSimulados.push(demandaSimulada)

    if (demandaSimulada > racionesDespachadasHoy) {
      deficits++
    } else if (racionesDespachadasHoy > demandaSimulada * 1.3) {
      saturaciones++
    }
  }

  const probColapso = ((deficits / totalIteraciones) * 100).toFixed(1)
  const probSaturacion = ((saturaciones / totalIteraciones) * 100).toFixed(1)

  // Renderizar Gráficas
  useEffect(() => {
    if (!chartGeneralRef.current) return

    // Destruir instancia anterior si existe
    if (chartGeneralInstance.current) {
      chartGeneralInstance.current.destroy()
    }

    const ctx = chartGeneralRef.current.getContext('2d')
    if (ctx) {
      chartGeneralInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: nodos.slice(0, 8).map(n => n.nombre_nodo),
          datasets: [
            {
              label: 'Población Estimada',
              data: nodos.slice(0, 8).map(n => n.poblacion_estimada),
              backgroundColor: 'rgba(20, 184, 166, 0.4)',
              borderColor: 'rgb(20, 184, 166)',
              borderWidth: 1.5,
              borderRadius: 6,
            },
            {
              label: 'Raciones Planificadas',
              data: nodos.slice(0, 8).map(n => {
                return despachos
                  .filter(d => d.nodo_id === n.id && d.estado !== 'cancelado')
                  .reduce((sum, d) => sum + (d.cantidad_declarada || 0), 0)
              }),
              backgroundColor: 'rgba(56, 189, 248, 0.4)',
              borderColor: 'rgb(56, 189, 248)',
              borderWidth: 1.5,
              borderRadius: 6,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#e4e4e7', font: { size: 10 } }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { size: 9 } } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa', font: { size: 9 } } }
          }
        }
      })
    }

    return () => {
      if (chartGeneralInstance.current) chartGeneralInstance.current.destroy()
    }
  }, [nodos, despachos])

  // Gráfico de Simulación de Monte Carlo
  useEffect(() => {
    if (!chartSimulacionRef.current || !nodoSeleccionado) return

    if (chartSimulacionInstance.current) {
      chartSimulacionInstance.current.destroy()
    }

    const ctx = chartSimulacionRef.current.getContext('2d')
    if (ctx) {
      // Ordenar puntos simulados para graficar curva de distribución
      const puntosOrdenados = [...puntosSimulados].sort((a, b) => a - b)
      
      chartSimulacionInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.from({ length: 50 }, (_, i) => Math.round(i * (totalIteraciones / 50))),
          datasets: [
            {
              label: 'Demanda Simulada (Raciones)',
              data: Array.from({ length: 50 }, (_, i) => {
                const idx = Math.min(totalIteraciones - 1, Math.round(i * (totalIteraciones / 50)))
                return puntosOrdenados[idx]
              }),
              borderColor: 'rgb(244, 63, 94)',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
            },
            {
              label: 'Suministros Despachados Fijos',
              data: Array.from({ length: 50 }, () => racionesDespachadasHoy),
              borderColor: 'rgb(34, 197, 94)',
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#e4e4e7', font: { size: 10 } }
            }
          },
          scales: {
            x: { display: false },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa', font: { size: 9 } } }
          }
        }
      })
    }

    return () => {
      if (chartSimulacionInstance.current) chartSimulacionInstance.current.destroy()
    }
  }, [nodoSeleccionado, demandaBaseRaciones, racionesDespachadasHoy])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Gráfico Población vs Raciones */}
        <div className="glass-strong rounded-3xl p-6 border border-white/5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-teal-400">📊 Población vs Raciones por Zona</h3>
            <p className="text-[10px] text-zinc-400">Comparativa directa entre la población de las zonas críticas y las raciones despachadas planificadas hoy.</p>
          </div>
          <div className="h-60 relative">
            <canvas ref={chartGeneralRef} />
          </div>
        </div>

        {/* Panel 2: Algoritmo de Proximidad de Centros de Acopio */}
        <div className="glass-strong rounded-3xl p-6 border border-white/5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-teal-400">📍 Centros de Distribución Cercanos</h3>
            <p className="text-[10px] text-zinc-400">Centros de acopio y ONGs de la red ordenados por cercanía con respecto a tu dirección ({perfilActual.municipio || 'Sin registrar'}).</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-teal-400 font-bold">
                  <th className="pb-2">Organización</th>
                  <th className="pb-2">Ubicación</th>
                  <th className="pb-2 text-right">Cercanía</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {acopiosCercanos.map(({ perfil: p, score }) => (
                   <tr key={p.id} className="hover:bg-white/5">
                    <td className="py-2.5 font-semibold text-white">{p.nombre_organizacion}</td>
                    <td className="py-2.5 text-zinc-400">
                      {p.urbanizacion_residencia ? `${p.urbanizacion_residencia}, ` : ''}
                      {p.sector ? `${p.sector}, ` : ''}
                      {p.parroquia}, {p.municipio}
                    </td>
                    <td className="py-2.5 text-right font-bold text-teal-300">
                      {score >= 100 ? 'Misma Urb/Res' : score >= 80 ? 'Mismo Sector' : score >= 60 ? 'Misma Parroquia' : score >= 40 ? 'Mismo Municipio' : score >= 20 ? 'Mismo Estado' : 'Diferente Región'}
                    </td>
                  </tr>
                ))}
                {acopiosCercanos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-zinc-500">No hay otros centros de acopio registrados en la red.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Panel 3: Simulación de Colapso de Recursos */}
      <div className="glass-strong rounded-3xl p-6 border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
              <span>🔮</span> Simulación Estocástica de Colapso de Recursos (Monte Carlo)
            </h3>
            <p className="text-[10px] text-zinc-400">Predicción probabilística de desabastecimiento basada en volatilidad de demanda de ±20% y traslados activos.</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="select_nodo_analytics" className="text-xs text-zinc-400">Seleccionar Zona:</label>
            <select
              id="select_nodo_analytics"
              value={nodoSeleccionado}
              onChange={(e) => setNodoSeleccionado(e.target.value)}
              className="bg-zinc-900 border border-white/10 text-white text-xs rounded-xl px-3 py-1.5 focus:border-teal-500"
            >
              {nodos.map(n => (
                <option key={n.id} value={n.id}>{n.nombre_nodo}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {/* Métricas de Simulación */}
            <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Población Estimada:</span>
                <span className="font-bold text-white font-mono">{poblacionBase} personas</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Personas Relocalizadas:</span>
                <span className="font-bold text-teal-400 font-mono">+{personasRehospedadas}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-zinc-400">Demanda Estimada (Raciones):</span>
                <span className="font-bold text-teal-300 font-mono">{demandaBaseRaciones} / día</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Raciones Despachadas Hoy:</span>
                <span className="font-bold text-emerald-400 font-mono">{racionesDespachadasHoy}</span>
              </div>
            </div>

            {/* Probabilidades Calculadas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
                <div className="text-[10px] text-red-400 font-bold uppercase">Riesgo de Desabastecimiento</div>
                <div className="text-2xl font-mono font-extrabold text-red-300 mt-1">{probColapso}%</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                <div className="text-[10px] text-amber-400 font-bold uppercase">Riesgo de Saturación</div>
                <div className="text-2xl font-mono font-extrabold text-amber-300 mt-1">{probSaturacion}%</div>
              </div>
            </div>
            
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              * El riesgo se calcula corriendo 500 iteraciones del escenario actual. Un riesgo de desabastecimiento mayor al 30% indica que se deben programar envíos adicionales urgentes a la zona.
            </p>
          </div>

          <div className="lg:col-span-2 h-64 relative">
            <canvas ref={chartSimulacionRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
