// src/components/AuthView.tsx
import { useState } from 'react'
import { Lock, Mail, User, ArrowLeft } from 'lucide-react'
import { ZonaEliteLogo } from '@/components/Logo'
import { authApi } from '@/api/auth'
import type { ViewState } from '@/types'

import { GoogleLogin } from '@react-oauth/google'

// Remove global google interface since we use @react-oauth/google

type AuthMode = 'login' | 'register' | 'recover' | 'verify'

interface Props {
  onNavigate: (v: ViewState) => void
  onLogin: (token: string, user: any) => void
}

export function AuthView({ onNavigate, onLogin }: Props) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [planType, setPlanType] = useState('Entrenamiento Funcional - Plan Básico')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogleSuccess(credentialResponse: any) {
    if (credentialResponse.credential) {
      await submit(() => authApi.googleLogin(credentialResponse.credential))
    }
  }

  function handleGoogleError() {
    setError('Error al conectar con Google')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    await submit(() => authApi.login(email, password))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await authApi.register(name, email, password, planType)
      if ((response as any).needsVerification) {
        setMode('verify')
        setSuccess('¡Registro exitoso! Ingresa el código enviado a tu correo. IMPORTANTE: Contáctanos al WA para activar tu plan y método de pago.')
      } else {
        onLogin(response.token, response.user)
        onNavigate(response.user.role as ViewState)
      }
    } catch (err: any) {
      setError(err.message ?? 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    await submit(() => authApi.verifyCode(email, code))
  }

  async function submit(fn: () => Promise<{ token: string; user: any }>) {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { token, user } = await fn()
      onLogin(token, user)
      onNavigate(user.role as ViewState)
    } catch (err: any) {
      setError(err.message ?? 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row fade-in text-foreground">

      {/* ── Left panel (decorative) ── */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-card items-center justify-center p-16 border-r border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(47_96%_53%/0.08)_0%,transparent_70%)]" />
        <div className="relative z-10 text-center space-y-6">
          <ZonaEliteLogo />
          <h2 className="text-3xl font-heading font-bold uppercase leading-tight">
            El Sistema de Reservas<br />Para Atletas de Verdad
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Gestiona tus turnos, controla tu progreso y entrena en un entorno de élite.
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 relative">
        <button
          onClick={() => onNavigate('landing')}
          className="absolute top-6 left-6 text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft size={15} /> Volver
        </button>

        <div className="w-full max-w-sm space-y-6">

          {/* Messages banner */}
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm font-medium animate-in">{error}</div>}
          {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-sm font-medium animate-in">{success}</div>}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <div className="space-y-6 animate-in">
              <div>
                <h1 className="text-3xl font-heading font-bold">Iniciar Sesión</h1>
                <p className="text-muted-foreground text-sm mt-1">Accede a tu panel de reservas.</p>
              </div>

              <form className="space-y-4" onSubmit={handleLogin}>
                <Field label="Correo" type="email" value={email} onChange={setEmail} placeholder="atleta@ejemplo.com" />
                <Field
                  label="Contraseña" type="password" value={password} onChange={setPassword}
                  placeholder="••••••••"
                  extra={
                    <button type="button" onClick={() => setMode('recover')} className="text-xs text-primary hover:underline">
                      ¿La olvidaste?
                    </button>
                  }
                />
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
                  {loading ? 'Accediendo…' : 'Iniciar Sesión'}
                </button>
              </form>

              {/* Google divider */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">o continuar con</span>
                  <div className="flex-1 border-t border-border" />
                </div>
                <div className="flex justify-center mt-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    width="380px"
                  />
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <button onClick={() => setMode('register')} className="text-foreground font-semibold hover:text-primary transition-colors">
                  Regístrate
                </button>
              </p>
            </div>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <div className="space-y-6 animate-in">
              <div>
                <h1 className="text-3xl font-heading font-bold">Crear Cuenta</h1>
                <p className="text-muted-foreground text-sm mt-1">Únete y reserva tus horarios.</p>
              </div>

              <form className="space-y-4" onSubmit={handleRegister}>
                <Field label="Nombre Completo" type="text" value={name} onChange={setName} placeholder="Tu nombre" />
                <Field label="Correo" type="email" value={email} onChange={setEmail} placeholder="atleta@ejemplo.com" />
                <Field label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Plan de Entrenamiento</label>
                  <select 
                    value={planType}
                    onChange={e => setPlanType(e.target.value)}
                    className="form-input w-full bg-background border border-border rounded-lg px-4 py-3"
                  >
                    <option value="Entrenamiento Funcional - Plan Básico">Fuerza Básico (3 días/sem) - $170.000</option>
                    <option value="Entrenamiento Funcional - Plan Avanzado">Fuerza Avanzado (5 días/sem) - $230.000</option>
                    <option value="Plan Élite Básico (Deportistas)">Élite Básico (1 día/sem) - $160.000</option>
                    <option value="Plan Élite Avanzado">Élite Avanzado (2 días/sem) - $280.000</option>
                  </select>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
                  {loading ? 'Creando cuenta…' : 'Crear Cuenta'}
                </button>
              </form>

              {/* Google divider */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">o continuar con</span>
                  <div className="flex-1 border-t border-border" />
                </div>
                <div className="flex justify-center mt-4">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    width="380px"
                  />
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => setMode('login')} className="text-foreground font-semibold hover:text-primary transition-colors">
                  Inicia sesión
                </button>
              </p>
            </div>
          )}

          {/* ── RECOVER ── */}
          {mode === 'recover' && (
            <div className="space-y-6 animate-in">
              <div>
                <h1 className="text-3xl font-heading font-bold">Recuperar Acceso</h1>
                <p className="text-muted-foreground text-sm mt-1">Te enviaremos un enlace de restauración.</p>
              </div>
              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <Field label="Correo" type="email" value={email} onChange={setEmail} placeholder="atleta@ejemplo.com" />
                <button type="submit" className="btn-primary w-full py-3.5 mt-2">
                  Enviar Enlace
                </button>
              </form>
              <button
                onClick={() => setMode('login')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <ArrowLeft size={14} /> Volver al Login
              </button>
            </div>
          )}

          {/* ── VERIFY CODE ── */}
          {mode === 'verify' && (
            <div className="space-y-6 animate-in">
              <div>
                <h1 className="text-3xl font-heading font-bold">Verificar Correo</h1>
                <p className="text-muted-foreground text-sm mt-1">Hemos enviado un código a <strong className="text-foreground">{email}</strong>.</p>
              </div>

              <form className="space-y-4" onSubmit={handleVerifyCode}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-center block">Código de 6 dígitos</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="form-input text-center text-3xl tracking-[0.5em] font-bold py-4"
                  />
                </div>
                <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full py-3.5 mt-2">
                  {loading ? 'Verificando…' : 'Confirmar y Entrar'}
                </button>
              </form>

              <button
                onClick={() => setMode('login')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <ArrowLeft size={14} /> Volver al Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

/* ── Shared field component ── */
const Field = ({
  label, type, value, onChange, placeholder, extra,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  extra?: React.ReactNode
}) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium">{label}</label>
      {extra}
    </div>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        {type === 'email' ? <Mail size={16} /> : type === 'password' ? <Lock size={16} /> : <User size={16} />}
      </span>
      <input
        type={type}
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input"
      />
    </div>
  </div>
)
