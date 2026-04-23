'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import { useStudent } from '@/hooks/useStudent';

const AVATAR_GRADIENT = 'linear-gradient(135deg, #C7D2FE, #818CF8)';

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" size={size} color={i < rating ? '#F59E0B' : '#DCE4EF'} stroke={0} />
      ))}
    </div>
  );
}

function SupervisorBadge({ name, title }: { name: string; title?: string }) {
  return (
    <Glass radius={14} style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--success-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="shield" size={18} color="var(--success-600)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 500 }}>Supervisado por</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{name}{title ? ` · ${title}` : ''}</div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success-600)', padding: '3px 8px', borderRadius: 999, background: 'var(--success-100)', flexShrink: 0 }}>Certificado</span>
    </Glass>
  );
}

function StudentUnavailable({ desktop = false }: { desktop?: boolean }) {
  if (desktop) {
    return (
      <DesktopShell role="patient" activeId="search" title="Perfil estudiante" search={false}>
        <Glass radius={22} style={{ padding: 48, textAlign: 'center', maxWidth: 560, margin: '40px auto 0' }}>
          <Icon name="users" size={38} color="var(--ink-300)" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink-900)', marginTop: 16 }}>
            No encontramos este perfil
          </div>
          <p style={{ fontSize: 15, color: 'var(--ink-500)', lineHeight: 1.5, margin: '10px 0 0' }}>
            El estudiante no esta disponible o ya no tiene servicios publicados.
          </p>
        </Glass>
      </DesktopShell>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Glass radius={22} style={{ padding: 32, textAlign: 'center', width: '100%', maxWidth: 420 }}>
        <Icon name="users" size={34} color="var(--ink-300)" />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', marginTop: 16 }}>
          Perfil no disponible
        </div>
        <p style={{ fontSize: 15, color: 'var(--ink-500)', lineHeight: 1.5, margin: '10px 0 0' }}>
          Este estudiante no tiene informacion visible en este momento.
        </p>
      </Glass>
    </div>
  );
}

