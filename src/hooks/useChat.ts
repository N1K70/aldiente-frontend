import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { reportFrontendError } from '@/lib/frontend-observability';

const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL || '';
const CHAT_TRANSPORT = (process.env.NEXT_PUBLIC_CHAT_TRANSPORT || 'http').toLowerCase();
const FORCE_HTTP_TRANSPORT = CHAT_TRANSPORT !== 'socket';
const SOCKET_CONNECT_TIMEOUT = 4000;
const POLL_INTERVAL = 5000;

export interface ChatMessage {
  id?: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  senderName?: string;
  attachment?: {
    file_url: string;
    file_name: string;
    file_size?: number;
    file_mime?: string;
  };
}

interface ChatJoinAck {
  ok?: boolean;
  error?: string;
  messages?: Record<string, unknown>[];
}

interface ChatSendAck {
  ok?: boolean;
  error?: string;
  message?: Record<string, unknown>;
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
  const rawAttachment = m.attachment ?? m.file ?? null;
  const attachment = rawAttachment && typeof rawAttachment === 'object'
    ? rawAttachment as Record<string, unknown>
    : null;

  const normalizedAttachment = attachment ? {
    file_url: String(attachment.file_url ?? attachment.url ?? ''),
    file_name: String(attachment.file_name ?? attachment.name ?? 'Archivo'),
    file_size: Number(attachment.file_size ?? attachment.size ?? 0) || undefined,
    file_mime: String(attachment.file_mime ?? attachment.mime ?? ''),
  } : undefined;

  const safeAttachment = normalizedAttachment && hasValidAttachmentContract(normalizedAttachment)
    ? normalizedAttachment
    : undefined;

  if (normalizedAttachment && !safeAttachment) {
    reportFrontendError({
      module: 'chat',
      action: 'mapMsgAttachmentContractValidation',
      severity: 'warning',
      message: 'Adjunto recibido no cumple contrato minimo',
      details: {
        messageId: String(m.id ?? ''),
        hasFileUrl: Boolean(normalizedAttachment.file_url),
        hasFileName: Boolean(normalizedAttachment.file_name),
      },
    });
  }

