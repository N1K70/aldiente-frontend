'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Glass, Icon, TextField } from '@/components/ui';
import BottomNav from '@/components/BottomNav';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import PatientOnboarding, { usePatientOnboarding } from '@/components/PatientOnboarding';
import { fetchUniversityServices, normalizeText, PublicServiceItem } from '@/lib/public-services';

const CATEGORY_FILTERS = [
  { id: 'blanqueamiento', label: 'Blanqueamiento', icon: 'sun', tint: '#F59E0B' },
  { id: 'limpieza', label: 'Limpieza', icon: 'sparkle', tint: '#10A9C6' },
  { id: 'ortodoncia', label: 'Ortodoncia', icon: 'shield', tint: '#6366F1' },
  { id: 'estetica', label: 'Estetica', icon: 'heart', tint: '#EC4899' },
] as const;

function formatPrice(value?: number) {
  if (value == null) return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
}

function ServiceCard({
  service,
  onOpen,
}: {
  service: PublicServiceItem;
  onOpen: () => void;
}) {
  return (
    <Glass radius={20} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 4 }}>{service.name}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {service.category || 'Servicio'}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
          {formatPrice(service.price)}
        </div>
      </div>

      {service.description && (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-600)', lineHeight: 1.5 }}>{service.description}</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {service.duration != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 999, background: 'rgba(16,169,198,0.08)', color: 'var(--brand-700)', fontSize: 12, fontWeight: 600 }}>
            <Icon name="clock" size={12} color="var(--brand-700)" />
            {service.duration} min
          </span>
        )}
        {service.studentName && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-700)', fontSize: 12, fontWeight: 600 }}>
            <Icon name="graduation" size={12} color="var(--accent-700)" />
            {service.studentName}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button size="md" full onClick={onOpen}>Ver detalles</Button>
        <Button size="md" variant="glass" full onClick={onOpen}>Reservar</Button>
      </div>
    </Glass>
  );
}

function ExploreContent({
  services,
  loading,
  search,
  setSearch,
  activeCategory,
  setActiveCategory,
  universityName,
  onChangeUniversity,
}: {
  services: PublicServiceItem[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  activeCategory: string;
  setActiveCategory: (value: string) => void;
  universityName: string;
  onChangeUniversity: () => void;
}) {
  const router = useRouter();

  const filtered = useMemo(() => {
    return services.filter(service => {
      const haystack = normalizeText(`${service.name} ${service.category} ${service.description ?? ''} ${service.studentName ?? ''}`);
      const searchMatch = !search || haystack.includes(normalizeText(search));
      const categoryMatch = !activeCategory || normalizeText(service.category).includes(activeCategory);
      return searchMatch && categoryMatch;
    });
  }, [activeCategory, search, services]);

  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em' }}>Servicios</div>
          <div style={{ fontSize: 14, color: 'var(--ink-600)', marginTop: 4 }}>
            {loading ? 'Cargando servicios...' : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} en ${universityName}`}
          </div>
        </div>
        <Button size="md" variant="glass" onClick={onChangeUniversity}>Cambiar universidad</Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <TextField label="" icon="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, categoria o estudiante..." />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORY_FILTERS.map(filter => {
          const active = activeCategory === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveCategory(active ? '' : filter.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: `1px solid ${active ? filter.tint : 'rgba(10,22,40,0.08)'}`,
                background: active ? `${filter.tint}1A` : 'rgba(255,255,255,0.75)',
                color: active ? filter.tint : 'var(--ink-700)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon name={filter.icon} size={14} color={active ? filter.tint : 'var(--ink-500)'} />
              {filter.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Glass radius={20} style={{ padding: 48, textAlign: 'center', color: 'var(--ink-500)', fontSize: 14 }}>
          Cargando catalogo...
        </Glass>
      ) : filtered.length === 0 ? (
        <Glass radius={20} style={{ padding: 48, textAlign: 'center' }}>
          <Icon name="search" size={36} color="var(--ink-300)" />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', marginTop: 14 }}>No encontramos servicios</div>
          <div style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 6 }}>Prueba con otra categoria o cambia la universidad seleccionada.</div>
        </Glass>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(service => (
            <ServiceCard key={`${service.id}-${service.studentId ?? ''}`} service={service} onOpen={() => router.push(`/servicio/${service.id}`)} />
          ))}
        </div>
      )}
    </>
  );

  return content;
}

export default function ExplorarPage() {
  const isDesktop = useIsDesktop();
  const { needsOnboarding, selectedUniversity, completeOnboarding, updateUniversity } = usePatientOnboarding();
  const [showUniversityFlow, setShowUniversityFlow] = useState(false);
  const [services, setServices] = useState<PublicServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const showOnboarding = needsOnboarding || showUniversityFlow || !selectedUniversity;

  useEffect(() => {
    if (!selectedUniversity?.id) return;
    setLoading(true);
    fetchUniversityServices(selectedUniversity.id)
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [selectedUniversity?.id]);

  const handleUniversitySelect = (university: Parameters<typeof completeOnboarding>[0]) => {
    if (needsOnboarding || !selectedUniversity) {
      completeOnboarding(university);
    } else {
      updateUniversity(university);
    }
    setShowUniversityFlow(false);
  };

  if (showOnboarding) {
    return <PatientOnboarding onComplete={handleUniversitySelect} />;
  }

  const content = (
    <ExploreContent
      services={services}
      loading={loading}
      search={search}
      setSearch={setSearch}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      universityName={selectedUniversity?.short_name || selectedUniversity?.name || 'tu universidad'}
      onChangeUniversity={() => setShowUniversityFlow(true)}
    />
  );

  if (isDesktop) {
    return (
      <DesktopShell role="patient" activeId="search" title="Explorar servicios" subtitle={selectedUniversity?.name ? `Catalogo disponible en ${selectedUniversity.name}` : undefined}>
        {content}
      </DesktopShell>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', padding: '56px 20px 110px' }}>
      {content}
      <BottomNav />
    </div>
  );
}
