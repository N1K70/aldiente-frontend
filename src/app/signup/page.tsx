'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Icon, TextField } from '@/components/ui';
import TermsModal from '@/components/TermsModal';
import { useAuth } from '@/contexts/AuthContext';
import { useIsDesktop } from '@/components/desktop-shell';
import { formatRutOnInput, validateAndFormatRut } from '@/lib/rut';
import { reportFrontendError } from '@/lib/frontend-observability';

type Role = 'patient' | 'student';

function SurfaceField({
  label,
  children,
  help,
}: {
  label: string;
  children: React.ReactNode;
  help?: string;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8, letterSpacing: '-0.005em' }}>
        {label}
      </div>
      {children}
      {help && <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 8, paddingLeft: 4 }}>{help}</div>}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const [focus, setFocus] = useState(false);

  return (
    <SurfaceField label={label}>
      <div
        style={{
          minHeight: 56,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          border: `1.5px solid ${focus ? 'var(--brand-500)' : 'rgba(10,22,40,0.08)'}`,
          boxShadow: focus
            ? '0 0 0 4px rgba(16,169,198,0.18), 0 2px 8px rgba(10,22,40,0.04)'
            : '0 2px 6px rgba(10,22,40,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
          transition: 'border 160ms, box-shadow 160ms',
        }}
      >
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%',
            height: 54,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '0 18px',
            fontFamily: 'var(--font-body)',
            fontSize: 17,
            color: value ? 'var(--ink-900)' : 'var(--ink-500)',
          }}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </SurfaceField>
  );
}

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { register } = useAuth();
  const initialRole: Role = params.get('role') === 'student' ? 'student' : 'patient';
  const [role, setRole] = useState<Role>(initialRole);
  const [step, setStep] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [data, setData] = useState({
    name: '',
    lastname: '',
    email: '',
    pw: '',
    confirmPw: '',
    rut: '',
    birthDate: '',
    gender: '',
    location: '',
    fullName: '',
    university: '',
    careerYear: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const upd = (key: keyof typeof data, value: string) => {
    setData(current => ({ ...current, [key]: value }));
  };

  const copy = useMemo(
    () => ({
      patient: {
        title: 'Cuentanos de ti',
        sub: 'Necesitamos tus datos base para crear tu cuenta como paciente.',
        roleLabel: 'Paciente',
        roleSub: 'Agenda atenciones y sigue tus citas.',
      },
      student: {
        title: 'Tu perfil de acceso',
        sub: 'Necesitamos tus datos base para habilitar el registro como estudiante.',
        roleLabel: 'Estudiante',
        roleSub: 'Gestiona servicios y atiende pacientes.',
      },
    }),
    []
  );

  const steps = [
    { title: copy[role].title, sub: copy[role].sub },
    { title: 'Credenciales de acceso', sub: 'Tu cuenta quedará asociada solo a correo y contraseña.' },
  ];

  const validateStepOne = () => {
    const rutValidation = validateAndFormatRut(data.rut);
    if (!rutValidation.valid) return rutValidation.message;

    if (role === 'patient') {
      if (!data.name || !data.lastname || !data.birthDate || !data.location) {
        return 'Completa nombre, apellido, fecha de nacimiento y ciudad.';
      }
      return '';
    }

    if (!data.fullName || !data.university || !data.careerYear) {
      return 'Completa nombre completo, universidad y año de carrera.';
    }

    return '';
  };

  const validateAll = () => {
    const baseError = validateStepOne();
    if (baseError) return baseError;
    if (!data.email || !data.pw) return 'Completa correo y contraseña.';
    if (data.pw.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (data.pw !== data.confirmPw) return 'Las contraseñas no coinciden.';
    if (!acceptTerms) return 'Debes aceptar los términos y condiciones.';
    return '';
  };

  const isDesktop = useIsDesktop();

  type IconName = Parameters<typeof Icon>[0]['name'];
  const brandFeatures: { icon: IconName; text: string }[] = [
    { icon: 'shield', text: 'Estudiantes verificados con supervisión docente' },
    { icon: 'star',   text: 'Precios accesibles sin sacrificar calidad' },
    { icon: 'check',  text: 'Agenda, paga y gestiona todo en un solo lugar' },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: isDesktop ? 'flex' : 'block', fontFamily: 'var(--font-body)' }}>
      {isDesktop && (
        <div style={{ width: 420, flexShrink: 0, background: 'linear-gradient(160deg, #0E8AA5 0%, #4F46E5 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 48px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>A</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>ALDIENTE</div>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 16px' }}>
            Odontología de calidad, accesible para todos
          </h2>
          <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.6, margin: '0 0 40px' }}>
            Conectamos pacientes con estudiantes de odontología supervisados.
          </p>
          {brandFeatures.map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <Icon name={f.icon} size={16} color="#fff" />
              </div>
              <span style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.5 }}>{f.text}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ flex: 1, overflowY: isDesktop ? 'auto' : undefined, display: isDesktop ? 'flex' : 'block', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: isDesktop ? '48px 48px 40px' : '60px 24px 40px', minHeight: isDesktop ? undefined : '100dvh', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: isDesktop ? 520 : undefined, margin: isDesktop ? undefined : '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => (step === 0 ? router.push('/welcome') : setStep(current => current - 1))}
            style={{ width: 44, height: 44, borderRadius: 999, flexShrink: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="arrow_left" size={20} />
          </button>
          <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(10,22,40,0.08)', overflow: 'hidden' }}>
            <div style={{ width: `${((step + 1) / 2) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #10A9C6, #4F46E5)', transition: 'width 400ms var(--ease-out-quart)', borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', minWidth: 26 }}>{step + 1}/2</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
          {(['patient', 'student'] as Role[]).map(item => {
            const selected = role === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 18,
                  border: `2px solid ${selected ? 'var(--brand-500)' : 'rgba(10,22,40,0.08)'}`,
                  background: selected ? 'linear-gradient(135deg, rgba(16,169,198,0.14), rgba(79,70,229,0.08))' : 'rgba(255,255,255,0.72)',
                  color: 'var(--ink-900)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: selected ? '0 0 0 4px rgba(16,169,198,0.12)' : '0 2px 6px rgba(10,22,40,0.04)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700 }}>{copy[item].roleLabel}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4, lineHeight: 1.4 }}>{copy[item].roleSub}</div>
              </button>
            );
          })}
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, margin: '0 0 10px', color: 'var(--ink-900)' }}>
          {steps[step].title}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink-600)', margin: '0 0 28px', lineHeight: 1.5 }}>
          {steps[step].sub}
        </p>

        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {role === 'patient' ? (
              <React.Fragment>
                <TextField label="Nombre" icon="user" value={data.name} onChange={e => upd('name', e.target.value)} placeholder="Maria" autoFocus />
                <TextField label="Apellido" value={data.lastname} onChange={e => upd('lastname', e.target.value)} placeholder="Rivas" />
              </React.Fragment>
            ) : (
              <TextField label="Nombre completo" icon="user" value={data.fullName} onChange={e => upd('fullName', e.target.value)} placeholder="Sofia Mendez" autoFocus />
            )}

            <TextField label="RUT" icon="shield" value={data.rut} onChange={e => upd('rut', formatRutOnInput(e.target.value))} placeholder="12.345.678-9" />

            {role === 'patient' ? (
              <React.Fragment>
                <TextField label="Fecha de nacimiento" icon="calendar" type="date" value={data.birthDate} onChange={e => upd('birthDate', e.target.value)} />
                <SelectField
                  label="Genero (opcional)"
                  value={data.gender}
                  onChange={value => upd('gender', value)}
                  options={[
                    { value: '', label: 'Selecciona una opcion' },
                    { value: 'female', label: 'Femenino' },
                    { value: 'male', label: 'Masculino' },
                    { value: 'other', label: 'Otro' },
                    { value: 'prefer_not_to_say', label: 'Prefiero no decirlo' },
                  ]}
                />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <TextField label="Universidad" icon="graduation" value={data.university} onChange={e => upd('university', e.target.value)} placeholder="Universidad de Chile" />
                <TextField label="Ano de carrera" icon="calendar" value={data.careerYear} onChange={e => upd('careerYear', e.target.value.replace(/[^\d]/g, ''))} placeholder="5" />
              </React.Fragment>
            )}

            <TextField label="Ciudad" icon="home" value={data.location} onChange={e => upd('location', e.target.value)} placeholder="Santiago" />
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <TextField label="Correo electronico" icon="mail" type="email" value={data.email} onChange={e => upd('email', e.target.value)} placeholder={role === 'student' ? 'tu@universidad.cl' : 'tu@correo.cl'} autoFocus />
            <TextField label="Contraseña" icon="lock" type="password" value={data.pw} onChange={e => upd('pw', e.target.value)} placeholder="Mínimo 6 caracteres" help="Usa al menos 6 caracteres." />
            <TextField label="Confirmar contraseña" icon="lock" type="password" value={data.confirmPw} onChange={e => upd('confirmPw', e.target.value)} placeholder="Repite tu contraseña" />

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(10,22,40,0.08)', cursor: 'pointer' }}>
              <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--brand-600)' }} />
              <span style={{ fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.5 }}>
                Acepto los{' '}
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    setShowTerms(true);
                  }}
                  style={{ border: 'none', background: 'none', padding: 0, color: 'var(--brand-700)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  términos y condiciones
                </button>
                {' '}y la política de privacidad.
              </span>
            </label>

            <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(16,169,198,0.08)', border: '1px solid rgba(16,169,198,0.16)', fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.5 }}>
              El acceso queda habilitado solo por correo y contraseña.
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ marginBottom: 8, padding: '12px 16px', borderRadius: 12, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 14, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <Button
            size="lg"
            full
            trailingIcon="arrow_right"
            disabled={loading}
            onClick={async () => {
              if (step < 1) {
                const stepOneError = validateStepOne();
                if (stepOneError) {
                  setError(stepOneError);
                  return;
                }
                setError('');
                setStep(current => current + 1);
                return;
              }

              const validationError = validateAll();
              if (validationError) {
                setError(validationError);
                return;
              }

              setError('');
              setLoading(true);
              const normalizedEmail = data.email.trim().toLowerCase();
              try {
                const rutValidation = validateAndFormatRut(data.rut);
                const normalizedName = data.name.trim();
                const normalizedLastname = data.lastname.trim();
                const normalizedFullName = data.fullName.trim();
                const normalizedUniversity = data.university.trim();
                const normalizedLocation = data.location.trim();
                await register({
                  name: normalizedName,
                  lastname: normalizedLastname,
                  email: normalizedEmail,
                  password: data.pw,
                  role,
                  rut: rutValidation.formatted ?? undefined,
                  birthDate: data.birthDate || undefined,
                  gender: data.gender || undefined,
                  location: normalizedLocation || undefined,
                  fullName: normalizedFullName || undefined,
                  university: normalizedUniversity || undefined,
                  careerYear: data.careerYear || undefined,
                });
                const stored = localStorage.getItem('authUser');
                const storedRole = stored ? JSON.parse(stored).role : null;
                router.push(storedRole === 'student' || storedRole === 'admin' ? '/dashboard' : '/quiz');
              } catch {
                reportFrontendError({
                  module: 'signup',
                  action: 'register',
                  message: 'Error creando cuenta en signup',
                  details: { role, emailDomain: normalizedEmail.split('@')[1] ?? null },
                });
                setError('No se pudo crear la cuenta. Intenta nuevamente.');
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? 'Creando...' : step < 1 ? 'Continuar' : 'Crear cuenta'}
          </Button>

          <div style={{ textAlign: 'center', fontSize: 15, color: 'var(--ink-600)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" style={{ color: 'var(--brand-700)', fontWeight: 700, textDecoration: 'none' }}>
              Ingresar
            </Link>
          </div>
        </div>
      </div>
      </div>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-500)' }}>Cargando...</div>}>
      <SignupInner />
    </Suspense>
  );
}
