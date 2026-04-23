'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useIsDesktop, DesktopShell } from '@/components/desktop-shell';

// ── Types ──────────────────────────────────────────────────────
interface Appointment {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduled_at?: string;
  notes?: string;
  service_name?: string;
  student_id?: string;
  patient_id?: string;
  student_name?: string;
  patient_name?: string;
  price?: number;
  clinic?: { name?: string; box?: string };
}

interface Attachment {
  id: string;
  file_url: string;
  file_name?: string;
  file_mime?: string;
  allow_student: boolean;
  created_at: string;
}

const STATUS_MAP = {
  confirmed: { label: 'Confirmada',  bg: 'var(--success-100)', fg: 'var(--success-600)' },
  pending:   { label: 'Pendiente',   bg: 'var(--warning-100)', fg: 'var(--warning-600)' },
  completed: { label: 'Completada',  bg: 'var(--ink-100)',     fg: 'var(--ink-600)' },
  cancelled: { label: 'Cancelada',   bg: 'var(--danger-100)',  fg: 'var(--danger-600)' },
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--ink-100)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,169,198,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={18} color="var(--brand-600)" />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 15, color: 'var(--ink-900)', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const role = user?.role === 'student' ? 'student' : 'patient';

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success'|'danger'>('success');

  const showToast = (msg: string, type: 'success'|'danger' = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [apptRes, attsRes] = await Promise.all([
          api.get(`/api/appointments/${id}`),
          api.get(`/api/appointments/${id}/attachments`).catch(() => ({ data: [] })),
        ]);
        const a: Appointment = apptRes.data;
        // Enrich names if missing
        if (!a.patient_name && a.patient_id) {
          try {
            const r = await api.get(`/api/patients/${a.patient_id}`);
            a.patient_name = r.data?.name ?? r.data?.full_name ?? undefined;
          } catch {}
        }
        if (!a.student_name && a.student_id) {
          try {
            const r = await api.get(`/api/students/${a.student_id}`);
            a.student_name = r.data?.full_name ?? r.data?.name ?? undefined;
          } catch {}
        }
        setAppt(a);
        setAttachments(Array.isArray(attsRes.data) ? attsRes.data : []);
      } catch {
        showToast('No se pudo cargar la cita', 'danger');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const uploadRes = await api.post('/api/files/upload', form);
      const fileUrl = uploadRes.data?.url ?? uploadRes.data?.file_url;
      await api.post(`/api/appointments/${id}/attachments`, {
        file_url: fileUrl, file_name: file.name, file_mime: file.type,
        file_size: file.size, allow_student: true,
      });
      const attsRes = await api.get(`/api/appointments/${id}/attachments`);
      setAttachments(Array.isArray(attsRes.data) ? attsRes.data : []);
      showToast('Archivo adjuntado');
    } catch {
      showToast('Error al subir el archivo', 'danger');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    setDeletingId(attId);
    try {
      await api.delete(`/api/appointments/${id}/attachments/${attId}`);
      setAttachments(prev => prev.filter(a => a.id !== attId));
    } catch {
      showToast('Error al eliminar archivo', 'danger');
    } finally {
      setDeletingId('');
    }
  };

  const canUpload = user?.role === 'patient' && appt?.status !== 'cancelled' && appt?.status !== 'completed';
  const otherName = user?.role === 'patient' ? (appt?.student_name ?? 'Estudiante') : (appt?.patient_name ?? 'Paciente');
  const statusInfo = STATUS_MAP[appt?.status ?? 'pending'] ?? STATUS_MAP.pending;

  const spinner = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: isDesktop ? 400 : '100dvh', background: isDesktop ? 'transparent' : 'var(--bg-aurora)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(10,22,40,0.1)', borderTopColor: 'var(--brand-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (loading) {
    if (isDesktop) return <DesktopShell role={role} activeId="appts" title="Detalle de cita">{spinner}</DesktopShell>;
    return spinner;
  }

  if (!appt) {
    const empty = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: isDesktop ? 400 : '100dvh', fontFamily: 'var(--font-body)' }}>
        <Icon name="calendar" size={48} color="var(--ink-300)" />
        <p style={{ color: 'var(--ink-500)', fontSize: 15 }}>No se encontró la cita</p>
        <Button size="md" onClick={() => router.push('/citas')}>Volver</Button>
      </div>
    );
    if (isDesktop) return <DesktopShell role={role} activeId="appts" title="Detalle de cita">{empty}</DesktopShell>;
    return <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)' }}>{empty}</div>;
  }

  const scheduledDate = appt.scheduled_at
    ? new Date(appt.scheduled_at).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : undefined;
  const scheduledTime = appt.scheduled_at
    ? new Date(appt.scheduled_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    : undefined;

  const content = (
    <div style={{ fontFamily: 'var(--font-body)', paddingBottom: 48 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: toastType === 'success' ? 'var(--success-500,#22c55e)' : 'var(--danger-500,#ef4444)', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 500, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>{toast}</div>
      )}

      {/* Header — mobile only (desktop uses DesktopShell topbar) */}
      {!isDesktop && (
        <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="arrow_left" size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink-900)' }}>Detalle de cita</h1>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: statusInfo.bg, color: statusInfo.fg }}>{statusInfo.label}</span>
        </div>
      )}
      {isDesktop && (
        <div style={{ padding: '16px 32px 4px', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: statusInfo.bg, color: statusInfo.fg }}>{statusInfo.label}</span>
        </div>
      )}

      <div style={{ padding: isDesktop ? '0 32px' : '0 20px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: isDesktop ? 720 : undefined }}>

        {/* Main info */}
        <Glass hi radius={20} style={{ padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Información</div>
          <InfoRow icon="tooth"     label="Servicio"  value={appt.service_name ?? 'No especificado'} />
          <InfoRow icon="user"      label={user?.role === 'patient' ? 'Estudiante' : 'Paciente'} value={otherName} />
          <InfoRow icon="calendar"  label="Fecha"     value={scheduledDate} />
          <InfoRow icon="clock"     label="Hora"      value={scheduledTime} />
          {appt.clinic?.name && <InfoRow icon="home" label="Clínica" value={`${appt.clinic.name}${appt.clinic.box ? ` · Box ${appt.clinic.box}` : ''}`} />}
          {appt.price != null && <InfoRow icon="star" label="Precio" value={`$${appt.price.toLocaleString('es-CL')}`} />}
          {appt.notes && <InfoRow icon="edit" label="Notas" value={appt.notes} />}
        </Glass>

        {/* Attachments */}
        <Glass radius={20} style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Archivos adjuntos</div>
            {canUpload && (
              <label style={{ cursor: 'pointer' }}>
                <input type="file" onChange={handleUpload} style={{ display: 'none' }} accept="image/*,application/pdf" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--brand-600)', padding: '6px 12px', borderRadius: 10, background: 'rgba(16,169,198,0.1)' }}>
                  {uploading ? '…' : <><Icon name="plus" size={14} color="var(--brand-600)" /> Adjuntar</>}
                </div>
              </label>
            )}
          </div>
          {attachments.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--ink-400)', textAlign: 'center', padding: '12px 0' }}>No hay archivos adjuntos</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attachments.map(att => (
                <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.6)' }}>
                  <Icon name="edit" size={18} color="var(--ink-500)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.file_name ?? 'Archivo'}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{new Date(att.created_at).toLocaleDateString('es-CL')}</div>
                  </div>
                  <a href={att.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-600)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Ver</a>
                  {canUpload && (
                    <button onClick={() => handleDeleteAttachment(att.id)} disabled={deletingId === att.id} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--danger-500)' }}>
                      <Icon name="close" size={16} color="var(--danger-500)" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Glass>

        {/* Actions */}
        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button size="lg" full variant="outline" onClick={() => router.push(`/citas/${id}/reagendar`)}>
              Reagendar cita
            </Button>
          </div>
        )}

        {/* Chat link */}
        {(appt.status === 'confirmed' || appt.status === 'completed') && (
          <button onClick={() => router.push(`/chat?appointmentId=${id}`)}
            style={{ padding: '14px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', border: '2px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chat" size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Chat con {otherName}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>Envía mensajes sobre esta cita</div>
            </div>
            <Icon name="chevron_right" size={18} color="var(--ink-400)" />
          </button>
        )}

        {/* Rating prompt for completed */}
        {appt.status === 'completed' && user?.role === 'patient' && (
          <Glass radius={18} style={{ padding: 20, textAlign: 'center' }}>
            <Icon name="star" size={32} color="var(--warning-500,#F59E0B)" />
            <p style={{ fontSize: 15, color: 'var(--ink-700)', margin: '10px 0 14px', fontWeight: 500 }}>
              ¿Cómo fue tu experiencia con {appt.student_name ?? 'el estudiante'}?
            </p>
            <Button size="md" full onClick={() => router.push(`/citas/${id}/calificar`)}>
              Calificar atención
            </Button>
          </Glass>
        )}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <DesktopShell role={role} activeId="appts" title="Detalle de cita">
        {content}
      </DesktopShell>
    );
  }

  return (
    <div className="app-scroll" style={{ minHeight: '100dvh', overflowY: 'auto', background: 'var(--bg-aurora)' }}>
      {content}
    </div>
  );
}
