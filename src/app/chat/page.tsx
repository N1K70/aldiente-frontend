'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import { useAppointments } from '@/hooks/useAppointments';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #C7D2FE, #818CF8)',
  'linear-gradient(135deg, #A7F3D0, #10B981)',
  'linear-gradient(135deg, #BFDBFE, #3B82F6)',
  'linear-gradient(135deg, #1BB9D6, #6366F1)',
];

type AppRole = 'patient' | 'student';
type Thread = {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
  gradient: string;
  inits: string;
  appointmentId: string;
};

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

function buildThreads(
  appointments: ReturnType<typeof useAppointments>['appointments'],
  role: AppRole,
) {
  return appointments.map((appointment, index) => {
    const counterpart = role === 'student' ? appointment.patient?.name : appointment.student?.name;
    const name = counterpart ?? `Cita ${index + 1}`;

    return {
      id: appointment.id,
      name,
      lastMsg: appointment.service ?? '',
      time: appointment.date ?? '',
      unread: 0,
      gradient: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
      inits: counterpart ? initials(counterpart) : '?',
      appointmentId: appointment.id,
    } as Thread;
  });
}

function MessageList({
  messages,
  scrollRef,
}: {
  messages: ReturnType<typeof useChat>['messages'];
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {messages.map((message, index) => {
        const mine = message.from === 'me';
        return (
          <div key={message.id || index} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '78%',
                padding: '10px 14px',
                borderRadius: 18,
                background: mine ? 'linear-gradient(135deg, #1BB9D6, #0E8AA5)' : 'rgba(255,255,255,0.9)',
                color: mine ? '#fff' : 'var(--ink-900)',
                borderBottomRightRadius: mine ? 6 : 18,
                borderBottomLeftRadius: mine ? 18 : 6,
                boxShadow: mine ? '0 4px 10px rgba(14,138,165,0.2)' : '0 2px 4px rgba(10,22,40,0.04)',
                backdropFilter: mine ? 'none' : 'blur(14px)',
                border: mine ? 'none' : '1px solid rgba(255,255,255,0.9)',
                fontSize: 15,
                lineHeight: 1.4,
              }}
            >
              {message.text}
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: 'right' }}>{message.time}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div style={{ padding: '8px 16px 32px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, borderRadius: 999, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 20px rgba(10,22,40,0.08)' }}>
        <input
          value={value}
          onChange={event => onChange(event.target.value)}
          onKeyDown={event => event.key === 'Enter' && onSend()}
          placeholder="Escribe un mensaje..."
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '0 14px', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-900)' }}
        />
        <button onClick={onSend} style={{ width: 44, height: 44, borderRadius: 999, flexShrink: 0, background: 'linear-gradient(180deg, #1BB9D6, #0E8AA5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(14,138,165,0.3)' }}>
          <Icon name="arrow_right" size={20} color="#fff" stroke={2.4} />
        </button>
      </div>
    </div>
  );
}

function EmptyChatState({ role }: { role: AppRole }) {
  const targetHref = role === 'student' ? '/agenda' : '/explorar';
  const buttonLabel = role === 'student' ? 'Ver agenda' : 'Explorar estudiantes';
  const message = role === 'student'
    ? 'Cuando recibas una cita podras conversar con tu paciente desde aqui.'
    : 'No tienes conversaciones aun. Agenda una cita para chatear con tu estudiante.';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
      <Icon name="chat" size={48} color="var(--ink-200)" />
      <div style={{ fontSize: 15, color: 'var(--ink-500)', textAlign: 'center', lineHeight: 1.45 }}>{message}</div>
      <Link href={targetHref}><Button size="md">{buttonLabel}</Button></Link>
    </div>
  );
}

