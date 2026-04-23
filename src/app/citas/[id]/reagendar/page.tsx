'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { useIsDesktop, DesktopShell } from '@/components/desktop-shell';

interface AvailBlock { day_of_week: number; start_time: string; end_time: string; }

const DAY_LABELS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function RescheduleAppointmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const [apptServiceId, setApptServiceId] = useState('');
  const [apptInfo, setApptInfo] = useState<{ service_name?: string; patient_name?: string; student_name?: string; scheduled_at?: string } | null>(null);
  const [availability, setAvailability] = useState<AvailBlock[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load appointment
  useEffect(() => {
    api.get(`/api/appointments/${id}`)
      .then(r => {
        const a = r.data;
        setApptInfo(a);
        setApptServiceId(a.student_service_id ?? '');
        if (a.scheduled_at) {
          const d = new Date(a.scheduled_at);
          setSelectedDate(d.toISOString().slice(0,10));
          setSelectedTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
        }
      })
      .catch(() => setError('No se pudo cargar la cita'));
  }, [id]);

  // Load availability when service known
  useEffect(() => {
    if (!apptServiceId) return;
    setLoadingAvail(true);
    api.get(`/api/student-services/${apptServiceId}/availabilities`)
      .then(r => {
        const d = r.data;
        setAvailability(Array.isArray(d) ? d : (d?.availabilities ?? []));
      })
      .catch(() => setAvailability([]))
      .finally(() => setLoadingAvail(false));
  }, [apptServiceId]);

  const allowedWeekdays = useMemo(() => new Set(availability.map(a => a.day_of_week)), [availability]);

  const availableDays = useMemo(() => {
    if (!availability.length) return [];
    const today = new Date(); today.setHours(0,0,0,0);
    const days: Date[] = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      if (d.getDay() !== 0 && allowedWeekdays.has(d.getDay())) days.push(d);
    }
    return days;
  }, [availability, allowedWeekdays]);

  const timesForDate = useMemo(() => {
    if (!selectedDate) return [];
    const d = new Date(`${selectedDate}T00:00:00`);
    const now = new Date();
    const isToday = selectedDate === now.toISOString().slice(0,10);
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const slots: string[] = [];
    for (const b of availability.filter(a => a.day_of_week === d.getDay())) {
      const [sh, sm] = (b.start_time || '00:00').slice(0,5).split(':').map(Number);
      const [eh, em] = (b.end_time || '00:00').slice(0,5).split(':').map(Number);
      let min = sh * 60 + sm;
      while (min <= eh * 60 + em - 30) {
        if (!isToday || min + 5 >= currentMin) {
          slots.push(`${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`);
        }
        min += 30;
      }
    }
    return [...new Set(slots)].sort();
  }, [selectedDate, availability]);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) { setError('Selecciona fecha y hora'); return; }
    setSubmitting(true); setError('');
    try {
      await api.put(`/api/appointments/${id}`, { scheduled_at: `${selectedDate}T${selectedTime}:00` });
      router.push(`/citas/${id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al reagendar la cita');
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className="app-scroll" style={{ minHeight: '100dvh', overflowY: 'auto', background: 'var(--bg-aurora)', fontFamily: 'var(--font-body)', paddingBottom: 100 }}>
      {!isDesktop && (
        <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="arrow_left" size={20} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink-900)' }}>Reagendar cita</h1>
        </div>
      )}

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Current summary */}
        {apptInfo && (
          <Glass radius={18} style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Cita actual</div>
            {[
              { label: 'Servicio', value: apptInfo.service_name },
              { label: 'Fecha actual', value: apptInfo.scheduled_at ? new Date(apptInfo.scheduled_at).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' }) : undefined },
            ].map(r => r.value ? (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                <span style={{ color: 'var(--ink-500)' }}>{r.label}</span>
                <span style={{ fontWeight: 600, color: 'var(--ink-900)', textAlign: 'right', maxWidth: '60%', textTransform: 'capitalize' }}>{r.value}</span>
              </div>
            ) : null)}
          </Glass>
        )}

        {/* Date picker */}
        {loadingAvail ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-400)', fontSize: 14 }}>Cargando disponibilidad…</div>
        ) : (
          <Glass hi radius={20} style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-600)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Nueva fecha</div>
            {availableDays.length === 0 ? (
              <p style={{ color: 'var(--ink-400)', fontSize: 14 }}>No hay disponibilidad configurada para este servicio.</p>
            ) : (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                {availableDays.slice(0,20).map(d => {
                  const key = d.toISOString().slice(0,10);
                  const sel = selectedDate === key;
                  return (
                    <button key={key} onClick={() => { setSelectedDate(key); setSelectedTime(''); }}
                      style={{ flexShrink: 0, width: 64, height: 80, borderRadius: 18, background: sel ? 'linear-gradient(180deg, #1BB9D6, #0E8AA5)' : 'rgba(255,255,255,0.78)', color: sel ? '#fff' : 'var(--ink-900)', backdropFilter: 'blur(14px)', border: `2px solid ${sel ? 'var(--brand-600)' : 'rgba(255,255,255,0.9)'}`, boxShadow: sel ? '0 8px 20px rgba(16,169,198,0.35)' : '0 2px 6px rgba(10,22,40,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, fontFamily: 'var(--font-body)', transition: 'all 160ms' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, opacity: sel ? 0.9 : 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{DAY_LABELS[d.getDay()]}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{d.getDate()}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>{MONTH_LABELS[d.getMonth()]}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedDate && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-600)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '20px 0 10px' }}>Nuevo horario</div>
                {timesForDate.length === 0 ? (
                  <p style={{ color: 'var(--ink-400)', fontSize: 14 }}>No hay horarios para esta fecha.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {timesForDate.map(t => {
                      const sel = selectedTime === t;
                      return (
                        <button key={t} onClick={() => setSelectedTime(t)}
                          style={{ height: 48, borderRadius: 14, background: sel ? 'linear-gradient(180deg, #1BB9D6, #0E8AA5)' : 'rgba(255,255,255,0.78)', color: sel ? '#fff' : 'var(--ink-900)', backdropFilter: 'blur(14px)', border: `1.5px solid ${sel ? 'var(--brand-600)' : 'rgba(255,255,255,0.9)'}`, boxShadow: sel ? '0 8px 20px rgba(16,169,198,0.35)' : 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, transition: 'all 160ms' }}>{t}</button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </Glass>
        )}

        {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 14 }}>{error}</div>}
      </div>

      <div style={{ position: 'fixed', bottom: 24, left: 16, right: 16 }}>
        <Button size="lg" full disabled={!selectedDate || !selectedTime || submitting} onClick={handleSubmit}>
          {submitting ? 'Reagendando…' : 'Confirmar reagendamiento'}
        </Button>
      </div>
    </div>
  );

  if (isDesktop) return <DesktopShell role="patient" activeId="appts" title="Reagendar cita">{content}</DesktopShell>;
  return content;
}
