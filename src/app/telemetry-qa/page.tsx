'use client';

import { useEffect, useState } from 'react';
import { DesktopShell } from '@/components/desktop-shell';
import { Glass, Icon } from '@/components/ui';

type TelemetryEvent = {
  kind: 'funnel_event' | 'frontend_error';
  timestamp: string;
  route?: string;
  data: Record<string, unknown>;
};

export default function TelemetryQaPage() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telemetry', { cache: 'no-store' });
      const json = await res.json();
      setEvents(Array.isArray(json?.events) ? json.events : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <DesktopShell role="patient" activeId="home" title="Telemetry QA" subtitle="Eventos recibidos por /api/telemetry">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
        <Glass radius={18} style={{ padding: 16, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="bar_chart" size={18} color="var(--brand-700)" />
            <strong>Total: {events.length}</strong>
          </div>
          <button onClick={() => void load()} style={{ border: 'none', borderRadius: 12, padding: '8px 12px', background: 'var(--brand-500)', color: '#fff', cursor: 'pointer' }}>
            Recargar
          </button>
        </Glass>

        <Glass radius={18} style={{ padding: 12 }}>
          {loading ? (
            <div style={{ padding: 12 }}>Cargando eventos...</div>
          ) : events.length === 0 ? (
            <div style={{ padding: 12 }}>Sin eventos por ahora.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {events.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} style={{ border: '1px solid rgba(10,22,40,0.08)', borderRadius: 12, padding: 12, background: '#fff' }}>
                  <div style={{ fontSize: 13, color: 'var(--ink-700)', marginBottom: 6 }}>
                    <strong>{event.kind}</strong> · {event.timestamp} · {event.route || 'sin ruta'}
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--ink-900)' }}>
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </Glass>
      </div>
    </DesktopShell>
  );
}
