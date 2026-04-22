'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import { Button, Glass, Icon } from '@/components/ui';
import { useAppointments, type Appointment } from '@/hooks/useAppointments';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

type AgendaTab = 'upcoming' | 'requests' | 'history';
type ViewMode = 'calendar' | 'list';
type StatusFilter = 'all' | Appointment['status'];

const STATUS_META: Record<Appointment['status'], { label: string; bg: string; fg: string }> = {
  confirmed: { label: 'Confirmada', bg: 'var(--success-100)', fg: 'var(--success-600)' },
  pending: { label: 'Pendiente', bg: 'var(--warning-100)', fg: 'var(--warning-700)' },
  completed: { label: 'Completada', bg: 'var(--ink-100)', fg: 'var(--ink-600)' },
  cancelled: { label: 'Cancelada', bg: 'var(--danger-100)', fg: 'var(--danger-600)' },
};

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'cancelled', label: 'Canceladas' },
];

const TABS: Array<{ id: AgendaTab; label: string }> = [
  { id: 'upcoming', label: 'Proximas' },
  { id: 'requests', label: 'Solicitudes' },
  { id: 'history', label: 'Historial' },
];

function appointmentTimestamp(appointment: Appointment) {
  const value = appointment.scheduledAt ?? '';
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function sortAppointments(items: Appointment[]) {
  return [...items].sort((left, right) => {
    const leftTime = appointmentTimestamp(left) ?? Number.MAX_SAFE_INTEGER;
    const rightTime = appointmentTimestamp(right) ?? Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });
}

function formatDateTime(appointment: Appointment) {
  const timestamp = appointmentTimestamp(appointment);
  if (timestamp == null) {
    return [appointment.date, appointment.time].filter(Boolean).join(' · ') || 'Por confirmar';
  }

  const date = new Date(timestamp);
  return `${date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })} · ${date.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;
}

function formatDayLabel(appointment: Appointment) {
  const timestamp = appointmentTimestamp(appointment);
  if (timestamp == null) return appointment.date || 'Sin fecha';
  return new Date(timestamp).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTimeOnly(appointment: Appointment) {
  const timestamp = appointmentTimestamp(appointment);
  if (timestamp == null) return appointment.time || 'Por confirmar';
  return new Date(timestamp).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function statusMatches(appointment: Appointment, filter: StatusFilter) {
  if (filter === 'all') return true;
  return appointment.status === filter;
}

function groupByDay(items: Appointment[]) {
  const groups = new Map<string, Appointment[]>();

  for (const item of items) {
    const key = formatDayLabel(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  return Array.from(groups.entries()).map(([label, entries]) => ({
    label,
    items: sortAppointments(entries),
  }));
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Glass radius={20} style={{ padding: 40, textAlign: 'center' }}>
      <Icon name="calendar" size={34} color="var(--ink-300)" />
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', marginTop: 14 }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 6 }}>{description}</div>
    </Glass>
  );
}

function AgendaControls({
  tab,
  setTab,
  viewMode,
  setViewMode,
  filter,
  setFilter,
  counts,
}: {
  tab: AgendaTab;
  setTab: (tab: AgendaTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  filter: StatusFilter;
  setFilter: (filter: StatusFilter) => void;
  counts: Record<AgendaTab, number>;
}) {
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {TABS.map(option => (
          <button
            key={option.id}
            onClick={() => setTab(option.id)}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: '10px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              background: tab === option.id ? 'linear-gradient(180deg, #1BB9D6, #0E8AA5)' : 'rgba(255,255,255,0.78)',
              color: tab === option.id ? '#fff' : 'var(--ink-700)',
              boxShadow: tab === option.id ? '0 8px 18px rgba(14,138,165,0.25)' : 'none',
            }}
          >
            {option.label} ({counts[option.id]})
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FILTERS.map(option => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id)}
              style={{
                border: filter === option.id ? '1px solid rgba(16,169,198,0.25)' : '1px solid rgba(10,22,40,0.06)',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                background: filter === option.id ? 'rgba(16,169,198,0.08)' : 'rgba(255,255,255,0.6)',
                color: filter === option.id ? 'var(--brand-700)' : 'var(--ink-600)',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(10,22,40,0.06)' }}>
          {([
            ['calendar', 'Calendario'],
            ['list', 'Lista'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              style={{
                border: 'none',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                background: viewMode === id ? 'var(--ink-900)' : 'transparent',
                color: viewMode === id ? '#fff' : 'var(--ink-600)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function AppointmentActions({
  appointment,
  busyAction,
  onConfirm,
  onReject,
  onOpenChat,
  onOpenDetail,
}: {
  appointment: Appointment;
  busyAction: string;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onOpenChat: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  if (appointment.status === 'pending') {
    const confirmBusy = busyAction === `confirm:${appointment.id}`;
    const rejectBusy = busyAction === `cancel:${appointment.id}`;
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button size="sm" onClick={() => onConfirm(appointment.id)} disabled={confirmBusy || rejectBusy}>
          {confirmBusy ? 'Aceptando...' : 'Aceptar'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onReject(appointment.id)} disabled={confirmBusy || rejectBusy}>
          {rejectBusy ? 'Rechazando...' : 'Rechazar'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onOpenDetail(appointment.id)}>Ver detalle</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button size="sm" variant="glass" icon="chat" onClick={() => onOpenChat(appointment.id)}>Chat</Button>
      <Button size="sm" variant="outline" onClick={() => onOpenDetail(appointment.id)}>Ver detalle</Button>
    </div>
  );
}

function AppointmentCard({
  appointment,
  busyAction,
  onConfirm,
  onReject,
  onOpenChat,
  onOpenDetail,
}: {
  appointment: Appointment;
  busyAction: string;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onOpenChat: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const status = STATUS_META[appointment.status] ?? STATUS_META.pending;
  const patientName = appointment.patient?.name ?? 'Paciente por asignar';

  return (
    <Glass radius={20} style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{patientName}</div>
          <div style={{ fontSize: 14, color: 'var(--ink-600)', marginTop: 2 }}>{appointment.service ?? 'Servicio por confirmar'}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: status.bg, color: status.fg, flexShrink: 0 }}>
          {status.label}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 14, fontSize: 13, color: 'var(--ink-500)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="calendar" size={14} color="var(--ink-400)" />
          {formatDateTime(appointment)}
        </div>
        {appointment.clinic?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="home" size={14} color="var(--ink-400)" />
            {appointment.clinic.name}
            {appointment.clinic.box ? ` · Box ${appointment.clinic.box}` : ''}
          </div>
        )}
        {appointment.price != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="sparkle" size={14} color="var(--ink-400)" />
            ${appointment.price.toLocaleString('es-CL')}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <AppointmentActions
          appointment={appointment}
          busyAction={busyAction}
          onConfirm={onConfirm}
          onReject={onReject}
          onOpenChat={onOpenChat}
          onOpenDetail={onOpenDetail}
        />
      </div>
    </Glass>
  );
}

function AgendaCalendar({
  items,
  busyAction,
  onConfirm,
  onReject,
  onOpenChat,
  onOpenDetail,
}: {
  items: Appointment[];
  busyAction: string;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onOpenChat: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const groups = groupByDay(items);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
      {groups.map(group => (
        <Glass key={group.label} radius={22} style={{ padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            {group.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {group.items.map(item => (
              <div key={item.id} style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(10,22,40,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{formatTimeOnly(item)}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: STATUS_META[item.status].bg, color: STATUS_META[item.status].fg }}>
                    {STATUS_META[item.status].label}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{item.patient?.name ?? 'Paciente por asignar'}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>{item.service ?? 'Servicio por confirmar'}</div>
                <div style={{ marginTop: 12 }}>
                  <AppointmentActions
                    appointment={item}
                    busyAction={busyAction}
                    onConfirm={onConfirm}
                    onReject={onReject}
                    onOpenChat={onOpenChat}
                    onOpenDetail={onOpenDetail}
                  />
                </div>
              </div>
            ))}
          </div>
        </Glass>
      ))}
    </div>
  );
}

function useAgendaCollections(appointments: Appointment[]) {
  const now = Date.now();

  const requests = useMemo(
    () => sortAppointments(appointments.filter(appointment => appointment.status === 'pending')),
    [appointments],
  );

  const upcoming = useMemo(
    () => sortAppointments(appointments.filter(appointment => {
      const timestamp = appointmentTimestamp(appointment);
      return (appointment.status === 'pending' || appointment.status === 'confirmed') && (timestamp == null || timestamp >= now);
    })),
    [appointments, now],
  );

  const history = useMemo(
    () => sortAppointments(appointments.filter(appointment => {
      const timestamp = appointmentTimestamp(appointment);
      const isClosed = appointment.status === 'completed' || appointment.status === 'cancelled';
      const isPastOpen = (appointment.status === 'pending' || appointment.status === 'confirmed') && timestamp != null && timestamp < now;
      return isClosed || isPastOpen;
    })),
    [appointments, now],
  );

  return { requests, upcoming, history };
}

function useAgendaState(appointments: Appointment[]) {
  const [tab, setTab] = useState<AgendaTab>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [busyAction, setBusyAction] = useState('');
  const { requests, upcoming, history } = useAgendaCollections(appointments);

  const counts = {
    upcoming: upcoming.length,
    requests: requests.length,
    history: history.length,
  };

  const visibleItems = useMemo(() => {
    const source = tab === 'requests' ? requests : tab === 'history' ? history : upcoming;
    return source.filter(appointment => statusMatches(appointment, statusFilter));
  }, [history, requests, statusFilter, tab, upcoming]);

  return {
    tab,
    setTab,
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
    busyAction,
    setBusyAction,
    counts,
    visibleItems,
  };
}

function AgendaContent({
  items,
  loading,
  busyAction,
  onConfirm,
  onReject,
  onOpenChat,
  onOpenDetail,
  emptyTitle,
  emptyDescription,
  viewMode,
}: {
  items: Appointment[];
  loading: boolean;
  busyAction: string;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onOpenChat: (id: string) => void;
  onOpenDetail: (id: string) => void;
  emptyTitle: string;
  emptyDescription: string;
  viewMode: ViewMode;
}) {
  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>Cargando agenda...</div>;
  }

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  if (viewMode === 'calendar') {
    return (
      <AgendaCalendar
        items={items}
        busyAction={busyAction}
        onConfirm={onConfirm}
        onReject={onReject}
        onOpenChat={onOpenChat}
        onOpenDetail={onOpenDetail}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map(item => (
        <AppointmentCard
          key={item.id}
          appointment={item}
          busyAction={busyAction}
          onConfirm={onConfirm}
          onReject={onReject}
          onOpenChat={onOpenChat}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
}

function getEmptyCopy(tab: AgendaTab) {
  if (tab === 'requests') {
    return {
      title: 'No hay solicitudes pendientes',
      description: 'Las nuevas reservas apareceran aqui para que las puedas aceptar o rechazar.',
    };
  }

  if (tab === 'history') {
    return {
      title: 'Sin historial todavia',
      description: 'Las citas completadas y canceladas quedaran registradas en esta vista.',
    };
  }

  return {
    title: 'Agenda sin citas proximas',
    description: 'Cuando confirmes nuevas atenciones las veras ordenadas por dia y hora.',
  };
}

function AgendaDesktopPage() {
  const router = useRouter();
  const { appointments, loading, refresh } = useAppointments('student');
  const state = useAgendaState(appointments);

  const updateStatus = async (appointmentId: string, action: 'confirm' | 'cancel') => {
    state.setBusyAction(`${action}:${appointmentId}`);
    try {
      await api.put(`/api/appointments/${appointmentId}/${action}`);
      refresh();
    } finally {
      state.setBusyAction('');
    }
  };

  const emptyCopy = getEmptyCopy(state.tab);

  return (
    <DesktopShell
      role="student"
      activeId="agenda"
      title="Agenda"
      subtitle={`Proximas ${state.counts.upcoming} · Solicitudes ${state.counts.requests} · Historial ${state.counts.history}`}
      search={false}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Proximas', value: state.counts.upcoming, icon: 'calendar', tint: '#10A9C6' },
          { label: 'Pendientes', value: state.counts.requests, icon: 'bell', tint: '#F59E0B' },
          { label: 'Cerradas', value: state.counts.history, icon: 'check', tint: '#10B981' },
        ].map(card => (
          <Glass key={card.label} radius={18} style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: `${card.tint}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={card.icon as Parameters<typeof Icon>[0]['name']} size={20} color={card.tint} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink-900)' }}>{card.value}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{card.label}</div>
            </div>
          </Glass>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AgendaControls
          tab={state.tab}
          setTab={state.setTab}
          viewMode={state.viewMode}
          setViewMode={state.setViewMode}
          filter={state.statusFilter}
          setFilter={state.setStatusFilter}
          counts={state.counts}
        />

        <AgendaContent
          items={state.visibleItems}
          loading={loading}
          busyAction={state.busyAction}
          onConfirm={id => updateStatus(id, 'confirm')}
          onReject={id => updateStatus(id, 'cancel')}
          onOpenChat={id => router.push(`/chat?appointmentId=${id}`)}
          onOpenDetail={id => router.push(`/citas/${id}`)}
          emptyTitle={emptyCopy.title}
          emptyDescription={emptyCopy.description}
          viewMode={state.viewMode}
        />
      </div>
    </DesktopShell>
  );
}

