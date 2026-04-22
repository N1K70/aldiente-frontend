'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icon, Button, Glass } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

export const DESKTOP_BP = 1024;

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BP}px)`);
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const PATIENT_LINKS = [
  { id: 'home',    icon: 'home',     label: 'Inicio',             href: '/home' },
  { id: 'search',  icon: 'search',   label: 'Buscar estudiantes', href: '/explorar' },
  { id: 'appts',   icon: 'calendar', label: 'Mis citas',          href: '/citas',   badge: '2' },
  { id: 'chat',    icon: 'chat',     label: 'Mensajes',           href: '/chat',    badge: '3' },
  { id: 'docs',    icon: 'shield',   label: 'Documentos',         href: '/perfil' },
  { id: 'profile', icon: 'user',     label: 'Perfil',             href: '/perfil' },
];

const STUDENT_LINKS = [
  { id: 'home',    icon: 'home',     label: 'Panel',    href: '/dashboard' },
  { id: 'agenda',  icon: 'calendar', label: 'Agenda',   href: '/agenda' },
  { id: 'services',icon: 'tooth',    label: 'Servicios',href: '/servicios' },
  { id: 'chat',    icon: 'chat',     label: 'Mensajes', href: '/chat' },
  { id: 'profile', icon: 'shield',   label: 'Mi perfil',href: '/perfil' },
];

const ADMIN_LINKS = [
  { id: 'home',     icon: 'home',     label: 'Overview',      href: '/dashboard' },
  { id: 'students', icon: 'users',    label: 'Estudiantes',   href: '/dashboard' },
  { id: 'patients', icon: 'heart',    label: 'Pacientes',     href: '/dashboard' },
  { id: 'agenda',   icon: 'calendar', label: 'Agenda global', href: '/dashboard' },
  { id: 'billing',  icon: 'sparkle',  label: 'Facturación',   href: '/dashboard' },
  { id: 'settings', icon: 'shield',   label: 'Ajustes',       href: '/perfil' },
];

interface SidebarLinkProps { icon: string; label: string; active?: boolean; badge?: string; onClick?: () => void; }
const SidebarLink: React.FC<SidebarLinkProps> = ({ icon, label, active, badge, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
      background: active ? 'linear-gradient(135deg, rgba(16,169,198,0.14), rgba(79,70,229,0.08))' : 'transparent',
      color: active ? 'var(--brand-700)' : 'var(--ink-700)',
      fontWeight: active ? 700 : 500, fontSize: 14,
      border: active ? '1px solid rgba(16,169,198,0.2)' : '1px solid transparent',
      transition: 'all 0.15s',
    }}
  >
    <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={18} color={active ? 'var(--brand-600)' : 'var(--ink-500)'} />
    <span style={{ flex: 1 }}>{label}</span>
    {badge && (
      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'var(--brand-500)', color: '#fff' }}>
        {badge}
      </span>
    )}
  </div>
);

interface SidebarProps { role?: 'patient' | 'student' | 'admin'; activeId?: string; }
export const Sidebar: React.FC<SidebarProps> = ({ role = 'patient', activeId }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const links = role === 'student' ? STUDENT_LINKS : role === 'admin' ? ADMIN_LINKS : PATIENT_LINKS;
  const initials = user?.name ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : role === 'student' ? 'SM' : 'MR';

  return (
    <aside style={{
      width: 240, flexShrink: 0, height: '100%',
      padding: '20px 14px',
      background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRight: '1px solid rgba(255,255,255,0.9)',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 18px' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #1BB9D6, #6366F1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
          boxShadow: '0 4px 10px rgba(16,169,198,0.3)',
        }}>A</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em' }}>ALDIENTE</div>
      </div>

      {/* Role label */}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 14px' }}>
        {role === 'student' ? 'Estudiante' : role === 'admin' ? 'Clínica' : 'Paciente'}
      </div>

      {/* Nav links */}
      {links.map(l => (
        <SidebarLink key={l.id} icon={l.icon} label={l.label} active={l.id === activeId} badge={'badge' in l ? (l as { badge: string }).badge : undefined} onClick={() => router.push(l.href)} />
      ))}

      <div style={{ flex: 1 }} />

      {/* Help card */}
      <div style={{
        padding: 14, borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(16,169,198,0.08), rgba(79,70,229,0.06))',
        border: '1px solid rgba(16,169,198,0.15)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 4 }}>¿Necesitas ayuda?</div>
        <div style={{ fontSize: 12, color: 'var(--ink-600)', lineHeight: 1.4, marginBottom: 10 }}>
          Habla con nuestro equipo de soporte.
        </div>
        <button onClick={() => router.push('/chat')} style={{
          width: '100%', padding: '8px 10px', borderRadius: 10,
          background: '#fff', border: '1px solid rgba(10,22,40,0.08)',
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
          color: 'var(--brand-700)', cursor: 'pointer',
        }}>Chatear con soporte</button>
      </div>

      {/* User chip */}
      <div style={{
        marginTop: 10, padding: '8px 10px', borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.6)', cursor: 'pointer',
      }} onClick={() => router.push('/perfil')}>
        <div style={{
          width: 32, height: 32, borderRadius: 999, flexShrink: 0,
          background: role === 'student' ? 'linear-gradient(135deg, #C7D2FE, #818CF8)' : 'linear-gradient(135deg, #FDE68A, #F59E0B)',
          color: '#fff', fontWeight: 700, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name ?? (role === 'student' ? 'Sofía Méndez' : 'María Rodríguez')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>
            {role === 'student' ? '5º año · UCh' : role === 'admin' ? 'Supervisora' : 'Paciente'}
          </div>
        </div>
        <Icon name="chevron" size={14} color="var(--ink-400)" />
      </div>
    </aside>
  );
};

// ── Topbar ────────────────────────────────────────────────────────────────────

interface TopbarProps {
  title: string;
  subtitle?: string;
  search?: boolean;
  ctaLabel?: string;
  ctaIcon?: string;
  onCtaClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle, search = true, ctaLabel, ctaIcon, onCtaClick }) => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{
      height: 64, flexShrink: 0,
      padding: '0 32px',
      display: 'flex', alignItems: 'center', gap: 20,
      borderBottom: '1px solid rgba(255,255,255,0.8)',
      background: 'rgba(255,255,255,0.5)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em', lineHeight: 1 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {search && (
        <div style={{
          width: 320, height: 40, borderRadius: 10,
          background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(10,22,40,0.06)',
          display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
        }}>
          <Icon name="search" size={16} color="var(--ink-400)" />
          <div style={{ flex: 1, fontSize: 14, color: 'var(--ink-400)' }}>Buscar servicios, estudiantes…</div>
          <div style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: 'var(--ink-100)', color: 'var(--ink-500)', fontWeight: 700 }}>⌘K</div>
        </div>
      )}

      {/* Bell + dropdown */}
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(10,22,40,0.06)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}
        >
          <Icon name="bell" size={17} color="var(--ink-700)" />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 999, background: 'var(--danger-500)', border: '2px solid #fff' }} />
          )}
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 48, right: 0, zIndex: 100,
            width: 340, maxHeight: 420, overflowY: 'auto',
            borderRadius: 16, padding: 12,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(10,22,40,0.08)',
            boxShadow: '0 16px 40px rgba(10,22,40,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Notificaciones</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  style={{ fontSize: 12, color: 'var(--brand-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Marcar todas leídas
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--ink-500)' }}>
                No tienes notificaciones
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{
                    padding: '10px 12px', borderRadius: 12, marginBottom: 4, cursor: 'pointer',
                    background: n.read ? 'transparent' : 'rgba(16,169,198,0.06)',
                    border: n.read ? '1px solid transparent' : '1px solid rgba(16,169,198,0.12)',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {!n.read && (
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--brand-500)', flexShrink: 0, marginTop: 5 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: 'var(--ink-900)', marginBottom: 2 }}>{n.title}</div>
                      {n.body && n.body !== n.title && (
                        <div style={{ fontSize: 12, color: 'var(--ink-600)', lineHeight: 1.4 }}>{n.body}</div>
                      )}
                      {n.createdAt && (
                        <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>
                          {new Date(n.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {ctaLabel && (
        <Button size="md" icon={ctaIcon as Parameters<typeof Button>[0]['icon']} onClick={onCtaClick}>{ctaLabel}</Button>
      )}
    </div>
  );
};

// ── DesktopShell ──────────────────────────────────────────────────────────────

interface DesktopShellProps {
  role?: 'patient' | 'student' | 'admin';
  activeId?: string;
  title: string;
  subtitle?: string;
  search?: boolean;
  ctaLabel?: string;
  ctaIcon?: string;
  onCtaClick?: () => void;
  children: React.ReactNode;
}

export const DesktopShell: React.FC<DesktopShellProps> = ({
  role = 'patient', activeId, title, subtitle, search, ctaLabel, ctaIcon, onCtaClick, children,
}) => (
  <div style={{
    width: '100%', height: '100dvh', background: 'var(--bg-aurora)',
    display: 'flex', overflow: 'hidden',
    fontFamily: 'var(--font-body)', color: 'var(--ink-900)',
  }}>
    <Sidebar role={role} activeId={activeId} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Topbar title={title} subtitle={subtitle} search={search} ctaLabel={ctaLabel} ctaIcon={ctaIcon} onCtaClick={onCtaClick} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        {children}
      </div>
    </div>
  </div>
);
