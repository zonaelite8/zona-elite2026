// src/components/AuthView.tsx
import { useState, useEffect } from 'react'
import { Lock, Mail, User, ArrowLeft } from 'lucide-react'
import { ZonaEliteLogo } from '@/components/Logo'
import { authApi } from '@/api/auth'
import { plansApi, Plan } from '@/api/plans'
import type { ViewState } from '@/types'

// Google login removed per user request

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
  const [success, setSuccess] = useState<React.ReactNode>('')
  const [loading, setLoading] = useState(false)
  const [dbPlans, setDbPlans] = useState<Plan[]>([])

  useEffect(() => {
    if (mode === 'register' && dbPlans.length === 0) {
      plansApi.getAll().then(plans => {
        const activePlans = plans.filter(p => p.is_active);
        setDbPlans(activePlans);
        if (activePlans.length > 0) {
          setPlanType(activePlans[0].name);
        }
      }).catch(console.error);
    }
  }, [mode, dbPlans.length]);
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
        setSuccess(
          <div>
            <p className="mb-3">¡Registro exitoso! Ingresa el código enviado a tu correo.</p>
            <p className="font-bold text-xs uppercase tracking-wider text-emerald-400 mb-2">IMPORTANTE: Activa tu plan</p>
            <p className="text-sm mb-4">Para configurar tu método de pago y que te habilitemos las clases, haz clic aquí:</p>
            <a 
              href={`https://wa.me/573206950680?text=${encodeURIComponent('Hola, me acabo de registrar en Zona Élite y quisiera activar mi plan.')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 px-4 rounded-lg font-bold hover:bg-[#20bd5a] transition-colors w-full shadow-lg shadow-[#25D366]/20"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Escribir al WhatsApp
            </a>
          </div>
        )
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
                    {dbPlans.length === 0 && <option value="Cargando planes...">Cargando planes...</option>}
                    {dbPlans.map(plan => (
                      <option key={plan.id} value={plan.name}>
                        {plan.name} {plan.price && parseFloat(plan.price) > 0 ? `- $${parseFloat(plan.price).toLocaleString()}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
                  {loading ? 'Creando cuenta…' : 'Crear Cuenta'}
                </button>
              </form>


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
