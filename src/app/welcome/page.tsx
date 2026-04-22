'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui';
import { ToothMark } from '@/components/brand';
import { useIsDesktop } from '@/components/desktop-shell';
import { Glass } from '@/components/ui';

export default function WelcomePage() {
  const isDesktop = useIsDesktop();

  const cta = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Link href="/signup" style={{ textDecoration: 'none', display: 'block' }}>
        <Button size="lg" full trailingIcon="arrow_right">Crear cuenta</Button>
      </Link>
      <Link href="/login" style={{ textDecoration: 'none', display: 'block' }}>
        <Button size="lg" full variant="glass">Ya tengo cuenta</Button>
      </Link>
    </div>
  );

  const legal = (
    <div style={{ fontSize: 13, color: 'var(--ink-500)', textAlign: 'center', lineHeight: 1.5 }}>
      Al continuar aceptas los{' '}
      <Link href="/" style={{ color: 'var(--ink-700)', fontWeight: 700, textDecoration: 'none' }}>Términos</Link>
      {' '}y la{' '}
      <Link href="/" style={{ color: 'var(--ink-700)', fontWeight: 700, textDecoration: 'none' }}>Política de privacidad</Link>.
    </div>
  );

  if (isDesktop) return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg-aurora)',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Left – brand panel */}
      <div style={{ padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <Link href="/landing" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1BB9D6, #6366F1)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink-900)' }}>ALDIENTE</div>
          </div>
        </Link>
        <div>
          <div style={{ marginBottom: 28 }}>
            <div style={{
              width: 96, height: 96, borderRadius: 28,
              background: 'linear-gradient(135deg, #DEF5F9, #B7EAF3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.9), 0 14px 30px rgba(16,169,198,0.25)',
              marginBottom: 24,
            }}>
              <ToothMark size={54} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1, color: 'var(--ink-900)', marginBottom: 16 }}>
            Bienvenido a<br />al<span style={{ color: 'var(--brand-600)' }}>diente</span>
          </div>
          <div style={{ fontSize: 17, color: 'var(--ink-600)', lineHeight: 1.5, maxWidth: 380 }}>
            Cuidado dental supervisado, a precio justo, desde cualquier dispositivo.
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 28, fontSize: 13, color: 'var(--ink-600)' }}>
            {[['2.400+', 'Pacientes'], ['180+', 'Estudiantes'], ['4.8★', 'Rating']].map(([v, l]) => (
              <div key={l}>
                <b style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink-900)', letterSpacing: '-0.02em', display: 'block' }}>{v}</b>
                {l}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>© 2026 ALDIENTE · Chile</div>
      </div>

      {/* Right – actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <Glass hi radius={24} style={{ padding: 40, width: '100%', maxWidth: 440 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6, color: 'var(--ink-900)' }}>Empezar</div>
          <div style={{ fontSize: 14, color: 'var(--ink-600)', marginBottom: 28 }}>
            Crea una cuenta o inicia sesión para continuar.
          </div>
          {cta}
          <div style={{ marginTop: 24 }}>{legal}</div>
        </Glass>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100dvh', overflow: 'auto',
      background: 'var(--bg-aurora)',
      display: 'flex', flexDirection: 'column', padding: '60px 24px 40px',
    }}>
      <Link href="/landing">
        <button style={{
          width: 44, height: 44, borderRadius: 999,
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(10,22,40,0.05)',
        }}>
          <Icon name="arrow_left" size={20} />
        </button>
      </Link>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32, padding: '40px 0', maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 104, height: 104, borderRadius: 32,
            background: 'linear-gradient(135deg, #DEF5F9, #B7EAF3)',
            margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.9), 0 14px 30px rgba(16,169,198,0.25)',
          }}>
            <ToothMark size={60} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700,
            letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 12px', color: 'var(--ink-900)',
          }}>
            Bienvenido a<br />al<span style={{ color: 'var(--brand-600)' }}>diente</span>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink-600)', margin: 0, lineHeight: 1.5 }}>
            Cuidado dental supervisado, a precio justo, desde tu celular.
          </p>
        </div>

        {cta}
        {legal}
      </div>
    </div>
  );
}
