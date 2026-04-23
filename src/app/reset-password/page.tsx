'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Glass, Icon, TextField } from '@/components/ui';
import { useIsDesktop } from '@/components/desktop-shell';
import { submitPasswordReset } from '@/lib/auth-recovery';

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const isDesktop = useIsDesktop();
  const token = params.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const invalidToken = useMemo(() => !token, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (invalidToken) {
      setError('El enlace no es valido o ya expiro.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('Completa ambos campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await submitPasswordReset({ token, newPassword, confirmPassword });
      setDone(true);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        ?? (err as { message?: string })?.message
        ?? 'No se pudo restablecer la contrasena.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <div style={{ width: '100%', maxWidth: 440 }}>
      {done ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 28, margin: '0 auto 24px', background: 'linear-gradient(135deg, #D1FAE5, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(16,185,129,0.28)' }}>
            <Icon name="check" size={36} color="#fff" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 10px', color: 'var(--ink-900)' }}>
            Contrasena actualizada
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-600)', lineHeight: 1.5, margin: '0 0 28px' }}>
            Ya puedes iniciar sesion con tu nueva contrasena.
          </p>
          <Button size="lg" full onClick={() => router.push('/login')}>
            Ir al login
          </Button>
        </div>
      ) : (
        <>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isDesktop ? 30 : 28, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px', color: 'var(--ink-900)' }}>
            Restablecer contrasena
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-600)', margin: '0 0 28px', lineHeight: 1.5 }}>
            Define tu nueva contrasena para recuperar el acceso a tu cuenta.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextField label="Nueva contrasena" icon="lock" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimo 6 caracteres" />
            <TextField label="Confirmar contrasena" icon="lock" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repite tu contrasena" />
            {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 14, fontWeight: 500 }}>{error}</div>}
            <Button size="lg" full type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Restablecer'}
            </Button>
          </form>
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
              Crea tu nueva
              <br />
              contrasena
            </div>
            <div style={{ fontSize: 16, color: 'var(--ink-600)', lineHeight: 1.5, maxWidth: 380 }}>
              Este formulario funciona con el token enviado por correo y mantiene compatibilidad con la ruta historica.
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-500)' }}>Cargando...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
