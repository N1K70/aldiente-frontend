'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Button, Glass } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import { useAppointments } from '@/hooks/useAppointments';
import { useProfile } from '@/hooks/useProfile';
import { api } from '@/lib/api';

const STATUS_MAP = {
  confirmed: { label: 'Confirmada', color: 'var(--success-700)', bg: 'var(--success-100)' },
  pending:   { label: 'Pendiente',  color: 'var(--warning-700)', bg: 'var(--warning-100)' },
  completed: { label: 'Completada', color: 'var(--ink-600)',     bg: 'var(--ink-100)' },
  cancelled: { label: 'Cancelada',  color: 'var(--ink-500)',     bg: 'var(--ink-100)' },
};

function DashboardDesktop() {
  const router = useRouter();
  const { user } = useAuth();
  const { appointments, upcoming, loading, refresh } = useAppointments('student');
  const { profile } = useProfile('student');
  const firstName = user?.name?.split(' ')[0] ?? 'tú';

  const supervisorName = profile.supervisor_name ?? (profile as Record<string, unknown>).supervisorName as string | undefined;
  const supervisorTitle = profile.supervisor_title ?? (profile as Record<string, unknown>).supervisorTitle as string | undefined;

  const pendingRequests = appointments.filter(a => a.status === 'pending');

  const acceptRequest = async (id: string) => {
    try { await api.put(`/api/appointments/${id}/confirm`); refresh(); } catch { /* silent */ }
  };
  const rejectRequest = async (id: string) => {
    try { await api.put(`/api/appointments/${id}/cancel`); refresh(); } catch { /* silent */ }
  };
  const todayAppts = upcoming.slice(0, 5);

  const toneMap = { brand: { bg: 'var(--brand-100)', fg: 'var(--brand-700)' }, success: { bg: 'var(--success-100)', fg: 'var(--success-600)' }, warning: { bg: 'var(--warning-100)', fg: 'var(--warning-600)' } } as const;

  return (
    <DesktopShell role="student" activeId="home" title={`Buenos días, ${firstName} ✨`} subtitle={`Tienes ${upcoming.length} cita${upcoming.length !== 1 ? 's' : ''} próxima${upcoming.length !== 1 ? 's' : ''} · ${pendingRequests.length} solicitud${pendingRequests.length !== 1 ? 'es' : ''} pendiente${pendingRequests.length !== 1 ? 's' : ''}`}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { v: `${upcoming.length}`, l: 'Citas próximas',    trend: 'activas',    tint: '#6366F1', icon: 'check' },
          { v: `${appointments.filter(a => a.status === 'completed').length}`, l: 'Completadas', trend: 'total', tint: '#10B981', icon: 'sparkle' },
          { v: `${pendingRequests.length}`, l: 'Pendientes', trend: 'nuevas',     tint: '#F59E0B', icon: 'star' },
          { v: `${appointments.length}`, l: 'Total citas',  trend: 'este mes',   tint: '#10A9C6', icon: 'shield' },
        ].map(k => (
          <Glass key={k.l} radius={18} style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${k.tint}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={k.icon as Parameters<typeof Icon>[0]['name']} size={20} color={k.tint} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: k.tint, padding: '3px 8px', borderRadius: 999, background: `${k.tint}14` }}>{k.trend}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em', lineHeight: 1 }}>{loading ? '…' : k.v}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4, fontWeight: 500 }}>{k.l}</div>
          </Glass>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <Glass hi radius={20} style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>Próximas citas</div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{upcoming.length} citas</div>
            </div>
            <button style={{ background: 'none', border: 'none', color: 'var(--brand-700)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={() => router.push('/agenda')}>Ver agenda →</button>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>Cargando…</div>
          ) : todayAppts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>No hay citas próximas</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayAppts.map((a, i) => {
                const st = STATUS_MAP[a.status] ?? STATUS_MAP.pending;
                return (
                  <div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(10,22,40,0.04)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', width: 70, flexShrink: 0 }}>{a.time ?? a.date.split(/[\s/-]/)[1] ?? '—'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{a.service ?? '—'}</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{a.patient?.name ?? '—'}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: st.bg, color: st.color }}>{st.label}</span>
                    <Icon name="chevron" size={16} color="var(--ink-400)" />
                  </div>
                );
              })}
            </div>
          )}
        </Glass>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Glass hi radius={18} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--danger-500)' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Solicitudes pendientes</div>
            </div>
            {loading ? (
              <div style={{ fontSize: 14, color: 'var(--ink-400)', padding: '8px 0' }}>Cargando…</div>
            ) : pendingRequests.length === 0 ? (
              <div style={{ fontSize: 14, color: 'var(--ink-400)', padding: '8px 0' }}>Sin solicitudes pendientes</div>
            ) : pendingRequests.slice(0, 3).map((r, i) => (
              <div key={r.id || i} style={{ padding: '12px 0', borderTop: i ? '1px solid rgba(10,22,40,0.06)' : 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{r.patient?.name ?? '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 8 }}>{r.service ?? '—'}{r.date ? ` · ${r.date}` : ''}{r.time ? ` · ${r.time}` : ''}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" onClick={() => acceptRequest(r.id)}>Aceptar</Button>
                  <Button size="sm" variant="ghost" onClick={() => rejectRequest(r.id)}>Rechazar</Button>
                </div>
              </div>
            ))}
          </Glass>

          {supervisorName && (
            <Glass radius={18} style={{ padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Tu supervisor/a</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #FDE68A, #F59E0B)', color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {supervisorName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{supervisorName}</div>
                  {supervisorTitle && <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{supervisorTitle}</div>}
                </div>
              </div>
              <Button size="sm" full variant="glass" icon="chat" onClick={() => router.push('/chat')}>Enviar mensaje</Button>
            </Glass>
          )}
        </div>
      </div>
    </DesktopShell>
  );
}

export default function DashboardPage() {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'upcoming' | 'requests'>('upcoming');
  const { upcoming, loading, appointments, refresh } = useAppointments('student');
  const pendingRequests = appointments.filter(a => a.status === 'pending');

  const acceptMobile = async (id: string) => {
    try { await api.put(`/api/appointments/${id}/confirm`); refresh(); } catch { /* silent */ }
  };
  const rejectMobile = async (id: string) => {
    try { await api.put(`/api/appointments/${id}/cancel`); refresh(); } catch { /* silent */ }
  };

  if (isDesktop) return <DashboardDesktop />;

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', paddingBottom: 100 }}>
      <div style={{ padding: '56px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: '0 0 2px' }}>Panel estudiante</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink-900)' }}>
              Hola, {user?.name?.split(' ')[0] ?? 'Estudiante'}
            </h1>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #4F46E5 0%, #10A9C6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff' }}>
            {initials}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { icon: 'calendar', label: 'citas realizadas', value: loading ? '…' : String(appointments.filter(a => a.status === 'completed').length) },
            { icon: 'star',     label: 'próximas',         value: loading ? '…' : String(upcoming.length) },
            { icon: 'users',    label: 'pendientes',       value: loading ? '…' : String(pendingRequests.length) },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, padding: '14px 12px', borderRadius: 18, textAlign: 'center', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 16px rgba(10,22,40,0.05)' }}>
              <Icon name={stat.icon as Parameters<typeof Icon>[0]['name']} size={18} color="var(--brand-500)" />
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)', margin: '4px 0 0', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8 }}>
        {(['upcoming', 'requests'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: tab === t ? '1.5px solid var(--brand-500)' : '1.5px solid transparent', background: tab === t ? 'var(--brand-500)' : 'rgba(255,255,255,0.6)', color: tab === t ? '#fff' : 'var(--ink-600)', transition: 'all 0.15s' }}>
            {t === 'upcoming' ? `Próximas (${upcoming.length})` : `Solicitudes (${pendingRequests.length})`}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-500)', fontSize: 14 }}>Cargando…</div>
        ) : tab === 'upcoming' ? (
          upcoming.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.8)' }}>
              <Icon name="calendar" size={32} color="var(--ink-300)" />
              <p style={{ fontSize: 15, color: 'var(--ink-500)', margin: '12px 0 0', fontWeight: 500 }}>No hay citas próximas</p>
            </div>
          ) : upcoming.map(apt => {
            const st = STATUS_MAP[apt.status] ?? STATUS_MAP.pending;
            return (
              <div key={apt.id} style={{ padding: 16, borderRadius: 20, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 16px rgba(10,22,40,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{apt.patient?.name ?? '—'}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-600)', marginTop: 1 }}>{apt.service ?? '—'}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, color: st.color, background: st.bg }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Icon name="calendar" size={14} color="var(--ink-400)" />
                  <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>{apt.date}{apt.time ? ` · ${apt.time}` : ''}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" variant="ghost" full onClick={() => router.push(`/citas/${apt.id}`)}>Ver detalles</Button>
                  <Button size="sm" full onClick={() => router.push('/chat')}><Icon name="chat" size={14} />Chat</Button>
                </div>
              </div>
            );
          })
        ) : (
          pendingRequests.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.8)' }}>
              <Icon name="bell" size={32} color="var(--ink-300)" />
              <p style={{ fontSize: 15, color: 'var(--ink-500)', margin: '12px 0 0', fontWeight: 500 }}>No hay solicitudes pendientes</p>
            </div>
          ) : pendingRequests.map(r => (
            <div key={r.id} style={{ padding: 16, borderRadius: 20, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.9)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{r.patient?.name ?? '—'}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-600)', marginBottom: 12 }}>{r.service ?? '—'}{r.date ? ` · ${r.date}` : ''}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" full onClick={() => acceptMobile(r.id)}>Aceptar</Button>
                <Button size="sm" variant="ghost" full onClick={() => rejectMobile(r.id)}>Rechazar</Button>
              </div>
            </div>
          ))
        )}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 max(14px, env(safe-area-inset-bottom))', background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderTop: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 -4px 24px rgba(10,22,40,0.07)' }}>
        {[
          { icon: 'home',     label: 'Inicio',       href: '/dashboard', active: true },
          { icon: 'calendar', label: 'Agenda',        href: '/agenda' },
          { icon: 'tooth',    label: 'Servicios',     href: '/servicios' },
          { icon: 'chat',     label: 'Mensajes',      href: '/chat' },
          { icon: 'user',     label: 'Perfil',        href: '/perfil' },
        ].map(t => (
          <button key={t.label} onClick={() => router.push(t.href)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '0 12px', color: t.active ? 'var(--brand-600)' : 'var(--ink-400)' }}>
            <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={22} color={t.active ? 'var(--brand-600)' : 'var(--ink-400)'} />
            <span style={{ fontSize: 10, fontWeight: t.active ? 700 : 500 }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
