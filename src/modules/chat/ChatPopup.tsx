import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonNote,
  IonSpinner,
  IonText,
  IonBadge,
} from '@ionic/react';
import { chatbubbleEllipsesOutline, closeOutline, sendOutline } from 'ionicons/icons';
import { useAppointmentChat } from './useAppointmentChat';
import type { ChatConnectionState, ChatMessage } from './types';
import './ChatPopup.css';

interface ChatPopupProps {
  appointmentId: string;
  token: string;
  currentUserId: string;
  enabled: boolean;
  otherParticipantName?: string;
}

const connectionLabels: Record<ChatConnectionState, string> = {
  idle: 'Desconectado',
  connecting: 'Conectando…',
  connected: 'En línea',
  error: 'Error',
};

const ChatPopup: React.FC<ChatPopupProps> = ({ appointmentId, token, currentUserId, enabled, otherParticipantName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const lastMessageCountRef = useRef(0);
  const initialLoadRef = useRef(true);

  const { connectionState, messages, error, sendMessage, sending } = useAppointmentChat({
    appointmentId,
    token,
    enabled,
  });

  const mergedError = useMemo(() => error || localError, [error, localError]);

  // Auto-scroll al final cuando hay mensajes nuevos
  useEffect(() => {
    if (!listEndRef.current || !isOpen) return;
    listEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isOpen]);

  // Contar mensajes no leídos cuando el chat está cerrado
  // Solo contar mensajes del otro participante (no propios)
  useEffect(() => {
    // En la carga inicial, solo establecer el contador sin incrementar
    if (initialLoadRef.current && messages.length > 0) {
      lastMessageCountRef.current = messages.length;
      initialLoadRef.current = false;
      // No incrementar el contador en la carga inicial
      return;
    }

    if (!isOpen && messages.length > lastMessageCountRef.current) {
      // Obtener solo los mensajes nuevos
      const newMessages = messages.slice(lastMessageCountRef.current);
      // Contar solo los mensajes que NO son del usuario actual
      const newMessagesFromOthers = newMessages.filter(msg => msg.senderId !== currentUserId).length;
      
      if (newMessagesFromOthers > 0) {
        setUnreadCount(prev => prev + newMessagesFromOthers);
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, isOpen, currentUserId]);

  // Resetear contador al abrir
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const currentMessage = message.trim();
    if (!currentMessage) {
      setLocalError('El mensaje no puede estar vacío');
      setTimeout(() => setLocalError(null), 2000);
      return;
    }
    try {
      setLocalError(null);
      setMessage('');
      await sendMessage(currentMessage);
    } catch (err: any) {
      setLocalError(err?.message || 'No se pudo enviar el mensaje');
      setMessage(currentMessage);
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    const isOwn = msg.senderId === currentUserId;
    const time = msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : '';

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`chat-bubble ${isOwn ? 'chat-bubble--own' : 'chat-bubble--other'}`}
      >
        {!isOwn && (
          <div className="chat-bubble__sender">
            {msg.senderName || msg.senderEmail || 'Participante'}
          </div>
        )}
        <div className="chat-bubble__content">{msg.content}</div>
        <div className="chat-bubble__time">{time}</div>
      </motion.div>
    );
  };

  if (!enabled) {
    return null; // No mostrar el botón si el chat no está habilitado
  }

  return (
    <>
      {/* Botón fijo estilo card */}
      <motion.div
        className="chat-button-card"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="chat-button-card__content">
          <div className="chat-button-card__icon-wrapper">
            <IonIcon icon={chatbubbleEllipsesOutline} className="chat-button-card__icon" />
            {unreadCount > 0 && !isOpen && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="chat-button-card__badge"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.div>
            )}
          </div>
          <div className="chat-button-card__text">
            <h3 className="chat-button-card__title">Chat en tiempo real</h3>
            <p className="chat-button-card__subtitle">
              {otherParticipantName ? `Conversar con ${otherParticipantName}` : 'Abrir conversación'}
            </p>
          </div>
          <IonIcon icon={chatbubbleEllipsesOutline} className="chat-button-card__arrow" />
        </div>
      </motion.div>

      {/* Popup del chat */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="chat-popup-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Popup */}
            <motion.div
              className="chat-popup"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
            {/* Header */}
            <div className="chat-popup__header">
              <div className="chat-popup__header-content">
                <IonIcon icon={chatbubbleEllipsesOutline} className="chat-popup__header-icon" />
                <div>
                  <h3 className="chat-popup__title">{otherParticipantName || 'Chat'}</h3>
                  <span className={`chat-popup__status chat-popup__status--${connectionState}`}>
                    {connectionLabels[connectionState]}
                  </span>
                </div>
              </div>
              <motion.button
                className="chat-popup__close"
                onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.25)' }}
                whileTap={{ scale: 0.9 }}
                title="Cerrar chat"
              >
                <IonIcon icon={closeOutline} />
                <span className="chat-popup__close-text">Cerrar</span>
              </motion.button>
            </div>

            {/* Mensajes */}
            <div className="chat-popup__messages">
              {connectionState === 'connecting' && (
                <div className="chat-popup__loading">
                  <IonSpinner name="crescent" color="primary" />
                  <IonText color="medium">Conectando...</IonText>
                </div>
              )}

              {messages.length === 0 && connectionState === 'connected' && (
                <div className="chat-popup__empty">
                  <IonIcon icon={chatbubbleEllipsesOutline} className="chat-popup__empty-icon" />
                  <IonText color="medium">
                    <p>¡Inicia la conversación!</p>
                  </IonText>
                </div>
              )}

              {messages.length > 0 && (
                <div className="chat-popup__messages-list">
                  {messages.map(renderMessage)}
                  <div ref={listEndRef} />
                </div>
              )}

              {mergedError && (
                <IonNote color="danger" className="chat-popup__error">
                  {mergedError}
                </IonNote>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="chat-popup__input">
              <IonInput
                disabled={sending || connectionState !== 'connected'}
                value={message}
                onIonInput={(ev: any) => {
                  const newValue = ev.target?.value ?? '';
                  setMessage(newValue);
                  if (localError) setLocalError(null);
                }}
                onKeyPress={(ev: any) => {
                  if (ev.key === 'Enter') {
                    ev.preventDefault();
                    const form = ev.target.closest('form');
                    if (form) form.requestSubmit();
                  }
                }}
                placeholder="Escribe un mensaje..."
                className="chat-popup__input-field"
              />
              <motion.button
                type="submit"
                disabled={sending || connectionState !== 'connected' || !message.trim()}
                className="chat-popup__send-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IonIcon icon={sendOutline} />
              </motion.button>
            </form>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatPopup;
