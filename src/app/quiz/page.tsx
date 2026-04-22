'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Glass, Icon } from '@/components/ui';
import { recommendServices, ServiceRecommendation } from '@/lib/public-services';

const questions = [
  {
    id: 'reason',
    title: '¿Cual es tu motivo principal?',
    sub: 'Esto nos ayuda a identificar el servicio mas cercano a tu necesidad.',
    options: [
      { id: 'pain', label: 'Tengo dolor', sub: 'Necesito atencion rapida', icon: 'heart', tint: '#EF4444' },
      { id: 'checkup', label: 'Chequeo general', sub: 'Revision o limpieza', icon: 'sparkle', tint: '#10A9C6' },
      { id: 'aesthetic', label: 'Quiero mejorar mi sonrisa', sub: 'Cuidado estetico', icon: 'sun', tint: '#F59E0B' },
      { id: 'prevention', label: 'Prevencion', sub: 'Control y mantencion', icon: 'shield', tint: '#6366F1' },
    ],
  },
  {
    id: 'budget',
    title: '¿Cual es tu presupuesto?',
    sub: 'Te mostraremos servicios alineados a tu rango.',
    options: [
      { id: 'low', label: 'Hasta $20.000', sub: 'Opcion economica', icon: 'check', tint: '#10B981' },
      { id: 'medium', label: '$20.000 a $50.000', sub: 'Rango medio', icon: 'sparkle', tint: '#10A9C6' },
      { id: 'high', label: 'Sobre $50.000', sub: 'Tratamientos complejos', icon: 'star', tint: '#F59E0B' },
      { id: 'flexible', label: 'Soy flexible', sub: 'Quiero ver todas las opciones', icon: 'search', tint: '#64748B' },
    ],
  },
  {
    id: 'urgency',
    title: '¿Que tan pronto quieres atenderte?',
    sub: 'Con esto priorizamos servicios con mejor disponibilidad.',
    options: [
      { id: 'urgent', label: 'Lo antes posible', sub: 'Necesito una hora pronto', icon: 'zap', tint: '#EF4444' },
      { id: 'soon', label: 'Esta o la proxima semana', sub: 'Tengo algo de flexibilidad', icon: 'calendar', tint: '#10A9C6' },
      { id: 'calm', label: 'Sin urgencia', sub: 'Puedo esperar un poco', icon: 'clock', tint: '#6366F1' },
    ],
  },
] as const;

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
}

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingResults, setLoadingResults] = useState(false);
  const [results, setResults] = useState<ServiceRecommendation[]>([]);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[step];
  const selected = answers[currentQuestion?.id ?? ''];

  useEffect(() => {
    if (!showResults) return;

    setLoadingResults(true);
    recommendServices({
      reason: answers.reason,
      budget: answers.budget,
      urgency: answers.urgency,
    })
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoadingResults(false));
  }, [answers, showResults]);

  if (showResults) {
    return (
      <div style={{ minHeight: '100dvh', overflow: 'auto', background: 'var(--bg-aurora)' }}>
        <div style={{ padding: '60px 24px 40px', minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 980, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
            <button type="button" onClick={() => setShowResults(false)} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="arrow_left" size={20} />
            </button>
            <Button size="md" variant="glass" onClick={() => router.push('/explorar')}>Ver todo el catalogo</Button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink-900)' }}>Servicios recomendados para ti</div>
            <div style={{ fontSize: 16, color: 'var(--ink-600)', marginTop: 8, lineHeight: 1.5 }}>
              Ordenamos las opciones segun tus respuestas y la disponibilidad actual del catalogo.
            </div>
          </div>

          {loadingResults ? (
            <Glass radius={24} style={{ padding: 56, textAlign: 'center', color: 'var(--ink-500)' }}>
              Buscando recomendaciones...
            </Glass>
          ) : results.length === 0 ? (
            <Glass radius={24} style={{ padding: 56, textAlign: 'center' }}>
              <Icon name="search" size={38} color="var(--ink-300)" />
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', marginTop: 16 }}>No encontramos resultados</div>
              <div style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 6 }}>Puedes explorar el catalogo completo o rehacer el quiz.</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                <Button size="md" onClick={() => setShowResults(false)}>Volver al quiz</Button>
                <Button size="md" variant="glass" onClick={() => router.push('/explorar')}>Explorar servicios</Button>
              </div>
            </Glass>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {results.map(result => (
                <Glass key={result.id} radius={22} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{result.name}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: 'rgba(16,169,198,0.08)', color: 'var(--brand-700)', fontSize: 12, fontWeight: 700, marginTop: 8 }}>
                        {result.matchScore}% match
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>
                      {formatPrice(result.price)}
                    </div>
                  </div>

                  {result.description && (
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-600)', lineHeight: 1.5 }}>{result.description}</p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {result.matchReasons.slice(0, 3).map(reason => (
                      <span key={reason} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-700)', fontSize: 12, fontWeight: 600 }}>
                        <Icon name="check" size={12} color="var(--accent-700)" />
                        {reason}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, color: 'var(--ink-500)' }}>
                    <span>{result.duration} min</span>
                    <span>{result.studentCount} estudiante{result.studentCount !== 1 ? 's' : ''}</span>
                    <span>★ {result.avgRating.toFixed(1)}</span>
                  </div>

                  <Button size="md" full onClick={() => router.push(`/servicio/${result.id}`)}>
                    Ver detalles
                  </Button>
                </Glass>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', overflow: 'auto', background: 'var(--bg-aurora)' }}>
      <div style={{ padding: '60px 24px 32px', minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button type="button" onClick={() => (step > 0 ? setStep(current => current - 1) : router.push('/home'))} style={{ width: 44, height: 44, borderRadius: 999, flexShrink: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow_left" size={20} />
          </button>
          <div style={{ flex: 1, display: 'flex', gap: 6 }}>
            {questions.map((_, index) => (
              <div key={index} style={{ flex: 1, height: 6, borderRadius: 99, background: index <= step ? 'linear-gradient(90deg, #10A9C6, #4F46E5)' : 'rgba(10,22,40,0.08)', transition: 'background 300ms' }} />
            ))}
          </div>
          <button type="button" onClick={() => router.push('/home')} style={{ background: 'none', border: 'none', color: 'var(--ink-500)', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 8, fontFamily: 'var(--font-body)' }}>
            Omitir
          </button>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 10px', color: 'var(--ink-900)' }}>
          {currentQuestion.title}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink-600)', margin: '0 0 24px', lineHeight: 1.5 }}>{currentQuestion.sub}</p>

        <div style={{ display: 'grid', gridTemplateColumns: currentQuestion.options.length > 3 ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 24 }}>
          {currentQuestion.options.map(option => {
            const active = selected === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAnswers(current => ({ ...current, [currentQuestion.id]: option.id }))}
                style={{ padding: 16, borderRadius: 20, textAlign: 'left', cursor: 'pointer', background: active ? 'linear-gradient(135deg, rgba(16,169,198,0.15), rgba(79,70,229,0.1))' : 'rgba(255,255,255,0.75)', backdropFilter: 'blur(14px) saturate(180%)', WebkitBackdropFilter: 'blur(14px) saturate(180%)', border: `2px solid ${active ? 'var(--brand-500)' : 'rgba(255,255,255,0.9)'}`, boxShadow: active ? '0 0 0 4px rgba(16,169,198,0.15), 0 8px 20px rgba(10,22,40,0.08)' : '0 2px 6px rgba(10,22,40,0.05)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${option.tint}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={option.icon} size={22} color={option.tint} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.01em' }}>{option.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>{option.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Button
            size="lg"
            full
            disabled={!selected}
            trailingIcon="arrow_right"
            onClick={() => {
              if (step < questions.length - 1) {
                setStep(current => current + 1);
              } else {
                setShowResults(true);
              }
            }}
          >
            {step < questions.length - 1 ? 'Continuar' : 'Ver recomendaciones'}
          </Button>
        </div>
      </div>
    </div>
  );
}
