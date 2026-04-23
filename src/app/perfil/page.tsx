'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Button, Glass, TextField } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import { useProfile } from '@/hooks/useProfile';
import { api } from '@/lib/api';
import ProfileCompleteness from '@/components/ProfileCompleteness';

type Section = 'datos' | 'seguridad' | 'notificaciones' | 'salud';

const MENU_ITEMS: { id: Section; icon: string; label: string; sub: string }[] = [
  { id: 'datos',           icon: 'user',         label: 'Datos personales',   sub: 'Nombre, correo, teléfono' },
  { id: 'seguridad',       icon: 'shield',        label: 'Seguridad',          sub: 'Contraseña y autenticación' },
  { id: 'notificaciones',  icon: 'bell',          label: 'Notificaciones',     sub: 'Recordatorios y alertas' },
  { id: 'salud',           icon: 'heart',         label: 'Salud dental',       sub: 'Ficha y antecedentes' },
];

interface University { id: string | number; name: string; }

function AvatarBadge({ initials, role }: { initials: string; role?: string }) {
  return (
    <div style={{ width: 72, height: 72, borderRadius: 999, flexShrink: 0, background: role === 'student' ? 'linear-gradient(135deg, #C7D2FE, #818CF8)' : 'linear-gradient(135deg, #10A9C6 0%, #4F46E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', boxShadow: '0 6px 16px rgba(10,22,40,0.12)' }}>
      {initials}
    </div>
  );
}

