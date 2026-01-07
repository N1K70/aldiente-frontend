import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { CHAT_URL } from '../../config';
import type { ChatConnectionState, ChatJoinResponse, ChatMessage } from './types';

type ChatMessageAck = {
  ok: boolean;
  message?: ChatMessage;
  error?: string;
};

interface UseAppointmentChatOptions {
  appointmentId?: string | null;
  enabled?: boolean;
  token?: string | null;
}

interface UseAppointmentChatResult {
  connectionState: ChatConnectionState;
  messages: ChatMessage[];
  error: string | null;
  sendMessage: (content: string) => Promise<ChatMessage>;
  sending: boolean;
}

export function useAppointmentChat(options: UseAppointmentChatOptions): UseAppointmentChatResult {
  const { appointmentId, enabled = false, token } = options;
  const [connectionState, setConnectionState] = useState<ChatConnectionState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !appointmentId || !token) {
      setConnectionState('idle');
      setMessages([]);
      setError(null);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    setConnectionState('connecting');
    setError(null);

    const socket: Socket = io(CHAT_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socketRef.current = socket;

    const onConnectError = (err: Error) => {
      console.error('[chat] connect_error', err);
      setError(err.message || 'No se pudo conectar al chat');
      setConnectionState('error');
    };

    const onDisconnect = (reason: string) => {
      console.warn('[chat] disconnect', reason);
      if (reason !== 'io client disconnect') {
        setError('Se perdió la conexión con el chat');
        setConnectionState('error');
      } else {
        setConnectionState('idle');
      }
    };

    const onMessage = (message: ChatMessage) => {
      setMessages((prev: ChatMessage[]) => {
        if (prev.some((m: ChatMessage) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message].sort((a, b) => {
          if (!a.sentAt || !b.sentAt) return 0;
          return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
        });
      });

      // Disparar evento personalizado para notificaciones
      // Solo si el mensaje no es del usuario actual
      const currentUserId = localStorage.getItem('userId');
      if (message.senderId !== currentUserId && message.senderId) {
        window.dispatchEvent(new CustomEvent('chat:new-message', { 
          detail: { 
            appointmentId,
            message,
            senderName: message.senderName || message.senderEmail || 'Usuario'
          } 
        }));
      }
    };

    const onConnect = () => {
      console.log('[chat] Conectado, enviando chat:join para', appointmentId);
      socket.emit('chat:join', { appointmentId }, (response?: ChatJoinResponse) => {
        if (!response || response.ok !== true) {
          const errMsg = response && 'error' in response && response.error ? response.error : 'No se pudo unir al chat';
          console.error('[chat] Error en chat:join:', errMsg);
          setError(errMsg);
          setConnectionState('error');
          return;
        }
        console.log('[chat] Unido exitosamente, mensajes:', response.messages?.length || 0);
        setMessages((response.messages || []).slice());
        setConnectionState('connected');
      });
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:message', onMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:message', onMessage);
      socket.disconnect();
      socketRef.current = null;
      setConnectionState('idle');
    };
  }, [appointmentId, enabled, token]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!socketRef.current || connectionState !== 'connected') {
        throw new Error('El chat no está conectado');
      }
      if (!appointmentId) {
        throw new Error('appointmentId inválido');
      }
      const trimmed = content.trim();
      if (!trimmed) {
        throw new Error('El mensaje no puede estar vacío');
      }
      setSending(true);
      return new Promise<ChatMessage>((resolve, reject) => {
        // @ts-ignore - Socket.io emit callback typing issue
        socketRef.current?.emit(
          'chat:message',
          { appointmentId, content: trimmed },
          (ack: ChatMessageAck | undefined) => {
            setSending(false);
            if (!ack || !ack.ok || !ack.message) {
              const errMsg = ack?.error || 'No se pudo enviar el mensaje';
              setError(errMsg);
              reject(new Error(errMsg));
              return;
            }
            setError(null);
            setMessages((prev: ChatMessage[]) => {
              if (prev.some((m: ChatMessage) => m.id === ack.message!.id)) {
                return prev;
              }
              return [...prev, ack.message!];
            });
            resolve(ack.message);
          }
        );
      });
    },
    [appointmentId, token, enabled]
  );
  return useMemo(
    () => ({ connectionState, messages, error, sendMessage, sending }),
    [connectionState, messages, error, sendMessage, sending]
  );
}
export default useAppointmentChat;