function ChatDesktop({
  role,
  threads,
  activeIdx,
  onSelectThread,
  messages,
  input,
  setInput,
  send,
  scrollRef,
  connected,
  onViewAppointment,
}: {
  role: AppRole;
  threads: Thread[];
  activeIdx: number;
  onSelectThread: (index: number) => void;
  messages: ReturnType<typeof useChat>['messages'];
  input: string;
  setInput: (value: string) => void;
  send: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  connected: boolean;
  onViewAppointment: () => void;
}) {
  const activeThread = threads[activeIdx];

  return (
    <DesktopShell role={role} activeId="chat" title="Mensajes" search={false}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0, height: 'calc(100dvh - 64px - 64px)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)' }}>
        <div style={{ borderRight: '1px solid rgba(10,22,40,0.06)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, borderBottom: '1px solid rgba(10,22,40,0.06)' }}>
            <div style={{ height: 36, borderRadius: 10, background: '#fff', border: '1px solid rgba(10,22,40,0.06)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
              <Icon name="search" size={14} color="var(--ink-400)" />
              <span style={{ fontSize: 13, color: 'var(--ink-400)' }}>Buscar conversacion...</span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {threads.map((thread, index) => (
              <div key={thread.id} onClick={() => onSelectThread(index)} style={{ padding: '14px 16px', display: 'flex', gap: 10, cursor: 'pointer', background: index === activeIdx ? 'rgba(16,169,198,0.08)' : 'transparent', borderLeft: `3px solid ${index === activeIdx ? 'var(--brand-500)' : 'transparent'}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: thread.gradient, color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{thread.inits}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', flexShrink: 0 }}>{thread.time}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread.lastMsg}</div>
                    {thread.unread > 0 && <div style={{ width: 18, height: 18, borderRadius: 999, background: 'var(--brand-500)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{thread.unread}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.3)' }}>
          {activeThread && (
            <div style={{ padding: 16, borderBottom: '1px solid rgba(10,22,40,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: activeThread.gradient, color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeThread.inits}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{activeThread.name}</div>
                <div style={{ fontSize: 12, color: connected ? 'var(--success-600)' : 'var(--ink-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: connected ? 'var(--success-500)' : 'var(--ink-300)' }} />
                  {connected ? 'En linea' : 'Conectando...'}
                </div>
              </div>
              <Button size="md" variant="glass" icon="calendar" onClick={onViewAppointment}>Ver cita</Button>
            </div>
          )}

          {!activeThread ? (
            <EmptyChatState role={role} />
          ) : (
            <>
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.map((message, index) => {
                  const mine = message.from === 'me';
                  return (
                    <div key={message.id || index} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '62%', padding: '10px 14px', borderRadius: 18, background: mine ? 'linear-gradient(135deg, #1BB9D6, #0E8AA5)' : '#fff', color: mine ? '#fff' : 'var(--ink-900)', borderBottomRightRadius: mine ? 6 : 18, borderBottomLeftRadius: mine ? 18 : 6, boxShadow: mine ? '0 4px 10px rgba(14,138,165,0.2)' : '0 2px 4px rgba(10,22,40,0.04)', border: mine ? 'none' : '1px solid rgba(10,22,40,0.04)', fontSize: 14, lineHeight: 1.4 }}>
                        {message.text}
                        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: 'right' }}>{message.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: 16, borderTop: '1px solid rgba(10,22,40,0.06)' }}>
                <div style={{ display: 'flex', gap: 8, padding: 6, borderRadius: 999, background: '#fff', border: '1px solid rgba(10,22,40,0.06)', alignItems: 'center' }}>
                  <input value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && send()} placeholder="Escribe un mensaje..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '0 14px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-900)' }} />
                  <button onClick={send} style={{ width: 38, height: 38, borderRadius: 999, background: 'linear-gradient(180deg, #1BB9D6, #0E8AA5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="arrow_right" size={17} color="#fff" stroke={2.4} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DesktopShell>
  );
}

function ChatInner() {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const role: AppRole = user?.role === 'student' ? 'student' : 'patient';
  const homeHref = role === 'student' ? '/dashboard' : '/home';
  const { appointments, loading: appointmentsLoading } = useAppointments(role);
  const threads = useMemo(() => buildThreads(appointments, role), [appointments, role]);
  const [activeApptIdx, setActiveApptIdx] = useState(0);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestedAppointmentId = searchParams.get('appointmentId');

  useEffect(() => {
    if (threads.length === 0) {
      setActiveApptIdx(0);
      return;
    }

    if (requestedAppointmentId) {
      const requestedIndex = threads.findIndex(thread => thread.appointmentId === requestedAppointmentId);
      if (requestedIndex >= 0) {
        setActiveApptIdx(requestedIndex);
        return;
      }
    }

    if (activeApptIdx >= threads.length) setActiveApptIdx(0);
  }, [activeApptIdx, requestedAppointmentId, threads]);

  const activeThread = threads[activeApptIdx];
  const activeAppointment = appointments[activeApptIdx];
  const { messages, connected, sendMessage } = useChat(activeThread?.appointmentId ?? null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999 });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const openAppointment = () => {
    if (activeThread?.appointmentId) router.push(`/citas/${activeThread.appointmentId}`);
  };

  if (isDesktop) {
    return (
      <ChatDesktop
        role={role}
        threads={threads}
        activeIdx={activeApptIdx}
        onSelectThread={setActiveApptIdx}
        messages={messages}
        input={input}
        setInput={setInput}
        send={send}
        scrollRef={scrollRef}
        connected={connected}
        onViewAppointment={openAppointment}
      />
    );
  }

  return (
    <div style={{ height: '100dvh', background: 'var(--bg-aurora)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '56px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Link href={homeHref}>
          <button style={{ width: 44, height: 44, borderRadius: 999, flexShrink: 0, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow_left" size={20} />
          </button>
        </Link>

        {activeThread ? (
          <>
            <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: activeThread.gradient, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeThread.inits}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{activeThread.name}</div>
              <div style={{ fontSize: 12, color: connected ? 'var(--success-600)' : 'var(--ink-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: connected ? 'var(--success-500)' : 'var(--ink-300)' }} />
                {connected ? 'En linea' : 'Conectando...'}
              </div>
            </div>
            <button onClick={openAppointment} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="calendar" size={20} color="var(--brand-700)" />
            </button>
          </>
        ) : (
          <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink-900)' }}>Mensajes</div>
        )}
      </div>

      {activeAppointment && (
        <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
          <Glass radius={14} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <Icon name="calendar" size={16} color="var(--brand-600)" />
            <span style={{ flex: 1, color: 'var(--ink-700)' }}>
              <b style={{ color: 'var(--ink-900)' }}>{activeAppointment.date}{activeAppointment.time ? ` · ${activeAppointment.time}` : ''}</b>
              {activeAppointment.service ? ` · ${activeAppointment.service}` : ''}
            </span>
            <button onClick={openAppointment} style={{ background: 'none', border: 'none', color: 'var(--brand-700)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Ver</button>
          </Glass>
        </div>
      )}

      {appointmentsLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-400)', fontSize: 14 }}>Cargando...</div>
      ) : threads.length === 0 ? (
        <EmptyChatState role={role} />
      ) : (
        <>
          <MessageList messages={messages} scrollRef={scrollRef} />
          <Composer value={input} onChange={setInput} onSend={send} />
        </>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--ink-400)' }}>Cargando...</div>
      </div>
    }>
      <ChatInner />
    </Suspense>
  );
}
