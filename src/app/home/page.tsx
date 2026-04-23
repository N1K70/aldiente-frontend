'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/hooks/useAppointments';
import { useNotifications } from '@/hooks/useNotifications';
import PatientOnboarding, { usePatientOnboarding } from '@/components/PatientOnboarding';
import { fetchUniversityServices, normalizeText, PublicServiceItem } from '@/lib/public-services';

const STATUS_LABEL: Record<string, string> = { confirmed: 'Confirmada', pending: 'Pendiente', completed: 'Completada', cancelled: 'Cancelada' };
const SERVICE_TONES = ['#10A9C6', '#6366F1', '#F59E0B', '#EC4899'] as const;
const STUDENT_GRADIENTS = [
  'linear-gradient(135deg, #C7D2FE, #818CF8)',
  'linear-gradient(135deg, #A7F3D0, #10B981)',
  'linear-gradient(135deg, #FECACA, #EF4444)',
] as const;

type FeaturedStudent = {
  id: string;
  name: string;
  university?: string;
  serviceName?: string;
  price?: number;
  initials: string;
  gradient: string;
};

function ApptDateBadge({ dateStr, time }: { dateStr: string; time?: string }) {
  let month = '', day = '';
  if (dateStr) {
    const parts = dateStr.split(/[\s/-]/);
    if (parts.length >= 2) { [month, day] = [parts[0], parts[1]]; }
    else { month = dateStr; }
  }
  return (
    <div style={{ width: 96, height: 108, borderRadius: 18, flexShrink: 0, background: 'linear-gradient(180deg, var(--brand-100), var(--brand-200))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{month}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, color: 'var(--brand-800)', letterSpacing: '-0.03em', lineHeight: 1 }}>{day || '—'}</div>
      {time && <div style={{ fontSize: 12, color: 'var(--brand-700)', fontWeight: 600, marginTop: 2 }}>{time}</div>}
    </div>
  );
}

function useUniversityHighlights(universityId?: string) {
  const [services, setServices] = useState<PublicServiceItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!universityId) {
      setServices([]);
      return;
    }

    let mounted = true;
    setLoading(true);

    fetchUniversityServices(universityId)
      .then(rows => {
        if (mounted) setServices(rows);
      })
      .catch(() => {
        if (mounted) setServices([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [universityId]);

  const featuredServices = useMemo(() => {
    const unique = new Map<string, PublicServiceItem>();

    for (const service of services) {
      const key = normalizeText(service.name);
      if (!key || unique.has(key)) continue;
      unique.set(key, service);
    }

    return Array.from(unique.values()).slice(0, 4);
  }, [services]);

  const featuredStudents = useMemo(() => {
    const unique = new Map<string, FeaturedStudent>();

    for (const service of services) {
      if (!service.studentId || !service.studentName || unique.has(service.studentId)) continue;

      unique.set(service.studentId, {
        id: service.studentId,
        name: service.studentName,
        university: service.studentUniversity,
        serviceName: service.name,
        price: service.price,
        initials: service.studentName
          .split(' ')
          .slice(0, 2)
          .map(word => word[0])
          .join('')
          .toUpperCase(),
        gradient: STUDENT_GRADIENTS[unique.size % STUDENT_GRADIENTS.length],
      });
    }

    return Array.from(unique.values()).slice(0, 3);
  }, [services]);

  return { featuredServices, featuredStudents, loading };
}

function HomeDesktop() {
  const router = useRouter();
  const { user } = useAuth();
  const { next, upcoming, loading } = useAppointments('patient');
  const { needsOnboarding, selectedUniversity, completeOnboarding } = usePatientOnboarding();
  const { featuredServices, featuredStudents, loading: catalogLoading } = useUniversityHighlights(selectedUniversity?.id);
  const firstName = user?.name?.split(' ')[0] ?? 'tú';

  if (needsOnboarding) return <PatientOnboarding onComplete={completeOnboarding} />;

  const apptTitle = next
    ? `${next.service || 'Cita'} ${next.student?.name ? `con ${next.student.name}` : ''}`
    : loading ? 'Cargando…' : 'Sin citas próximas';
  const apptSub = next?.clinic?.name ? `${next.clinic.name}${next.clinic.box ? ` · Box ${next.clinic.box}` : ''}` : '';
  const today = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <DesktopShell role="patient" activeId="home" title={`Hola, ${firstName} 👋`} subtitle={`Hoy es ${today} · Tienes ${upcoming.length} cita${upcoming.length !== 1 ? 's' : ''} próxima${upcoming.length !== 1 ? 's' : ''}`}>
      {selectedUniversity && (
        <Glass radius={18} style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Universidad seleccionada</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', marginTop: 4 }}>{selectedUniversity.name}</div>
          </div>
          <Button size="md" variant="glass" onClick={() => router.push('/explorar')}>Explorar servicios</Button>
        </Glass>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <Glass hi radius={24} style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(at 100% 0%, rgba(16,169,198,0.18) 0%, transparent 55%), radial-gradient(at 0% 100%, rgba(99,102,241,0.12) 0%, transparent 50%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', gap: 24, alignItems: 'center' }}>
            <ApptDateBadge dateStr={next?.date ?? ''} time={next?.time} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tu próxima cita</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 4 }}>{apptTitle}</div>
              {apptSub && <div style={{ fontSize: 14, color: 'var(--ink-600)', marginBottom: 16 }}>{apptSub}</div>}
              {next && (
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <Button size="md" icon="chat" onClick={() => router.push(`/chat?appointmentId=${next.id}`)}>Mensaje</Button>
                  <Button size="md" variant="glass" onClick={() => router.push(`/citas/${next.id}`)}>Ver detalle</Button>
                  <Button size="md" variant="ghost" onClick={() => router.push(`/citas/${next.id}/reagendar`)}>Reagendar</Button>
                </div>
              )}
              {!next && !loading && (
                <Button size="md" icon="plus" onClick={() => router.push('/explorar')}>Agendar cita</Button>
              )}
            </div>
          </div>
        </Glass>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { v: upcoming.length > 0 ? `${upcoming.length}` : '—', l: 'Citas próximas', tint: '#6366F1', icon: 'check' },
            { v: next?.price ? `$${(next.price).toLocaleString('es-CL')}` : '—', l: 'Precio próxima cita', tint: '#10B981', icon: 'sparkle' },
            { v: STATUS_LABEL[next?.status ?? ''] ?? '—', l: 'Estado', tint: '#F59E0B', icon: 'star' },
          ].map(s => (
            <Glass key={s.l} radius={18} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.tint}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} size={20} color={s.tint} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>{s.v}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 500 }}>{s.l}</div>
              </div>
            </Glass>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>¿Qué necesitas hoy?</div>
          <button style={{ background: 'none', border: 'none', color: 'var(--brand-700)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={() => router.push('/explorar')}>Ver todos los servicios →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {catalogLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Glass key={index} radius={18} style={{ padding: 18, minHeight: 142, opacity: 0.65 }}>
                <div />
              </Glass>
            ))
          ) : featuredServices.length > 0 ? (
            featuredServices.map((service, index) => {
              const tint = SERVICE_TONES[index % SERVICE_TONES.length];
              const icons = ['sparkle', 'shield', 'heart', 'check'] as const;
              return (
                <Glass key={service.id} radius={18} style={{ padding: 18, cursor: 'pointer' }} onClick={() => router.push(`/servicio/${service.id}`)}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${tint}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon name={icons[index % icons.length]} size={22} color={tint} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.01em', marginBottom: 2 }}>{service.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>
                    {service.duration ? `${service.duration} min` : 'Duracion variable'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', marginTop: 10 }}>
                    {service.price != null ? `Desde $${service.price.toLocaleString('es-CL')}` : 'Consultar'}
                  </div>
                </Glass>
              );
            })
          ) : (
            <Glass radius={18} style={{ padding: 22, gridColumn: '1 / -1', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--ink-500)' }}>Todavia no hay servicios publicados para tu universidad.</div>
            </Glass>
          )}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>Estudiantes destacados cerca tuyo</div>
          <button style={{ background: 'none', border: 'none', color: 'var(--brand-700)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={() => router.push('/explorar')}>Explorar todos →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {catalogLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Glass key={index} radius={20} style={{ padding: 18, minHeight: 208, opacity: 0.65 }}>
                <div />
              </Glass>
            ))
          ) : featuredStudents.length > 0 ? (
            featuredStudents.map(student => (
            <Glass key={student.id} radius={20} style={{ padding: 18, cursor: 'pointer' }} onClick={() => router.push(`/estudiante?id=${student.id}`)}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: student.gradient, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{student.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{student.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{student.university || 'Universidad asociada'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12 }}>
                    <Icon name="tooth" size={12} color="var(--brand-600)" />
                    <b style={{ color: 'var(--ink-900)' }}>{student.serviceName || 'Servicio disponible'}</b>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success-600)', fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'var(--success-100)', width: 'fit-content', marginBottom: 12 }}>
                <Icon name="shield" size={12} color="var(--success-600)" />
                {student.price != null ? `Desde $${student.price.toLocaleString('es-CL')}` : 'Supervisado'}
              </div>
              <Button size="md" full>Ver perfil</Button>
            </Glass>
            ))
          ) : (
            <Glass radius={20} style={{ padding: 22, gridColumn: '1 / -1', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--ink-500)' }}>Aun no hay estudiantes destacados para mostrar en tu universidad.</div>
            </Glass>
          )}
        </div>
      </div>
    </DesktopShell>
  );
}

