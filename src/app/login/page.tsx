'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Iniciar sesión directamente con correo y contraseña
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (loginError) {
      setError('Correo o contraseña incorrectos. Verifica tus datos.')
    } else {
      // Redirigir al dashboard con sesión activa
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative bg-cover bg-center" style={{ backgroundImage: "url('/vzla.jpg')" }}>
      {/* Capa de overlay oscuro/teal sobre la imagen */}
      <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-xs pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass mb-4 border border-teal-500/30">
            <span className="text-2xl">🇻🇪</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Unidos por Venezuela</h1>
          <p className="text-muted-foreground text-sm mt-1">Sistema Operativo de Logística</p>
        </div>

        {/* Card de login */}
        <div className="glass-strong rounded-3xl p-6 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Acceso de Coordinadores</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Ingresa tus credenciales registradas para acceder al Libro Mayor.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Correo institucional
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="coordinador@ong.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/5 border-white/10 focus:border-teal-500/60 focus:ring-teal-500/20 rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
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
              disabled={loading || !email || !password}
              className="w-full h-11 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition-all duration-200"
              id="btn-iniciar-sesion"
            >
              {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            ¿Eres un nuevo centro de acopio?{' '}
            <a href="/registro" className="text-teal-400 hover:underline font-medium">
              Regístrate aquí
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          U4V · Sistema Logístico de Crisis · v0.1.0
        </p>
      </div>
    </div>
  )
}
