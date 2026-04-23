'use client';

import React, { useState } from 'react';
import { Button, TextField, Glass, Icon } from '@/components/ui';
import { api } from '@/lib/api';

interface Props {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError('');
    if (!current || !next || !confirm) { setError('Completa todos los campos.'); return; }
    if (next.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (next !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    try {
      await api.post('/api/users/change-password', { currentPassword: current, newPassword: next });
      setDone(true);
      setTimeout(onClose, 1600);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => !loading && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.4)', backdropFilter: 'blur(6px)', zIndex: 200 }} />
      {/* Modal */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201, padding: '0 0 env(safe-area-inset-bottom,0)' }}>
        <Glass hi radius={0} style={{ borderRadius: '24px 24px 0 0', padding: 28, maxWidth: 540, margin: '0 auto' }}>
          {/* Handle */}
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--ink-200)', margin: '0 auto 24px' }} />

          {done ? (
            <div style={{ textAlign: 'center', paddingBottom: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-500,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
                <Icon name="check" size={28} color="#fff" stroke={2.5} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-900)', margin: 0 }}>Contraseña actualizada</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', margin: 0 }}>Cambiar contraseña</h2>
                <button onClick={() => !loading && onClose()} style={{ width: 36, height: 36, borderRadius: 99, background: 'rgba(10,22,40,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="close" size={18} color="var(--ink-500)" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                <TextField label="Contraseña actual" icon="lock" type={showCurrent ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••"
                  trailing={<button type="button" onClick={() => setShowCurrent(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}><Icon name={showCurrent ? 'eye_off' : 'eye'} size={18} color="var(--ink-400)" /></button>} />
                <TextField label="Nueva contraseña" icon="lock" type={showNext ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)} placeholder="••••••••"
                  trailing={<button type="button" onClick={() => setShowNext(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}><Icon name={showNext ? 'eye_off' : 'eye'} size={18} color="var(--ink-400)" /></button>} />
                <TextField label="Confirmar nueva contraseña" icon="lock" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
              </div>

              {error && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 14, marginBottom: 16 }}>{error}</div>}

              <Button size="lg" full disabled={loading} onClick={submit}>
                {loading ? 'Guardando…' : 'Guardar contraseña'}
              </Button>
            </>
          )}
        </Glass>
      </div>
    </>
  );
}
