'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Glass, Icon, Button } from '@/components/ui';
import { api } from '@/lib/api';

const ONBOARDING_KEY = 'aldiente_patient_onboarding_completed';
const SELECTED_UNIVERSITY_KEY = 'aldiente_selected_university';

export interface University {
  id: string; name: string; short_name?: string;
  address?: string; city: string;
  latitude: number; longitude: number; distance?: number;
}

// ── Hook ──────────────────────────────────────────────────────
export function usePatientOnboarding() {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    const saved = localStorage.getItem(SELECTED_UNIVERSITY_KEY);
    if (!done) { setNeedsOnboarding(true); return; }
    if (saved) { try { setSelectedUniversity(JSON.parse(saved)); } catch {} }
  }, []);

  const completeOnboarding = useCallback((uni: University) => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(SELECTED_UNIVERSITY_KEY, JSON.stringify(uni));
    setSelectedUniversity(uni);
    setNeedsOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(SELECTED_UNIVERSITY_KEY);
    setSelectedUniversity(null);
    setNeedsOnboarding(true);
  }, []);

  const updateUniversity = useCallback((uni: University) => {
    localStorage.setItem(SELECTED_UNIVERSITY_KEY, JSON.stringify(uni));
    setSelectedUniversity(uni);
  }, []);

  return { needsOnboarding, selectedUniversity, completeOnboarding, resetOnboarding, updateUniversity };
}

// ── Component ─────────────────────────────────────────────────
interface Props {
  onComplete: (uni: University) => void;
}

