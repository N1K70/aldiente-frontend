'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Glass, Icon, Button } from '@/components/ui';
import { api } from '@/lib/api';

interface PaymentDetails {
  buyOrder?: string;
  amount?: number;
  authorizationCode?: string;
  cardNumber?: string;
  responseCode?: string;
}

type Status = 'loading' | 'success' | 'error' | 'cancelled';

function WebpayReturnContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Procesando pago…');
  const [details, setDetails] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    const process = async () => {
      const token_ws     = params.get('token_ws');
      const TBK_TOKEN    = params.get('TBK_TOKEN');
      const TBK_ORDEN    = params.get('TBK_ORDEN_COMPRA');
      const TBK_SESION   = params.get('TBK_ID_SESION');

      try {
        if (TBK_TOKEN && TBK_ORDEN) {
          await api.post('/api/webpay/cancel', { TBK_TOKEN, TBK_ID_SESION: TBK_SESION ?? '', TBK_ORDEN_COMPRA: TBK_ORDEN }).catch(() => {});
          setStatus('cancelled');
          setMessage('Has cancelado el pago');
          return;
        }
        if (!token_ws) {
          setStatus('error');
          setMessage('No se recibió información del pago');
          return;
        }
        const res = await api.post('/api/webpay/commit', { token_ws });
        const result = res.data;
        if (result.status === 'approved') {
          setStatus('success');
          setMessage('¡Pago aprobado exitosamente!');
          setDetails(result);
        } else {
          setStatus('error');
          setMessage('El pago fue rechazado');
          setDetails(result);
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.response?.data?.message ?? 'Error al procesar el pago');
      }
    };
    process();
  }, [params]);

  const iconName = status === 'success' ? 'check' : status === 'cancelled' ? 'alert' : 'close';
  const iconBg   = status === 'success' ? 'var(--success-100)' : status === 'cancelled' ? 'rgba(245,158,11,0.12)' : 'var(--danger-100)';
  const iconColor= status === 'success' ? 'var(--success-600,#16a34a)' : status === 'cancelled' ? 'var(--warning-600,#d97706)' : 'var(--danger-600,#dc2626)';
  const titleColor = iconColor;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)', gap: 20 }}>
      {status === 'loading' ? (
        <>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(10,22,40,0.1)', borderTopColor: 'var(--brand-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 16, color: 'var(--ink-600)' }}>{message}</div>
        </>
      ) : (
        <Glass hi radius={24} style={{ padding: 32, maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 999, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Icon name={iconName as any} size={38} color={iconColor} />
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: titleColor, marginBottom: 8 }}>{message}</div>

          {status === 'success' && details && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0', textAlign: 'left' }}>
              {details.buyOrder && <Row label="Orden" value={details.buyOrder} />}
              {details.amount != null && <Row label="Monto" value={`$${details.amount.toLocaleString('es-CL')} CLP`} />}
              {details.authorizationCode && <Row label="Autorización" value={details.authorizationCode} />}
              {details.cardNumber && <Row label="Tarjeta" value={`**** **** **** ${details.cardNumber}`} />}
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(16,169,198,0.08)', fontSize: 13, color: 'var(--brand-700)', marginTop: 4 }}>
                Tu reserva ha sido confirmada. Puedes verla en Mis Reservas.
              </div>
            </div>
          )}

          {status === 'error' && details && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0', textAlign: 'left' }}>
              {details.buyOrder && <Row label="Orden" value={details.buyOrder} />}
              {details.responseCode && <Row label="Código" value={details.responseCode} />}
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--danger-100)', fontSize: 13, color: 'var(--danger-600)', marginTop: 4 }}>
                El pago no pudo ser procesado. Intenta de nuevo o usa otro método de pago.
              </div>
            </div>
          )}

          {status === 'cancelled' && (
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.1)', fontSize: 13, color: 'var(--warning-700,#b45309)', margin: '16px 0' }}>
              Has cancelado el proceso de pago. Tu reserva no fue confirmada.
            </div>
          )}

          <Button size="lg" full onClick={() => router.push(status === 'success' ? '/reservas' : '/home')}>
            {status === 'success' ? 'Ver mis reservas' : 'Volver al inicio'}
          </Button>
        </Glass>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid rgba(10,22,40,0.06)' }}>
      <span style={{ color: 'var(--ink-500)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{value}</span>
    </div>
  );
}

export default function WebpayReturnPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(10,22,40,0.1)', borderTopColor: 'var(--brand-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <WebpayReturnContent />
    </Suspense>
  );
}
