import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useAppointmentChat } from './useAppointmentChat';
import type { ChatConnectionState, ChatMessage } from './types';

interface ChatPanelProps {
  appointmentId: string;
  token: string;
  currentUserId: string;
  enabled: boolean;
}

const connectionLabels: Record<ChatConnectionState, string> = {
  idle: 'Conexión inactiva',
  connecting: 'Conectando…',
  connected: 'Conectado',
  error: 'Error de conexión',
};

const ChatPanel: React.FC<ChatPanelProps> = ({ appointmentId, token, currentUserId, enabled }) => {
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const { connectionState, messages, error, sendMessage, sending } = useAppointmentChat({
    appointmentId,
    token,
    enabled,
  });

  const mergedError = useMemo(() => error || localError, [error, localError]);

  useEffect(() => {
    if (!listEndRef.current) return;
    listEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    // Obtener el valor actual del input directamente
    const currentMessage = message.trim();
    if (!currentMessage) {
      setLocalError('El mensaje no puede estar vacío');
      setTimeout(() => setLocalError(null), 2000);
      return;
    }
    try {
      setLocalError(null);
      // Limpiar el input inmediatamente para mejor UX
      setMessage('');
      await sendMessage(currentMessage);
    } catch (err: any) {
      setLocalError(err?.message || 'No se pudo enviar el mensaje');
      // Restaurar el mensaje si falla el envío
      setMessage(currentMessage);
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    const isOwn = msg.senderId === currentUserId;
    return (
      <IonItem key={msg.id} lines="none" className={`chat-message ${isOwn ? 'chat-message--own' : ''}`}>
        <IonLabel className="ion-text-wrap">
          <div className="chat-message__meta">
            <IonText color={isOwn ? 'primary' : 'medium'}>
              <strong>{isOwn ? 'Tú' : msg.senderName || msg.senderEmail || 'Participante'}</strong>
            </IonText>
            {msg.sentAt && (
              <IonNote color="medium">
                {new Date(msg.sentAt).toLocaleString()}
              </IonNote>
            )}
          </div>
          <p className="chat-message__content">{msg.content}</p>
        </IonLabel>
      </IonItem>
    );
  };

  return (
    <IonCard className="appointment-chat-card">
      <IonCardHeader>
        <IonCardSubtitle>Chat en tiempo real</IonCardSubtitle>
        <IonCardTitle>Paciente ↔ Estudiante</IonCardTitle>
        <IonNote color={connectionState === 'connected' ? 'success' : connectionState === 'error' ? 'danger' : 'medium'}>
          {connectionLabels[connectionState]}
        </IonNote>
      </IonCardHeader>
      <IonCardContent>
        {!enabled ? (
          <IonText color="medium">
            <p>El chat se habilita cuando la cita está confirmada.</p>
          </IonText>
        ) : (
          <>
            {connectionState === 'connecting' && (
              <div className="chat-connection-state">
                <IonSpinner name="crescent" />
                <IonText color="medium">
                  <span>Conectando al chat…</span>
                </IonText>
              </div>
            )}
            {messages.length === 0 && connectionState === 'connected' && (
              <IonText color="medium">
                <p>Aún no hay mensajes. ¡Saluda para iniciar la conversación!</p>
              </IonText>
            )}
            <IonList className="chat-message-list">
              {messages.map(renderMessage)}
            </IonList>
            <div ref={listEndRef} />
            {mergedError && (
              <IonNote color="danger" className="chat-error-note">
                {mergedError}
              </IonNote>
            )}
            <form onSubmit={handleSubmit} className="chat-input-row">
              <IonInput
                disabled={sending || connectionState !== 'connected'}
                value={message}
                onIonInput={(ev: any) => {
                  const newValue = ev.target?.value ?? '';
                  setMessage(newValue);
                  // Limpiar error cuando el usuario empieza a escribir
                  if (localError) setLocalError(null);
                }}
                onKeyPress={(ev: any) => {
                  // Enviar con Enter
                  if (ev.key === 'Enter') {
                    ev.preventDefault();
                    const form = ev.target.closest('form');
                    if (form) {
                      form.requestSubmit();
                    }
                  }
                }}
                placeholder="Escribe un mensaje (Enter para enviar)"
                enterkeyhint="send"
              />
              <IonButton
                type="submit"
                disabled={sending || connectionState !== 'connected' || !message.trim()}
                color="primary"
              >
                {sending ? 'Enviando…' : 'Enviar'}
              </IonButton>
            </form>
          </>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default ChatPanel;
