'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Appointment {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduled_at?: string;
  service_name?: string;
  student_name?: string;
  student_id?: string;
  notes?: string;
  payment_status?: string;
  payment_method?: string;
}

const STATUS_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  confirmed: { label: 'Confirmada',  bg: 'var(--success-100)', fg: 'var(--success-600)' },
  pending:   { label: 'Pendiente',   bg: 'var(--warning-100)', fg: 'var(--warning-600)' },
  completed: { label: 'Completada',  bg: 'var(--ink-100)',     fg: 'var(--ink-600)' },
  cancelled: { label: 'Cancelada',   bg: 'var(--danger-100)',  fg: 'var(--danger-600)' },
};

const PAYMENT_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  approved:        { label: 'Pagado',           bg: 'var(--success-100)', fg: 'var(--success-600)' },
  pending_payment: { label: 'Pago pendiente',   bg: 'var(--warning-100)', fg: 'var(--warning-600)' },
  rejected:        { label: 'Pago rechazado',   bg: 'var(--danger-100)',  fg: 'var(--danger-600)' },
};

type FilterKey = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
const FILTERS: { id: FilterKey; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'cancelled', label: 'Canceladas' },
];

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
}

function needsWebpay(a: Appointment) {
  const notes = a.notes ?? '';
  const hasFlag = notes.toLowerCase().includes('pago: webpay');
  return hasFlag && (!a.payment_status || a.payment_status === 'pending' || a.payment_status === 'rejected');
}

export default function ReservasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [paying, setPaying] = useState('');

  useEffect(() => {
    api.get('/api/appointments')
      .then(r => {
        const d = r.data;
        setRows(Array.isArray(d) ? d : (d?.appointments ?? d?.data ?? []));
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();

  const upcoming = useMemo(() => rows
    .filter(a => {
      const t = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const open = a.status !== 'completed' && a.status !== 'cancelled';
      return open && t > now && (filter === 'all' || a.status === filter);
    })
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()),
  [rows, now, filter]);

  const past = useMemo(() => rows
    .filter(a => {
      const t = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const closed = a.status === 'completed' || a.status === 'cancelled';
      return (closed || t < now) && (filter === 'all' || a.status === filter);
    })
    .sort((a, b) => new Date(b.scheduled_at!).getTime() - new Date(a.scheduled_at!).getTime()),
  [rows, now, filter]);

  const handlePay = async (id: string) => {
    setPaying(id);
    try {
      const res = await api.post(`/api/appointments/${id}/payment/initiate`);
      const url = res.data?.redirectUrl ?? res.data?.url;
      if (url) window.location.href = url;
    } catch {
      setPaying('');
    }
  };

  const renderCard = (a: Appointment, dim = false) => {
    const st = STATUS_MAP[a.status] ?? STATUS_MAP.pending;
    const pt = a.payment_status ? PAYMENT_MAP[a.payment_status] : null;
    return (
      <Glass key={a.id} radius={18} style={{ padding: 16, opacity: dim ? 0.8 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.service_name ?? 'Servicio'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>
              {a.student_name ?? `Estudiante`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {pt && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: pt.bg, color: pt.fg }}>{pt.label}</span>}
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: st.bg, color: st.fg }}>{st.label}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-500)', marginBottom: 12 }}>
          <Icon name="calendar" size={14} color="var(--ink-400)" />
          {fmtDate(a.scheduled_at)}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {needsWebpay(a) && (
            <Button size="sm" disabled={paying === a.id} onClick={() => handlePay(a.id)} style={{ flex: 1 }}>
              {paying === a.id ? 'Procesando…' : 'Pagar con Webpay'}
            </Button>
          )}
          <button onClick={() => router.push(`/citas/${a.id}`)}
            style={{ flex: 1, height: 36, borderRadius: 10, background: 'rgba(10,22,40,0.06)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="eye" size={14} color="var(--ink-500)" /> Ver detalles
          </button>
        </div>
      </Glass>
    );
  };

  return (
    <div className="app-scroll" style={{ minHeight: '100dvh', overflowY: 'auto', background: 'var(--bg-aurora)', fontFamily: 'var(--font-body)', paddingBottom: 60 }}>
      <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="arrow_left" size={20} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink-900)' }}>Mis reservas</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>{rows.length} en total</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ padding: '0 20px 14px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding: '8px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, background: filter === f.id ? 'linear-gradient(180deg, #1BB9D6, #0E8AA5)' : 'rgba(255,255,255,0.78)', color: filter === f.id ? '#fff' : 'var(--ink-700)', backdropFilter: 'blur(14px)', boxShadow: filter === f.id ? '0 4px 10px rgba(14,138,165,0.25)' : 'none' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>Cargando…</div>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <Glass radius={20} style={{ padding: 48, textAlign: 'center' }}>
            <Icon name="calendar" size={40} color="var(--ink-300)" />
            <p style={{ fontSize: 15, color: 'var(--ink-500)', margin: '16px 0 0' }}>No hay reservas{filter !== 'all' ? ' con este filtro' : ''}</p>
          </Glass>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Próximas ({upcoming.length})</div>
                {upcoming.map(a => renderCard(a, false))}
              </>
            )}
            {past.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 12 }}>Historial ({past.length})</div>
                {past.map(a => renderCard(a, true))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
