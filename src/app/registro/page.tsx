'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const phoneRegex = /^\+?[1-9]\d{10,14}$/

export default function RegistroPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre_organizacion: '',
    nombre_contacto: '',
    email: '',
    password: '',
    whatsapp: '',
    sms: '',
    tipo_entidad: 'ong',
    direccion_fisica: '',
    capacidad_hospedaje: 0,
    capacidad_salud_camas: 0,
    capacidad_raciones_diarias: 0,
    tipo_racion: 'ninguno',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function validateForm() {
    if (formData.nombre_organizacion.trim().length < 3) {
      return "El nombre de la organización debe tener al menos 3 caracteres."
    }
    if (formData.nombre_contacto.trim().length < 3) {
      return "El nombre del contacto debe tener al menos 3 caracteres."
    }
    if (!formData.email.includes('@')) {
      return "El correo electrónico ingresado no es válido."
    }
    if (formData.password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres."
    }
    if (!phoneRegex.test(formData.whatsapp)) {
      return "El número de WhatsApp no es válido. Debe tener formato internacional (ej: +584121234567) sin letras, espacios ni guiones."
    }
    if (!phoneRegex.test(formData.sms)) {
      return "El número de SMS no es válido. Debe tener formato internacional (ej: +584121234567) sin letras, espacios ni guiones."
    }
    if (formData.direccion_fisica.trim().length < 5) {
      return "La dirección física debe tener al menos 5 caracteres descriptivos."
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        capacidad_hospedaje: Number(formData.capacidad_hospedaje),
        capacidad_salud_camas: Number(formData.capacidad_salud_camas),
        capacidad_raciones_diarias: Number(formData.capacidad_raciones_diarias),
      }

      const response = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ocurrió un error inesperado.')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      console.error(err)
      setError('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => {
      const updated = { ...prev, [id]: value }
      
      // Ajustes automáticos de raciones si es 0
      if (id === 'capacidad_raciones_diarias') {
        const val = Number(value)
        if (val === 0) {
          updated.tipo_racion = 'ninguno'
        } else if (updated.tipo_racion === 'ninguno') {
          updated.tipo_racion = 'comida_bebida'
        }
      }
      return updated
    })
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative">
      {/* Fondo con gradiente radial */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg my-8">
        {/* Logo / Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass mb-3 border border-teal-500/30">
            <span className="text-2xl">🇻🇪</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Unidos por Venezuela</h1>
          <p className="text-muted-foreground text-sm mt-1">Registro de Organizaciones y Centros Operativos</p>
        </div>

        {/* Card de registro */}
        <div className="glass-strong rounded-3xl p-6 shadow-2xl">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center text-3xl mx-auto animate-pulse">
                ✓
              </div>
              <h2 className="text-xl font-semibold text-emerald-400">Registro Exitoso</h2>
              <p className="text-sm text-muted-foreground">
                Tu organización ha sido registrada correctamente. Redirigiéndote al acceso para coordinadores...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Crear Cuenta de Red Logística</h2>
                <p className="text-zinc-400 text-xs mt-1">
                  Ingresa tus datos operativos y de contacto para coordinar recursos de emergencia.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Información General */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">1. Información de la Organización</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="nombre_organizacion" className="text-xs font-medium text-zinc-300">
                        Nombre del Centro / ONG
                      </Label>
                      <Input
                        id="nombre_organizacion"
                        type="text"
                        placeholder="ONG Rescate Caracas"
                        value={formData.nombre_organizacion}
                        onChange={handleChange}
                        required
                        className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="tipo_entidad" className="text-xs font-medium text-zinc-300">
                        Tipo de Entidad
                      </Label>
                      <select
                        id="tipo_entidad"
                        value={formData.tipo_entidad}
                        onChange={handleChange}
                        className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-sm focus:border-teal-500/60 focus:ring-teal-500/20 w-full"
                      >
                        <option value="ong">ONG (Distribución / Apoyo)</option>
                        <option value="centro_acopio">Centro de Acopio (Depósito)</option>
                        <option value="refugio">Refugio / Albergue</option>
                        <option value="hospital">Hospital / Punto de Salud</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="direccion_fisica" className="text-xs font-medium text-zinc-300">
                      Ubicación / Dirección Física Completa
                    </Label>
                    <Input
                      id="direccion_fisica"
                      type="text"
                      placeholder="Calle 4 con Av. Francisco de Miranda, Chacao, Caracas"
                      value={formData.direccion_fisica}
                      onChange={handleChange}
                      required
                      className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10 text-sm"
                    />
                  </div>
                </div>

                {/* 2. Responsable y Credenciales */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">2. Responsable y Acceso</h3>
                  
                  <div className="space-y-1">
                    <Label htmlFor="nombre_contacto" className="text-xs font-medium text-zinc-300">
                      Nombre del Responsable / Contacto
                    </Label>
                    <Input
                      id="nombre_contacto"
                      type="text"
                      placeholder="María Pérez"
                      value={formData.nombre_contacto}
                      onChange={handleChange}
                      required
                      className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-medium text-zinc-300">
                        Correo de Acceso
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="coordinador@ong.org"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="password" className="text-xs font-medium text-zinc-300">
                        Contraseña
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Contacto Logístico (Notificaciones) */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">3. Enlaces de Comunicación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="whatsapp" className="text-xs font-medium text-zinc-300">
                        WhatsApp de Coordinación
                      </Label>
                      <Input
                        id="whatsapp"
                        type="text"
                        placeholder="+584121234567"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        required
                        className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="sms" className="text-xs font-medium text-zinc-300">
                        Teléfono para SMS urgentes
                      </Label>
                      <Input
                        id="sms"
                        type="text"
                        placeholder="+584121234567"
                        value={formData.sms}
                        onChange={handleChange}
                        required
                        className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Capacidades Operativas (Condicionales) */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">4. Capacidad de Ayuda</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Albergue */}
                    {(formData.tipo_entidad === 'refugio' || formData.tipo_entidad === 'hospital' || formData.tipo_entidad === 'otro') && (
                      <div className="space-y-1">
                        <Label htmlFor="capacidad_hospedaje" className="text-xs font-medium text-zinc-300">
                          Hospedaje (Personas)
                        </Label>
                        <Input
                          id="capacidad_hospedaje"
                          type="number"
                          min="0"
                          value={formData.capacidad_hospedaje}
                          onChange={handleChange}
                          required
                          className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10 text-sm"
                        />
                      </div>
                    )}

                    {/* Salud */}
                    {formData.tipo_entidad === 'hospital' && (
                      <div className="space-y-1">
                        <Label htmlFor="capacidad_salud_camas" className="text-xs font-medium text-zinc-300">
                          Camas Disponibles
                        </Label>
                        <Input
                          id="capacidad_salud_camas"
                          type="number"
                          min="0"
                          value={formData.capacidad_salud_camas}
                          onChange={handleChange}
                          required
                          className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10 text-sm"
                        />
                      </div>
                    )}

                    {/* Comedor / Alimentos */}
                    <div className="space-y-1">
                      <Label htmlFor="capacidad_raciones_diarias" className="text-xs font-medium text-zinc-300">
                        Comedor (Raciones/Día)
                      </Label>
                      <Input
                        id="capacidad_raciones_diarias"
                        type="number"
                        min="0"
                        value={formData.capacidad_raciones_diarias}
                        onChange={handleChange}
                        required
                        className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-10 text-sm"
                      />
                    </div>

                    {/* Tipo de Ración */}
                    {formData.capacidad_raciones_diarias > 0 && (
                      <div className="space-y-1">
                        <Label htmlFor="tipo_racion" className="text-xs font-medium text-zinc-300">
                          El Menú Incluye
                        </Label>
                        <select
                          id="tipo_racion"
                          value={formData.tipo_racion}
                          onChange={handleChange}
                          className="bg-zinc-900 border border-white/10 text-white rounded-xl h-10 px-3 text-sm focus:border-teal-500/60 focus:ring-teal-500/20 w-full"
                        >
                          <option value="comida_bebida">Comida y Bebida</option>
                          <option value="solo_comida">Solo Alimento</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="urgencia-rojo rounded-xl px-3 py-2 text-xs border text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all duration-200 mt-2 text-sm"
                >
                  {loading ? 'Registrando en la Red...' : 'Registrar en Unidos por Venezuela'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    onClick={() => router.push('/login')}
                    className="text-teal-400 hover:underline font-medium focus:outline-none"
                  >
                    Ingresa aquí
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          U4V · Sistema Logístico de Crisis · v0.1.0
        </p>
      </div>
    </div>
  )
}
