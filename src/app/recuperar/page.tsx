'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, TextField, Glass, Icon } from '@/components/ui';
import { useIsDesktop } from '@/components/desktop-shell';
import { requestPasswordReset } from '@/lib/auth-recovery';

export default function RecuperarPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    try {
      const data = await requestPasswordReset(email);
      const link = (data as { devResetLink?: string } | null)?.devResetLink;
      if (link) setDevLink(link);
      setSent(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 404 || (msg && /not found|no existe|registrado/i.test(msg))) {
        setError('No encontramos una cuenta con ese correo. Verifica e inténtalo de nuevo.');
      } else {
        // For unknown errors, show generic success (security best practice)
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <div style={{ width: '100%', maxWidth: 440 }}>
      {sent ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 28, margin: '0 auto 24px', background: 'linear-gradient(135deg, #D1FAE5, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(16,185,129,0.28)' }}>
            <Icon name="mail" size={36} color="#fff" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 10px', color: 'var(--ink-900)' }}>
            Revisa tu correo
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-600)', lineHeight: 1.5, margin: '0 0 28px' }}>
            Si <b>{email}</b> esta registrado, recibiras un enlace para restablecer tu contrasena.
          </p>
          {devLink && (
            <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 14, background: 'rgba(16,169,198,0.08)', border: '1px solid rgba(16,169,198,0.16)', textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Enlace de desarrollo
              </div>
              <div style={{ wordBreak: 'break-all', fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.5, marginBottom: 12 }}>{devLink}</div>
              <Button size="md" full onClick={() => window.open(devLink, '_blank', 'noopener,noreferrer')}>
                Abrir enlace
              </Button>
            </div>
          )}
          <Button size="lg" full onClick={() => router.push('/login')}>
            Volver al inicio de sesion
          </Button>
        </div>
      ) : (
        <>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isDesktop ? 30 : 28, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px', color: 'var(--ink-900)' }}>
            ¿Olvidaste tu contrasena?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-600)', margin: '0 0 28px', lineHeight: 1.5 }}>
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextField label="Correo electronico" icon="mail" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="tu@correo.cl" />
            {error && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', color: '#991b1b', fontSize: 13, fontWeight: 500 }}>{error}</div>}
            <Button size="lg" full type="submit" disabled={loading || !email}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--ink-600)' }}>
            <Link href="/login" style={{ color: 'var(--brand-700)', fontWeight: 600, textDecoration: 'none' }}>
              ← Volver al inicio de sesion
            </Link>
          </div>
        </>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: 'var(--font-body)' }}>
        <div style={{ padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1BB9D6, #6366F1)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink-900)' }}>ALDIENTE</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1, color: 'var(--ink-900)', marginBottom: 14 }}>
              Recupera
              <br />
              tu acceso
            </div>
            <div style={{ fontSize: 16, color: 'var(--ink-600)', lineHeight: 1.5, maxWidth: 380 }}>
              Te enviaremos un enlace seguro para crear una nueva contrasena.
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>© 2026 ALDIENTE · Chile</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <Glass hi radius={24} style={{ padding: 40, width: '100%', maxWidth: 440 }}>
            {form}
          </Glass>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', padding: '60px 24px 40px', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, marginBottom: 28, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="arrow_left" size={20} />
      </button>
      {form}
    </div>
  );
}
