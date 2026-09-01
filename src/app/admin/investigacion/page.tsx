'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Glass, Icon } from '@/components/ui';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

type Persona = 'patient' | 'student' | 'university';

type CountRow = { label?: string; persona?: Persona; count: number };

type ResearchLead = {
  id: string;
  persona: Persona;
  contact: { name: string; email: string; phone: string | null; city: string | null };
  submittedAt: string;
  retentionUntil: string;
  source: { utmSource: string | null; utmMedium: string | null; utmCampaign: string | null };
  response: Record<string, string | null>;
};

type ResearchResponse = {
  summary: {
    total: number;
    last7Days: number;
    byPersona: CountRow[];
    organizations: CountRow[];
    treatmentNeeds: CountRow[];
  };
  leads: ResearchLead[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

const personaCopy: Record<Persona, string> = {
  patient: 'Pacientes',
  student: 'Estudiantes',
  university: 'Universidades',
};

function humanize(value: string | null | undefined) {
  if (!value) return 'Sin especificar';
  return value.replaceAll('_', ' ');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function responseFields(lead: ResearchLead) {
  if (lead.persona === 'patient') {
    return [
      ['Interes', humanize(lead.response.treatmentNeed)],
      ['Disponibilidad', humanize(lead.response.availability)],
    ];
  }
  if (lead.persona === 'student') {
    return [
      ['Universidad', humanize(lead.response.university)],
      ['Etapa', humanize(lead.response.clinicalStage)],
      ['Pacientes hoy', humanize(lead.response.patientAcquisition)],
    ];
  }
  return [
    ['Institucion', humanize(lead.response.organization)],
    ['Cargo', humanize(lead.response.respondentRole)],
    ['Clinica docente', humanize(lead.response.hasClinic)],
    ['Captacion', humanize(lead.response.institutionalAcquisition)],
  ];
}

function SummaryCard({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <Glass radius={8} style={{ padding: 16, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', background: `${color}18` }}>
          <Icon name={icon} size={18} color={color} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1, fontWeight: 700, color: 'var(--ink-900)' }}>{value}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>{label}</div>
        </div>
      </div>
    </Glass>
  );
}

function Distribution({ title, rows }: { title: string; rows: CountRow[] }) {
  const max = Math.max(1, ...rows.map(row => row.count));
  return (
    <section style={{ minWidth: 0 }}>
      <h2 style={{ fontSize: 15, margin: '0 0 12px', color: 'var(--ink-900)', fontWeight: 700 }}>{title}</h2>
      {rows.length === 0 ? (
        <div style={{ color: 'var(--ink-500)', fontSize: 13, padding: '12px 0' }}>Aun no hay respuestas.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row, index) => (
            <div key={`${row.label || row.persona}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: 'var(--ink-700)', marginBottom: 5 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{humanize(row.label || (row.persona ? personaCopy[row.persona] : null))}</span>
                  <span style={{ color: 'var(--ink-500)', flexShrink: 0 }}>{row.count}</span>
                </div>
                <div style={{ height: 6, background: 'var(--ink-100)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(6, (row.count / max) * 100)}%`, height: '100%', background: 'var(--brand-500)', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ResearchContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [persona, setPersona] = useState<'all' | Persona>('all');
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (user?.role !== 'admin') return;
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<ResearchResponse>('/api/admin/market-research', {
        params: persona === 'all' ? undefined : { persona },
      });
      setData(response);
    } catch (requestError: unknown) {
      const status = typeof requestError === 'object' && requestError && 'response' in requestError
        ? (requestError as { response?: { status?: number } }).response?.status
        : undefined;
      setError(status === 403 ? 'No tienes permisos para ver esta informacion.' : 'No pudimos cargar las respuestas.');
    } finally {
      setLoading(false);
    }
  }, [persona, user?.role]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, router, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const byPersona = useMemo(() => data?.summary.byPersona ?? [], [data]);
  const total = data?.summary.total ?? 0;

  if (authLoading || !user) {
    return <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 14 }}>Cargando...</div>;
  }

  if (user.role !== 'admin') {
    return <div style={{ padding: 32, color: 'var(--ink-700)', fontSize: 14 }}>No tienes acceso a esta seccion.</div>;
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 3 }}>Investigacion comercial</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1.1, fontWeight: 700, letterSpacing: 0, color: 'var(--ink-900)', margin: 0 }}>Respuestas del cuestionario</h1>
        </div>
        <Button size="sm" variant="outline" icon="chart" onClick={() => void load()} disabled={loading}>Actualizar</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
        <SummaryCard icon="users" value={total} label="Respuestas activas" color="#10A9C6" />
        <SummaryCard icon="sparkle" value={data?.summary.last7Days ?? 0} label="Ultimos 7 dias" color="#10B981" />
        <SummaryCard icon="heart" value={byPersona.find(row => row.persona === 'patient')?.count ?? 0} label="Pacientes" color="#E05A72" />
        <SummaryCard icon="graduation" value={byPersona.find(row => row.persona === 'student')?.count ?? 0} label="Estudiantes" color="#6366F1" />
      </div>

      <Glass radius={8} style={{ padding: 18, marginBottom: 20 }}>
        <label htmlFor="research-persona" style={{ display: 'block', fontSize: 12, color: 'var(--ink-600)', fontWeight: 700, marginBottom: 6 }}>Segmento</label>
        <select
          id="research-persona"
          value={persona}
          onChange={event => setPersona(event.target.value as 'all' | Persona)}
          style={{ height: 38, minWidth: 220, maxWidth: '100%', borderRadius: 6, border: '1px solid var(--ink-200)', background: '#fff', color: 'var(--ink-900)', padding: '0 10px', fontSize: 14 }}
        >
          <option value="all">Todos los segmentos</option>
          <option value="patient">Pacientes</option>
          <option value="student">Estudiantes</option>
          <option value="university">Universidades</option>
        </select>
      </Glass>

      {error ? (
        <Glass radius={8} style={{ padding: 18, color: 'var(--danger-700)', marginBottom: 20 }}>{error}</Glass>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18, padding: '18px 0 22px', borderTop: '1px solid var(--ink-200)', borderBottom: '1px solid var(--ink-200)', marginBottom: 22 }}>
            <Distribution title="Segmentos" rows={byPersona.map(row => ({ ...row, label: row.persona ? personaCopy[row.persona] : row.label }))} />
            <Distribution title="Universidades e instituciones" rows={data?.summary.organizations ?? []} />
            <Distribution title="Interes de pacientes" rows={data?.summary.treatmentNeeds ?? []} />
          </div>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, margin: 0, color: 'var(--ink-900)', fontWeight: 700 }}>Contactos para seguimiento</h2>
              <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>{total} en total</span>
            </div>
            {loading ? (
              <div style={{ padding: '28px 0', color: 'var(--ink-500)', fontSize: 14 }}>Cargando respuestas...</div>
            ) : data?.leads.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {data.leads.map(lead => (
                  <Glass key={lead.id} radius={8} style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.contact.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{personaCopy[lead.persona]}{lead.contact.city ? ` · ${lead.contact.city}` : ''}</div>
                      </div>
                      <span style={{ flexShrink: 0, color: 'var(--ink-500)' }} title={formatDate(lead.submittedAt)}><Icon name="clock" size={17} /></span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 13, fontSize: 13 }}>
                      <a href={`mailto:${lead.contact.email}`} style={{ color: 'var(--brand-700)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.contact.email}</a>
                      {lead.contact.phone && <a href={`tel:${lead.contact.phone}`} style={{ color: 'var(--brand-700)', textDecoration: 'none' }}>{lead.contact.phone}</a>}
                    </div>

                    <div style={{ borderTop: '1px solid var(--ink-100)', paddingTop: 11, display: 'grid', gap: 7 }}>
                      {responseFields(lead).map(([label, value]) => (
                        <div key={label} style={{ display: 'grid', gridTemplateColumns: '104px minmax(0, 1fr)', gap: 8, fontSize: 12 }}>
                          <span style={{ color: 'var(--ink-500)' }}>{label}</span>
                          <span style={{ color: 'var(--ink-800)', overflowWrap: 'anywhere' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </Glass>
                ))}
              </div>
            ) : (
              <div style={{ padding: '30px 0', color: 'var(--ink-500)', fontSize: 14 }}>No hay respuestas para este segmento.</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function ResearchAdminPage() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <DesktopShell role="admin" activeId="research" title="Investigacion comercial" subtitle="Cuestionario de interes" search={false}>
        <ResearchContent />
      </DesktopShell>
    );
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', color: 'var(--ink-900)', padding: '24px 16px 40px' }}>
      <ResearchContent />
    </main>
  );
}
