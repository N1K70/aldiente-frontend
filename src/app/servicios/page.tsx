'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import { api } from '@/lib/api';
import ServiceFormModal, { type StudentService } from '@/components/ServiceFormModal';

// ── Helpers ────────────────────────────────────────────────────
function fmt(price?: number) {
  if (price == null) return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(price);
}

// ── Page ───────────────────────────────────────────────────────
export default function MisServiciosPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();

  const [services, setServices] = useState<StudentService[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentService | null>(null);

  const loadServices = () => {
    if (!user?.id) return;
    setLoading(true);
    api.get(`/api/students/${user.id}/services`)
      .then(r => {
        const raw = r.data;
        setServices(Array.isArray(raw) ? raw : (raw?.services ?? raw?.data ?? []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadServices(); }, [user?.id]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (svc: StudentService) => { setEditing(svc); setModalOpen(true); };

  const onSaved = (svc: StudentService) => {
    setServices(prev => {
      const idx = prev.findIndex(s => s.id === svc.id);
      return idx >= 0 ? prev.map((s,i) => i === idx ? { ...s, ...svc } : s) : [...prev, svc];
    });
    setModalOpen(false);
  };

  const onDeleted = (id: string) => {
    setServices(prev => prev.filter(s => String(s.id) !== id));
    setModalOpen(false);
  };

  const content = (
    <>
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>Cargando servicios…</div>
      ) : services.length === 0 ? (
        <Glass radius={20} style={{ padding: 48, textAlign: 'center' }}>
          <Icon name="tooth" size={40} color="var(--ink-300)" />
          <p style={{ fontSize: 15, color: 'var(--ink-500)', margin: '16px 0 20px' }}>
            Aún no tienes servicios configurados.<br />Agrega el primero para que los pacientes puedan encontrarte.
          </p>
          <Button size="md" onClick={openCreate}>+ Agregar servicio</Button>
        </Glass>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {services.map(svc => (
            <Glass key={svc.id} radius={18} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(16,169,198,0.15), rgba(79,70,229,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="tooth" size={22} color="var(--brand-600)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {svc.service_name ?? 'Servicio'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>
                  {fmt(svc.price)}{svc.duration ? ` · ${svc.duration} min` : ''}
                  {(svc as any).location ? ` · ${(svc as any).location}` : ''}
                </div>
              </div>
              <button onClick={() => openEdit(svc)}
                style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(10,22,40,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="edit" size={16} color="var(--ink-500)" />
              </button>
            </Glass>
          ))}
        </div>
      )}
    </>
  );

  if (isDesktop) return (
    <DesktopShell role="student" activeId="services" title="Mis servicios" subtitle={`${services.length} servicio${services.length !== 1 ? 's' : ''} configurado${services.length !== 1 ? 's' : ''}`}
      ctaLabel="Nuevo servicio" ctaIcon="plus" onCtaClick={openCreate}>
      {content}
      {modalOpen && user?.id && (
        <ServiceFormModal
          studentId={user.id}
          mode={editing ? 'edit' : 'create'}
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </DesktopShell>
  );

  return (
    <div className="app-scroll" style={{ minHeight: '100dvh', overflowY: 'auto', background: 'var(--bg-aurora)', fontFamily: 'var(--font-body)', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="arrow_left" size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink-900)' }}>Mis servicios</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>{services.length} configurado{services.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {content}
      </div>

      {/* FAB */}
      {services.length > 0 && (
        <button onClick={openCreate} style={{ position: 'fixed', bottom: 88, right: 20, width: 56, height: 56, borderRadius: 999, background: 'linear-gradient(135deg, #1BB9D6, #6366F1)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(27,185,214,0.4)', zIndex: 10 }}>
          <Icon name="plus" size={26} color="#fff" />
        </button>
      )}

      {modalOpen && user?.id && (
        <ServiceFormModal
          studentId={user.id}
          mode={editing ? 'edit' : 'create'}
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
}