// ── Patient datos ──────────────────────────────────────────────
function PatientDatosSection({ profile, onSave }: { profile: Record<string, string>; onSave: (d: Record<string, string>) => Promise<boolean> }) {
  const [form, setForm] = useState({
    name:      profile.name      ?? '',
    email:     profile.email     ?? '',
    phone:     profile.phone     ?? '',
    rut:       profile.rut       ?? '',
    birthdate: profile.birthdate ?? '',
    gender:    profile.gender    ?? '',
    address:   profile.address   ?? '',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const upd = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setStatus('saving');
    const ok = await onSave(form);
    if (ok) {
      setStatus('ok');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('err');
      setErrMsg('No se pudo guardar. Verifica tu conexión e intenta de nuevo.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <TextField label="Nombre completo" icon="user" value={form.name} onChange={e => upd('name', e.target.value)} placeholder="María Rivas" />
        <TextField label="RUT" value={form.rut} onChange={e => upd('rut', e.target.value)} placeholder="12.345.678-9" />
        <TextField label="Correo electrónico" icon="mail" type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="tu@correo.cl" />
        <TextField label="Teléfono" value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="+56 9 XXXX XXXX" />
        <TextField label="Fecha de nacimiento" type="date" value={form.birthdate} onChange={e => upd('birthdate', e.target.value)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>Género</label>
          <select value={form.gender} onChange={e => upd('gender', e.target.value)}
            style={{ height: 44, borderRadius: 12, border: '1.5px solid rgba(10,22,40,0.1)', padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', background: 'rgba(255,255,255,0.7)', color: 'var(--ink-900)', outline: 'none' }}>
            <option value="">Sin especificar</option>
            <option value="female">Femenino</option>
            <option value="male">Masculino</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>
      <TextField label="Dirección" value={form.address} onChange={e => upd('address', e.target.value)} placeholder="Av. Ejemplo 123, Santiago" />
      {status === 'ok' && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', color: '#16a34a', fontSize: 13, fontWeight: 600 }}>¡Cambios guardados correctamente!</div>}
      {status === 'err' && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--danger-100,#fee2e2)', color: 'var(--danger-600,#dc2626)', fontSize: 13 }}>{errMsg}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="md" disabled={status === 'saving'} onClick={handleSave}>{status === 'saving' ? 'Guardando…' : 'Guardar cambios'}</Button>
      </div>
    </div>
  );
}

// ── Student datos ──────────────────────────────────────────────
function StudentDatosSection({ profile, onSave }: { profile: Record<string, string>; onSave: (d: Record<string, string>) => Promise<boolean> }) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [form, setForm] = useState({
    full_name:              profile.full_name            ?? profile.name ?? '',
    email:                  profile.email                ?? '',
    phone:                  profile.phone                ?? '',
    university_id:          String(profile.university_id ?? ''),
    career_year:            String(profile.career_year   ?? ''),
    university_location:    profile.university_location  ?? '',
    alternative_location:   profile.alternative_location ?? '',
    certifications:         profile.certifications       ?? '',
    bio:                    profile.bio                  ?? '',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const upd = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/api/universities').then(r => {
      const d = r.data;
      setUniversities(Array.isArray(d) ? d : (d?.universities ?? []));
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setStatus('saving');
    const ok = await onSave(form);
    if (ok) {
      setStatus('ok');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('err');
      setErrMsg('No se pudo guardar. Verifica tu conexión e intenta de nuevo.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <TextField label="Nombre completo" icon="user" value={form.full_name} onChange={e => upd('full_name', e.target.value)} placeholder="Juan Martínez" />
        <TextField label="Correo electrónico" icon="mail" type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="tu@correo.cl" />
        <TextField label="Teléfono" value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="+56 9 XXXX XXXX" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>Año de carrera</label>
          <select value={form.career_year} onChange={e => upd('career_year', e.target.value)}
            style={{ height: 44, borderRadius: 12, border: '1.5px solid rgba(10,22,40,0.1)', padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', background: 'rgba(255,255,255,0.7)', color: 'var(--ink-900)', outline: 'none' }}>
            <option value="">Seleccionar</option>
            {[1,2,3,4,5,6].map(y => <option key={y} value={String(y)}>{y}° año</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>Universidad</label>
        <select value={form.university_id} onChange={e => upd('university_id', e.target.value)}
          style={{ height: 44, borderRadius: 12, border: '1.5px solid rgba(10,22,40,0.1)', padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', background: 'rgba(255,255,255,0.7)', color: 'var(--ink-900)', outline: 'none' }}>
          <option value="">Seleccionar universidad</option>
          {universities.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
        </select>
      </div>
      <TextField label="Ubicación de la clínica universitaria" value={form.university_location} onChange={e => upd('university_location', e.target.value)} placeholder="Av. Universidad 1234, Santiago" />
      <TextField label="Ubicación alternativa" value={form.alternative_location} onChange={e => upd('alternative_location', e.target.value)} placeholder="Otra dirección donde atiendes" />
      <TextField label="Certificaciones / especialidades" value={form.certifications} onChange={e => upd('certifications', e.target.value)} placeholder="Ej: Radiología, Endodoncia básica" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>Biografía</label>
        <textarea value={form.bio} onChange={e => upd('bio', e.target.value)} rows={3} placeholder="Cuéntales a los pacientes sobre ti…"
          style={{ borderRadius: 12, border: '1.5px solid rgba(10,22,40,0.1)', padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical', background: 'rgba(255,255,255,0.7)', color: 'var(--ink-900)', outline: 'none' }} />
      </div>
      {status === 'ok' && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', color: '#16a34a', fontSize: 13, fontWeight: 600 }}>¡Cambios guardados correctamente!</div>}
      {status === 'err' && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--danger-100,#fee2e2)', color: 'var(--danger-600,#dc2626)', fontSize: 13 }}>{errMsg}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="md" disabled={status === 'saving'} onClick={handleSave}>{status === 'saving' ? 'Guardando…' : 'Guardar cambios'}</Button>
      </div>
    </div>
  );
}

// ── DatosSection router ────────────────────────────────────────
function DatosSection({ role, profile, onSave }: { role?: string; profile: Record<string, string>; onSave: (d: Record<string, string>) => Promise<boolean> }) {
  if (role === 'student') return <StudentDatosSection profile={profile} onSave={onSave} />;
  return <PatientDatosSection profile={profile} onSave={onSave} />;
}

// ── Seguridad ──────────────────────────────────────────────────
function SeguridadSection() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');

  const handleSave = async () => {
    if (form.next !== form.confirm) { setStatus('err'); return; }
    setStatus('saving');
    try {
      await api.post('/api/users/change-password', { currentPassword: form.current, newPassword: form.next });
      setStatus('ok');
      setForm({ current: '', next: '', confirm: '' });
    } catch { setStatus('err'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
      <TextField label="Contraseña actual" icon="lock" type="password" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" />
      <TextField label="Nueva contraseña" icon="lock" type="password" value={form.next} onChange={e => setForm(f => ({ ...f, next: e.target.value }))} placeholder="Mínimo 8 caracteres" />
      <TextField label="Confirmar nueva contraseña" icon="lock" type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
      {status === 'err' && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 13 }}>Las contraseñas no coinciden o hubo un error.</div>}
      {status === 'ok' && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--success-100)', color: 'var(--success-700)', fontSize: 13 }}>¡Contraseña actualizada correctamente!</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="md" disabled={status === 'saving'} onClick={handleSave}>{status === 'saving' ? 'Guardando…' : 'Cambiar contraseña'}</Button>
      </div>
    </div>
  );
}

// ── Salud ──────────────────────────────────────────────────────
function SaludSection({ profile, saving, onSave }: { profile: Record<string, string>; saving: boolean; onSave: (d: Record<string, string>) => void }) {
  const [form, setForm] = useState({
    allergies:   profile.allergies   ?? '',
    medications: profile.medications ?? '',
  });
  const upd = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(16,169,198,0.08)', fontSize: 13, color: 'var(--brand-700)', lineHeight: 1.5 }}>
        Esta información ayuda al estudiante a preparar tu atención con seguridad.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>Alergias conocidas</label>
        <textarea value={form.allergies} onChange={e => upd('allergies', e.target.value)} rows={3}
          placeholder="Ej: Penicilina, látex, anestesia local..."
          style={{ borderRadius: 12, border: '1.5px solid rgba(10,22,40,0.1)', padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical', background: 'rgba(255,255,255,0.7)', color: 'var(--ink-900)', outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)' }}>Medicamentos actuales</label>
        <textarea value={form.medications} onChange={e => upd('medications', e.target.value)} rows={3}
          placeholder="Ej: Ibuprofeno 400mg, Aspirina..."
          style={{ borderRadius: 12, border: '1.5px solid rgba(10,22,40,0.1)', padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical', background: 'rgba(255,255,255,0.7)', color: 'var(--ink-900)', outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="md" disabled={saving} onClick={() => onSave(form)}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
      </div>
    </div>
  );
}

// ── Notificaciones ────────────────────────────────────────────
function NotificacionesSection() {
  const router = useRouter();
  const [prefs, setPrefs] = useState({ citas: true, mensajes: true, recordatorios: true, promociones: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    try { await api.put('/api/notifications/preferences', prefs); } catch { /* ignore */ }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const items: { key: keyof typeof prefs; label: string; sub: string }[] = [
    { key: 'citas',        label: 'Citas y reservas',     sub: 'Confirmaciones, cambios y cancelaciones' },
    { key: 'mensajes',     label: 'Mensajes nuevos',       sub: 'Cuando recibes un mensaje en el chat' },
    { key: 'recordatorios',label: 'Recordatorios',         sub: 'Alertas 24h antes de una cita' },
    { key: 'promociones',  label: 'Novedades y ofertas',   sub: 'Nuevos servicios y descuentos' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>Preferencias de notificaciones</div>
        <Button size="sm" variant="glass" onClick={() => router.push('/notificaciones')}>Ver todas</Button>
      </div>

      {items.map(item => (
        <Glass key={item.key} radius={16} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>{item.label}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{item.sub}</div>
          </div>
          <button
            type="button"
            onClick={() => toggle(item.key)}
            style={{ width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', background: prefs[item.key] ? 'var(--brand-500)' : 'var(--ink-200)', transition: 'background 200ms', position: 'relative', flexShrink: 0 }}
          >
            <span style={{ position: 'absolute', top: 3, left: prefs[item.key] ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 200ms' }} />
          </button>
        </Glass>
      ))}

      {saved && <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#065f46', fontSize: 13, fontWeight: 600 }}>¡Preferencias guardadas!</div>}

      <Button size="md" onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar preferencias'}
      </Button>
    </div>
  );
}

// ── Section dispatcher ─────────────────────────────────────────
function SectionContent({ section, role, profile, saving, onSave }: { section: Section; role?: string; profile: Record<string, string>; saving: boolean; onSave: (d: Record<string, string>) => Promise<boolean> }) {
  if (section === 'datos') return <DatosSection role={role} profile={profile} onSave={onSave} />;
  if (section === 'seguridad') return <SeguridadSection />;
  if (section === 'notificaciones') return <NotificacionesSection />;
  if (section === 'salud' && role !== 'student') return <SaludSection profile={profile} saving={saving} onSave={onSave} />;
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>
      <Icon name="sparkle" size={40} color="var(--ink-200)" />
      <p style={{ marginTop: 12 }}>Próximamente disponible</p>
    </div>
  );
}

// ── Desktop shell ──────────────────────────────────────────────
function PerfilDesktop() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { profile, loading, saving, save } = useProfile(user?.role === 'student' ? 'student' : 'patient');
  const [section, setSection] = useState<Section>('datos');

  const initials = user?.name ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
  const merged = { name: user?.name ?? '', email: user?.email ?? '', ...profile } as Record<string, string>;
  const sectionMeta = MENU_ITEMS.find(m => m.id === section)!;

  const menuItems = user?.role === 'student'
    ? MENU_ITEMS.filter(m => m.id !== 'salud')
    : MENU_ITEMS;

  return (
    <DesktopShell role={user?.role === 'student' ? 'student' : 'patient'} activeId="profile" title="Mi perfil">
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Glass hi radius={20} style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <AvatarBadge initials={initials} role={user?.role} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-900)' }}>{user?.name ?? '—'}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>{user?.email ?? ''}</div>
            <div style={{ marginTop: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: user?.role === 'student' ? 'var(--accent-700)' : 'var(--brand-700)', background: user?.role === 'student' ? 'var(--accent-100)' : 'var(--brand-100)', padding: '3px 10px', borderRadius: 999 }}>
                {user?.role === 'student' ? 'Estudiante' : 'Paciente'}
              </span>
            </div>
          </Glass>

          <ProfileCompleteness profile={merged} role={user?.role === 'student' ? 'student' : 'patient'} onEdit={() => setSection('datos')} />

          <Glass radius={16} style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {menuItems.map(item => (
              <button key={item.id} onClick={() => setSection(item.id)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: section === item.id ? 'linear-gradient(135deg, rgba(16,169,198,0.12), rgba(79,70,229,0.08))' : 'transparent', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} size={16} color={section === item.id ? 'var(--brand-600)' : 'var(--ink-400)'} />
                <span style={{ fontSize: 14, fontWeight: section === item.id ? 700 : 500, color: section === item.id ? 'var(--brand-700)' : 'var(--ink-700)' }}>{item.label}</span>
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--ink-100)', margin: '4px 0' }} />
            <button onClick={() => { logout(); router.push('/welcome'); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="arrow_left" size={16} color="var(--danger-500)" />
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--danger-600)' }}>Cerrar sesión</span>
            </button>
          </Glass>
        </div>

        <Glass hi radius={20} style={{ padding: 28 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>{sectionMeta.label}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>{sectionMeta.sub}</div>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>Cargando…</div>
          ) : (
            <SectionContent section={section} role={user?.role} profile={merged} saving={saving} onSave={save} />
          )}
        </Glass>
      </div>
    </DesktopShell>
  );
}

// ── Mobile page ────────────────────────────────────────────────
export default function PerfilPage() {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { profile, loading, saving, save } = useProfile(user?.role === 'student' ? 'student' : 'patient');
  const [section, setSection] = useState<Section | null>(null);

  if (isDesktop) return <PerfilDesktop />;

  const initials = user?.name ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
  const merged = { name: user?.name ?? '', email: user?.email ?? '', ...profile } as Record<string, string>;

  const menuItems = user?.role === 'student'
    ? MENU_ITEMS.filter(m => m.id !== 'salud')
    : MENU_ITEMS;

  if (section) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', paddingBottom: 40 }}>
        <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setSection(null)} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow_left" size={20} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink-900)' }}>
            {MENU_ITEMS.find(m => m.id === section)?.label}
          </h1>
        </div>
        <div style={{ padding: '0 20px' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>Cargando…</div>
          ) : (
            <Glass radius={20} style={{ padding: 20 }}>
              <SectionContent section={section} role={user?.role} profile={merged} saving={saving} onSave={save} />
            </Glass>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', paddingBottom: 100 }}>
      <div style={{ padding: '56px 20px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 20px', color: 'var(--ink-900)' }}>Mi Perfil</h1>
        <div style={{ padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(10,22,40,0.07)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <AvatarBadge initials={initials} role={user?.role} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 2 }}>{user?.name ?? 'Usuario'}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email ?? ''}</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: user?.role === 'student' ? 'var(--accent-700)' : 'var(--brand-700)', background: user?.role === 'student' ? 'var(--accent-100)' : 'var(--brand-100)', padding: '3px 10px', borderRadius: 999 }}>
                {user?.role === 'student' ? 'Estudiante' : 'Paciente'}
              </span>
            </div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }} onClick={() => setSection('datos')}>
            <Icon name="edit" size={18} color="var(--ink-400)" />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <ProfileCompleteness profile={merged} role={user?.role === 'student' ? 'student' : 'patient'} onEdit={() => setSection('datos')} />
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {menuItems.map(item => (
          <button key={item.label} onClick={() => setSection(item.id)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'var(--brand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} size={18} color="var(--brand-600)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' }}>{item.label}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{item.sub}</div>
            </div>
            <Icon name="chevron_right" size={16} color="var(--ink-300)" />
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <Button size="lg" full variant="ghost" onClick={() => { logout(); router.push('/welcome'); }}>
          <span style={{ color: 'var(--danger-600)' }}>Cerrar sesión</span>
        </Button>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-400)', marginTop: 12 }}>Al Diente v0.1.0 · Chile</p>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 max(14px, env(safe-area-inset-bottom))', background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderTop: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 -4px 24px rgba(10,22,40,0.07)' }}>
        {[
          { icon: 'home',     label: 'Inicio',   href: '/home' },
          { icon: 'search',   label: 'Explorar', href: '/explorar' },
          { icon: 'calendar', label: 'Citas',    href: '/citas' },
          { icon: 'chat',     label: 'Chat',     href: '/chat' },
          { icon: 'user',     label: 'Perfil',   href: '/perfil', active: true },
        ].map(tab => (
          <button key={tab.label} onClick={() => router.push(tab.href)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '0 12px', color: tab.active ? 'var(--brand-600)' : 'var(--ink-400)' }}>
            <Icon name={tab.icon as Parameters<typeof Icon>[0]['name']} size={22} color={tab.active ? 'var(--brand-600)' : 'var(--ink-400)'} />
            <span style={{ fontSize: 10, fontWeight: tab.active ? 700 : 500 }}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
