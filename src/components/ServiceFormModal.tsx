'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Glass, Icon, Button, TextField } from '@/components/ui';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────
interface BaseService { id: string; name: string; categoria_general?: string; }
type DayState = { enabled: boolean; start: string; end: string; };

export interface StudentService {
  id?: string;
  service_id?: string;
  service_name?: string;
  description?: string;
  price?: number;
  duration?: number;
  location?: string;
}

interface Props {
  studentId: string;
  mode?: 'create' | 'edit';
  initial?: StudentService | null;
  onClose: () => void;
  onSaved: (svc: StudentService) => void;
  onDeleted?: (id: string) => void;
}

const WEEKDAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DEFAULT_DAYS: Record<number, DayState> = Object.fromEntries(
  [1,2,3,4,5,6].map(i => [i, { enabled: false, start: '09:00', end: '17:00' }])
);

function toHms(v: string) { const [h,m] = v.split(':'); return `${h||'00'}:${m||'00'}:00`; }
function toHHmm(v?: string) { if (!v) return ''; const [h,m] = v.split(':'); return `${h}:${m}`; }

// ── Component ──────────────────────────────────────────────────
export default function ServiceFormModal({ studentId, mode = 'create', initial, onClose, onSaved, onDeleted }: Props) {
  const [baseServices, setBaseServices] = useState<BaseService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [baseServiceId, setBaseServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('Universidad');
  const [days, setDays] = useState<Record<number, DayState>>(DEFAULT_DAYS);
  const [dayErrors, setDayErrors] = useState<Record<number,string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load base services
  useEffect(() => {
    api.get('/api/services')
      .then(r => {
        const raw = r.data;
        const rows: any[] = Array.isArray(raw) ? raw : (raw?.services ?? raw?.data ?? []);
        setBaseServices(rows.map(r => ({ id: String(r.id), name: r.name ?? 'Servicio', categoria_general: r.categoria_general ?? '' })));
      })
      .catch(() => {});
  }, []);

  const categories = useMemo(() => [...new Set(baseServices.map(s => s.categoria_general || 'Otro'))].sort(), [baseServices]);
  const filteredServices = useMemo(() => selectedCategory ? baseServices.filter(s => (s.categoria_general || 'Otro') === selectedCategory) : [], [baseServices, selectedCategory]);

  // Populate in edit mode
  useEffect(() => {
    if (mode === 'edit' && initial) {
      const svcId = String((initial as any).service_id ?? '');
      setBaseServiceId(svcId);
      if (svcId && baseServices.length) {
        const match = baseServices.find(s => String(s.id) === svcId);
        if (match) setSelectedCategory(match.categoria_general || 'Otro');
      }
      setDescription((initial as any).description ?? '');
      setPrice(initial.price != null ? String(initial.price) : '');
      setDuration(initial.duration != null ? String(initial.duration) : '');
      setLocation((initial as any).location ?? 'Universidad');

      // Load availability
      if (initial.id) {
        api.get(`/api/student-services/${initial.id}/availabilities`)
          .then(r => {
            const data: any[] = Array.isArray(r.data) ? r.data : (r.data?.availabilities ?? []);
            const init: Record<number,DayState> = { ...DEFAULT_DAYS };
            data.forEach(a => {
              const d = a.day_of_week ?? a.weekday;
              if (d != null && d !== 0) {
                init[d] = { enabled: true, start: toHHmm(a.start_time) || '09:00', end: toHHmm(a.end_time) || '17:00' };
              }
            });
            setDays(init);
          })
          .catch(() => {});
      }
    }
  }, [mode, initial, baseServices]);

  const toggleDay = (idx: number, enabled: boolean) => {
    setDays(prev => ({ ...prev, [idx]: { ...prev[idx], enabled } }));
  };

  const validate = () => {
    const newErrors: Record<number,string> = {};
    for (const [k, st] of Object.entries(days)) {
      const idx = Number(k);
      if (!st.enabled) continue;
      if (!st.start || !st.end) { newErrors[idx] = 'Especifica inicio y fin'; continue; }
      if (toHms(st.start) >= toHms(st.end)) newErrors[idx] = 'El inicio debe ser menor que el fin';
    }
    setDayErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = useCallback(async () => {
    setError('');
    if (mode === 'create' && !baseServiceId) { setError('Selecciona un servicio base'); return; }
    if (!validate()) { setError('Revisa los horarios de disponibilidad'); return; }

    const enabledDays = Object.entries(days).filter(([,st]) => st.enabled);
    if (mode === 'create' && enabledDays.length === 0) { setError('Agrega al menos un día de disponibilidad'); return; }

    setSubmitting(true);
    try {
      const payload: any = {
        description,
        price: price ? Number(price) : undefined,
        duration: duration ? Number(duration) : undefined,
        location,
      };

      if (mode === 'create') {
        payload.service_id = baseServiceId;
        payload.availabilities = enabledDays.map(([k, st]) => ({
          day_of_week: Number(k) === 0 ? 7 : Number(k),
          start_time: toHms(st.start),
          end_time: toHms(st.end),
        }));
        const res = await api.post(`/api/students/${studentId}/services`, payload);
        onSaved(res.data);
      } else {
        if (baseServiceId && String(baseServiceId) !== String((initial as any)?.service_id ?? '')) {
          payload.service_id = baseServiceId;
        }
        await api.put(`/api/students/${studentId}/services/${initial!.id}`, payload);

        // Rebuild availability
        const existing = await api.get(`/api/student-services/${initial!.id}/availabilities`).catch(() => ({ data: [] }));
        const existingList: any[] = Array.isArray(existing.data) ? existing.data : (existing.data?.availabilities ?? []);
        await Promise.all(existingList.map(a => api.delete(`/api/service-availabilities/${a.id}`).catch(() => {})));
        await Promise.all(enabledDays.map(([k, st]) =>
          api.post(`/api/student-services/${initial!.id}/availabilities`, {
            dayOfWeek: Number(k), startTime: toHms(st.start), endTime: toHms(st.end), isRecurring: true,
          }).catch(() => {})
        ));
        onSaved({ ...initial!, ...payload });
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'No se pudo guardar el servicio');
    } finally {
      setSubmitting(false);
    }
  }, [studentId, baseServiceId, description, price, duration, location, days, mode, initial, onSaved, onClose]);

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/students/${studentId}/services/${initial!.id}`);
      onDeleted?.(String(initial!.id));
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo eliminar el servicio');
    } finally {
      setDeleting(false); setConfirmDelete(false);
    }
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 15,
    border: '1.5px solid rgba(255,255,255,0.9)', borderRadius: 14,
    background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)',
    color: 'var(--ink-900)', cursor: 'pointer', outline: 'none',
    fontFamily: 'var(--font-body)', appearance: 'none',
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => !submitting && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.4)', backdropFilter: 'blur(6px)', zIndex: 200 }} />

      {/* Sheet */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 201, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <Glass hi radius={0} style={{ borderRadius: '24px 24px 0 0', padding: '20px 24px 40px', maxWidth: 600, margin: '60px auto 0', width: '100%' }}>
          {/* Handle + header */}
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--ink-200)', margin: '0 auto 20px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', margin: 0 }}>
              {mode === 'edit' ? 'Editar servicio' : 'Nuevo servicio'}
            </h2>
            <button onClick={() => !submitting && onClose()} style={{ width: 36, height: 36, borderRadius: 99, background: 'rgba(10,22,40,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={18} color="var(--ink-500)" />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Section: Service selection */}
            <Glass radius={16} style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="tooth" size={14} color="var(--brand-600)" /> Selección de servicio
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', display: 'block', marginBottom: 6 }}>Categoría *</label>
                  <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setBaseServiceId(''); }} style={selectStyle}>
                    <option value="">Selecciona una categoría</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {selectedCategory && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', display: 'block', marginBottom: 6 }}>Servicio específico *</label>
                    <select value={baseServiceId} onChange={e => setBaseServiceId(e.target.value)} style={selectStyle}>
                      <option value="">Selecciona un servicio</option>
                      {filteredServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <p style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 4 }}>{filteredServices.length} servicio{filteredServices.length !== 1 ? 's' : ''} en {selectedCategory}</p>
                  </div>
                )}
              </div>
            </Glass>

            {/* Section: Details */}
            <Glass radius={16} style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="edit" size={14} color="var(--brand-600)" /> Detalles
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', display: 'block', marginBottom: 6 }}>Descripción</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe el servicio y qué incluye" rows={3}
                    style={{ ...selectStyle, resize: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <TextField label="Precio (CLP)" icon="star" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="15000" />
                  <TextField label="Duración (min)" icon="clock" type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="60" />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', display: 'block', marginBottom: 6 }}>Ubicación</label>
                  <select value={location} onChange={e => setLocation(e.target.value)} style={selectStyle}>
                    <option value="Universidad">Universidad</option>
                    <option value="Laboratorio">Laboratorio</option>
                  </select>
                </div>
              </div>
            </Glass>

            {/* Section: Availability */}
            <Glass radius={16} style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="calendar" size={14} color="var(--brand-600)" /> Disponibilidad
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3,4,5,6].map(idx => {
                  const st = days[idx] ?? { enabled: false, start: '09:00', end: '17:00' };
                  return (
                    <div key={idx} style={{ borderRadius: 14, border: `2px solid ${st.enabled ? 'var(--brand-400)' : 'rgba(10,22,40,0.08)'}`, background: st.enabled ? 'rgba(16,169,198,0.06)' : 'rgba(255,255,255,0.5)', padding: '12px 14px', transition: 'all 140ms' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleDay(idx, !st.enabled)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 99, border: `2px solid ${st.enabled ? 'var(--brand-500)' : 'var(--ink-300)'}`, background: st.enabled ? 'var(--brand-500)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 140ms' }}>
                            {st.enabled && <Icon name="check" size={12} color="#fff" stroke={2.5} />}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: st.enabled ? 'var(--brand-700)' : 'var(--ink-600)' }}>{WEEKDAYS[idx]}</span>
                        </div>
                        <span style={{ fontSize: 12, color: st.enabled ? 'var(--brand-600)' : 'var(--ink-400)' }}>{st.enabled ? 'Habilitado' : 'Deshabilitado'}</span>
                      </div>
                      {st.enabled && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                          <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Desde</span>
                          <input type="time" value={st.start} onChange={e => { setDays(p => ({ ...p, [idx]: { ...p[idx], start: e.target.value } })); setDayErrors(p => ({ ...p, [idx]: '' })); }}
                            style={{ height: 36, padding: '0 10px', borderRadius: 10, border: '1.5px solid rgba(10,22,40,0.12)', fontSize: 13, fontFamily: 'var(--font-body)' }} />
                          <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>–</span>
                          <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Hasta</span>
                          <input type="time" value={st.end} onChange={e => { setDays(p => ({ ...p, [idx]: { ...p[idx], end: e.target.value } })); setDayErrors(p => ({ ...p, [idx]: '' })); }}
                            style={{ height: 36, padding: '0 10px', borderRadius: 10, border: '1.5px solid rgba(10,22,40,0.12)', fontSize: 13, fontFamily: 'var(--font-body)' }} />
                        </div>
                      )}
                      {dayErrors[idx] && <p style={{ fontSize: 12, color: 'var(--danger-600)', margin: '6px 0 0' }}>{dayErrors[idx]}</p>}
                    </div>
                  );
                })}
              </div>
            </Glass>

            {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 14 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              {mode === 'edit' && !confirmDelete && (
                <button onClick={() => setConfirmDelete(true)} disabled={deleting}
                  style={{ padding: '0 18px', height: 52, borderRadius: 16, background: 'var(--danger-100)', color: 'var(--danger-600)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-body)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="close" size={16} color="var(--danger-600)" /> Eliminar
                </button>
              )}
              {confirmDelete && (
                <button onClick={onDelete} disabled={deleting}
                  style={{ padding: '0 18px', height: 52, borderRadius: 16, background: 'var(--danger-500)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-body)', flexShrink: 0 }}>
                  {deleting ? 'Eliminando…' : '¿Confirmar?'}
                </button>
              )}
              <Button size="lg" full disabled={submitting} onClick={onSubmit}>
                {submitting ? 'Guardando…' : mode === 'edit' ? 'Actualizar servicio' : 'Guardar servicio'}
              </Button>
            </div>
          </div>
        </Glass>
      </div>
    </>
  );
}
