import React from 'react';

const DEFAULT_HOURS = Array.from({ length: 12 }, (_, i) => `${String(9 + i).padStart(2, '0')}:00`);
const DEFAULT_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function normalizeHour(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return '';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function hourToMinutes(value) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export default function AppointmentGrid({ appointments = [], days = [], onSlotClick, className = '' }) {
  const displayDays = days.length > 0 ? days : DEFAULT_DAYS;
  const normalizedAppointments = appointments.map((appointment) => ({
    ...appointment,
    day: Number.isInteger(appointment.day) && appointment.day >= 0 && appointment.day < displayDays.length ? appointment.day : 0,
    hour: normalizeHour(appointment.hour),
  }));
  const displayHours = [...new Set([
    ...DEFAULT_HOURS,
    ...normalizedAppointments.map((appointment) => appointment.hour).filter(Boolean),
  ])].sort((first, second) => hourToMinutes(first) - hourToMinutes(second));

  function renderAppointmentLabel(appointment) {
    return appointment.clientName || appointment.servicio || 'Reservado';
  }

  return (
    <div className={className}>
      <div className="space-y-3 md:hidden">
        {normalizedAppointments.length === 0 ? (
          <p className="rounded-xl border border-white/10 p-4 text-center text-sm opacity-60">Sin citas para mostrar.</p>
        ) : normalizedAppointments.map((appointment, index) => {
          const Appointment = onSlotClick ? 'button' : 'div';
          const appointmentProps = onSlotClick ? {
            type: 'button',
            onClick: () => onSlotClick({ day: appointment.day, hour: appointment.hour }),
            'aria-label': `${displayDays[appointment.day] || 'Cita'} ${appointment.hour || ''}`,
          } : {};
          return (
            <Appointment key={appointment.id || index} className={`block w-full rounded-xl border border-white/10 bg-white/60 p-4 text-left ${onSlotClick ? 'cursor-pointer transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400' : ''}`} {...appointmentProps}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{displayDays[appointment.day] || 'Sin día'} · {appointment.hour || 'Sin horario'}</p>
              <p className="mt-1 break-words text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{renderAppointmentLabel(appointment)}</p>
              {appointment.servicio && appointment.clientName && <p className="mt-1 break-words text-xs opacity-70">{appointment.servicio}</p>}
            </Appointment>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
      <div className="min-w-[700px]">
        <div className="grid gap-px mb-1" style={{ gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)` }}>
          <div className="p-2" />
          {displayDays.map((day, i) => (
            <div key={i} className="p-2 text-center text-sm font-semibold opacity-70">{day}</div>
          ))}
        </div>
        <div className="glass-card p-2 rounded-xl">
          {displayHours.map((hour) => (
            <div key={hour} className="grid gap-px" style={{ gridTemplateColumns: `80px repeat(${displayDays.length}, 1fr)` }}>
              <div className="p-2 text-xs opacity-50 text-right pr-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{hour}</div>
              {displayDays.map((day, di) => {
                const slotAppts = normalizedAppointments.filter((appointment) => appointment.day === di && appointment.hour === hour);
                const Slot = onSlotClick ? 'button' : 'div';
                const slotProps = onSlotClick ? {
                  type: 'button',
                  onClick: () => onSlotClick({ day: di, hour }),
                  'aria-label': `${displayDays[di]} ${hour}`,
                } : {};
                return (
                  <Slot key={di} className={`m-0.5 min-h-[36px] rounded p-1 text-left transition-all duration-200 ${slotAppts.length > 0 ? 'text-xs font-medium text-white' : ''} ${onSlotClick ? 'cursor-pointer hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400' : ''}`}
                    style={slotAppts.length > 0 ? { background: 'var(--brand-primary)' } : {}}
                    {...slotProps}>
                    {slotAppts.length > 0 && <div className="truncate px-1">{renderAppointmentLabel(slotAppts[0])}</div>}
                  </Slot>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
