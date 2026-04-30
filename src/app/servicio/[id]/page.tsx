'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Glass, Icon } from '@/components/ui';
import { DesktopShell, useIsDesktop } from '@/components/desktop-shell';
import BottomNav from '@/components/BottomNav';
import { fetchProvidersForServiceName, fetchServiceById, ProviderItem, PublicServiceItem } from '@/lib/public-services';
import { trackFunnelEvent } from '@/lib/frontend-analytics';

function formatPrice(value?: number) {
  if (value == null) return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
}

function ProviderCard({
  provider,
  service,
}: {
  provider: ProviderItem;
  service: PublicServiceItem;
}) {
  const router = useRouter();

  return (
    <Glass radius={20} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #C7D2FE, #818CF8)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {provider.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>{provider.name}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 2 }}>{provider.university || service.studentUniversity || 'ALDIENTE'}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            {provider.duration != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-600)' }}>
                <Icon name="clock" size={12} color="var(--ink-400)" />
                {provider.duration} min
              </span>
            )}
            {provider.rating != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-600)' }}>
                <Icon name="star" size={12} color="#F59E0B" />
                {provider.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>
          {formatPrice(provider.price)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button size="md" full onClick={() => router.push(`/reservar?studentId=${provider.id}&serviceId=${provider.serviceId}`)}>
          Reservar
        </Button>
        <Button size="md" variant="glass" full onClick={() => router.push(`/estudiante?id=${provider.id}`)}>
          Ver perfil
        </Button>
      </div>
    </Glass>
  );
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isDesktop = useIsDesktop();
  const [service, setService] = useState<PublicServiceItem | null>(null);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const serviceId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (!serviceId) return;

    let active = true;
    setLoading(true);

    fetchServiceById(serviceId)
      .then(async result => {
        if (!active) return;
        setService(result);
        if (result?.name) {
          const rows = await fetchProvidersForServiceName(result.name);
          if (!active) return;
          setProviders(rows);
        } else {
          setProviders([]);
        }
      })
      .catch(() => {
        if (!active) return;
        setService(null);
        setProviders([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [serviceId]);

  useEffect(() => {
    if (!service) return;
    trackFunnelEvent('funnel_service_viewed', {
      serviceId: service.id,
      serviceName: service.name,
      category: service.category ?? null,
    });
  }, [service]);

  const content = loading ? (
    <Glass radius={20} style={{ padding: 48, textAlign: 'center', color: 'var(--ink-500)', fontSize: 14 }}>
      Cargando servicio...
    </Glass>
  ) : !service ? (
    <Glass radius={20} style={{ padding: 48, textAlign: 'center' }}>
      <Icon name="search" size={36} color="var(--ink-300)" />
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', marginTop: 14 }}>Servicio no encontrado</div>
      <div style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 6 }}>No pudimos cargar el detalle solicitado.</div>
    </Glass>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Glass hi radius={22} style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.03em' }}>{service.name}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
              {service.category || 'Servicio'}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            {formatPrice(service.price)}
          </div>
        </div>

        {service.description && (
          <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-600)', lineHeight: 1.6 }}>{service.description}</p>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          {service.duration != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 999, background: 'rgba(16,169,198,0.08)', color: 'var(--brand-700)', fontSize: 12, fontWeight: 600 }}>
              <Icon name="clock" size={12} color="var(--brand-700)" />
              {service.duration} min
            </span>
          )}
          {service.studentUniversity && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', color: 'var(--accent-700)', fontSize: 12, fontWeight: 600 }}>
              <Icon name="graduation" size={12} color="var(--accent-700)" />
              {service.studentUniversity}
            </span>
          )}
        </div>
      </Glass>

      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Profesionales disponibles ({providers.length})
        </div>
        {providers.length === 0 ? (
          <Glass radius={20} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-500)' }}>
            No encontramos estudiantes disponibles para este servicio en este momento.
          </Glass>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {providers.map(provider => (
              <ProviderCard key={provider.id} provider={provider} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <DesktopShell role="patient" activeId="search" title={service?.name || 'Detalle de servicio'} subtitle={service?.category || undefined}>
        {content}
      </DesktopShell>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', padding: '56px 20px 110px' }}>
      <button onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, marginBottom: 20, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="arrow_left" size={20} />
      </button>
      {content}
      <BottomNav />
    </div>
  );
}
