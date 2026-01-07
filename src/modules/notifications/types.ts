export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string;
  read: boolean;
  created_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unread_count: number;
}
