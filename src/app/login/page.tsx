'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Icon, TextField, Glass } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useIsDesktop } from '@/components/desktop-shell';

function roleHome() {
  try {
    const role = JSON.parse(localStorage.getItem('authUser') ?? '{}').role;
    return role === 'student' || role === 'admin' ? '/dashboard' : '/home';
  } catch {
    return '/home';
  }
}

function MailOnlyNotice() {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 14,
        background: 'rgba(16,169,198,0.08)',
        border: '1px solid rgba(16,169,198,0.16)',
        fontSize: 13,
        color: 'var(--ink-700)',
        lineHeight: 1.5,
      }}
    >
      Acceso habilitado solo con correo y contrasena.
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const isDesktop = useIsDesktop();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, pw);
      router.push(roleHome());
    } catch {
      setError('Correo o contrasena incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: 'var(--font-body)' }}>
        <div style={{ padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1BB9D6, #6366F1)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink-900)' }}>ALDIENTE</div>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1, color: 'var(--ink-900)', marginBottom: 16 }}>
              Bienvenido
              <br />
              nuevamente
            </div>
            <div style={{ fontSize: 17, color: 'var(--ink-600)', lineHeight: 1.5, maxWidth: 420 }}>
              Ingresa con tu correo para revisar tus citas, mensajes y reservas activas.
            </div>
            <Glass hi radius={20} style={{ padding: 18, marginTop: 28, maxWidth: 380, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #FDE68A, #F59E0B)', color: '#fff', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>OK</div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.4 }}>
                  Todo el acceso queda centralizado por mail para mantener un flujo unico de registro y soporte.
                </div>
              </div>
            </Glass>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>© 2026 ALDIENTE · Chile</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <Glass hi radius={24} style={{ padding: 40, width: '100%', maxWidth: 440 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6, color: 'var(--ink-900)' }}>Inicia sesion</div>
            <div style={{ fontSize: 14, color: 'var(--ink-600)', marginBottom: 28 }}>
              ¿Aun no tienes cuenta?{' '}
              <Link href="/signup" style={{ color: 'var(--brand-700)', fontWeight: 600, textDecoration: 'none' }}>
                Crea una →
              </Link>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextField label="Correo electronico" icon="mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.cl" />
              <TextField
                label="Contrasena"
                icon="lock"
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="••••••••"
                trailing={
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
                    <Icon name={showPw ? 'eye_off' : 'eye'} size={20} color="var(--ink-400)" />
                  </button>
                }
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => router.push('/recuperar')} style={{ background: 'none', border: 'none', color: 'var(--brand-700)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  ¿Olvidaste tu contrasena?
                </button>
              </div>
              {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 14, fontWeight: 500 }}>{error}</div>}
              <Button size="lg" full type="submit" disabled={loading}>
                {loading ? 'Ingresando...' : 'Iniciar sesion'}
              </Button>
            </form>

            <div style={{ marginTop: 22 }}>
              <MailOnlyNotice />
            </div>
          </Glass>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', overflow: 'auto', background: 'var(--bg-aurora)' }}>
      <form onSubmit={handleSubmit} style={{ padding: '60px 24px 40px', minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
        <Link href="/welcome">
          <button type="button" style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow_left" size={20} />
          </button>
        </Link>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, margin: '0 0 10px', color: 'var(--ink-900)' }}>
          Bienvenida
          <br />
          de nuevo.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink-600)', margin: '0 0 28px' }}>
          Ingresa con tu correo para continuar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <TextField label="Correo electronico" icon="mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.cl" />
          <TextField
            label="Contrasena"
            icon="lock"
            type={showPw ? 'text' : 'password'}
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="••••••••"
            trailing={
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
                <Icon name={showPw ? 'eye_off' : 'eye'} size={20} color="var(--ink-400)" />
              </button>
            }
          />
          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <button type="button" onClick={() => router.push('/recuperar')} style={{ background: 'none', border: 'none', color: 'var(--brand-700)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              ¿Olvidaste tu contrasena?
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 14, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <Button size="lg" full type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>

        <div style={{ marginTop: 18 }}>
          <MailOnlyNotice />
        </div>

        <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 32, fontSize: 15, color: 'var(--ink-600)' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/signup" style={{ color: 'var(--brand-700)', fontWeight: 700, textDecoration: 'none' }}>
            Crear cuenta
          </Link>
        </div>
      </form>
    </div>
  );
}
