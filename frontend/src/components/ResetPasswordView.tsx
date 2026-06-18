import { useState, FormEvent } from 'react'
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import { ZonaEliteLogo } from '@/components/Logo'
import { authApi } from '@/api/auth'

interface Props {
  token: string
}

export function ResetPasswordView({ token }: Props) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e: FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await authApi.resetPassword(token, password)
      setSuccess(response.message || 'Contraseña restablecida exitosamente.')
    } catch (err: any) {
      setError(err.message ?? 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  function handleGoToLogin() {
    window.history.pushState({}, '', '/');
    window.location.href = '/';
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
          onClick={handleGoToLogin}
          className="absolute top-6 left-6 text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft size={15} /> Volver al Inicio
        </button>

        <div className="w-full max-w-sm space-y-6">
          {/* Messages banner */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm font-medium animate-in">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-6 animate-in text-center">
              <div className="flex justify-center">
                <CheckCircle size={64} className="text-emerald-500" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold">¡Todo listo!</h1>
                <p className="text-muted-foreground text-sm mt-2">{success}</p>
              </div>
              <button
                onClick={handleGoToLogin}
                className="btn-primary w-full py-3.5 mt-4"
              >
                Iniciar Sesión
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in">
              <div>
                <h1 className="text-3xl font-heading font-bold">Nueva Contraseña</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Ingresa tu nueva contraseña para acceder a tu cuenta.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleReset}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nueva Contraseña</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-input pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-foreground focus:outline-none z-10 text-[10px] font-bold uppercase tracking-wider bg-secondary border border-border px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Confirmar Contraseña</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-input pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-foreground focus:outline-none z-10 text-[10px] font-bold uppercase tracking-wider bg-secondary border border-border px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 mt-2"
                >
                  {loading ? 'Restableciendo…' : 'Actualizar Contraseña'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
