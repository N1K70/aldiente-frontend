'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Glass, Icon } from '@/components/ui';
import { Wordmark } from '@/components/brand';
import { trackFunnelEvent } from '@/lib/frontend-analytics';

type Persona = 'patient' | 'student' | 'university';

type ResearchForm = {
  name: string;
  email: string;
  phone: string;
  city: string;
  treatmentNeed: string;
  currentChallenge: string;
  availability: string;
  university: string;
  clinicalStage: string;
  patientAcquisition: string;
  organization: string;
  respondentRole: string;
  hasClinic: string;
  institutionalAcquisition: string;
  notes: string;
  consent: boolean;
  website: string;
};

const EMPTY_FORM: ResearchForm = {
  name: '',
  email: '',
  phone: '',
  city: '',
  treatmentNeed: '',
  currentChallenge: '',
  availability: '',
  university: '',
  clinicalStage: '',
  patientAcquisition: '',
  organization: '',
  respondentRole: '',
  hasClinic: '',
  institutionalAcquisition: '',
  notes: '',
  consent: false,
  website: '',
};

const PERSONA_OPTIONS: Array<{ id: Persona; title: string; description: string; icon: string; color: string }> = [
  { id: 'patient', title: 'Busco atención dental', description: 'Quiero resolver una necesidad de atención.', icon: 'tooth', color: '#0E8AA5' },
  { id: 'student', title: 'Soy estudiante de odontología', description: 'Me interesa atender y encontrar pacientes.', icon: 'graduation', color: '#4F46E5' },
  { id: 'university', title: 'Represento una universidad o centro de alumnos', description: 'Quiero conversar sobre una posible alianza.', icon: 'users', color: '#059669' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 52,
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid var(--ink-200)',
  background: '#fff',
  color: 'var(--ink-900)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  lineHeight: 1.3,
};

function Field({ label, children, optional = false }: { label: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', color: 'var(--ink-800)', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
        {label}{optional ? <span style={{ color: 'var(--ink-500)', fontWeight: 500 }}> (opcional)</span> : null}
      </span>
      {children}
    </label>
  );
}

function SelectField({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={event => onChange(event.target.value)} style={inputStyle}>
      {children}
    </select>
  );
}

export default function InterestPage() {
  const [persona, setPersona] = useState<Persona>('patient');
  const [form, setForm] = useState<ResearchForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const viewed = useRef(false);

  useEffect(() => {
    const profile = new URLSearchParams(window.location.search).get('perfil');
    if (profile === 'student' || profile === 'university' || profile === 'patient') setPersona(profile);
  }, []);

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    trackFunnelEvent('market_research_viewed', { source: 'interest_page' });
  }, []);

  function setField<K extends keyof ResearchForm>(field: K, value: ResearchForm[K]) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function selectPersona(nextPersona: Persona) {
    setPersona(nextPersona);
    setError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch('/api/market-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          persona,
          utmSource: params.get('utm_source') ?? undefined,
          utmMedium: params.get('utm_medium') ?? undefined,
          utmCampaign: params.get('utm_campaign') ?? undefined,
        }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !result?.ok) {
        setError(result?.error ?? 'No pudimos registrar tu respuesta. Inténtalo nuevamente más tarde.');
        return;
      }

      trackFunnelEvent('market_research_submitted', { persona, source: 'interest_page' });
      setSubmitted(true);
    } catch {
      setError('No pudimos registrar tu respuesta. Revisa tu conexión e inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  const personaContent = persona === 'patient' ? (
    <>
      <Field label="¿Qué atención estás buscando?">
        <SelectField value={form.treatmentNeed} onChange={value => setField('treatmentNeed', value)}>
          <option value="">Selecciona una opción</option>
          <option value="consulta_preventiva">Consulta, limpieza o prevención</option>
          <option value="dolor_urgencia">Dolor o una necesidad urgente</option>
          <option value="restauracion">Tapadura, arreglo o extracción</option>
          <option value="estetica">Estética dental</option>
          <option value="otro">Otro tratamiento</option>
        </SelectField>
      </Field>
      <Field label="¿Qué te cuesta más al buscar atención?">
        <SelectField value={form.currentChallenge} onChange={value => setField('currentChallenge', value)}>
          <option value="">Selecciona una opción</option>
          <option value="precio">El precio</option>
          <option value="encontrar_hora">Encontrar una hora disponible</option>
          <option value="confianza">Saber dónde atenderme con confianza</option>
          <option value="traslado">La distancia o el traslado</option>
          <option value="otro">Otro motivo</option>
        </SelectField>
      </Field>
      <Field label="¿Cuándo te gustaría atenderte?" optional>
        <SelectField value={form.availability} onChange={value => setField('availability', value)}>
          <option value="">Prefiero no decirlo</option>
          <option value="esta_semana">Esta semana</option>
          <option value="este_mes">Durante este mes</option>
          <option value="sin_urgencia">Sin urgencia</option>
        </SelectField>
      </Field>
    </>
  ) : persona === 'student' ? (
    <>
      <Field label="¿En qué universidad estudias?">
        <input required value={form.university} onChange={event => setField('university', event.target.value)} placeholder="Ej. Universidad de..." style={inputStyle} />
      </Field>
      <Field label="¿En qué etapa estás?" optional>
        <SelectField value={form.clinicalStage} onChange={value => setField('clinicalStage', value)}>
          <option value="">Prefiero no decirlo</option>
          <option value="preclinico">Etapa preclínica</option>
          <option value="inicio_clinica">Inicio de clínica</option>
          <option value="clinica_avanzada">Clínica avanzada / internado</option>
          <option value="egresado">Egresé recientemente</option>
        </SelectField>
      </Field>
      <Field label="¿Cómo consigues pacientes hoy?">
        <SelectField value={form.patientAcquisition} onChange={value => setField('patientAcquisition', value)}>
          <option value="">Selecciona una opción</option>
          <option value="cuenta_propia">Los busco por mi cuenta</option>
          <option value="apoyo_institucional">La universidad o clínica me deriva pacientes</option>
          <option value="mixto">Ambas alternativas</option>
          <option value="aun_no">Aún no necesito conseguir pacientes</option>
        </SelectField>
      </Field>
      <Field label="¿Qué es lo más difícil de ese proceso?" optional>
        <textarea value={form.currentChallenge} onChange={event => setField('currentChallenge', event.target.value)} placeholder="Ej. cancelaciones, poca visibilidad, coordinación..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </Field>
    </>
  ) : (
    <>
      <Field label="Institución o centro de alumnos">
        <input required value={form.organization} onChange={event => setField('organization', event.target.value)} placeholder="Nombre de la institución" style={inputStyle} />
      </Field>
      <Field label="Tu cargo o relación con la institución">
        <input required value={form.respondentRole} onChange={event => setField('respondentRole', event.target.value)} placeholder="Ej. director/a de carrera, CA, coordinación clínica" style={inputStyle} />
      </Field>
      <Field label="¿La carrera cuenta con clínica docente propia?">
        <SelectField value={form.hasClinic} onChange={value => setField('hasClinic', value)}>
          <option value="">Selecciona una opción</option>
          <option value="si">Sí</option>
          <option value="no">No</option>
          <option value="limitada">Sí, pero con capacidad limitada</option>
          <option value="no_se">No lo sé</option>
        </SelectField>
      </Field>
      <Field label="¿Cómo llegan pacientes para la atención docente?" optional>
        <textarea value={form.institutionalAcquisition} onChange={event => setField('institutionalAcquisition', event.target.value)} placeholder="Describe brevemente el proceso actual." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </Field>
    </>
  );

  if (submitted) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', padding: '24px', display: 'grid', placeItems: 'center' }}>
        <Glass hi radius={8} style={{ width: '100%', maxWidth: 580, padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 20px', background: 'var(--success-100)' }}>
            <Icon name="check" size={28} color="var(--success-600)" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1.1, margin: 0, color: 'var(--ink-900)' }}>Gracias por tu respuesta.</h1>
          <p style={{ color: 'var(--ink-600)', lineHeight: 1.5, margin: '14px auto 28px', maxWidth: 430 }}>
            La registramos para orientar el piloto de ALDIENTE. Te contactaremos sólo para conversar sobre este tema.
          </p>
          <Button href="/landing" size="md">Volver a ALDIENTE</Button>
        </Glass>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', padding: '20px 20px 48px' }}>
      <header style={{ maxWidth: 840, margin: '0 auto 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <Link href="/landing" aria-label="Volver a ALDIENTE" style={{ textDecoration: 'none' }}><Wordmark size={20} /></Link>
        <Link href="/landing" style={{ color: 'var(--ink-600)', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Volver</Link>
      </header>

      <section style={{ width: '100%', maxWidth: 840, margin: '0 auto' }}>
        <div style={{ maxWidth: 640, marginBottom: 28 }}>
          <div style={{ color: 'var(--brand-700)', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Investigación de mercado</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 6vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 12px', color: 'var(--ink-900)' }}>
            Queremos entender mejor el acceso a la atención dental.
          </h1>
          <p style={{ margin: 0, color: 'var(--ink-600)', fontSize: 17, lineHeight: 1.55 }}>
            Tus respuestas nos ayudarán a diseñar un piloto útil para pacientes, estudiantes y universidades. Toma menos de dos minutos.
          </p>
        </div>

        <Glass hi radius={8} style={{ padding: 'clamp(20px, 5vw, 36px)' }}>
          <form onSubmit={handleSubmit} noValidate>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ color: 'var(--ink-800)', fontSize: 15, fontWeight: 800, marginBottom: 12 }}>¿Cómo te relacionas con este tema?</legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 28 }}>
                {PERSONA_OPTIONS.map(option => {
                  const selected = persona === option.id;
                  return (
                    <button key={option.id} type="button" onClick={() => selectPersona(option.id)} aria-pressed={selected} style={{ minHeight: 134, textAlign: 'left', padding: 16, borderRadius: 8, cursor: 'pointer', border: `2px solid ${selected ? option.color : 'var(--ink-200)'}`, background: selected ? `${option.color}10` : '#fff', color: 'var(--ink-900)' }}>
                      <Icon name={option.icon} size={22} color={option.color} />
                      <div style={{ marginTop: 12, fontWeight: 800, fontSize: 15, lineHeight: 1.25 }}>{option.title}</div>
                      <div style={{ marginTop: 5, color: 'var(--ink-600)', fontSize: 13, lineHeight: 1.35 }}>{option.description}</div>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18 }}>
              <Field label="Nombre completo">
                <input required autoComplete="name" value={form.name} onChange={event => setField('name', event.target.value)} placeholder="Tu nombre" style={inputStyle} />
              </Field>
              <Field label="Correo electrónico">
                <input required type="email" autoComplete="email" value={form.email} onChange={event => setField('email', event.target.value)} placeholder="tu@correo.cl" style={inputStyle} />
              </Field>
              <Field label="Comuna o ciudad" optional>
                <input autoComplete="address-level2" value={form.city} onChange={event => setField('city', event.target.value)} placeholder="Ej. Santiago" style={inputStyle} />
              </Field>
              <Field label="Teléfono" optional>
                <input type="tel" autoComplete="tel" value={form.phone} onChange={event => setField('phone', event.target.value)} placeholder="+56 9 ..." style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: 'grid', gap: 18, marginTop: 18 }}>{personaContent}</div>

            <div style={{ marginTop: 18 }}>
              <Field label="¿Hay algo más que debamos saber?" optional>
                <textarea value={form.notes} onChange={event => setField('notes', event.target.value)} placeholder="Comparte tu experiencia o contexto." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </Field>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 22, color: 'var(--ink-700)', fontSize: 14, lineHeight: 1.4, cursor: 'pointer' }}>
              <input required type="checkbox" checked={form.consent} onChange={event => setField('consent', event.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: 'var(--brand-600)', flexShrink: 0 }} />
              <span>Autorizo a ALDIENTE a usar estos datos para esta investigación y a contactarme sobre el piloto. No se usarán para crear una cuenta ni agendar una atención.</span>
            </label>

            <label aria-hidden style={{ display: 'none' }}>
              Sitio web
              <input tabIndex={-1} autoComplete="off" value={form.website} onChange={event => setField('website', event.target.value)} />
            </label>

            {error ? <div role="alert" style={{ marginTop: 18, padding: 12, borderRadius: 8, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 14, fontWeight: 700 }}>{error}</div> : null}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginTop: 26 }}>
              <span style={{ color: 'var(--ink-500)', fontSize: 13 }}>Respuesta confidencial. Sin compromiso.</span>
              <Button type="submit" size="md" disabled={submitting} trailingIcon="arrow_right">{submitting ? 'Enviando...' : 'Enviar respuestas'}</Button>
            </div>
          </form>
        </Glass>
      </section>
    </main>
  );
}
