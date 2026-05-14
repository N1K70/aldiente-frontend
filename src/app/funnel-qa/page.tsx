'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Glass, Icon } from '@/components/ui';
import { clearStoredFunnelEvents, getStoredFunnelEvents, type FunnelEvent } from '@/lib/frontend-analytics';

const EVENT_FILTERS = [
  'all',
  'funnel_visit',
  'funnel_signup_completed',
  'funnel_service_viewed',
  'funnel_booking_started',
  'funnel_payment_started',
  'funnel_payment_completed',
] as const;

export default function FunnelQaPage() {
  const [events, setEvents] = useState<FunnelEvent[]>([]);
  const [eventFilter, setEventFilter] = useState<(typeof EVENT_FILTERS)[number]>('all');

  const reload = () => {
    const stored = getStoredFunnelEvents();
    setEvents(stored.slice().reverse());
  };

  useEffect(() => {
    reload();
  }, []);

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return events;
    return events.filter(event => event.name === eventFilter);
  }, [eventFilter, events]);

  const exportFilteredEvents = () => {
    const data = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel-events-${eventFilter}-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', padding: '56px 20px 40px', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em' }}>
              Funnel QA
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
              {filteredEvents.length} de {events.length} evento(s)
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="glass" onClick={reload}>Recargar</Button>
            <Button size="sm" variant="glass" onClick={exportFilteredEvents} disabled={filteredEvents.length === 0}>Exportar JSON</Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                clearStoredFunnelEvents();
                setEvents([]);
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>

        <Glass radius={14} style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 700, textTransform: 'uppercase' }}>Filtro</div>
            <select
              value={eventFilter}
              onChange={event => setEventFilter(event.target.value as (typeof EVENT_FILTERS)[number])}
              style={{ height: 34, borderRadius: 10, border: '1px solid rgba(10,22,40,0.12)', background: 'rgba(255,255,255,0.9)', padding: '0 10px', fontSize: 13, color: 'var(--ink-900)' }}
            >
              {EVENT_FILTERS.map(item => (
                <option key={item} value={item}>
                  {item === 'all' ? 'Todos' : item}
                </option>
              ))}
            </select>
          </div>
        </Glass>

        {filteredEvents.length === 0 ? (
          <Glass radius={18} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)' }}>
            No hay eventos para este filtro.
          </Glass>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {filteredEvents.map((event, index) => (
              <Glass key={`${event.timestamp}-${index}`} radius={14} style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="sparkle" size={14} color="var(--brand-600)" />
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>{event.name}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 6 }}>
                  {new Date(event.timestamp).toLocaleString('es-CL')}
                </div>
                {event.route && (
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>
                    Ruta: {event.route}
                  </div>
                )}
                <pre style={{ margin: '10px 0 0', padding: 10, borderRadius: 10, background: 'rgba(10,22,40,0.05)', fontSize: 12, overflowX: 'auto', color: 'var(--ink-700)' }}>
{JSON.stringify(event.payload, null, 2)}
                </pre>
              </Glass>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