export default function HomePage() {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const { user } = useAuth();
  const { next, upcoming, loading } = useAppointments('patient');
  const { unreadCount } = useNotifications();
  const { needsOnboarding, selectedUniversity, completeOnboarding } = usePatientOnboarding();
  const { featuredServices, featuredStudents, loading: catalogLoading } = useUniversityHighlights(selectedUniversity?.id);

  if (isDesktop) return <HomeDesktop />;
  if (needsOnboarding) return <PatientOnboarding onComplete={completeOnboarding} />;

  const firstName = user?.name?.split(' ')[0] ?? 'tú';
  const initials = user?.name ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : 'U';

  const apptDate = next?.date ? next.date.split(/[\s/-]/).slice(0, 2).join(' ') : '';
  const apptTitle = next ? `${next.service || 'Cita'}${next.student?.name ? ` · Clínica` : ''}` : '';

  return (
    <div className="app-scroll" style={{ minHeight: '100dvh', overflowY: 'auto', background: 'var(--bg-aurora)', position: 'relative', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '56px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--ink-500)', fontWeight: 500 }}>Hola,</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {firstName} 👋
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/notificaciones')} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(10,22,40,0.05)' }}>
            <Icon name="bell" size={20} color="var(--ink-700)" />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: '50%', background: 'var(--danger-500)', border: '2px solid #fff' }}/>}
          </button>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #FBBF24, #D97706)', border: '2px solid #fff', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', boxShadow: '0 4px 10px rgba(217,119,6,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</div>
        </div>
      </div>

      {selectedUniversity && (
        <div style={{ padding: '0 20px 8px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(16,169,198,0.08)', color: 'var(--brand-700)', fontSize: 13, fontWeight: 700 }}>
            <Icon name="graduation" size={13} color="var(--brand-700)" />
            {selectedUniversity.name}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52, borderRadius: 16, padding: '0 16px', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(14px) saturate(180%)', WebkitBackdropFilter: 'blur(14px) saturate(180%)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 6px rgba(10,22,40,0.05)' }} onClick={() => router.push('/explorar')}>
          <Icon name="search" size={20} color="var(--ink-400)" />
          <div style={{ flex: 1, fontSize: 15, color: 'var(--ink-500)' }}>Buscar tratamientos, estudiantes...</div>
        </div>
      </div>

      {/* Next appointment */}
      <div style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
          <div style={{ fontSize: 13, color: 'var(--ink-600)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tu próxima cita</div>
          <Link href="/citas" style={{ color: 'var(--brand-700)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Ver todas →</Link>
        </div>

        {loading ? (
          <div style={{ height: 160, borderRadius: 24, background: 'linear-gradient(135deg, #0E8AA5 0%, #4F46E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Cargando…</div>
          </div>
        ) : next ? (
          <div style={{ padding: 20, borderRadius: 24, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0E8AA5 0%, #4F46E5 100%)', boxShadow: '0 18px 40px rgba(14,138,165,0.35), 0 4px 12px rgba(79,70,229,0.15)', color: '#fff' }}>
            <div aria-hidden style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent 70%)' }}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', fontSize: 12, fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }}/>
                {STATUS_LABEL[next.status] ?? next.status}
              </div>
              <Icon name="calendar" size={22} color="rgba(255,255,255,0.9)" />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 4, position: 'relative' }}>
              {next.date}{next.time ? ` · ${next.time}` : ''}
            </div>
            <div style={{ fontSize: 15, opacity: 0.9, marginBottom: 16, position: 'relative' }}>
              {next.service || 'Cita'}{next.clinic?.name ? ` · ${next.clinic.name}` : ''}
            </div>
            {next.student?.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #C7D2FE, #818CF8)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {next.student.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{next.student.name}</div>
                  {next.student.university && <div style={{ fontSize: 12, opacity: 0.85 }}>{next.student.university}</div>}
                </div>
                <Link href={`/chat?appointmentId=${next.id}`}>
                  <button style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(255,255,255,0.95)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="chat" size={18} color="var(--brand-700)" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', textAlign: 'center' }}>
            <Icon name="calendar" size={32} color="var(--ink-300)" />
            <div style={{ fontSize: 15, color: 'var(--ink-600)', margin: '12px 0 16px', fontWeight: 500 }}>No tienes citas próximas</div>
            <Button size="md" onClick={() => router.push('/explorar')}>Agendar cita</Button>
          </div>
        )}
      </div>

      {/* Services */}
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>Tratamientos</div>
          <button style={{ background: 'none', border: 'none', color: 'var(--brand-700)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }} onClick={() => router.push('/explorar')}>Ver todos →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {catalogLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Glass key={index} radius={20} style={{ padding: 14, minHeight: 136, opacity: 0.65 }}>
                <div />
              </Glass>
            ))
          ) : featuredServices.length > 0 ? (
            featuredServices.map((service, index) => {
              const tint = SERVICE_TONES[index % SERVICE_TONES.length];
              const icons = ['sparkle', 'shield', 'heart', 'check'] as const;
              return (
                <Link key={service.id} href={`/servicio/${service.id}`} style={{ textDecoration: 'none' }}>
                  <Glass radius={20} style={{ padding: 14, cursor: 'pointer' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${tint}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Icon name={icons[index % icons.length]} size={22} color={tint} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 2 }}>{service.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="clock" size={12} color="var(--ink-400)" />
                      {service.duration ? `${service.duration} min` : 'Duracion variable'}
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>desde </span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                        {service.price != null ? `$${service.price.toLocaleString('es-CL')}` : 'Consultar'}
                      </span>
                    </div>
                  </Glass>
                </Link>
              );
            })
          ) : (
            <Glass radius={20} style={{ padding: 20, gridColumn: '1 / -1', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--ink-500)' }}>Todavia no hay tratamientos visibles para tu universidad.</div>
            </Glass>
          )}
        </div>
      </div>

      {/* Students */}
      <div style={{ padding: '8px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>Estudiantes disponibles</div>
          <button style={{ background: 'none', border: 'none', color: 'var(--brand-700)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }} onClick={() => router.push('/explorar')}>Ver todos →</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {catalogLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Glass key={index} radius={20} style={{ padding: 16, minHeight: 116, opacity: 0.65 }}>
                <div />
              </Glass>
            ))
          ) : featuredStudents.length > 0 ? (
            featuredStudents.map(student => (
              <Glass key={student.id} radius={20} style={{ padding: 16, cursor: 'pointer' }} onClick={() => router.push(`/estudiante?id=${student.id}`)}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: student.gradient, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{student.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{student.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>{student.university || 'Universidad asociada'}</div>
                    <div style={{ fontSize: 12, color: 'var(--brand-700)', marginTop: 6, fontWeight: 700 }}>
                      {student.serviceName || 'Servicio disponible'}
                      {student.price != null ? ` · Desde $${student.price.toLocaleString('es-CL')}` : ''}
                    </div>
                  </div>
                  <Icon name="chevron" size={18} color="var(--ink-400)" />
                </div>
              </Glass>
            ))
          ) : (
            <Glass radius={20} style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--ink-500)' }}>Aun no hay estudiantes visibles en este momento.</div>
            </Glass>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ position: 'fixed', bottom: 24, left: 16, right: 16, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 64, borderRadius: 999, padding: '0 12px', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 18px 40px rgba(10,22,40,0.12), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
          {[
            { icon: 'home',     label: 'Inicio',  href: '/home',      active: true },
            { icon: 'search',   label: 'Buscar',  href: '/explorar' },
            { icon: 'calendar', label: 'Citas',   href: '/citas' },
            { icon: 'chat',     label: 'Chat',    href: '/chat' },
            { icon: 'user',     label: 'Perfil',  href: '/perfil' },
          ].map(t => (
            <Link key={t.label} href={t.href} style={{ textDecoration: 'none' }}>
              <button style={{ width: 56, height: 48, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: t.active ? 'var(--brand-700)' : 'var(--ink-500)', position: 'relative' }}>
                {t.active && <div style={{ position: 'absolute', inset: 4, borderRadius: 999, background: 'linear-gradient(135deg, rgba(16,169,198,0.15), rgba(79,70,229,0.1))' }}/>}
                <Icon name={t.icon as Parameters<typeof Icon>[0]['name']} size={22} color={t.active ? 'var(--brand-700)' : 'var(--ink-500)'} stroke={t.active ? 2.2 : 1.8} />
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.01em', position: 'relative' }}>{t.label}</div>
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
