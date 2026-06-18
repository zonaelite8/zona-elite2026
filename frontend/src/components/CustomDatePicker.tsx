import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export function CustomDatePicker({ selectedDate, onChange, className }: { selectedDate: Date, onChange: (d: Date) => void, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const emptyDays = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }); // Monday start

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 bg-secondary/50 hover:bg-secondary text-foreground text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors border border-border ${className || ''}`}
      >
        <CalendarIcon size={16} className="text-primary" />
        {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div className="w-full max-w-[320px] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 flex items-center justify-between border-b border-border bg-secondary/30">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft size={20} />
              </button>
              <span className="font-heading font-bold uppercase tracking-wider text-sm">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground uppercase mb-3">
                {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                {emptyDays.map((_, i) => <div key={`empty-${i}`} />)}
                {daysInMonth.map(date => {
                  const isSelected = isSameDay(date, selectedDate);
                  return (
                    <button
                      key={date.toString()}
                      onClick={() => {
                        onChange(date);
                        setIsOpen(false);
                      }}
                      className={`h-9 w-9 rounded-full mx-auto flex items-center justify-center text-sm font-bold transition-all ${
                        isSelected ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/40' : 
                        'hover:bg-secondary text-foreground'
                      }`}
                    >
                      {format(date, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
