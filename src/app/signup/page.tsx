'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Icon, TextField } from '@/components/ui';
import TermsModal from '@/components/TermsModal';
import { useAuth } from '@/contexts/AuthContext';
import { formatRutOnInput, validateAndFormatRut } from '@/lib/rut';

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
    { title: 'Credenciales de acceso', sub: 'Tu cuenta quedara asociada solo a correo y contrasena.' },
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
      return 'Completa nombre completo, universidad y ano de carrera.';
    }

    return '';
  };

  const validateAll = () => {
    const baseError = validateStepOne();
    if (baseError) return baseError;
    if (!data.email || !data.pw) return 'Completa correo y contrasena.';
    if (data.pw.length < 6) return 'La contrasena debe tener al menos 6 caracteres.';
    if (data.pw !== data.confirmPw) return 'Las contrasenas no coinciden.';
    if (!acceptTerms) return 'Debes aceptar los terminos y condiciones.';
    return '';
  };

  return (
    <div style={{ minHeight: '100dvh', overflow: 'auto', background: 'var(--bg-aurora)' }}>
      <div style={{ padding: '60px 24px 40px', minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 520, margin: '0 auto' }}>
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
              <>
                <TextField label="Nombre" icon="user" value={data.name} onChange={e => upd('name', e.target.value)} placeholder="Maria" autoFocus />
                <TextField label="Apellido" value={data.lastname} onChange={e => upd('lastname', e.target.value)} placeholder="Rivas" />
              </>
            ) : (
              <TextField label="Nombre completo" icon="user" value={data.fullName} onChange={e => upd('fullName', e.target.value)} placeholder="Sofia Mendez" autoFocus />
            )}

            <TextField label="RUT" icon="shield" value={data.rut} onChange={e => upd('rut', formatRutOnInput(e.target.value))} placeholder="12.345.678-9" />

            {role === 'patient' ? (
              <>
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
              </>
            ) : (
              <>
                <TextField label="Universidad" icon="graduation" value={data.university} onChange={e => upd('university', e.target.value)} placeholder="Universidad de Chile" />
                <TextField label="Ano de carrera" icon="calendar" value={data.careerYear} onChange={e => upd('careerYear', e.target.value.replace(/[^\d]/g, ''))} placeholder="5" />
              </>
            )}

            <TextField label="Ciudad" icon="home" value={data.location} onChange={e => upd('location', e.target.value)} placeholder="Santiago" />
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <TextField label="Correo electronico" icon="mail" type="email" value={data.email} onChange={e => upd('email', e.target.value)} placeholder={role === 'student' ? 'tu@universidad.cl' : 'tu@correo.cl'} autoFocus />
            <TextField label="Contrasena" icon="lock" type="password" value={data.pw} onChange={e => upd('pw', e.target.value)} placeholder="Minimo 6 caracteres" help="Usa al menos 6 caracteres." />
            <TextField label="Confirmar contrasena" icon="lock" type="password" value={data.confirmPw} onChange={e => upd('confirmPw', e.target.value)} placeholder="Repite tu contrasena" />

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
                  terminos y condiciones
                </button>
                {' '}y la politica de privacidad.
              </span>
            </label>

            <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(16,169,198,0.08)', border: '1px solid rgba(16,169,198,0.16)', fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.5 }}>
              El acceso queda habilitado solo por correo y contrasena.
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
              try {
                const rutValidation = validateAndFormatRut(data.rut);
                const result = await register({
                  name: data.name,
                  lastname: data.lastname,
                  email: data.email,
                  password: data.pw,
                  role,
                  rut: rutValidation.formatted ?? undefined,
                  birthDate: data.birthDate || undefined,
                  gender: data.gender || undefined,
                  location: data.location || undefined,
                  fullName: data.fullName || undefined,
                  university: data.university || undefined,
                  careerYear: data.careerYear || undefined,
                });

                if (result.authenticated) {
                  const finalRole = result.role ?? role;
                  router.push(finalRole === 'student' || finalRole === 'admin' ? '/dashboard' : '/quiz');
                  return;
                }

                router.push('/login?registered=1');
              } catch {
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
