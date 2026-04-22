'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface UserDocument {
  id: string;
  title: string;
  description?: string;
  category: string;
  year?: number;
  file_url: string;
  file_size?: number;
  created_at: string;
}

const QUOTA = 30 * 1024 * 1024;

const STUDENT_CATS = [
  { value: '', label: 'Todas' },
  { value: 'alumno_regular', label: 'Alumno Regular' },
  { value: 'plan_semestre', label: 'Plan Semestral' },
  { value: 'syllabus', label: 'Syllabus' },
  { value: 'otros', label: 'Otros' },
];
const PATIENT_CATS = [
  { value: '', label: 'Todas' },
  { value: 'receta', label: 'Recetas' },
  { value: 'solicitud', label: 'Solicitudes' },
  { value: 'otros', label: 'Otros' },
];

function UploadModal({ isStudent, onClose, onUploaded }: { isStudent: boolean; onClose: () => void; onUploaded: () => void }) {
  const cats = isStudent ? STUDENT_CATS.slice(1) : PATIENT_CATS.slice(1);
  const currentYear = new Date().getFullYear();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState<number | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [usedBytes, setUsedBytes] = useState(0);

  useEffect(() => {
    api.get('/api/documents').then(r => {
      const docs: UserDocument[] = Array.isArray(r.data) ? r.data : (r.data?.documents ?? []);
      setUsedBytes(docs.reduce((s, d) => s + Number(d.file_size ?? 0), 0));
    }).catch(() => {});
  }, []);

  const usedPct = Math.min(1, usedBytes / QUOTA);
  const barColor = usedPct >= 1 ? 'var(--danger-500,#ef4444)' : usedPct > 0.85 ? 'var(--warning-500,#F59E0B)' : 'var(--brand-500)';

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 10 * 1024 * 1024) { setError('El archivo excede 10MB'); setFile(null); return; }
    setError('');
    setFile(f);
  };

  const canSubmit = title && category && file && !(isStudent && category === 'alumno_regular' && year !== currentYear);

  const handleSubmit = async () => {
    if (!canSubmit || !file) return;
    setSubmitting(true); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title);
      form.append('category', category);
      if (desc) form.append('description', desc);
      if (year) form.append('year', String(year));
      await api.post('/api/documents', form);
      onUploaded();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al subir el documento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 600, background: 'rgba(255,255,255,0.96)', borderRadius: '28px 28px 0 0', padding: '28px 24px 40px', boxShadow: '0 -12px 48px rgba(10,22,40,0.18)', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink-900)' }}>Subir documento</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Icon name="close" size={20} color="var(--ink-400)" /></button>
        </div>

        {/* Quota bar */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 6 }}>
            Almacenamiento: {(usedBytes / (1024*1024)).toFixed(1)} MB / 30 MB
          </div>
          <div style={{ height: 6, borderRadius: 99, background: 'rgba(10,22,40,0.08)' }}>
            <div style={{ height: '100%', width: `${usedPct * 100}%`, borderRadius: 99, background: barColor, transition: 'width 0.4s' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>Título *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Certificado Alumno Regular"
            style={{ height: 44, borderRadius: 12, border: '1.5px solid rgba(10,22,40,0.1)', padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', background: 'rgba(255,255,255,0.7)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>Categoría *</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            style={{ height: 44, borderRadius: 12, border: '1.5px solid rgba(10,22,40,0.1)', padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', background: 'rgba(255,255,255,0.7)' }}>
            <option value="">Seleccionar…</option>
            {cats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {isStudent && category === 'alumno_regular' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>Año *</label>
            <input type="number" value={year ?? ''} onChange={e => setYear(Number(e.target.value))} placeholder={String(currentYear)}
              style={{ height: 44, borderRadius: 12, border: '1.5px solid rgba(10,22,40,0.1)', padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', background: 'rgba(255,255,255,0.7)' }} />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>Descripción</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Opcional…"
            style={{ borderRadius: 12, border: '1.5px solid rgba(10,22,40,0.1)', padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none', background: 'rgba(255,255,255,0.7)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>Archivo * (máx. 10 MB)</label>
          <input type="file" onChange={onFileChange} accept="image/*,application/pdf,.doc,.docx"
            style={{ fontSize: 13, fontFamily: 'var(--font-body)' }} />
          {file && <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</div>}
        </div>

        {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 13 }}>{error}</div>}

        <Button size="lg" full disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? 'Subiendo…' : 'Subir documento'}
        </Button>
      </div>
    </div>
  );
}

export default function DocumentosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const categories = isStudent ? STUDENT_CATS : PATIENT_CATS;
  const currentYear = new Date().getFullYear();

  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/api/documents', { params: filter ? { category: filter } : {} })
      .then(r => {
        const d = r.data;
        setDocs(Array.isArray(d) ? d : (d?.documents ?? []));
      })
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const missingAlumnoRegular = isStudent && !docs.some(d => d.category === 'alumno_regular' && d.year === currentYear);

  const handleDelete = async (doc: UserDocument) => {
    if (!confirm(`¿Eliminar "${doc.title}"?`)) return;
    await api.delete(`/api/documents/${doc.id}`).catch(() => {});
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  };

  return (
    <div className="app-scroll" style={{ minHeight: '100dvh', overflowY: 'auto', background: 'var(--bg-aurora)', fontFamily: 'var(--font-body)', paddingBottom: 60 }}>
      <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="arrow_left" size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink-900)' }}>Documentos</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>{docs.length} archivo{docs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #1BB9D6, #6366F1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={22} color="#fff" />
        </button>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Missing doc warning */}
        {!loading && missingAlumnoRegular && (
          <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.3)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Icon name="alert" size={20} color="var(--warning-600,#d97706)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning-700,#b45309)' }}>Documento obligatorio faltante</div>
              <div style={{ fontSize: 13, color: 'var(--warning-600,#d97706)', marginTop: 2 }}>Debes subir tu Certificado de Alumno Regular {currentYear}.</div>
            </div>
            <button onClick={() => setModalOpen(true)} style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning-700,#b45309)', background: 'rgba(245,158,11,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Subir</button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {categories.map(c => (
            <button key={c.value} onClick={() => setFilter(c.value)}
              style={{ padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, flexShrink: 0, background: filter === c.value ? 'linear-gradient(180deg, #1BB9D6, #0E8AA5)' : 'rgba(255,255,255,0.78)', color: filter === c.value ? '#fff' : 'var(--ink-700)', backdropFilter: 'blur(14px)' }}>
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>Cargando…</div>
        ) : docs.length === 0 ? (
          <Glass radius={20} style={{ padding: 48, textAlign: 'center' }}>
            <Icon name="file" size={40} color="var(--ink-300)" />
            <p style={{ fontSize: 15, color: 'var(--ink-500)', margin: '16px 0 20px' }}>No hay documentos{filter ? ' en esta categoría' : ''}.</p>
            <Button size="md" onClick={() => setModalOpen(true)}>Subir documento</Button>
          </Glass>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map(doc => (
              <Glass key={doc.id} radius={16} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,169,198,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="file" size={20} color="var(--brand-600)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                    {doc.category}{doc.year ? ` · ${doc.year}` : ''} · {new Date(doc.created_at).toLocaleDateString('es-CL')}
                  </div>
                </div>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16,169,198,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="download" size={16} color="var(--brand-600)" />
                </a>
                <button onClick={() => handleDelete(doc)}
                  style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="close" size={16} color="var(--danger-500,#ef4444)" />
                </button>
              </Glass>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <UploadModal isStudent={isStudent} onClose={() => setModalOpen(false)} onUploaded={load} />
      )}
    </div>
  );
}
