import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonToast,
  IonPopover,
  IonContent,
} from '@ionic/react';
import { notificationsOutline, checkmarkOutline, trashOutline, refreshOutline } from 'ionicons/icons';
import { Notification } from './types';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from './notifications.api';
import { useAuth } from '../../shared/context/AuthContext';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { user } = useAuth();
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; color: string } | null>(null);
  const [tokenAvailable, setTokenAvailable] = useState<boolean>(() => !!(localStorage.getItem('authToken') || localStorage.getItem('token')));

  const loadNotifications = useCallback(async () => {
    if (!user) return; // No cargar si no hay usuario autenticado
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return; // Evitar 401 si aún no hay token disponible

    try {
      setLoading(true);
      const data = await getNotifications({ limit: 20 });
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (error: any) {
      const status = error?.response?.status;
      // Silenciar 401 (expira sesión) para no ensuciar la consola, el interceptor redirige si corresponde
      if (status !== 401) {
        console.error('Error loading notifications:', error);
        setToast({ show: true, message: 'Error al cargar notificaciones', color: 'danger' });
      }
      if (status === 401) {
        // Deshabilitar polling hasta que exista un token válido nuevamente
        setTokenAvailable(false);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Mantener sincronizado tokenAvailable ante cambios en localStorage o eventos de auth
    const onStorage = () => setTokenAvailable(!!(localStorage.getItem('authToken') || localStorage.getItem('token')));
    const onAuthChanged = () => onStorage();
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth:changed', onAuthChanged as any);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth:changed', onAuthChanged as any);
    };
  }, []);

  useEffect(() => {
    if (user && tokenAvailable) {
      loadNotifications();
      // Poll for new notifications cada 30s solo si hay token
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [loadNotifications, user, tokenAvailable]);

  // Escuchar mensajes nuevos del chat para refrescar notificaciones
  useEffect(() => {
    const handleNewChatMessage = () => {
      // Refrescar notificaciones cuando llegue un mensaje nuevo
      if (tokenAvailable) {
        loadNotifications();
      }
    };

    window.addEventListener('chat:new-message', handleNewChatMessage as any);
    return () => window.removeEventListener('chat:new-message', handleNewChatMessage as any);
  }, [loadNotifications, tokenAvailable]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      setToast({ show: true, message: 'Notificación marcada como leída', color: 'success' });
    } catch (error) {
      setToast({ show: true, message: 'Error al marcar como leída', color: 'danger' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      setToast({ show: true, message: 'Todas las notificaciones marcadas como leídas', color: 'success' });
    } catch (error) {
      setToast({ show: true, message: 'Error al marcar todas como leídas', color: 'danger' });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setToast({ show: true, message: 'Notificación eliminada', color: 'success' });
    } catch (error) {
      setToast({ show: true, message: 'Error al eliminar notificación', color: 'danger' });
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Ahora';
      if (diffInMinutes < 60) return `${diffInMinutes}m`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
      return `${Math.floor(diffInMinutes / 1440)}d`;
    } catch {
      return '';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // Cerrar el popover
    setIsOpen(false);

    // Redirigir según el tipo de notificación
    if (notification.related_id) {
      switch (notification.type) {
        case 'appointment':
        case 'message':
        case 'chat':
          // Redirigir a la cita (que incluye el chat)
          history.push(`/tabs/appointments/${notification.related_id}`);
          break;
        case 'reservation':
          // Redirigir a las reservas del paciente
          history.push('/tabs/profile/reservas');
          break;
        case 'service':
          // Redirigir al servicio
          history.push(`/tabs/servicio/${notification.related_id}`);
          break;
        default:
          // Para otros tipos, no hacer nada específico
          break;
      }
    }
  };

  // No renderizar si no hay usuario autenticado
  if (!user) {
    return null;
  }

  return (
    <>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <IonButton
          fill="clear"
          className={className}
          id="notification-trigger"
          aria-label="Notificaciones"
          onClick={(e) => {
            setIsOpen(true);
            (e.currentTarget as unknown as HTMLElement).blur();
          }}
        >
          <IonIcon icon={notificationsOutline} style={{ fontSize: '24px' }} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                fontSize: '11px',
                fontWeight: '700',
                minWidth: '20px',
                height: '20px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                border: '2px solid white'
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </IonButton>
      </motion.div>

      <IonPopover
        isOpen={isOpen}
        trigger="notification-trigger"
        onDidDismiss={() => {
          setIsOpen(false);
          const el = document.activeElement as HTMLElement | null;
          if (el && typeof el.blur === 'function') el.blur();
        }}
        showBackdrop={true}
        side="bottom"
        alignment="end"
        dismissOnSelect={false}
        className="notification-popover-clean"
      >
        <div style={{ background: 'transparent' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: -20, originX: 1, originY: 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
          background: 'white',
          borderRadius: '24px',
          overflow: 'hidden',
          maxHeight: '85vh',
          width: '420px',
          maxWidth: '90vw',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.18), 0 12px 24px rgba(8, 145, 178, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          {/* Header moderno */}
          <div style={{ 
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            padding: '24px 24px 20px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>Notificaciones</h2>
              {unreadCount > 0 && (
                <p style={{ margin: '6px 0 0 0', fontSize: '14px', opacity: 0.95, fontWeight: '500' }}>
                  {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.25)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAllAsRead}
                title="Marcar todas como leídas"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <IonIcon icon={checkmarkOutline} style={{ fontSize: '22px', color: 'white' }} />
              </motion.button>
            )}
          </div>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
              <IonSpinner color="primary" />
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="empty-state-modern" 
              style={{ 
                padding: '60px 24px', 
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(8, 145, 178, 0.2)'
              }}>
                <IonIcon icon={notificationsOutline} style={{ fontSize: '40px', color: 'white' }} />
              </div>
              <h3 className="heading-md" style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Todo al día</h3>
              <p className="body-sm" style={{ margin: '0 0 20px', color: 'var(--text-secondary)' }}>No tienes notificaciones nuevas</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadNotifications}
                className="btn-modern-ghost"
                style={{ minWidth: '120px' }}
              >
                <IonIcon icon={refreshOutline} style={{ marginRight: '8px' }} />
                Actualizar
              </motion.button>
            </motion.div>
          )}

          {!loading && notifications.length > 0 && (
            <div style={{ 
              padding: '12px 16px 16px',
              overflowY: 'auto',
              maxHeight: 'calc(85vh - 100px)'
            }}>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="floating-card"
                  style={{
                    marginBottom: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    position: 'relative',
                    border: notification.read ? '1px solid var(--border-color)' : '2px solid #06b6d4',
                    background: notification.read ? 'var(--bg-elevated)' : 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(8, 145, 178, 0.05) 100%)',
                    opacity: notification.read ? 0.7 : 1
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  whileHover={{ scale: 1.01, boxShadow: 'var(--shadow-lg)' }}
                >
                  {!notification.read && (
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#06b6d4',
                      boxShadow: '0 0 0 4px rgba(6, 182, 212, 0.2)'
                    }} />
                  )}
                  <h3 className="heading-sm" style={{ 
                    margin: '0 0 8px',
                    paddingRight: '20px',
                    fontWeight: notification.read ? 600 : 700,
                    color: notification.read ? 'var(--text-secondary)' : 'var(--text-primary)'
                  }}>
                    {notification.title}
                  </h3>
                  <p className="body-sm" style={{ 
                    margin: '0 0 12px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6
                  }}>
                    {notification.message}
                  </p>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span className="caption" style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>
                      {formatTime(notification.created_at)}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = 'transparent'}
                    >
                      <IonIcon icon={trashOutline} style={{ fontSize: '20px', color: 'var(--color-error)' }} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        </div>
      </IonPopover>

      <IonToast
        isOpen={!!toast?.show}
        message={toast?.message}
        color={toast?.color}
        duration={2000}
        onDidDismiss={() => setToast(null)}
      />
    </>
  );
};

export default NotificationCenter;
