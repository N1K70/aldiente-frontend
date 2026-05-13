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
  const [lastReloadAt, setLastReloadAt] = useState<string>('');

  const reload = () => {
    const stored = getStoredFunnelEvents();
    setEvents(stored.slice().reverse());
    setLastReloadAt(new Date().toISOString());
  };

  useEffect(() => {
    reload();
  }, []);

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return events;
    return events.filter(event => event.name === eventFilter);
  }, [eventFilter, events]);

  const coverage = useMemo(() => {
    const counts = events.reduce<Record<string, number>>((acc, event) => {
      acc[event.name] = (acc[event.name] ?? 0) + 1;
      return acc;
    }, {});
    return EVENT_FILTERS.filter(item => item !== 'all').map(name => ({
      name,
      present: Boolean(counts[name]),
      count: counts[name] ?? 0,
    }));
  }, [events]);
  const coverageCompleted = coverage.filter(item => item.present).length;
  const missingEvents = coverage.filter(item => !item.present).map(item => item.name);
  const [copied, setCopied] = useState(false);
  const coverageSummary = missingEvents.length === 0
    ? `Cobertura completa (${coverageCompleted}/${coverage.length})`
    : `Cobertura ${coverageCompleted}/${coverage.length}. Faltan: ${missingEvents.join(', ')}`;

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
            {eventFilter !== 'all' && (
              <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 999, background: 'rgba(16,169,198,0.12)', border: '1px solid rgba(16,169,198,0.25)', fontSize: 11, fontWeight: 700, color: 'var(--brand-700)' }}>
                Filtro activo: {eventFilter}
              </div>
            )}
            {lastReloadAt && (
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                Ultima recarga: {new Date(lastReloadAt).toLocaleString('es-CL')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="glass" onClick={reload}>Recargar</Button>
            <Button size="sm" variant="glass" onClick={exportFilteredEvents} disabled={filteredEvents.length === 0}>Exportar JSON</Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={eventFilter === 'all'}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(JSON.stringify(filteredEvents, null, 2));
                } catch {
                  // Ignore clipboard restrictions.
                }
              }}
            >
              Copiar filtrado
            </Button>
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

        <Glass radius={14} style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 700, textTransform: 'uppercase' }}>
              Cobertura de eventos
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-700)' }}>
              {coverageCompleted}/{coverage.length}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {coverage.map(item => (
              <div
                key={item.name}
                style={{
                  borderRadius: 10,
                  padding: '8px 10px',
                  background: item.present ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                  border: `1px solid ${item.present ? 'rgba(16,185,129,0.28)' : 'rgba(245,158,11,0.28)'}`,
                  fontSize: 12,
                  color: 'var(--ink-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span>{item.name}</span>
                <b style={{ color: item.present ? 'var(--success-700)' : 'var(--warning-700)' }}>
                  {item.present ? `OK (${item.count})` : 'FALTA'}
                </b>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-600)' }}>
            {missingEvents.length === 0 ? 'Cobertura completa en esta sesion.' : `Faltan: ${missingEvents.join(', ')}`}
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEventFilter('all')}
                disabled={eventFilter === 'all'}
              >
                Ver todos
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (missingEvents.length > 0) setEventFilter(missingEvents[0] as (typeof EVENT_FILTERS)[number]);
                }}
                disabled={missingEvents.length === 0}
              >
                Ver primer faltante
              </Button>
              <Button
                size="sm"
                variant="glass"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(coverageSummary);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  } catch {
                    // Ignore clipboard restrictions in some browsers.
                  }
                }}
              >
                {copied ? 'Copiado' : 'Copiar resumen'}
              </Button>
            </div>
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
