import React from 'react';

const HOURS = Array.from({ length: 12 }, (_, i) => `${9 + i}:00`);

export default function AppointmentGrid({ appointments = [], days = [], onSlotClick, className = '' }) {
  const displayDays = days.length > 0 ? days : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="min-w-[700px]">
        <div className="grid gap-px mb-1" style={{ gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)` }}>
          <div className="p-2" />
          {displayDays.map((day, i) => (
            <div key={i} className="p-2 text-center text-sm font-semibold opacity-70">{day}</div>
          ))}
        </div>
        <div className="glass-card p-2 rounded-xl">
          {HOURS.map((hour) => (
            <div key={hour} className="grid gap-px" style={{ gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)` }}>
              <div className="p-2 text-xs opacity-50 text-right pr-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{hour}</div>
              {displayDays.map((day, di) => {
                const slotAppts = appointments.filter(a => a.day === di && a.hour === hour);
                return (
                  <div key={di} className={`p-1 rounded m-0.5 min-h-[36px] transition-all duration-200 ${slotAppts.length > 0 ? 'text-white text-xs font-medium cursor-pointer hover:shadow-md' : 'hover:bg-white/5 cursor-pointer'}`}
                    style={slotAppts.length > 0 ? { background: 'var(--brand-primary)' } : {}}
                    onClick={() => onSlotClick?.({ day: di, hour })}>
                    {slotAppts.length > 0 && <div className="truncate px-1">{slotAppts[0]?.clientName || slotAppts[0]?.servicio || 'Reservado'}</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
