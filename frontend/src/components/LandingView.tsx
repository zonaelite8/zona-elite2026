// src/components/LandingView.tsx
import { ReactNode } from 'react'
import { Dumbbell, Activity, ArrowRight, MapPin } from 'lucide-react'
import { ZonaEliteLogo } from '@/components/Logo'
import type { ViewState } from '@/types'

interface Props {
  onNavigate: (v: ViewState) => void
}

export function LandingView({ onNavigate }: Props) {
  return (
    <div className="flex flex-col min-h-screen fade-in bg-background text-foreground">
      {/* ── Navbar ── */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <ZonaEliteLogo />
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('auth')}
            className="text-sm font-semibold hover:text-primary transition-colors hidden sm:block"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => onNavigate('auth')}
            className="btn-primary px-5 py-2 text-sm"
          >
            RESERVAR AHORA
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex items-center min-h-[72vh] px-6 lg:px-16 py-24">
        {/* background image */}
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-25"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
        </div>

        <div className="max-w-3xl space-y-6">
          <h1 className="text-5xl lg:text-7xl font-heading font-bold uppercase leading-tight">
            Reserva tu<br />
            <span className="text-primary">entrenamiento</span><br />
            de alto rendimiento
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl">
            Gestiona tus horarios, elige tu enfoque y asegura tu lugar en nuestras
            instalaciones de élite. Capacidad estrictamente limitada.
          </p>
          <button
            onClick={() => onNavigate('auth')}
            className="btn-primary flex items-center gap-2 group text-lg px-8 py-4 mt-4"
          >
            COMENZAR AHORA
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── Modalidades ── */}
      <section className="py-24 px-6 lg:px-16 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title">Nuestras Modalidades</h2>
            <p className="text-muted-foreground">
              Selecciona el enfoque que mejor se adapte a tus objetivos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <ModalidadCard
              icon={<Dumbbell className="text-primary w-10 h-10" />}
              title="Entrenamiento de Fuerza"
              desc="Sesiones enfocadas en hipertrofia y fuerza máxima. Espacio equipado con racks de competición y discos calibrados."
              badge="Máx. 5 personas / turno"
            />
            <ModalidadCard
              icon={<Activity className="text-primary w-10 h-10" />}
              title="Personalizado Deportivo"
              desc="Atención 1-a-1 o 2-a-1. Trabajos específicos de biomecánica, readaptación o gestos técnicos de tu deporte."
              badge="Máx. 2 personas / turno"
            />
          </div>
        </div>
      </section>

      {/* ── Ubicación ── */}
      <section className="py-24 px-6 lg:px-16 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <MapPin className="text-primary w-12 h-12" />
            </div>
            <h2 className="section-title">Nuestra Ubicación</h2>
            <p className="text-muted-foreground mb-8">
              Visítanos en el sector María Auxiliadora, Marinilla.
            </p>
            <a
              href="https://maps.app.goo.gl/2zWhv3G447U5S4qt8"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm font-bold tracking-wide"
            >
              <MapPin size={18} />
              CÓMO LLEGAR
            </a>
          </div>
          <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-border shadow-lg">
            <iframe
              src="https://maps.google.com/maps?q=Maria+Auxiliadora+marinilla&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-border bg-card px-6 mt-auto text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Zona Élite — Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}

/* ── Sub-component ── */
function ModalidadCard({
  icon, title, desc, badge,
}: {
  icon: ReactNode
  title: string
  desc: string
  badge: string
}) {
  return (
    <div className="card group">
      <div className="mb-6">{icon}</div>
      <h3 className="text-2xl font-heading font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground mb-6">{desc}</p>
      <span className="inline-block text-xs font-semibold bg-secondary text-secondary-foreground px-4 py-2 rounded-lg">
        {badge}
      </span>
    </div>
  )
}
