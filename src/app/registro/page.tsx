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
      const response = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative">
      {/* Fondo con gradiente radial */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md my-8">
        {/* Logo / Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass mb-3 border border-teal-500/30">
            <span className="text-2xl">🇻🇪</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Unidos por Venezuela</h1>
          <p className="text-muted-foreground text-sm mt-1">Registro de Organizaciones y Centros de Acopio</p>
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
                <h2 className="text-lg font-semibold">Crear Cuenta de Organización</h2>
                <p className="text-muted-foreground text-xs mt-1">
                  Completa los campos. Todos los campos de contacto son requeridos para coordinar notificaciones.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="nombre_organizacion" className="text-xs font-medium text-zinc-300">
                    Nombre de la Organización / Centro de Acopio
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
                      Correo institucional
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="whatsapp" className="text-xs font-medium text-zinc-300">
                      WhatsApp de la Organización
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
                      Teléfono SMS
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

                {error && (
                  <div className="urgencia-rojo rounded-xl px-3 py-2 text-xs border">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition-all duration-200 mt-2 text-sm"
                >
                  {loading ? 'Registrando...' : 'Registrar Organización'}
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
