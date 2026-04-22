import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL || 'http://localhost:3002';

export interface ChatMessage {
  id?: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  senderName?: string;
}

export function useChat(appointmentId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setMessages([]);
    setConnected(false);

    if (!appointmentId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) return;

    const socket = io(CHAT_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('chat:join', { appointmentId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:history', (history: Record<string, unknown>[]) => {
      const userId = (() => { try { return JSON.parse(localStorage.getItem('authUser') ?? '{}').id; } catch { return ''; } })();
      setMessages(history.map(m => ({
        id: String(m.id ?? ''),
        from: String(m.senderId) === String(userId) ? 'me' : 'them',
        text: String(m.content ?? ''),
        time: m.sentAt ? new Date(m.sentAt as string).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
        senderName: String(m.senderName ?? ''),
      })));
    });

    socket.on('chat:message', (msg: Record<string, unknown>) => {
      const userId = (() => { try { return JSON.parse(localStorage.getItem('authUser') ?? '{}').id; } catch { return ''; } })();
      setMessages(prev => [...prev, {
        id: String(msg.id ?? ''),
        from: String(msg.senderId) === String(userId) ? 'me' : 'them',
        text: String(msg.content ?? ''),
        time: msg.sentAt ? new Date(msg.sentAt as string).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) : new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }),
        senderName: String(msg.senderName ?? ''),
      }]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [appointmentId]);

  const sendMessage = useCallback((content: string) => {
    if (!appointmentId || !content.trim()) return;
    const now = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    // Optimistic update
    setMessages(prev => [...prev, { from: 'me', text: content, time: now }]);
    socketRef.current?.emit('chat:message', { appointmentId, content });
  }, [appointmentId]);

  return { messages, connected, sendMessage };
}