export default function PatientOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selected, setSelected] = useState<University | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadUniversities = useCallback(async (lat?: number, lng?: number) => {
    setLoading(true);
    try {
      const params = lat != null && lng != null ? { lat, lng, limit: 10 } : undefined;
      const url = lat != null ? '/api/universities/nearby' : '/api/universities';
      const res = await api.get<University[]>(url, { params });
      setUniversities(Array.isArray(res.data) ? res.data : []);
    } catch {
      try {
        const res = await api.get<University[]>('/api/universities');
        setUniversities(Array.isArray(res.data) ? res.data : []);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 2) loadUniversities(coords?.lat, coords?.lng);
  }, [step, coords, loadUniversities]);

  const requestLocation = () => {
    setGeoLoading(true); setGeoError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setHasLocation(true); setGeoLoading(false);
        setStep(2);
      },
      () => {
        setGeoError('No pudimos obtener tu ubicación. Puedes continuar sin ella.');
        setGeoLoading(false);
      }
    );
  };

  const fmtDist = (d?: number) => {
    if (d == null) return null;
    return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
  };

  // ── Step 0: Welcome ───────────────────────────────────────────
  if (step === 0) return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-aurora)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, fontFamily: 'var(--font-body)' }}>
      {/* Progress */}
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', gap: 6, padding: '0 32px' }}>
        {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 5, borderRadius: 99, background: i === 0 ? 'var(--brand-500)' : 'rgba(10,22,40,0.1)' }} />)}
      </div>

      <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #1BB9D6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: '0 16px 48px rgba(27,185,214,0.35)' }}>
        <Icon name="sparkle" size={44} color="#fff" />
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.035em', textAlign: 'center', margin: '0 0 10px', color: 'var(--ink-900)' }}>¡Bienvenido a<br />ALDIENTE!</h1>
      <p style={{ fontSize: 15, color: 'var(--ink-600)', textAlign: 'center', margin: '0 0 36px', maxWidth: 320, lineHeight: 1.6 }}>Tu plataforma para encontrar servicios odontológicos de calidad.</p>

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
        {[
          { icon: 'shield', label: 'Estudiantes verificados', desc: 'Profesionales con supervisión docente certificada', bg: '#D1FAE5', color: '#059669' },
          { icon: 'star',   label: 'Precios accesibles',      desc: 'Tratamientos de calidad a precios justos',         bg: '#FEF3C7', color: '#D97706' },
        ].map(f => (
          <Glass key={f.label} radius={16} style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={f.icon} size={22} color={f.color} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{f.label}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{f.desc}</div>
            </div>
          </Glass>
        ))}
      </div>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <Button size="lg" full trailingIcon="arrow_right" onClick={() => setStep(1)}>Comenzar</Button>
      </div>
    </div>
  );

  // ── Step 1: Location ──────────────────────────────────────────
  if (step === 1) return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-aurora)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, fontFamily: 'var(--font-body)' }}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', gap: 6, padding: '0 32px' }}>
        {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 5, borderRadius: 99, background: i <= 1 ? 'var(--brand-500)' : 'rgba(10,22,40,0.1)' }} />)}
      </div>

      <div style={{ width: 96, height: 96, borderRadius: '50%', background: hasLocation ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: `0 16px 48px ${hasLocation ? 'rgba(34,197,94,0.35)' : 'rgba(59,130,246,0.35)'}` }}>
        {geoLoading
          ? <div style={{ width: 36, height: 36, border: '4px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          : <Icon name={hasLocation ? 'check' : 'search'} size={44} color="#fff" stroke={hasLocation ? 2.5 : 1.8} />
        }
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', textAlign: 'center', margin: '0 0 10px', color: 'var(--ink-900)' }}>Encuentra tu universidad</h1>
      <p style={{ fontSize: 15, color: 'var(--ink-600)', textAlign: 'center', margin: '0 0 32px', maxWidth: 320, lineHeight: 1.6 }}>
        {hasLocation ? '¡Ubicación obtenida! Te mostraremos las opciones más cercanas.' : 'Permite el acceso a tu ubicación para ver las universidades más cercanas.'}
      </p>

      {geoError && <div style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--danger-100)', color: 'var(--danger-600)', fontSize: 13, marginBottom: 20, maxWidth: 360, textAlign: 'center' }}>{geoError}</div>}

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!hasLocation && (
          <Button size="lg" full disabled={geoLoading} onClick={requestLocation}>
            {geoLoading ? 'Obteniendo ubicación…' : 'Permitir ubicación'}
          </Button>
        )}
        {hasLocation && <Button size="lg" full trailingIcon="arrow_right" onClick={() => setStep(2)}>Continuar</Button>}
        <Button size="lg" full variant="ghost" onClick={() => setStep(2)}>
          {hasLocation ? 'Continuar sin ubicación' : 'Continuar sin ubicación'}
        </Button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Step 2: Select university ─────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-aurora)', zIndex: 300, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)' }}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', gap: 6, padding: '0 32px' }}>
        {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 5, borderRadius: 99, background: 'var(--brand-500)' }} />)}
      </div>

      <div style={{ padding: '88px 24px 16px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px', color: 'var(--ink-900)' }}>Selecciona tu universidad</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-600)', margin: 0 }}>{hasLocation ? 'Ordenadas por cercanía a tu ubicación' : 'Elige dónde deseas atenderte'}</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-400)', fontSize: 14 }}>Cargando universidades…</div>
        ) : universities.length === 0 ? (
          <Glass radius={16} style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-500)', margin: 0 }}>No hay universidades disponibles.</p>
          </Glass>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {universities.map(u => {
              const sel = selected?.id === u.id;
              return (
                <button key={u.id} onClick={() => setSelected(u)}
                  style={{ padding: '14px 16px', borderRadius: 18, background: sel ? 'linear-gradient(135deg, rgba(16,169,198,0.12), rgba(79,70,229,0.08))' : 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', border: `2px solid ${sel ? 'var(--brand-500)' : 'rgba(255,255,255,0.9)'}`, boxShadow: sel ? '0 0 0 4px rgba(16,169,198,0.15)' : '0 2px 6px rgba(10,22,40,0.05)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)', transition: 'all 140ms' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: sel ? 'var(--brand-500)' : 'rgba(10,22,40,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="graduation" size={22} color={sel ? '#fff' : 'var(--ink-500)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{u.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>
                      {u.city}
                      {fmtDist(u.distance) && <span style={{ color: 'var(--brand-600)', fontWeight: 600, marginLeft: 6 }}>· {fmtDist(u.distance)}</span>}
                    </div>
                  </div>
                  {sel && <Icon name="check" size={20} color="var(--brand-600)" stroke={2.5} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 24px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom,0))' }}>
        <Button size="lg" full disabled={!selected} onClick={() => selected && onComplete(selected)}>
          Comenzar a explorar →
        </Button>
      </div>
    </div>
  );
}
