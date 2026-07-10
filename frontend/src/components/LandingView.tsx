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
              title="Entrenamientos Personalizados de Fuerza"
              desc="Sesiones enfocadas en hipertrofia y fuerza máxima. Espacio equipado con racks de competición y discos calibrados."
              badge="Máx. 5 personas / turno"
            />
            <ModalidadCard
              icon={<Activity className="text-primary w-10 h-10" />}
              title="Entrenamiento Personalizado de Deportistas"
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

      {/* ── Floating WhatsApp Button ── */}
      <a
        href="https://wa.me/573206950680"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500"
        title="Contáctanos por WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      </a>
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
