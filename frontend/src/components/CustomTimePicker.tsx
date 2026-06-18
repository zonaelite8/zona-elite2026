import { useState } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

export function CustomTimePicker({ value, onChange, className }: { value: string, onChange: (v: string) => void, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentHour = parseInt(value.split(':')[0] || '8', 10);
  const currentMinute = parseInt(value.split(':')[1] || '0', 10);

  const setTime = (h: number, m: number) => {
    const formattedH = h.toString().padStart(2, '0');
    const formattedM = m.toString().padStart(2, '0');
    onChange(`${formattedH}:${formattedM}`);
  };

  const handleHourUp = () => setTime((currentHour + 1) % 24, currentMinute);
  const handleHourDown = () => setTime((currentHour - 1 + 24) % 24, currentMinute);
  
  // Pasos de 1 minuto
  const handleMinuteUp = () => setTime(currentHour, (currentMinute + 1) % 60);
  const handleMinuteDown = () => setTime(currentHour, (currentMinute - 1 + 60) % 60);

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 bg-secondary/50 hover:bg-secondary text-foreground text-sm font-semibold rounded-xl px-4 py-3 transition-colors border border-border ${className || ''}`}
      >
        <Clock size={16} className="text-primary" />
        {value || '--:--'}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div className="w-full max-w-[280px] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-4 border-b border-border bg-secondary/30 text-center">
              <h3 className="font-heading font-bold uppercase tracking-wider text-sm">Selecciona la Hora</h3>
            </div>
            
            <div className="flex justify-center items-center gap-6 p-8 bg-background">
              {/* Horas */}
              <div className="flex flex-col items-center gap-3">
                <button type="button" onClick={handleHourUp} className="p-2 bg-secondary/50 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95">
                  <ChevronUp size={24} />
                </button>
                <div className="text-5xl font-heading font-bold w-16 text-center tabular-nums">
                  {currentHour.toString().padStart(2, '0')}
                </div>
                <button type="button" onClick={handleHourDown} className="p-2 bg-secondary/50 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95">
                  <ChevronDown size={24} />
                </button>
              </div>
              
              <div className="text-5xl font-heading font-bold text-muted-foreground pb-2">:</div>
              
              {/* Minutos */}
              <div className="flex flex-col items-center gap-3">
                <button type="button" onClick={handleMinuteUp} className="p-2 bg-secondary/50 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95">
                  <ChevronUp size={24} />
                </button>
                <div className="text-5xl font-heading font-bold w-16 text-center text-primary tabular-nums">
                  {currentMinute.toString().padStart(2, '0')}
                </div>
                <button type="button" onClick={handleMinuteDown} className="p-2 bg-secondary/50 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95">
                  <ChevronDown size={24} />
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-secondary/30">
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors uppercase text-sm shadow-lg shadow-primary/20"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
