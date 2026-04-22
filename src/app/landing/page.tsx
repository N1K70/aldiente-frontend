'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Glass } from '@/components/ui';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui';
import { Wordmark } from '@/components/brand';
import { useIsDesktop } from '@/components/desktop-shell';

function LandingDesktop() {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  return (
    <div ref={ref} style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', fontFamily: 'var(--font-body)', color: 'var(--ink-900)', overflowX: 'hidden' }}>
      {/* Nav */}
      <div style={{ padding: '24px 60px', display: 'flex', alignItems: 'center', gap: 32, position: 'sticky', top: 0, zIndex: 20, background: 'rgba(240,248,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #1BB9D6, #6366F1)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16,169,198,0.3)' }}>A</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink-900)' }}>ALDIENTE</div>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 14, color: 'var(--ink-700)', fontWeight: 500 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => document.getElementById('how-it-works-desktop')?.scrollIntoView({ behavior: 'smooth' })}>Cómo funciona</span>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push('/signup?role=student')}>Para estudiantes</span>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push('/login')}>Clínicas</span>
          <span style={{ cursor: 'pointer' }} onClick={() => document.getElementById('how-it-works-desktop')?.scrollIntoView({ behavior: 'smooth' })}>Precios</span>
        </div>
        <div style={{ flex: 1 }} />
        <Link href="/login" style={{ textDecoration: 'none', fontSize: 14, fontWeight: 600, color: 'var(--ink-700)' }}>Iniciar sesión</Link>
        <Link href="/signup"><Button size="md">Crear cuenta</Button></Link>
      </div>

      {/* Hero */}
      <div style={{ padding: '60px 60px 80px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 60, alignItems: 'center', maxWidth: 1280, margin: '0 auto' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(16,169,198,0.2)', fontSize: 13, fontWeight: 600, color: 'var(--brand-700)', marginBottom: 24 }}>
            <Icon name="shield" size={13} color="var(--brand-600)" />Estudiantes supervisados · 100% seguro
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 68, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 20px', color: 'var(--ink-900)' }}>
            Cuidado dental<br />que <span style={{ background: 'linear-gradient(135deg, #10A9C6, #6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>conecta</span>.
          </h1>
          <p style={{ fontSize: 19, color: 'var(--ink-600)', lineHeight: 1.5, margin: '0 0 32px', maxWidth: 500 }}>
            Atención dental de calidad hasta 60% más accesible. Estudiantes de los últimos años, siempre supervisados por odontólogos certificados.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
            <Link href="/signup"><Button size="lg" trailingIcon="arrow_right">Buscar atención</Button></Link>
            <Button size="lg" variant="glass" onClick={() => router.push('/signup?role=student')}>Soy estudiante</Button>
          </div>
          <div style={{ display: 'flex', gap: 32, fontSize: 13, color: 'var(--ink-600)' }}>
            {[['2.400+', 'Pacientes atendidos'], ['180+', 'Estudiantes activos'], ['4.8★', 'Rating promedio']].map(([v, l]) => (
              <div key={l}>
                <b style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink-900)', letterSpacing: '-0.02em', display: 'block' }}>{v}</b>
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Hero card */}
        <div style={{ position: 'relative', height: 460 }}>
          <Glass hi radius={28} style={{ position: 'absolute', inset: 0, padding: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Próxima cita</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 18, color: 'var(--ink-900)' }}>Limpieza con Sofía M.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[['Fecha', 'Mar 28'], ['Hora', '10:30'], ['Precio', '$15.000'], ['Duración', '45 min']].map(([l, v]) => (
                <div key={l} style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.7)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600 }}>{l}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: 'var(--success-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="shield" size={16} color="var(--success-600)" />
              <div style={{ fontSize: 13, color: 'var(--ink-800)' }}>Supervisada por <b>Dra. Morales</b></div>
            </div>
          </Glass>
          <Glass radius={20} style={{ position: 'absolute', top: 30, right: -24, padding: 16, width: 220, transform: 'rotate(3deg)', boxShadow: '0 20px 40px rgba(10,22,40,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #A7F3D0, #10B981)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>MR</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>María R.</div>
                <div style={{ display: 'flex', gap: 2 }}>{[0,1,2,3,4].map(i => <Icon key={i} name="star" size={10} color="#F59E0B" stroke={0} />)}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-600)', lineHeight: 1.4 }}>"Excelente trato, muy paciente. Me explicó todo paso a paso."</div>
          </Glass>
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works-desktop" style={{ padding: '60px', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8, color: 'var(--ink-900)' }}>Así funciona</div>
            <div style={{ fontSize: 17, color: 'var(--ink-600)' }}>De la búsqueda a tu cita confirmada en 3 pasos.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { n: '01', t: 'Encuentra tu estudiante', d: 'Filtra por servicio, precio, distancia y rating. Ve reseñas y al supervisor asignado.', icon: 'search', tint: '#10A9C6' },
              { n: '02', t: 'Agenda en segundos',     d: 'Elige día y hora. Paga con Webpay o en la clínica. Recibirás confirmación en tu correo.', icon: 'calendar', tint: '#6366F1' },
              { n: '03', t: 'Atención supervisada',   d: 'El estudiante realiza el procedimiento bajo supervisión directa de su docente.', icon: 'shield', tint: '#10B981' },
            ].map(s => (
              <Glass hi key={s.n} radius={22} style={{ padding: 28 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: s.tint, letterSpacing: '-0.03em', marginBottom: 10 }}>{s.n}</div>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${s.tint}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} size={22} color={s.tint} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', marginBottom: 8 }}>{s.t}</div>
                <div style={{ fontSize: 14, color: 'var(--ink-600)', lineHeight: 1.5 }}>{s.d}</div>
              </Glass>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '80px 60px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: 14, color: 'var(--ink-900)' }}>
          ¿Listo para agendar<br />tu próxima cita?
        </div>
        <div style={{ fontSize: 17, color: 'var(--ink-600)', marginBottom: 28 }}>Regístrate en 2 minutos. Sin compromisos.</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Link href="/signup"><Button size="lg" trailingIcon="arrow_right">Empezar ahora</Button></Link>
          <Button size="lg" variant="glass" onClick={() => document.getElementById('how-it-works-desktop')?.scrollIntoView({ behavior: 'smooth' })}>Ver cómo funciona</Button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '32px 60px', borderTop: '1px solid rgba(10,22,40,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--ink-500)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink-900)' }}>ALDIENTE</div>
        <div>© 2026 Al Diente SpA · Chile · Todos los derechos reservados</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>Privacidad</span>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>Términos</span>
          <span style={{ cursor: 'pointer' }} onClick={() => window.open('mailto:hola@aldiente.cl')}>Contacto</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const isDesktop = useIsDesktop();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (isDesktop) return;
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [isDesktop]);

  if (isDesktop) return <LandingDesktop />;

  return (
    <div
      ref={scrollRef}
      className="app-scroll"
      style={{
        minHeight: '100dvh',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'var(--bg-aurora)',
        position: 'relative',
      }}
    >
      {/* Mesh blobs */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: 80 - scrollY * 0.2, right: -80,
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.35), transparent 70%)',
          filter: 'blur(20px)',
        }}/>
        <div style={{
          position: 'absolute', top: 400 - scrollY * 0.15, left: -120,
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,169,198,0.4), transparent 70%)',
          filter: 'blur(20px)',
        }}/>
      </div>

      {/* Sticky nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, padding: '16px 20px 12px' }}>
        <Glass radius={999} hi style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px 10px 20px',
        }}>
          <Wordmark size={19} />
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button style={{
              height: 40, padding: '0 18px', borderRadius: 999,
              background: 'transparent', border: 'none',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
              color: 'var(--ink-800)', cursor: 'pointer',
            }}>Ingresar</button>
          </Link>
        </Glass>
      </div>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, padding: '16px 24px 40px' }}>
        {/* Trust pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px 8px 10px', borderRadius: 999,
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(14px) saturate(180%)',
          WebkitBackdropFilter: 'blur(14px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 2px 6px rgba(10,22,40,0.05)',
          fontSize: 13, fontWeight: 600, color: 'var(--brand-800)',
          marginBottom: 24,
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'linear-gradient(180deg, #3DC4DC, #0E8AA5)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="shield" size={13} color="#fff" stroke={2.4} />
          </span>
          Supervisión docente certificada
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 12vw, 56px)',
          fontWeight: 700, letterSpacing: '-0.035em',
          lineHeight: 1.02, color: 'var(--ink-900)',
          margin: '0 0 18px', textWrap: 'balance',
        }}>
          Tu sonrisa,<br />
          <span style={{
            background: 'linear-gradient(135deg, #10A9C6 0%, #4F46E5 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>al alcance</span><br />
          de todos.
        </h1>

        <p style={{
          fontSize: 18, lineHeight: 1.5, color: 'var(--ink-600)',
          margin: '0 0 28px', maxWidth: 440,
        }}>
          Agenda con estudiantes de odontología certificados, con supervisión docente y precios justos. Sin llamadas, sin filas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, maxWidth: 440 }}>
          <Link href="/signup" style={{ textDecoration: 'none', display: 'block' }}>
            <Button size="lg" full trailingIcon="arrow_right">Crear cuenta gratis</Button>
          </Link>
          <Button size="lg" full variant="glass" onClick={() => {
            document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Ver cómo funciona
          </Button>
        </div>

        {/* Social proof */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex' }}>
            {(['MG', 'CP', 'AL', 'JR'] as const).map((n, i) => (
              <div key={n} style={{
                width: 34, height: 34, borderRadius: '50%',
                background: `linear-gradient(135deg, ${['#FBBF24','#F472B6','#60A5FA','#34D399'][i]}, ${['#D97706','#DB2777','#2563EB','#059669'][i]})`,
                border: '2.5px solid #fff', marginLeft: i === 0 ? 0 : -10,
                color: '#fff', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}>{n}</div>
            ))}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-600)', lineHeight: 1.3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
              {[0,1,2,3,4].map(i => <Icon key={i} name="star" size={13} color="#F59E0B" stroke={0} />)}
              <span style={{ fontWeight: 700, color: 'var(--ink-900)', marginLeft: 4 }}>4.9</span>
            </div>
            <span><b style={{ color: 'var(--ink-900)' }}>+500 pacientes</b> confían en nosotros</span>
          </div>
        </div>
      </section>

      {/* Preview card */}
      <section style={{ position: 'relative', zIndex: 1, padding: '8px 24px 40px', maxWidth: 480 }}>
        <Glass hi radius={28} style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', fontWeight: 500 }}>Tu próxima cita</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>Martes · 10:30</div>
            </div>
            <div style={{
              padding: '6px 10px', borderRadius: 999,
              background: 'var(--success-100)', color: 'var(--success-600)',
              fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success-500)' }}/>
              Confirmada
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18,
            background: 'rgba(16,169,198,0.06)', border: '1px solid rgba(16,169,198,0.12)',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: 'linear-gradient(135deg, #C7D2FE, #818CF8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)',
            }}>SM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' }}>Sofía Méndez</div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="graduation" size={13} color="var(--ink-400)" />
                5º año · U. de Chile
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 700, color: 'var(--ink-800)' }}>
              <Icon name="star" size={13} color="#F59E0B" stroke={0} />4.9
            </div>
          </div>
        </Glass>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ position: 'relative', zIndex: 1, padding: '32px 24px 40px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Cómo funciona
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
          letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--ink-900)',
          margin: '0 0 24px',
        }}>
          Reservar nunca fue tan simple.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
          {[
            { n: '1', title: 'Cuéntanos qué necesitas', desc: 'Un quiz visual de 30 segundos. Tocas iconos, no llenas formularios.' },
            { n: '2', title: 'Elige a tu estudiante', desc: 'Mira calificaciones, supervisor y disponibilidad antes de reservar.' },
            { n: '3', title: 'Paga seguro y ven', desc: 'Webpay y recordatorios automáticos. Cambios gratis con 24h.' },
          ].map(s => (
            <Glass key={s.n} radius={22} style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                flexShrink: 0, width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, var(--brand-100), var(--brand-200))',
                color: 'var(--brand-700)', fontFamily: 'var(--font-display)',
                fontSize: 22, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.9)',
              }}>{s.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 15, color: 'var(--ink-600)', lineHeight: 1.45 }}>{s.desc}</div>
              </div>
            </Glass>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section style={{ position: 'relative', zIndex: 1, padding: '8px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 480 }}>
          {[
            { icon: 'shield', tint: '#10A9C6', title: 'Supervisión docente', desc: 'Cada tratamiento aprobado por un profesional.' },
            { icon: 'zap', tint: '#F59E0B', title: 'Hasta 70% menos', desc: 'Precios accesibles sin sacrificar calidad.' },
            { icon: 'chat', tint: '#6366F1', title: 'Chat directo', desc: 'Habla con tu estudiante antes de la cita.' },
            { icon: 'heart', tint: '#EC4899', title: 'Reviews reales', desc: 'Califica y lee antes de reservar.' },
          ].map(f => (
            <Glass key={f.title} radius={20} style={{ padding: 16 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: `${f.tint}14`, color: f.tint,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
              }}>
                <Icon name={f.icon} size={20} color={f.tint} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.4 }}>{f.desc}</div>
            </Glass>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section style={{ position: 'relative', zIndex: 1, padding: '8px 24px 40px' }}>
        <Glass hi radius={28} style={{ padding: 24, position: 'relative', maxWidth: 480 }}>
          <div style={{
            position: 'absolute', top: 16, right: 20,
            fontFamily: 'var(--font-display)', fontSize: 80, lineHeight: 1, color: 'var(--brand-200)',
          }}>"</div>
          <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
            {[0,1,2,3,4].map(i => <Icon key={i} name="star" size={15} color="#F59E0B" stroke={0} />)}
          </div>
          <p style={{
            fontSize: 17, lineHeight: 1.45, color: 'var(--ink-800)',
            margin: '0 0 18px', fontWeight: 500,
          }}>
            A mis 72 años tenía miedo de la tecnología. Acá pude agendar todo en el celular, vi quién me atendería y hasta hablé con ella. Mi nieta me ayudó solo con el primer paso.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #FBBF24, #D97706)',
              color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>MR</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>María Rivas</div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>Paciente · Santiago</div>
            </div>
          </div>
        </Glass>
      </section>

      {/* CTA final */}
      <section style={{ position: 'relative', zIndex: 1, padding: '20px 24px 40px' }}>
        <div style={{
          padding: 28, borderRadius: 32, maxWidth: 480,
          background: 'linear-gradient(135deg, #0E8AA5 0%, #4F46E5 100%)',
          boxShadow: '0 30px 60px rgba(14,138,165,0.35), 0 10px 20px rgba(79,70,229,0.2)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div aria-hidden style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.25), transparent 70%)',
          }}/>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
            letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.05,
            margin: '0 0 10px', position: 'relative',
          }}>¿Listo para tu<br />mejor sonrisa?</h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', margin: '0 0 20px', lineHeight: 1.45, position: 'relative' }}>
            Crea tu cuenta en menos de un minuto y agenda tu primera cita hoy.
          </p>
          <Link href="/signup" style={{ textDecoration: 'none', display: 'block', position: 'relative' }}>
            <button style={{
              width: '100%', height: 56, borderRadius: 18,
              background: '#fff', border: 'none',
              fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700,
              color: 'var(--brand-700)', letterSpacing: '-0.01em',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            }}>
              Empezar gratis
              <Icon name="arrow_right" size={20} />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '20px 24px 60px', textAlign: 'center' }}>
        <Wordmark size={17} color="var(--ink-700)" />
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-500)' }}>
          Hecho con ♥ en Chile · © 2026
        </div>
      </footer>
    </div>
  );
}
