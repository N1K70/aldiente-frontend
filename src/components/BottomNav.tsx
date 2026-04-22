'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

const PATIENT_TABS = [
  { icon: 'home',     label: 'Inicio',    href: '/home' },
  { icon: 'search',   label: 'Explorar',  href: '/explorar' },
  { icon: 'calendar', label: 'Citas',     href: '/citas' },
  { icon: 'chat',     label: 'Chat',      href: '/chat' },
  { icon: 'user',     label: 'Perfil',    href: '/perfil' },
] as const;

const STUDENT_TABS = [
  { icon: 'home',     label: 'Inicio',    href: '/dashboard' },
  { icon: 'calendar', label: 'Agenda',    href: '/agenda' },
  { icon: 'tooth',    label: 'Servicios', href: '/servicios' },
  { icon: 'chat',     label: 'Chat',      href: '/chat' },
  { icon: 'user',     label: 'Perfil',    href: '/perfil' },
] as const;

export default function BottomNav() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const tabs = user.role === 'student' ? STUDENT_TABS : PATIENT_TABS;

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home';
    return pathname.startsWith(href);
  };

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: 'max(10px, env(safe-area-inset-bottom)) 0 max(14px, env(safe-area-inset-bottom))',
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
      borderTop: '1px solid rgba(255,255,255,0.9)',
      boxShadow: '0 -4px 24px rgba(10,22,40,0.07)',
    }}>
      {tabs.map(tab => {
        const active = isActive(tab.href);
        return (
          <button key={tab.href} onClick={() => router.push(tab.href)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '0 14px', color: active ? 'var(--brand-600)' : 'var(--ink-400)' }}>
            <div style={{ position: 'relative' }}>
              <Icon name={tab.icon as Parameters<typeof Icon>[0]['name']} size={22} color={active ? 'var(--brand-600)' : 'var(--ink-400)'} />
              {active && (
                <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 99, background: 'var(--brand-500)' }} />
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
