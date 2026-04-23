'use client';

import React, { useMemo } from 'react';
import { Glass, Icon, Button } from '@/components/ui';

interface Item {
  id: string;
  label: string;
  icon: string;
  done: boolean;
  description: string;
  optional?: boolean;
}

interface Props {
  profile: Record<string, unknown>;
  documentsCount?: number;
  role?: 'patient' | 'student';
  onEdit?: () => void;
}

export default function ProfileCompleteness({ profile, documentsCount = 0, role = 'patient', onEdit }: Props) {
  const items = useMemo<Item[]>(() => {
    if (role === 'student') {
      return [
        { id: 'name',      label: 'Nombre completo',           icon: 'user',     done: !!profile.full_name || !!profile.name,  description: 'Tu nombre visible para los pacientes' },
        { id: 'uni',       label: 'Universidad',               icon: 'school',   done: !!profile.university_id,                description: 'Universidad donde estudias' },
        { id: 'uniLoc',    label: 'Ubicación clínica',         icon: 'pin',      done: !!profile.university_location,           description: 'Dirección de tu clínica universitaria' },
        { id: 'year',      label: 'Año de carrera',            icon: 'calendar', done: !!profile.career_year,                   description: 'Tu año actual en la carrera' },
        { id: 'certs',     label: 'Certificaciones',           icon: 'star',     done: !!(profile.certifications as string)?.trim(), description: 'Certificados o especialidades' },
        { id: 'bio',       label: 'Biografía',                 icon: 'edit',     done: ((profile.bio as string) ?? '').trim().length >= 20, description: 'Descripción profesional (mínimo 20 caracteres)' },
        { id: 'docs',      label: 'Documentos acreditativos',  icon: 'file',     done: documentsCount > 0,                      description: 'Sube al menos un documento de respaldo' },
        { id: 'altLoc',    label: 'Ubicación alternativa',     icon: 'pin',      done: !!profile.alternative_location,          description: 'Consulta particular u otro lugar', optional: true },
      ];
    }
    return [
      { id: 'name',    label: 'Nombre completo',    icon: 'user',     done: !!profile.name,      description: 'Tu nombre en la plataforma' },
      { id: 'phone',   label: 'Teléfono',           icon: 'phone',    done: !!profile.phone,     description: 'Número de contacto' },
      { id: 'birth',   label: 'Fecha de nacimiento',icon: 'calendar', done: !!profile.birthdate, description: 'Necesaria para ficha clínica' },
      { id: 'gender',  label: 'Género',             icon: 'user',     done: !!profile.gender,    description: 'Información para el estudiante' },
      { id: 'address', label: 'Dirección',          icon: 'pin',      done: !!profile.address,   description: 'Para ubicar clínicas cercanas' },
    ];
  }, [profile, documentsCount, role]);

  const required = items.filter(i => !i.optional);
  const done     = required.filter(i => i.done).length;
  const pct      = Math.round((done / required.length) * 100);

  const barColor = pct >= 80 ? 'var(--success-500,#22c55e)' : pct >= 50 ? 'var(--warning-500,#F59E0B)' : 'var(--danger-500,#ef4444)';
  const msg      = pct === 100 ? '¡Perfil completo!' : pct >= 80 ? 'Casi completo' : pct >= 50 ? 'Buen progreso' : 'Completa tu perfil';

  return (
    <Glass radius={20} style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>Completitud del perfil</div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>{msg}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: barColor, letterSpacing: '-0.03em', lineHeight: 1 }}>{pct}%</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 10, borderRadius: 99, background: 'rgba(10,22,40,0.08)', overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: barColor, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 10px ${barColor}60` }} />
      </div>

      {/* Item list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: item.done ? 'rgba(34,197,94,0.06)' : 'rgba(10,22,40,0.03)', border: `1px solid ${item.done ? 'rgba(34,197,94,0.2)' : 'rgba(10,22,40,0.06)'}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: item.done ? 'rgba(34,197,94,0.12)' : 'rgba(10,22,40,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} size={17} color={item.done ? 'var(--success-600,#16a34a)' : 'var(--ink-400)'} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.label}
                {item.optional && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-400)', background: 'rgba(10,22,40,0.06)', padding: '1px 6px', borderRadius: 99 }}>opcional</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>{item.description}</div>
            </div>
            <Icon
              name={item.done ? 'check' : 'close'}
              size={16}
              color={item.done ? 'var(--success-600,#16a34a)' : 'var(--warning-500,#F59E0B)'}
            />
          </div>
        ))}
      </div>

      {pct < 100 && onEdit && (
        <div style={{ marginTop: 16 }}>
          <Button size="md" full onClick={onEdit}>Completar perfil</Button>
        </div>
      )}
    </Glass>
  );
}
