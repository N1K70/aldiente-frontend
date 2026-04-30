import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { reportFrontendError } from '@/lib/frontend-observability';

const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL || '';
const SOCKET_CONNECT_TIMEOUT = 4000;
const POLL_INTERVAL = 5000;

export interface ChatMessage {
  id?: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  senderName?: string;
}

function getUserId(): string {
  try { return JSON.parse(localStorage.getItem('authUser') ?? '{}').id ?? ''; } catch { return ''; }
}

function fmt(iso?: string) {
  if (!iso) return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function mapMsg(m: Record<string, unknown>): ChatMessage {
  const userId = getUserId();
  return {
    id: String(m.id ?? ''),
    from: String(m.senderId ?? m.sender_id ?? '') === String(userId) ? 'me' : 'them',
    text: String(m.content ?? m.text ?? m.message ?? ''),
    time: fmt(String(m.sentAt ?? m.sent_at ?? m.createdAt ?? m.created_at ?? '')),
    senderName: String(m.senderName ?? m.sender_name ?? ''),
  };
}

// ── HTTP fallback ──────────────────────────────────────────────

async function fetchHistory(appointmentId: string): Promise<ChatMessage[]> {
  try {
    const res = await api.get(`/api/appointments/${appointmentId}/messages`);
    const raw = Array.isArray(res.data) ? res.data : (res.data?.messages ?? res.data?.data ?? []);
    return raw.map(mapMsg);
  } catch (e: any) {
    reportFrontendError({
      module: 'chat',
      action: 'fetchHistory',
      message: 'Error cargando historial de chat',
      details: { appointmentId, status: e?.response?.status ?? null },
    });
    return [];
  }
}

async function postMessage(appointmentId: string, content: string): Promise<void> {
  await api.post(`/api/appointments/${appointmentId}/messages`, { content });
}

// ── Hook ───────────────────────────────────────────────────────

export function useChat(appointmentId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const modeRef = useRef<'socket' | 'http' | 'pending'>('pending');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCountRef = useRef(0);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startHttpMode = useCallback((apptId: string) => {
    if (modeRef.current === 'http') return;
    modeRef.current = 'http';
    setConnected(true); // HTTP is always "connected"

    fetchHistory(apptId).then(msgs => {
      setMessages(msgs);
      lastCountRef.current = msgs.length;
    });

    pollRef.current = setInterval(async () => {
      const msgs = await fetchHistory(apptId);
      if (msgs.length !== lastCountRef.current) {
        setMessages(msgs);
        lastCountRef.current = msgs.length;
      }
    }, POLL_INTERVAL);
  }, []);

  useEffect(() => {
    setMessages([]);
    setConnected(false);
    modeRef.current = 'pending';
    lastCountRef.current = 0;
    stopPoll();

    if (!appointmentId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) { startHttpMode(appointmentId); return; }

    // No socket server configured → go straight to HTTP
    if (!CHAT_URL) { startHttpMode(appointmentId); return; }

    // Try socket, fall back to HTTP after timeout
    const socket = io(CHAT_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 2,
    });
    socketRef.current = socket;

    timeoutRef.current = setTimeout(() => {
      if (modeRef.current === 'pending') {
        socket.disconnect();
        startHttpMode(appointmentId);
      }
    }, SOCKET_CONNECT_TIMEOUT);

    socket.on('connect', () => {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      modeRef.current = 'socket';
      setConnected(true);
      socket.emit('chat:join', { appointmentId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
      // Fall back to HTTP if socket drops and we're not already in http mode
      if (modeRef.current === 'socket') startHttpMode(appointmentId);
    });

    socket.on('connect_error', (e: any) => {
      reportFrontendError({
        module: 'chat',
        action: 'socketConnectError',
        severity: 'warning',
        message: 'Error conectando socket de chat, usando fallback HTTP',
        details: { appointmentId, reason: e?.message ?? 'unknown' },
      });
      if (modeRef.current === 'pending') {
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        socket.disconnect();
        startHttpMode(appointmentId);
      }
    });

    socket.on('chat:history', (history: Record<string, unknown>[]) => {
      setMessages(history.map(mapMsg));
    });

    socket.on('chat:message', (msg: Record<string, unknown>) => {
      setMessages(prev => [...prev, mapMsg(msg)]);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      socket.disconnect();
      socketRef.current = null;
      stopPoll();
    };
  }, [appointmentId, startHttpMode, stopPoll]);

  const sendMessage = useCallback((content: string) => {
    if (!appointmentId || !content.trim()) return;
    const optimistic: ChatMessage = { from: 'me', text: content, time: fmt() };
    setMessages(prev => [...prev, optimistic]);

    if (modeRef.current === 'socket' && socketRef.current?.connected) {
      socketRef.current.emit('chat:message', { appointmentId, content });
    } else {
      postMessage(appointmentId, content).catch((e: any) => {
        reportFrontendError({
          module: 'chat',
          action: 'sendMessage',
          message: 'Error enviando mensaje por fallback HTTP',
          details: { appointmentId, status: e?.response?.status ?? null },
        });
      });
    }
  }, [appointmentId]);

  return { messages, connected, sendMessage };
}
