'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Step = 'email' | 'otp' | 'sent'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (error) {
      setError('No encontramos ese correo. Contacta al administrador de U4V.')
    } else {
      setStep('sent')
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    setLoading(false)
    if (error) {
      setError('Código incorrecto o expirado. Solicita uno nuevo.')
    } else {
      window.location.href = '/dashboard'
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
            <span className="text-2xl">🇻🇪</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Unidos por Venezuela</h1>
          <p className="text-muted-foreground text-sm mt-1">Sistema Operativo de Logística</p>
        </div>

        {/* Card de login */}
        <div className="glass-strong rounded-3xl p-6 shadow-2xl">
          {step === 'email' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold">Acceso de Coordinadores</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Ingresa tu correo registrado. Recibirás un código de verificación.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
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

                {error && (
                  <div className="urgencia-rojo rounded-xl px-3 py-2 text-sm border">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-11 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition-all duration-200"
                  id="btn-enviar-codigo"
                >
                  {loading ? 'Enviando...' : 'Enviar Código de Verificación'}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-4">
                ¿Eres un nuevo centro de acopio?{' '}
                <a href="/registro" className="text-teal-400 hover:underline font-medium">
                  Regístrate aquí
                </a>
              </p>
            </>
          )}

          {step === 'sent' && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-sm">
                    ✉️
                  </div>
                  <h2 className="text-lg font-semibold">Código enviado</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Revisa tu correo <span className="text-foreground font-medium">{email}</span>.
                  Ingresa el código de 6 dígitos.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium">
                    Código de verificación
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoComplete="one-time-code"
                    className="bg-white/5 border-white/10 focus:border-teal-500/60 text-center text-2xl tracking-widest font-mono rounded-xl h-14"
                  />
                </div>

                {error && (
                  <div className="urgencia-rojo rounded-xl px-3 py-2 text-sm border">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full h-11 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold"
                  id="btn-verificar-otp"
                >
                  {loading ? 'Verificando...' : 'Ingresar al Sistema'}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(null); setOtp('') }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-teal-400 transition-colors"
                >
                  ← Cambiar correo
                </button>
              </form>
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
