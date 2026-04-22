'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Glass, Icon, Button } from '@/components/ui';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface AppointmentDetails {
  id: string;
  studentName: string;
  serviceName: string;
  scheduledAt: string;
  location?: string;
  price?: number;
  paymentMethod?: string;
}

function fmt(iso: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
      + ' · '
      + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return iso; }
}

function gcalLink(appt: AppointmentDetails | null) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const title = encodeURIComponent(appt?.serviceName ? `Cita dental: ${appt.serviceName}` : 'Cita dental ALDIENTE');
  const loc = encodeURIComponent(appt?.location ?? 'Clínica ALDIENTE');
  const details = encodeURIComponent(appt?.studentName ? `Atención con ${appt.studentName}` : 'Atención dental supervisada');
  if (appt?.scheduledAt) {
    try {
      const s = new Date(appt.scheduledAt);
      const e = new Date(s.getTime() + 60 * 60 * 1000);
      const pad = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      return `${base}&text=${title}&dates=${pad(s)}/${pad(e)}&details=${details}&location=${loc}`;
    } catch { /* fallback */ }
  }
  return `${base}&text=${title}&details=${details}&location=${loc}`;
}

function fmtPrice(n?: number) {
  if (!n) return null;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
    <div style={{ color: 'var(--ink-500)', fontSize: 14 }}>{label}</div>
    <div style={{ color: 'var(--ink-900)', fontWeight: 600, textAlign: 'right', fontSize: 14 }}>{value}</div>
  </div>
);

function ConfirmacionInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const id = params.get('id');

  const [appt, setAppt] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    api.get(`/api/appointments/${id}`)
      .then(res => {
        const raw = res.data?.appointment ?? res.data ?? {};
        setAppt({
          id: String(raw.id ?? id),
          studentName: String(raw.studentName ?? raw.student_name ?? raw.student?.name ?? ''),
          serviceName: String(raw.serviceName ?? raw.service_name ?? raw.service?.name ?? ''),
          scheduledAt: String(raw.scheduledAt ?? raw.scheduled_at ?? raw.datetime ?? ''),
          location: String(raw.location ?? raw.clinic ?? ''),
          price: Number(raw.price ?? raw.amount ?? 0) || undefined,
          paymentMethod: String(raw.paymentMethod ?? raw.payment_method ?? ''),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const role = user?.role === 'student' ? 'student' : user?.role === 'admin' ? 'admin' : 'patient';

  const card = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: isDesktop ? undefined : 480, margin: '0 auto' }}>
      <div style={{
        width: 100, height: 100, borderRadius: 36,
        background: 'linear-gradient(135deg, #D1FAE5, #10B981)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        boxShadow: '0 12px 28px rgba(16,185,129,0.3)',
      }}>
        <Icon name="check" size={52} color="#fff" stroke={3} />
      </div>

      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: isDesktop ? 36 : 30, fontWeight: 700,
        letterSpacing: '-0.035em', margin: '0 0 10px', color: 'var(--ink-900)',
      }}>
        ¡Cita confirmada!
      </h1>
      <p style={{ fontSize: 16, color: 'var(--ink-600)', lineHeight: 1.5, margin: '0 0 28px', maxWidth: 320 }}>
        Te enviamos los detalles a tu correo. Recibirás un recordatorio 24h antes.
      </p>

      <Glass radius={20} style={{ padding: '18px 20px', width: '100%', marginBottom: 24, textAlign: 'left' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--ink-400)', fontSize: 14 }}>Cargando detalles…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {appt?.scheduledAt && <Row label="Fecha" value={fmt(appt.scheduledAt)} />}
            {appt?.studentName && <Row label="Con" value={appt.studentName} />}
            {appt?.serviceName && <Row label="Servicio" value={appt.serviceName} />}
            {appt?.location && <Row label="Lugar" value={appt.location} />}
            {appt?.price && <Row label="Total" value={fmtPrice(appt.price) ?? ''} />}
            {appt?.paymentMethod && <Row label="Pago" value={appt.paymentMethod === 'online' ? 'En línea' : 'En clínica'} />}
            {!appt && (
              <>
                <Row label="Estado" value="Confirmada" />
                <Row label="Código" value={id ?? '—'} />
              </>
            )}
          </div>
        )}
      </Glass>

      <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: 10, width: '100%' }}>
        <Button size="lg" full variant="glass" icon="calendar" onClick={() => window.open(gcalLink(appt), '_blank')}>Agregar al calendario</Button>
        <Button size="lg" full onClick={() => router.push('/home')}>Ir al inicio</Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <DesktopShell role={role} activeId="home" title="Cita confirmada" search={false}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40 }}>
          <div style={{ width: '100%', maxWidth: 560 }}>
            {card}
          </div>
        </div>
      </DesktopShell>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg-aurora)',
      display: 'flex', flexDirection: 'column', padding: '80px 24px 40px',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {card}
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense>
      <ConfirmacionInner />
    </Suspense>
  );
}
