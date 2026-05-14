import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

function normalize(raw: Record<string, unknown>): Notification {
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? raw.message ?? ''),
    body: String(raw.body ?? raw.description ?? raw.message ?? ''),
    type: String(raw.type ?? ''),
    relatedId: raw.related_id != null ? String(raw.related_id) : undefined,
    read: Boolean(raw.read ?? raw.isRead ?? false),
    createdAt: String(raw.createdAt ?? raw.created_at ?? raw.date ?? ''),
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/api/notifications')
      .then(res => {
        const raw = res.data;
        const list: Record<string, unknown>[] = Array.isArray(raw)
          ? raw
          : (raw?.notifications ?? raw?.data ?? []);
        setNotifications(list.map(normalize));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await api.put(`/api/notifications/${id}/read`); } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await api.put('/api/notifications/read-all'); } catch { /* silent */ }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, loading, markRead, markAllRead, reload: load };
}