export default function AgendaPage() {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const { user } = useAuth();
  const { appointments, loading, refresh } = useAppointments('student');
  const state = useAgendaState(appointments);

  useEffect(() => {
    if (user && user.role !== 'student') router.replace('/citas');
  }, [router, user]);

  const updateStatus = async (appointmentId: string, action: 'confirm' | 'cancel') => {
    state.setBusyAction(`${action}:${appointmentId}`);
    try {
      await api.put(`/api/appointments/${appointmentId}/${action}`);
      refresh();
    } finally {
      state.setBusyAction('');
    }
  };

  if (isDesktop) return <AgendaDesktopPage />;

  const emptyCopy = getEmptyCopy(state.tab);

  return (
    <div className="app-scroll" style={{ minHeight: '100dvh', overflowY: 'auto', background: 'var(--bg-aurora)', paddingBottom: 110 }}>
      <div style={{ padding: '56px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-500)' }}>Panel estudiante</p>
            <h1 style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink-900)' }}>
              Agenda
            </h1>
          </div>
          <button
            onClick={() => refresh()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.9)',
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(14px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="calendar" size={18} color="var(--brand-700)" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Proximas', value: state.counts.upcoming },
            { label: 'Solicitudes', value: state.counts.requests },
            { label: 'Historial', value: state.counts.history },
          ].map(card => (
            <Glass key={card.label} radius={18} style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)' }}>{card.value}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 700 }}>{card.label}</div>
            </Glass>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AgendaControls
            tab={state.tab}
            setTab={state.setTab}
            viewMode={state.viewMode}
            setViewMode={state.setViewMode}
            filter={state.statusFilter}
            setFilter={state.setStatusFilter}
            counts={state.counts}
          />
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AgendaContent
          items={state.visibleItems}
          loading={loading}
          busyAction={state.busyAction}
          onConfirm={id => updateStatus(id, 'confirm')}
          onReject={id => updateStatus(id, 'cancel')}
          onOpenChat={id => router.push(`/chat?appointmentId=${id}`)}
          onOpenDetail={id => router.push(`/citas/${id}`)}
          emptyTitle={emptyCopy.title}
          emptyDescription={emptyCopy.description}
          viewMode={state.viewMode}
        />
      </div>

      <BottomNav />
    </div>
  );
}
