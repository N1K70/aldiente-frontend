'use client';

import React, { useMemo } from 'react';
import { Glass, Icon, Button } from '@/components/ui';
import { getProfileCompletionState, type ProfileRole } from '@/lib/profile-completion';

interface Props {
  profile: Record<string, unknown>;
  documentsCount?: number;
  role?: ProfileRole;
  onEdit?: () => void;
  loading?: boolean;
}

export default function ProfileCompletenessV2({
  profile,
  documentsCount = 0,
  role = 'patient',
  onEdit,
  loading = false,
}: Props) {
  if (loading) return null;

  const completion = useMemo(() => {
    return getProfileCompletionState(profile, role, documentsCount);
  }, [profile, role, documentsCount]);

  if (completion.complete || completion.percent >= 100) return null;

  const barColor =
    completion.percent >= 80
      ? 'var(--success-500,#22c55e)'
      : completion.percent >= 50
        ? 'var(--warning-500,#F59E0B)'
        : 'var(--danger-500,#ef4444)';

  const message =
    completion.percent >= 80
      ? 'Casi completo'
      : completion.percent >= 50
        ? 'Buen progreso'
        : 'Completa tu perfil';

  return (
    <Glass radius={20} style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>Completitud del perfil</div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>{message}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: barColor, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {completion.percent}%
        </div>
      </div>

      <div style={{ height: 10, borderRadius: 99, background: 'rgba(10,22,40,0.08)', overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ height: '100%', width: `${completion.percent}%`, borderRadius: 99, background: barColor, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 10px ${barColor}60` }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {completion.items.map((item) => (
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
            <Icon name={item.done ? 'check' : 'close'} size={16} color={item.done ? 'var(--success-600,#16a34a)' : 'var(--warning-500,#F59E0B)'} />
          </div>
        ))}
      </div>

      {completion.percent < 100 && onEdit && (
        <div style={{ marginTop: 16 }}>
          <Button size="md" full onClick={onEdit}>Completar perfil</Button>
        </div>
      )}
    </Glass>
  );
}