function EstudianteDesktop({ id }: { id: string | null }) {
  const router = useRouter();
  const { student, loading } = useStudent(id);

  if (loading) return (
    <DesktopShell role="patient" activeId="search" title="Perfil estudiante">
      <div style={{ padding: 80, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>Cargando…</div>
    </DesktopShell>
  );

  if (!student) return <StudentUnavailable desktop />;
  const initials = student.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <DesktopShell role="patient" activeId="search" title={student.name} subtitle={[student.year, student.university].filter(Boolean).join(' · ')}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left — profile card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Glass hi radius={20} style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ width: 96, height: 96, borderRadius: 28, background: AVATAR_GRADIENT, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 14px 30px rgba(99,102,241,0.25)' }}>{initials}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>{student.name}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 4 }}>{[student.year, student.university].filter(Boolean).join(' · ')}</div>
            {student.rating != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'center' }}>
                <Icon name="star" size={14} color="#F59E0B" stroke={0} />
                <b style={{ fontSize: 14, color: 'var(--ink-900)' }}>{student.rating.toFixed(1)}</b>
                {student.reviewCount != null && <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>({student.reviewCount} reseñas)</span>}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
              {[
                [student.patientCount ? `${student.patientCount}+` : '—', 'Pacientes'],
                [student.yearsOnPlatform ? `${student.yearsOnPlatform} años` : '—', 'En ALDIENTE'],
                [student.attendanceRate ? `${student.attendanceRate}%` : '—', 'Asistencia'],
              ].map(([v, l]) => (
                <div key={l} style={{ padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(10,22,40,0.04)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-500)', fontWeight: 600, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </Glass>

          {student.supervisorName && <SupervisorBadge name={student.supervisorName} title={student.supervisorTitle} />}

          <div style={{ display: 'flex', gap: 10 }}>
            <Button size="md" variant="glass" icon="chat" full onClick={() => router.push('/chat')}>Mensaje</Button>
            <Button size="md" full onClick={() => router.push(`/reservar${id ? `?studentId=${id}` : ''}`)}>Agendar →</Button>
          </div>
        </div>

        {/* Right — bio, services, reviews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {student.bio && (
            <Glass hi radius={20} style={{ padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Sobre mí</div>
              <p style={{ fontSize: 15, color: 'var(--ink-700)', lineHeight: 1.6, margin: 0 }}>{student.bio}</p>
            </Glass>
          )}

          <Glass hi radius={20} style={{ padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Servicios</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {student.services.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(10,22,40,0.04)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{s.name}</div>
                    {s.duration != null && <div style={{ fontSize: 13, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><Icon name="clock" size={12} color="var(--ink-400)" />{s.duration} min</div>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>${s.price.toLocaleString('es-CL')}</div>
                  <Button size="sm" onClick={() => router.push(`/reservar${id ? `?studentId=${id}&serviceId=${s.id}` : ''}`)}>Agendar</Button>
                </div>
              ))}
            </div>
          </Glass>

          {student.reviews.length > 0 && (
            <Glass hi radius={20} style={{ padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Reseñas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {student.reviews.map((r, i) => (
                  <div key={i} style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(10,22,40,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{r.name}</div>
                        <StarRow rating={r.rating} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>{r.date}</div>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.45 }}>{r.text}</div>
                  </div>
                ))}
              </div>
            </Glass>
          )}
        </div>
      </div>
    </DesktopShell>
  );
}

function EstudianteMobile({ id }: { id: string | null }) {
  const router = useRouter();
  const { student, loading } = useStudent(id);

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--ink-400)' }}>Cargando…</div>
    </div>
  );

  if (!student) return <StudentUnavailable />;
  const initials = student.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="app-scroll" style={{ minHeight: '100dvh', overflowY: 'auto', background: 'var(--bg-aurora)', paddingBottom: 140 }}>
      <div style={{ padding: '60px 20px 0' }}>
        <button onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(10,22,40,0.05)' }}>
          <Icon name="arrow_left" size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 88, height: 88, borderRadius: 28, background: AVATAR_GRADIENT, color: '#fff', fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px rgba(99,102,241,0.3)', flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{student.name}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-600)', marginTop: 2 }}>{[student.year, student.university].filter(Boolean).join(' · ')}</div>
            {student.rating != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <Icon name="star" size={14} color="#F59E0B" stroke={0} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{student.rating.toFixed(1)}</span>
                {student.reviewCount != null && <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>({student.reviewCount} reseñas)</span>}
              </div>
            )}
          </div>
        </div>

        {student.supervisorName && (
          <div style={{ marginBottom: 20 }}>
            <SupervisorBadge name={student.supervisorName} title={student.supervisorTitle} />
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          [student.patientCount ? `${student.patientCount}+` : '—', 'Pacientes'],
          [student.yearsOnPlatform ? `${student.yearsOnPlatform} años` : '—', 'En ALDIENTE'],
          [student.attendanceRate ? `${student.attendanceRate}%` : '—', 'Asistencia'],
        ].map(([v, l]) => (
          <Glass key={l} radius={16} style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600, marginTop: 2 }}>{l}</div>
          </Glass>
        ))}
      </div>

      {student.bio && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-600)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Sobre mí</div>
          <p style={{ fontSize: 15, color: 'var(--ink-700)', lineHeight: 1.5, margin: 0 }}>{student.bio}</p>
        </div>
      )}

      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-600)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Servicios</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {student.services.map(s => (
            <Glass key={s.id} radius={16} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{s.name}</div>
                {s.duration != null && (
                  <div style={{ fontSize: 13, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="clock" size={12} color="var(--ink-400)" />{s.duration} min
                  </div>
                )}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                ${s.price.toLocaleString('es-CL')}
              </div>
            </Glass>
          ))}
        </div>
      </div>

      {student.reviews.length > 0 && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-600)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Reseñas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {student.reviews.map((r, i) => (
              <Glass key={i} radius={16} style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{r.date}</div>
                </div>
                <StarRow rating={r.rating} />
                <div style={{ fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.45, marginTop: 6 }}>{r.text}</div>
              </Glass>
            ))}
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 24, left: 16, right: 16, zIndex: 10, display: 'flex', gap: 10 }}>
        <button onClick={() => router.push('/chat')} style={{ width: 56, height: 56, borderRadius: 18, flexShrink: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px rgba(10,22,40,0.12)' }}>
          <Icon name="chat" size={22} color="var(--brand-700)" />
        </button>
        <Button size="lg" full trailingIcon="arrow_right" onClick={() => router.push(`/reservar${id ? `?studentId=${id}` : ''}`)}>
          Agendar con {student.name.split(' ')[0]}
        </Button>
      </div>
    </div>
  );
}

function EstudianteInner() {
  const isDesktop = useIsDesktop();
  const params = useSearchParams();
  const id = params.get('id');
  return isDesktop ? <EstudianteDesktop id={id} /> : <EstudianteMobile id={id} />;
}

export default function EstudiantePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--ink-400)' }}>Cargando…</div>
      </div>
    }>
      <EstudianteInner />
    </Suspense>
  );
}
