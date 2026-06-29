'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/bgust-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.status === 404) {
        // La IP ha sido bloqueada. Recargamos la página para que el servidor
        // ejecute notFound() e invalide/oculte el endpoint por completo.
        window.location.reload()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Credenciales inválidas.')
      } else {
        // Redirigir al dashboard administrativo
        window.location.href = '/dashboard'
      }
    } catch (err) {
      console.error(err)
      setError('Error de conexión con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      {/* Fondo con gradiente radial */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass mb-4 border border-teal-500/30">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Acceso de Emergencia</h1>
          <p className="text-muted-foreground text-sm mt-1">Consola Privada de Control U4V</p>
        </div>

        {/* Card de login */}
        <div className="glass-strong rounded-3xl p-6 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Credenciales del Administrador</h2>
            <p className="text-muted-foreground text-xs mt-1">
              Solo cuentas con rol de super administrador autorizadas. Se aplican políticas de rate-limiting severas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Correo institucional
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@u4v.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña de acceso
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-11"
              />
            </div>

            {error && (
              <div className="urgencia-rojo rounded-xl px-3 py-2 text-sm border text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-all duration-200"
            >
              {loading ? 'Validando...' : 'Iniciar Acceso Seguro'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          U4V · Consola Administrativa · v0.1.0
        </p>
      </div>
    </div>
  )
}
