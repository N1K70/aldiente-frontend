'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Icon, TextField, Glass } from '@/components/ui';
import { api } from '@/lib/api';

function EmailVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<'loading' | 'verified' | 'error' | 'resend'>('resend');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'danger'>('success');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setState('loading');
      api.post('/api/auth/email/verify', { token })
        .then(() => setState('verified'))
        .catch((err: any) => {
          setError(err?.response?.data?.message || 'Error al verificar el email');
          setState('error');
        });
    }
  }, [searchParams]);

  const showToast = (msg: string, type: 'success' | 'danger') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  const handleResend = async () => {
    if (!email) { showToast('Por favor ingresa tu correo', 'danger'); return; }
    setResendLoading(true);
    try {
      await api.post('/api/auth/email/send-verification', { email });
      showToast('Email de verificación enviado', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Error al enviar el email', 'danger');
    } finally {
      setResendLoading(false);
    }
  };

  const iconName = state === 'verified' ? 'check' : state === 'loading' ? 'sparkle' : 'mail';
  const iconBg = state === 'verified' ? 'var(--success-500, #22c55e)' : state === 'error' ? 'var(--danger-500, #ef4444)' : 'var(--brand-500)';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'var(--font-body)' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: toastType === 'success' ? 'var(--success-500, #22c55e)' : 'var(--danger-500, #ef4444)',
          color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 500,
          zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
        }}>{toast}</div>
      )}

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Back */}
        <Link href="/login">
          <button type="button" style={{
            width: 44, height: 44, borderRadius: 999,
            background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', marginBottom: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="arrow_left" size={20} />
          </button>
        </Link>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 32px ${iconBg}44`,
          }}>
            {state === 'loading'
              ? <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <Icon name={iconName} size={32} color="#fff" stroke={2.5} />
            }
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.035em', textAlign: 'center', margin: '0 0 8px', color: 'var(--ink-900)' }}>
          {state === 'loading' && 'Verificando…'}
          {state === 'verified' && '¡Email verificado!'}
          {state === 'error' && 'Error de verificación'}
          {state === 'resend' && 'Verifica tu email'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-600)', textAlign: 'center', margin: '0 0 28px', lineHeight: 1.5 }}>
          {state === 'loading' && 'Estamos verificando tu dirección de email…'}
          {state === 'verified' && 'Tu cuenta está activa. Ya puedes ingresar a ALDIENTE.'}
          {state === 'error' && error}
          {state === 'resend' && 'Ingresa tu correo para recibir el enlace de verificación.'}
        </p>

        <Glass hi radius={20} style={{ padding: 28 }}>
          {state === 'verified' && (
            <Button size="lg" full onClick={() => router.push('/login')}>
              Continuar al login
            </Button>
          )}

          {(state === 'resend' || state === 'error') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextField
                label="Correo electrónico"
                icon="mail"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.cl"
              />
              <Button size="lg" full onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? 'Enviando…' : 'Reenviar email'}
              </Button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                style={{ background: 'none', border: 'none', color: 'var(--ink-500)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '4px 0' }}
              >
                Volver al login
              </button>
            </div>
          )}

          {state === 'loading' && (
            <div style={{ textAlign: 'center', color: 'var(--ink-500)', fontSize: 14 }}>
              Procesando verificación…
            </div>
          )}
        </Glass>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense>
      <EmailVerificationContent />
    </Suspense>
  );
}
