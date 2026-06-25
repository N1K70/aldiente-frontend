'use client';

import React from 'react';
import { Icon } from '@/components/ui';

// [044] Estado de validacion institucional del estudiante.
// Prototipo: el backend aun no expone un campo de validacion (ver auditoria
// [041]), por lo que sin dato se asume "pendiente". Cuando el backend devuelva
// validation_status / is_validated, este banner lo refleja automaticamente.

export type ValidationStatus = 'validado' | 'pendiente' | 'rechazado';

export function normalizeValidationStatus(raw: unknown): ValidationStatus {
  if (typeof raw === 'boolean') return raw ? 'validado' : 'pendiente';
  const s = String(raw ?? '').trim().toLowerCase();
  if (['validado', 'validated', 'verified', 'approved', 'aprobado'].includes(s)) return 'validado';
  if (['rechazado', 'rejected', 'denied', 'no_verificado', 'not_verified'].includes(s)) return 'rechazado';
  return 'pendiente';
}

const CONFIG: Record<ValidationStatus, { icon: string; fg: string; bg: string; title: string; body: string }> = {
  validado: {
    icon: 'check',
    fg: 'var(--success-700)',
    bg: 'var(--success-100)',
    title: 'Validación institucional confirmada',
    body: 'Tu universidad validó tu perfil. Ya puedes publicar servicios en el piloto.',
  },
  pendiente: {
    icon: 'clock',
    fg: 'var(--warning-700)',
    bg: 'var(--warning-100)',
    title: 'Validación institucional pendiente',
    body: 'Puedes completar tu perfil. La publicación de servicios en el piloto requiere la validación de tu universidad.',
  },
  rechazado: {
    icon: 'close',
    fg: 'var(--ink-700)',
    bg: 'var(--ink-100)',
    title: 'Validación no aprobada',
    body: 'Tu validación institucional no fue aprobada. Escríbenos a soporte para revisar tu caso.',
  },
};

export default function StudentValidationBanner({ status }: { status?: unknown }) {
  const config = CONFIG[normalizeValidationStatus(status)];
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 14,
        background: config.bg,
        marginBottom: 16,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        <Icon name={config.icon} size={18} color={config.fg} />
      </span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{config.title}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.4, marginTop: 2 }}>{config.body}</div>
      </div>
    </div>
  );
}
