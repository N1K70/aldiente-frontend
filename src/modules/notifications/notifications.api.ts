import { api } from '../../shared/api/ApiClient';
import { Notification, NotificationResponse } from './types';

export async function getNotifications(params?: {
  limit?: number;
  offset?: number;
  unread_only?: boolean;
}): Promise<NotificationResponse> {
  const res = await api.get('/api/notifications', { params });
  return res.data as NotificationResponse;
}

export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  const res = await api.put(`/api/notifications/${notificationId}/read`);
  return res.data as Notification;
}

export async function markAllNotificationsAsRead(): Promise<{ message: string; updated_count: number }> {
  const res = await api.put('/api/notifications/read-all');
  return res.data as { message: string; updated_count: number };
}

export async function deleteNotification(notificationId: string): Promise<{ message: string }> {
  const res = await api.delete(`/api/notifications/${notificationId}`);
  return res.data as { message: string };
}
