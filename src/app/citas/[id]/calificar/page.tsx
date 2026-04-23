'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { useIsDesktop, DesktopShell } from '@/components/desktop-shell';

const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

export default function CalificarPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const [studentName, setStudentName] = useState('el estudiante');
  const [toUserId, setToUserId] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/appointments/${id}`).then(r => {
      const a = r.data;
      if (a.student_name) setStudentName(a.student_name);
      if (a.student_id) setToUserId(a.student_id);
    }).catch(() => {});
  }, [id]);

  const handleSubmit = async () => {
    if (rating === 0) { setError('Selecciona una calificación'); return; }
    setSubmitting(true); setError('');
    try {
      await api.post('/api/ratings', {
        appointment_id: id,
        to_user_id: toUserId,
        rating,
        comment: comment.trim() || undefined,
      });
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al enviar la calificación');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    const doneContent = (
      <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)', gap: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: 999, background: 'var(--success-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={40} color="var(--success-600,#16a34a)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink-900)' }}>¡Gracias por tu calificación!</div>
          <p style={{ fontSize: 15, color: 'var(--ink-500)', marginTop: 8 }}>Tu opinión ayuda a mejorar la plataforma.</p>
        </div>
        <Button size="lg" onClick={() => router.push('/citas')}>Volver a mis citas</Button>
      </div>
    );
    if (isDesktop) return <DesktopShell role="patient" activeId="appts" title="Calificar atención">{doneContent}</DesktopShell>;
    return doneContent;
  }

  const content = (
    <div className="app-scroll" style={{ minHeight: '100dvh', overflowY: 'auto', background: 'var(--bg-aurora)', fontFamily: 'var(--font-body)', paddingBottom: 60 }}>
      {!isDesktop && (
        <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="arrow_left" size={20} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink-900)' }}>Calificar atención</h1>
        </div>
      )}

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Glass hi radius={20} style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 15, color: 'var(--ink-600)', marginBottom: 4 }}>¿Cómo fue tu experiencia con</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 24 }}>{studentName}?</div>

          {/* Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'transform 120ms', transform: rating >= s ? 'scale(1.15)' : 'scale(1)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill={rating >= s ? '#F59E0B' : 'none'} stroke={rating >= s ? '#F59E0B' : '#CBD5E1'} strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>

          {rating > 0 && (
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--warning-600,#d97706)', marginBottom: 24 }}>{LABELS[rating]}</div>
          )}

          {/* Comment */}
          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 6 }}>Comentario (opcional)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value.slice(0, 500))} rows={3}
              placeholder="Comparte tu experiencia…"
              style={{ width: '100%', borderRadius: 12, border: '1.5px solid rgba(10,22,40,0.1)', padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none', background: 'rgba(255,255,255,0.7)', boxSizing: 'border-box' }} />
            <div style={{ fontSize: 11, color: 'var(--ink-400)', textAlign: 'right', marginTop: 4 }}>{comment.length}/500</div>
          </div>

          {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 13, marginBottom: 16, textAlign: 'left' }}>{error}</div>}

          <Button size="lg" full disabled={rating === 0 || submitting} onClick={handleSubmit}>
            {submitting ? 'Enviando…' : 'Enviar calificación'}
          </Button>
        </Glass>
      </div>
    </div>
  );

  if (isDesktop) return <DesktopShell role="patient" activeId="appts" title="Calificar atención">{content}</DesktopShell>;
  return content;
}
