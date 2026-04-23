'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useIsDesktop, DesktopShell } from '@/components/desktop-shell';

interface Notification {
  id: string;
  title: string;
  message: string;
  type?: string;
  related_id?: string;
  read: boolean;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function notifRoute(n: Notification): string | null {
  if (!n.related_id) return null;
  if (n.type === 'appointment' || n.type === 'message' || n.type === 'chat') return `/citas/${n.related_id}`;
  if (n.type === 'reservation') return '/reservas';
  if (n.type === 'service') return `/explorar/${n.related_id}`;
  return null;
}

export default function NotificacionesPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    api.get('/api/notifications', { params: { limit: 50 } })
      .then(r => {
        const d = r.data;
        const notifs: Notification[] = d?.notifications ?? (Array.isArray(d) ? d : []);
        setItems(notifs);
        setUnread(d?.unread_count ?? notifs.filter(n => !n.read).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    await api.put(`/api/notifications/${id}/read`).catch(() => {});
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await api.put('/api/notifications/read-all').catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const remove = async (id: string) => {
    const n = items.find(x => x.id === id);
    await api.delete(`/api/notifications/${id}`).catch(() => {});
    setItems(prev => prev.filter(x => x.id !== id));
    if (n && !n.read) setUnread(prev => Math.max(0, prev - 1));
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) await markRead(n.id);
    const route = notifRoute(n);
    if (route) router.push(route);
  };

  if (!user) return null;

  const content = (
    <div className="app-scroll" style={{ minHeight: '100dvh', overflowY: 'auto', background: 'var(--bg-aurora)', fontFamily: 'var(--font-body)', paddingBottom: 60 }}>
      {!isDesktop && (
        <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="arrow_left" size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink-900)' }}>Notificaciones</h1>
            {unread > 0 && <p style={{ fontSize: 13, color: 'var(--brand-600)', margin: 0, fontWeight: 600 }}>{unread} nueva{unread > 1 ? 's' : ''}</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-600)', background: 'rgba(16,169,198,0.1)', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
              Marcar todo
            </button>
          )}
        </div>
      )}
      {isDesktop && unread > 0 && (
        <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={markAllRead} style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-600)', background: 'rgba(16,169,198,0.1)', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
            Marcar todo
          </button>
        </div>
      )}

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>Cargando…</div>
        ) : items.length === 0 ? (
          <Glass radius={20} style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #1BB9D6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name="bell" size={30} color="#fff" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>Todo al día</div>
            <p style={{ fontSize: 14, color: 'var(--ink-500)', margin: '8px 0 0' }}>No tienes notificaciones nuevas</p>
          </Glass>
        ) : items.map(n => (
          <div key={n.id} onClick={() => handleClick(n)}
            style={{ padding: 16, borderRadius: 18, background: n.read ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.9)', border: `1.5px solid ${n.read ? 'rgba(255,255,255,0.8)' : 'rgba(27,185,214,0.35)'}`, backdropFilter: 'blur(14px)', cursor: notifRoute(n) ? 'pointer' : 'default', position: 'relative', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {!n.read && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-500)', boxShadow: '0 0 0 3px rgba(27,185,214,0.25)' }} />}
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: n.read ? 'rgba(10,22,40,0.06)' : 'rgba(16,169,198,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bell" size={18} color={n.read ? 'var(--ink-400)' : 'var(--brand-600)'} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 20 }}>
              <div style={{ fontSize: 14, fontWeight: n.read ? 600 : 700, color: n.read ? 'var(--ink-600)' : 'var(--ink-900)', marginBottom: 3 }}>{n.title}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.5 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 6 }}>{timeAgo(n.created_at)}</div>
            </div>
            <button onClick={e => { e.stopPropagation(); remove(n.id); }}
              style={{ position: 'absolute', bottom: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <Icon name="close" size={14} color="var(--ink-300)" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (isDesktop) return <DesktopShell role="patient" activeId="notifications" title="Notificaciones">{content}</DesktopShell>;
  return content;
}
