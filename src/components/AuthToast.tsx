'use client';

import { useEffect, useState } from 'react';

export default function AuthToast() {
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const onExpired = () => setMsg('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;

  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      background: '#F59E0B', color: '#fff',
      padding: '12px 20px', borderRadius: 12,
      fontSize: 14, fontWeight: 500,
      zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
      animation: 'fadeIn 200ms ease',
    }}>
      {msg}
    </div>
  );
}