  return {
    id: String(m.id ?? ''),
    from: String(m.senderId ?? m.sender_id ?? '') === String(userId) ? 'me' : 'them',
    text: String(m.content ?? m.text ?? m.message ?? ''),
    time: fmt(String(m.sentAt ?? m.sent_at ?? m.createdAt ?? m.created_at ?? '')),
    senderName: String(m.senderName ?? m.sender_name ?? ''),
    attachment: safeAttachment,
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

async function postMessage(appointmentId: string, content: string): Promise<Record<string, unknown>> {
  const res = await api.post(`/api/appointments/${appointmentId}/messages`, { content });
  return (res.data ?? {}) as Record<string, unknown>;
}

async function uploadChatFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const uploadRes = await api.post('/api/files/upload', form);
  const fileUrl = uploadRes.data?.url ?? uploadRes.data?.file_url;
  if (!fileUrl) throw new Error('No se recibio URL del archivo');

  return {
    file_url: fileUrl,
    file_name: file.name,
    file_size: file.size,
    file_mime: file.type || undefined,
  };
}

function hasValidAttachmentContract(attachment: {
  file_url?: string;
  file_name?: string;
}) {
  if (!attachment.file_url || !attachment.file_name) return false;
  try {
    // Accept absolute URLs and backend-origin-relative URLs.
    if (attachment.file_url.startsWith('/')) return true;
    const parsed = new URL(attachment.file_url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function nextTempId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function historySignature(messages: ChatMessage[]) {
  return messages
    .map((message) => `${message.id ?? ''}|${message.time}|${message.text}|${message.attachment?.file_url ?? ''}`)
    .join('||');
}

function appendUniqueMessage(prev: ChatMessage[], message: ChatMessage) {
  if (message.id && prev.some(existing => existing.id === message.id)) return prev;
  return [...prev, message];
}

// ── Hook ───────────────────────────────────────────────────────

export function useChat(appointmentId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const modeRef = useRef<'socket' | 'http' | 'pending'>('pending');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignatureRef = useRef('');

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startHttpMode = useCallback((apptId: string) => {
    if (modeRef.current === 'http') return;
    modeRef.current = 'http';
    setConnected(true); // HTTP is always "connected"

    fetchHistory(apptId).then(msgs => {
      setMessages(msgs);
      lastSignatureRef.current = historySignature(msgs);
    });

    pollRef.current = setInterval(async () => {
      const msgs = await fetchHistory(apptId);
      const signature = historySignature(msgs);
      if (signature !== lastSignatureRef.current) {
        setMessages(msgs);
        lastSignatureRef.current = signature;
      }
    }, POLL_INTERVAL);
  }, []);

  useEffect(() => {
    setMessages([]);
    setConnected(false);
    modeRef.current = 'pending';
    lastSignatureRef.current = '';
    stopPoll();

    if (!appointmentId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) { startHttpMode(appointmentId); return; }

    // Canonical persistence mode: HTTP-backed chat history.
    // Socket can be re-enabled by setting NEXT_PUBLIC_CHAT_TRANSPORT=socket.
    if (FORCE_HTTP_TRANSPORT || !CHAT_URL) { startHttpMode(appointmentId); return; }

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
      socket.emit('chat:join', { appointmentId }, (ack?: ChatJoinAck) => {
        if (!ack?.ok) {
          reportFrontendError({
            module: 'chat',
            action: 'joinAck',
            severity: 'warning',
            message: 'No se pudo cargar historial por socket, usando fallback HTTP',
            details: { appointmentId, reason: ack?.error ?? 'join_failed' },
          });
          socket.disconnect();
          socketRef.current = null;
          startHttpMode(appointmentId);
          return;
        }

        const history = Array.isArray(ack.messages) ? ack.messages.map(mapMsg) : [];
        setMessages(history);
        lastSignatureRef.current = historySignature(history);
      });
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
      const mapped = mapMsg(msg);
      setMessages(prev => appendUniqueMessage(prev, mapped));
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
    const tempId = nextTempId();
    const optimistic: ChatMessage = { id: tempId, from: 'me', text: content, time: fmt() };
    setMessages(prev => [...prev, optimistic]);

    if (modeRef.current === 'socket' && socketRef.current?.connected) {
      socketRef.current.emit('chat:message', { appointmentId, content }, (ack?: ChatSendAck) => {
        if (!ack?.ok || !ack.message) {
          setMessages(prev => prev.filter(message => message.id !== tempId));
          reportFrontendError({
            module: 'chat',
            action: 'sendMessageAck',
            message: 'Error enviando mensaje por socket',
            details: { appointmentId, reason: ack?.error ?? 'send_failed' },
          });
          return;
        }
        const persisted = mapMsg(ack.message);
        setMessages(prev => appendUniqueMessage(prev.filter(message => message.id !== tempId), persisted));
      });
    } else {
      postMessage(appointmentId, content)
        .then(payload => {
          const persisted = mapMsg(payload);
          setMessages(prev => appendUniqueMessage(prev.filter(message => message.id !== tempId), persisted));
        })
        .catch((e: any) => {
          setMessages(prev => prev.filter(message => message.id !== tempId));
          reportFrontendError({
            module: 'chat',
            action: 'sendMessage',
            message: 'Error enviando mensaje por fallback HTTP',
            details: { appointmentId, status: e?.response?.status ?? null },
          });
        });
    }
  }, [appointmentId]);

  const sendFile = useCallback(async (file: File) => {
    if (!appointmentId) return;
    const attachment = await uploadChatFile(file);
    if (!hasValidAttachmentContract(attachment)) {
      reportFrontendError({
        module: 'chat',
        action: 'sendFileContractValidation',
        message: 'Adjunto no cumple contrato minimo antes de enviar',
        details: { appointmentId, fileName: file.name, attachment },
      });
      return;
    }

    const content = `[Archivo] ${attachment.file_name}`;
    const tempId = nextTempId();
    const optimistic: ChatMessage = { id: tempId, from: 'me', text: content, time: fmt(), attachment };
    setMessages(prev => [...prev, optimistic]);

    const payload = { appointmentId, content, attachment };
    if (modeRef.current === 'socket' && socketRef.current?.connected) {
      socketRef.current.emit('chat:message', payload, (ack?: ChatSendAck) => {
        if (!ack?.ok || !ack.message) {
          setMessages(prev => prev.filter(message => message.id !== tempId));
          reportFrontendError({
            module: 'chat',
            action: 'sendFileAck',
            message: 'Error enviando archivo por socket',
            details: { appointmentId, fileName: file.name, reason: ack?.error ?? 'send_failed' },
          });
          return;
        }
        const persisted = mapMsg(ack.message);
        setMessages(prev => appendUniqueMessage(prev.filter(message => message.id !== tempId), persisted));
      });
    } else {
      api.post(`/api/appointments/${appointmentId}/messages`, {
        content,
        attachment,
      })
        .then(res => {
          const persisted = mapMsg((res?.data ?? {}) as Record<string, unknown>);
          setMessages(prev => appendUniqueMessage(prev.filter(message => message.id !== tempId), persisted));
        })
        .catch((e: any) => {
          setMessages(prev => prev.filter(message => message.id !== tempId));
          reportFrontendError({
            module: 'chat',
            action: 'sendFile',
            message: 'Error enviando archivo por fallback HTTP',
            details: { appointmentId, status: e?.response?.status ?? null, fileName: file.name },
          });
        });
    }
  }, [appointmentId]);

  return { messages, connected, sendMessage, sendFile };
}
