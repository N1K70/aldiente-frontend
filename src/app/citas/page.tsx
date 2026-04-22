'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import { useAppointments } from '@/hooks/useAppointments';

type Tone = 'success' | 'warning' | 'ink';

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  confirmed: { label: 'Confirmada', tone: 'success' },
  pending:   { label: 'Pendiente',  tone: 'warning' },
  completed: { label: 'Completada', tone: 'ink' },
  cancelled: { label: 'Cancelada',  tone: 'ink' },
};

const tones: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: 'var(--success-100)', fg: 'var(--success-600)' },
  warning: { bg: 'var(--warning-100)', fg: 'var(--warning-600)' },
  ink:     { bg: 'var(--ink-100)',     fg: 'var(--ink-600)' },
};

function StatusBadge({ status }: { status: string }) {
  const { label, tone } = STATUS_MAP[status] ?? { label: status, tone: 'ink' as Tone };
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: tones[tone].bg, color: tones[tone].fg }}>{label}</span>;
}

function AppointmentsDesktop() {
  const router = useRouter();
  const [dtab, setDtab] = useState<0|1|2>(0);
  const { appointments, upcoming, past, loading } = useAppointments('patient');

  const displayed = dtab === 0 ? appointments : dtab === 1 ? upcoming : past;

  return (
    <DesktopShell role="patient" activeId="appts" title="Mis citas" subtitle="Historial y próximas visitas" ctaLabel="Agendar nueva" ctaIcon="plus" onCtaClick={() => router.push('/explorar')}>
      <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(10,22,40,0.04)', width: 'fit-content', marginBottom: 20 }}>
        {[`Todas (${appointments.length})`, `Próximas (${upcoming.length})`, `Pasadas (${past.length})`].map((t, i) => (
          <button key={t} onClick={() => setDtab(i as 0|1|2)} style={{ padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', background: dtab === i ? 'linear-gradient(180deg, #1BB9D6, #0E8AA5)' : 'transparent', color: dtab === i ? '#fff' : 'var(--ink-700)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)' }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-500)', fontSize: 14 }}>Cargando citas…</div>
      ) : displayed.length === 0 ? (
        <Glass radius={20} style={{ padding: 48, textAlign: 'center' }}>
          <Icon name="calendar" size={40} color="var(--ink-300)" />
          <div style={{ fontSize: 16, color: 'var(--ink-500)', marginTop: 16 }}>No hay citas en esta categoría</div>
          <Button size="md" style={{ marginTop: 16 }} onClick={() => router.push('/explorar')}>Agendar cita</Button>
        </Glass>
      ) : (
        <Glass hi radius={20} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1.5fr 1fr 1fr 120px 60px', padding: '14px 20px', fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--ink-200)' }}>
            <div>Fecha</div><div>Servicio</div><div>Estudiante</div><div>Clínica</div><div>Precio</div><div>Estado</div><div></div>
          </div>
          {displayed.map((r, i) => {
            const dateParts = r.date?.split(/[\s/-]/) ?? [];
            return (
              <div key={r.id || i} style={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1.5fr 1fr 1fr 120px 60px', padding: '16px 20px', alignItems: 'center', borderBottom: i < displayed.length - 1 ? '1px solid rgba(10,22,40,0.04)' : 'none', fontSize: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-700)', letterSpacing: '0.06em' }}>{dateParts[0] ?? ''}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{r.time ?? dateParts[1] ?? ''}</div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{r.service ?? '—'}</div>
                <div style={{ color: 'var(--ink-700)' }}>{r.student?.name ?? '—'}</div>
                <div style={{ color: 'var(--ink-600)', fontSize: 13 }}>{r.clinic?.name ? `${r.clinic.name}${r.clinic.box ? ` · Box ${r.clinic.box}` : ''}` : '—'}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>{r.price ? `$${r.price.toLocaleString('es-CL')}` : '—'}</div>
                <div><StatusBadge status={r.status} /></div>
                <div style={{ textAlign: 'right' }}><Icon name="chevron" size={16} color="var(--ink-400)" /></div>
              </div>
            );
          })}
        </Glass>
      )}
    </DesktopShell>
  );
}

export default function AppointmentsPage() {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const [tab, setTab] = useState<'next' | 'past'>('next');
  const { upcoming, past, loading } = useAppointments('patient');

  if (isDesktop) return <AppointmentsDesktop />;

  const items = tab === 'next' ? upcoming : past;

  return (
    <div className="app-scroll" style={{ minHeight: '100dvh', overflowY: 'auto', background: 'var(--bg-aurora)', paddingBottom: 40 }}>
      <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/home">
          <button style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow_left" size={20} />
          </button>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink-900)' }}>Mis citas</h1>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)' }}>
          {([['next', `Próximas (${upcoming.length})`], ['past', `Pasadas (${past.length})`]] as [string, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id as 'next' | 'past')} style={{ flex: 1, height: 40, borderRadius: 999, border: 'none', cursor: 'pointer', background: tab === id ? 'linear-gradient(180deg, #1BB9D6, #0E8AA5)' : 'transparent', color: tab === id ? '#fff' : 'var(--ink-700)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', boxShadow: tab === id ? '0 4px 10px rgba(14,138,165,0.25)' : 'none', transition: 'all 200ms' }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-500)', fontSize: 14 }}>Cargando…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.8)' }}>
            <Icon name="calendar" size={32} color="var(--ink-300)" />
            <p style={{ fontSize: 15, color: 'var(--ink-500)', margin: '12px 0 0', fontWeight: 500 }}>No hay citas</p>
          </div>
        ) : items.map((a, i) => {
          const dateParts = a.date?.split(/[\s/-]/) ?? [];
          const { bg, fg } = tones[(STATUS_MAP[a.status]?.tone ?? 'ink')];
          return (
            <Glass key={a.id || i} radius={20} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => router.push(`/citas/${a.id}`)}>
              <div style={{ width: 56, height: 64, borderRadius: 14, flexShrink: 0, background: 'linear-gradient(180deg, var(--brand-100), var(--brand-200))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{dateParts[0] ?? ''}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--brand-800)', letterSpacing: '-0.02em', lineHeight: 1 }}>{dateParts[1] ?? '—'}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{a.service ?? '—'}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 6 }}>{a.time ? `${a.time} · ` : ''}{a.student?.name ?? ''}</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: bg, color: fg }}>{STATUS_MAP[a.status]?.label ?? a.status}</span>
              </div>
              <Icon name="chevron" size={18} color="var(--ink-400)" />
            </Glass>
          );
        })}
      </div>
    </div>
  );
}
