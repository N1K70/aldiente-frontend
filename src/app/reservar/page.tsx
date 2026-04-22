'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Glass, Icon, TextField } from '@/components/ui';
import BottomNav from '@/components/BottomNav';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import { useAvailabilities } from '@/hooks/useAvailabilities';
import { useStudent } from '@/hooks/useStudent';
import { api } from '@/lib/api';
import { fetchPublicServicesByUniversityName, fetchUniversities, filterHookServices, PublicServiceItem, UniversityOption } from '@/lib/public-services';

const HOOK_SERVICES = [
  { key: 'limpieza', name: 'Limpieza dental', icon: 'sparkle', description: 'Limpieza profesional y cuidado preventivo.' },
  { key: 'revision', name: 'Revision general', icon: 'search', description: 'Chequeo inicial y diagnostico.' },
  { key: 'urgencia', name: 'Urgencia dental', icon: 'heart', description: 'Atencion para dolor o molestias.' },
] as const;

const STEP_LABELS = ['Servicio', 'Fecha y hora', 'Confirmacion'] as const;

function formatPrice(value?: number) {
  if (value == null) return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
}

function formatLongDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function AuthBooking({
  studentId,
  preselectedServiceId,
}: {
  studentId: string;
  preselectedServiceId: string | null;
}) {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const { student } = useStudent(studentId);
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(preselectedServiceId ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [availabilityId, setAvailabilityId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('webpay');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { slots, byDate, loading: slotsLoading } = useAvailabilities(serviceId || null);
  const services = student?.services ?? [];
  const selectedService = services.find(item => item.id === serviceId) ?? services[0];
  const availableDates = useMemo(() => Array.from(new Set(slots.map(slot => slot.date))).sort(), [slots]);
  const availableTimes = date ? byDate(date) : [];

  useEffect(() => {
    if (!serviceId && services[0]?.id) setServiceId(services[0].id);
  }, [serviceId, services]);

  const canContinue = (step === 0 && !!serviceId) || (step === 1 && !!date && !!time) || step === 2;

  const confirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      const scheduledAt = `${date}T${time}:00`;
      const res = await api.post('/api/appointments', {
        studentServiceId: serviceId,
        availabilityId: availabilityId || undefined,
        scheduledAt,
        paymentMethod,
      });
      const appointmentId = res.data?.appointment?.id ?? res.data?.id ?? '';
      router.push(`/confirmacion?id=${appointmentId}`);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No se pudo crear la cita.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(services.length ? services : [{ id: 'clean', name: 'Limpieza dental', price: 15000, duration: 45 }]).map(service => {
            const selected = serviceId === service.id;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setServiceId(service.id)}
                style={{ padding: 16, borderRadius: 20, textAlign: 'left', cursor: 'pointer', background: selected ? 'linear-gradient(135deg, rgba(16,169,198,0.14), rgba(79,70,229,0.08))' : 'rgba(255,255,255,0.78)', border: `2px solid ${selected ? 'var(--brand-500)' : 'rgba(255,255,255,0.9)'}`, boxShadow: selected ? '0 0 0 4px rgba(16,169,198,0.12)' : '0 2px 6px rgba(10,22,40,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{service.name}</div>
                  {service.duration != null && <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>{service.duration} min</div>}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>
                  {formatPrice(service.price)}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Dias disponibles</div>
            {slotsLoading ? (
              <Glass radius={18} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)' }}>Cargando horarios...</Glass>
            ) : availableDates.length === 0 ? (
              <Glass radius={18} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)' }}>No hay horarios disponibles para este servicio.</Glass>
            ) : (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                {availableDates.map(item => {
                  const selected = item === date;
                  const parsed = new Date(`${item}T12:00:00`);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setDate(item);
                        setTime('');
                        setAvailabilityId('');
                      }}
                      style={{ minWidth: 82, padding: '12px 10px', borderRadius: 18, border: `2px solid ${selected ? 'var(--brand-500)' : 'rgba(255,255,255,0.9)'}`, background: selected ? 'linear-gradient(135deg, rgba(16,169,198,0.14), rgba(79,70,229,0.08))' : 'rgba(255,255,255,0.78)', cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: selected ? 'var(--brand-700)' : 'var(--ink-500)', textTransform: 'uppercase' }}>
                        {parsed.toLocaleDateString('es-CL', { weekday: 'short' })}
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', marginTop: 4 }}>
                        {parsed.getDate()}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>
                        {parsed.toLocaleDateString('es-CL', { month: 'short' })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {date && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Horarios</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {availableTimes.map(slot => {
                  const selected = slot.time === time;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setTime(slot.time);
                        setAvailabilityId(slot.id);
                      }}
                      style={{ height: 48, borderRadius: 14, border: `1.5px solid ${selected ? 'var(--brand-500)' : 'rgba(255,255,255,0.9)'}`, background: selected ? 'linear-gradient(135deg, rgba(16,169,198,0.14), rgba(79,70,229,0.08))' : 'rgba(255,255,255,0.78)', color: 'var(--ink-900)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Glass hi radius={18} style={{ padding: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--ink-500)' }}>Servicio</span>
                <span style={{ fontWeight: 700, color: 'var(--ink-900)' }}>{selectedService?.name ?? 'Servicio'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--ink-500)' }}>Estudiante</span>
                <span style={{ fontWeight: 700, color: 'var(--ink-900)' }}>{student?.name ?? 'Estudiante'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--ink-500)' }}>Fecha</span>
                <span style={{ fontWeight: 700, color: 'var(--ink-900)' }}>{date ? formatLongDate(date) : 'Pendiente'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--ink-500)' }}>Hora</span>
                <span style={{ fontWeight: 700, color: 'var(--ink-900)' }}>{time || 'Pendiente'}</span>
              </div>
              <div style={{ height: 1, background: 'var(--ink-100)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--ink-500)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>{formatPrice(selectedService?.price)}</span>
              </div>
            </div>
          </Glass>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'webpay', title: 'Webpay', desc: 'Debito o credito' },
              { id: 'cash', title: 'Efectivo', desc: 'Pago presencial' },
            ].map(option => {
              const selected = paymentMethod === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPaymentMethod(option.id)}
                  style={{ padding: 14, borderRadius: 16, textAlign: 'left', border: `2px solid ${selected ? 'var(--brand-500)' : 'rgba(255,255,255,0.9)'}`, background: selected ? 'linear-gradient(135deg, rgba(16,169,198,0.14), rgba(79,70,229,0.08))' : 'rgba(255,255,255,0.78)', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{option.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>{option.desc}</div>
                </button>
              );
            })}
          </div>

          {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 14 }}>{error}</div>}
        </div>
      )}
    </div>
  );

  const actions = (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      {step > 0 && <Button size="md" variant="ghost" onClick={() => setStep(current => current - 1)}>Atras</Button>}
      <Button size="md" disabled={!canContinue || submitting} onClick={() => (step < 2 ? setStep(current => current + 1) : confirm())}>
        {submitting ? 'Confirmando...' : step === 2 ? 'Confirmar y pagar' : 'Continuar'}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <DesktopShell role="patient" activeId="search" title="Agendar cita" subtitle={student ? `con ${student.name}` : ''}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          <Glass hi radius={22} style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {STEP_LABELS.map((label, index) => (
                <div key={label} style={{ flex: 1, height: 6, borderRadius: 99, background: index <= step ? 'linear-gradient(90deg, #10A9C6, #4F46E5)' : 'rgba(10,22,40,0.08)' }} />
              ))}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em', marginBottom: 16 }}>{STEP_LABELS[step]}</div>
            {content}
            <div style={{ marginTop: 24 }}>{actions}</div>
          </Glass>

          <Glass radius={20} style={{ padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Resumen rapido</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--ink-500)' }}>Servicio</span><span style={{ color: 'var(--ink-900)', fontWeight: 700 }}>{selectedService?.name ?? 'Pendiente'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--ink-500)' }}>Fecha</span><span style={{ color: 'var(--ink-900)', fontWeight: 700 }}>{date || 'Pendiente'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--ink-500)' }}>Hora</span><span style={{ color: 'var(--ink-900)', fontWeight: 700 }}>{time || 'Pendiente'}</span></div>
              <div style={{ height: 1, background: 'var(--ink-100)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--ink-500)' }}>Total</span><span style={{ color: 'var(--ink-900)', fontWeight: 700 }}>{formatPrice(selectedService?.price)}</span></div>
            </div>
          </Glass>
        </div>
      </DesktopShell>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', padding: '56px 20px 110px' }}>
      <button onClick={() => (step === 0 ? router.back() : setStep(current => current - 1))} style={{ width: 44, height: 44, borderRadius: 999, marginBottom: 20, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="arrow_left" size={20} />
      </button>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {STEP_LABELS.map((label, index) => (
          <div key={label} style={{ flex: 1, height: 6, borderRadius: 99, background: index <= step ? 'linear-gradient(90deg, #10A9C6, #4F46E5)' : 'rgba(10,22,40,0.08)' }} />
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em', marginBottom: 16 }}>{STEP_LABELS[step]}</div>
      {content}
      <div style={{ marginTop: 20 }}>{actions}</div>
      <BottomNav />
    </div>
  );
}

function GuestCheckout() {
  const router = useRouter();
  const [step, setStep] = useState<'location' | 'service' | 'datetime' | 'checkout' | 'success'>('location');
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityOption | null>(null);
  const [selectedHook, setSelectedHook] = useState<string>('');
  const [services, setServices] = useState<PublicServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<PublicServiceItem | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ appointment?: { service_name?: string; scheduled_at?: string; price?: number }; user?: { email?: string; is_new?: boolean } } | null>(null);

  const { slots, byDate, loading: slotsLoading } = useAvailabilities(selectedService?.id ?? null);
  const availableDates = useMemo(() => Array.from(new Set(slots.map(slot => slot.date))).sort(), [slots]);
  const availableTimes = date ? byDate(date) : [];

  useEffect(() => {
    setLoadingUniversities(true);
    fetchUniversities()
      .then(setUniversities)
      .catch(() => setUniversities([]))
      .finally(() => setLoadingUniversities(false));
  }, []);

  useEffect(() => {
    if (!selectedUniversity || !selectedHook) {
      setServices([]);
      return;
    }

    setLoadingServices(true);
    fetchPublicServicesByUniversityName(selectedUniversity.name)
      .then(allServices => {
        const filtered = filterHookServices(allServices, selectedHook);
        setServices(filtered.length > 0 ? filtered : allServices);
      })
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, [selectedHook, selectedUniversity]);

  const handleSubmit = async () => {
    if (!selectedService || !date || !time || !name || !email) {
      setError('Completa los campos requeridos.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const scheduledAt = `${date}T${time}:00`;
      const res = await api.post('/api/guest-checkout', {
        student_service_id: selectedService.id,
        scheduled_at: scheduledAt,
        notes: notes || null,
        name,
        email,
        phone: phone || null,
      });
      setSuccessData(res.data);
      setStep('success');
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No se pudo procesar la reserva.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep('location');
    setSelectedUniversity(null);
    setSelectedHook('');
    setSelectedService(null);
    setDate('');
    setTime('');
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setError('');
    setSuccessData(null);
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', padding: '40px 20px 40px', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em' }}>Reserva publica</div>
          <div style={{ fontSize: 14, color: 'var(--ink-600)', marginTop: 4 }}>Agenda sin iniciar sesion.</div>
        </div>
        {step !== 'success' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {['location', 'service', 'datetime', 'checkout'].map((item, index) => {
              const order = ['location', 'service', 'datetime', 'checkout'];
              const active = order.indexOf(step) >= index;
              return <div key={item} style={{ width: 42, height: 6, borderRadius: 99, background: active ? 'linear-gradient(90deg, #10A9C6, #4F46E5)' : 'rgba(10,22,40,0.08)' }} />;
            })}
          </div>
        )}
      </div>

      {step === 'location' && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', marginBottom: 8 }}>Selecciona una universidad</div>
          <div style={{ fontSize: 14, color: 'var(--ink-600)', marginBottom: 18 }}>Mostraremos los servicios disponibles en esa sede.</div>

          {loadingUniversities ? (
            <Glass radius={20} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-500)' }}>Cargando universidades...</Glass>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {universities.map(university => (
                <button
                  key={university.id}
                  type="button"
                  onClick={() => {
                    setSelectedUniversity(university);
                    setStep('service');
                  }}
                  style={{ padding: 18, borderRadius: 20, background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', textAlign: 'left', boxShadow: '0 2px 6px rgba(10,22,40,0.05)' }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(16,169,198,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon name="graduation" size={20} color="var(--brand-700)" />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{university.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>{university.city || 'Chile'}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'service' && selectedUniversity && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button size="md" variant="ghost" onClick={() => setStep('location')}>Cambiar universidad</Button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, background: 'rgba(16,169,198,0.08)', color: 'var(--brand-700)', fontSize: 13, fontWeight: 700 }}>
              <Icon name="graduation" size={13} color="var(--brand-700)" />
              {selectedUniversity.name}
            </span>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', marginBottom: 8 }}>¿Que necesitas?</div>
            <div style={{ fontSize: 14, color: 'var(--ink-600)', marginBottom: 18 }}>Elige el tipo de atencion para filtrar el catalogo.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {HOOK_SERVICES.map(option => {
              const selected = selectedHook === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedHook(option.key)}
                  style={{ padding: 18, borderRadius: 20, textAlign: 'left', border: `2px solid ${selected ? 'var(--brand-500)' : 'rgba(255,255,255,0.9)'}`, background: selected ? 'linear-gradient(135deg, rgba(16,169,198,0.14), rgba(79,70,229,0.08))' : 'rgba(255,255,255,0.78)', cursor: 'pointer', boxShadow: selected ? '0 0 0 4px rgba(16,169,198,0.12)' : '0 2px 6px rgba(10,22,40,0.05)' }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(16,169,198,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon name={option.icon} size={20} color="var(--brand-700)" />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{option.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4, lineHeight: 1.4 }}>{option.description}</div>
                </button>
              );
            })}
          </div>

          {selectedHook && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', marginBottom: 12 }}>Servicios disponibles</div>
              {loadingServices ? (
                <Glass radius={20} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-500)' }}>Buscando servicios...</Glass>
              ) : services.length === 0 ? (
                <Glass radius={20} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-500)' }}>No hay servicios para esta universidad.</Glass>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {services.map(service => (
                    <Glass key={`${service.id}-${service.studentId ?? ''}`} radius={20} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{service.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>{service.studentName || 'Profesional disponible'}</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>{formatPrice(service.price)}</div>
                      </div>
                      {service.description && <div style={{ fontSize: 14, color: 'var(--ink-600)', lineHeight: 1.5 }}>{service.description}</div>}
                      <Button size="md" full onClick={() => {
                        setSelectedService(service);
                        setDate('');
                        setTime('');
                        setStep('datetime');
                      }}>
                        Continuar
                      </Button>
                    </Glass>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'datetime' && selectedService && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Button size="md" variant="ghost" onClick={() => setStep('service')}>Volver</Button>
          <Glass hi radius={20} style={{ padding: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{selectedService.name}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 4 }}>{selectedService.studentName || 'Profesional'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', marginTop: 10 }}>{formatPrice(selectedService.price)}</div>
          </Glass>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Fecha</div>
            {slotsLoading ? (
              <Glass radius={18} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)' }}>Cargando disponibilidad...</Glass>
            ) : availableDates.length === 0 ? (
              <Glass radius={18} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)' }}>Este servicio aun no tiene horarios configurados.</Glass>
            ) : (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                {availableDates.map(item => {
                  const selected = item === date;
                  const parsed = new Date(`${item}T12:00:00`);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setDate(item);
                        setTime('');
                      }}
                      style={{ minWidth: 82, padding: '12px 10px', borderRadius: 18, border: `2px solid ${selected ? 'var(--brand-500)' : 'rgba(255,255,255,0.9)'}`, background: selected ? 'linear-gradient(135deg, rgba(16,169,198,0.14), rgba(79,70,229,0.08))' : 'rgba(255,255,255,0.78)', cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: selected ? 'var(--brand-700)' : 'var(--ink-500)', textTransform: 'uppercase' }}>{parsed.toLocaleDateString('es-CL', { weekday: 'short' })}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', marginTop: 4 }}>{parsed.getDate()}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{parsed.toLocaleDateString('es-CL', { month: 'short' })}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {date && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Hora</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {availableTimes.map(slot => {
                  const selected = slot.time === time;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setTime(slot.time)}
                      style={{ height: 48, borderRadius: 14, border: `1.5px solid ${selected ? 'var(--brand-500)' : 'rgba(255,255,255,0.9)'}`, background: selected ? 'linear-gradient(135deg, rgba(16,169,198,0.14), rgba(79,70,229,0.08))' : 'rgba(255,255,255,0.78)', color: 'var(--ink-900)', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {date && time && (
            <Button size="lg" full onClick={() => setStep('checkout')}>
              Continuar
            </Button>
          )}
        </div>
      )}

      {step === 'checkout' && selectedService && (
        <div style={{ display: 'grid', gap: 20 }}>
          <Button size="md" variant="ghost" onClick={() => setStep('datetime')}>Volver</Button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <Glass hi radius={20} style={{ padding: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <TextField label="Nombre completo" icon="user" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
                <TextField label="Correo electronico" icon="mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
                <TextField label="Whatsapp (opcional)" icon="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+56 9 1234 5678" />
                <TextField label="Notas (opcional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Algo que debamos saber" />
                {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 14 }}>{error}</div>}
                <Button size="lg" full onClick={handleSubmit} disabled={submitting || !name || !email}>
                  {submitting ? 'Procesando...' : 'Confirmar reserva'}
                </Button>
              </div>
            </Glass>

            <Glass radius={20} style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Resumen</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--ink-500)' }}>Servicio</span><span style={{ fontWeight: 700, color: 'var(--ink-900)', textAlign: 'right' }}>{selectedService.name}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--ink-500)' }}>Profesional</span><span style={{ fontWeight: 700, color: 'var(--ink-900)', textAlign: 'right' }}>{selectedService.studentName || 'Profesional'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--ink-500)' }}>Fecha</span><span style={{ fontWeight: 700, color: 'var(--ink-900)', textAlign: 'right' }}>{date ? formatLongDate(date) : 'Pendiente'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--ink-500)' }}>Hora</span><span style={{ fontWeight: 700, color: 'var(--ink-900)' }}>{time}</span></div>
                <div style={{ height: 1, background: 'var(--ink-100)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--ink-500)' }}>Total</span><span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink-900)' }}>{formatPrice(selectedService.price)}</span></div>
              </div>
            </Glass>
          </div>
        </div>
      )}

      {step === 'success' && successData && (
        <Glass hi radius={24} style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: 28, margin: '0 auto 20px', background: 'linear-gradient(135deg, #D1FAE5, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px rgba(16,185,129,0.28)' }}>
            <Icon name="check" size={38} color="#fff" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em' }}>¡Reserva confirmada!</div>
          <div style={{ fontSize: 15, color: 'var(--ink-600)', lineHeight: 1.5, marginTop: 10 }}>
            Hemos enviado los detalles a <b>{successData.user?.email || email}</b>.
          </div>
          <div style={{ display: 'grid', gap: 10, maxWidth: 420, margin: '24px auto 0', textAlign: 'left' }}>
            <Glass radius={18} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: 'var(--ink-500)' }}>Servicio</span><span style={{ color: 'var(--ink-900)', fontWeight: 700 }}>{successData.appointment?.service_name || selectedService?.name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8 }}><span style={{ color: 'var(--ink-500)' }}>Fecha</span><span style={{ color: 'var(--ink-900)', fontWeight: 700 }}>{successData.appointment?.scheduled_at ? new Date(successData.appointment.scheduled_at).toLocaleString('es-CL') : `${date} ${time}`}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8 }}><span style={{ color: 'var(--ink-500)' }}>Precio</span><span style={{ color: 'var(--ink-900)', fontWeight: 700 }}>{formatPrice(successData.appointment?.price ?? selectedService?.price)}</span></div>
            </Glass>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            <Button size="md" variant="glass" onClick={resetFlow}>Hacer otra reserva</Button>
            <Button size="md" onClick={() => router.push('/login')}>Ir a mi cuenta</Button>
          </div>
        </Glass>
      )}
    </div>
  );
}

function BookingInner() {
  const params = useSearchParams();
  const studentId = params.get('studentId');
  const serviceId = params.get('serviceId');

  if (studentId) {
    return <AuthBooking studentId={studentId} preselectedServiceId={serviceId} />;
  }

  return <GuestCheckout />;
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-500)' }}>Cargando...</div>}>
      <BookingInner />
    </Suspense>
  );
}
