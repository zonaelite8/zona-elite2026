// src/components/Logo.tsx
export function ZonaEliteLogo() {
  return (
    <div className="flex items-center gap-2 text-primary font-heading tracking-widest font-bold text-xl sm:text-2xl">
      <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary rounded-lg flex flex-col items-center justify-center relative overflow-hidden shrink-0">
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-4 sm:w-5 h-[2px] bg-primary transform -rotate-45 origin-left" />
        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 w-5 sm:w-6 h-[2px] bg-primary" />
        <div className="absolute top-1/2 left-1.5 sm:left-2 w-4 sm:w-5 h-[2px] bg-primary -translate-y-1/2" />
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-4 sm:w-5 h-[2px] bg-primary" />
      </div>
      <div className="flex flex-col leading-none">
        <span>ZONA</span>
        <span>ÉLITE</span>
      </div>
    </div>
  )
}
