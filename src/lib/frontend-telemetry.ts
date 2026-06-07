import { redactTelemetryValue, type TelemetryEnvelope, type TelemetryKind } from '@/lib/telemetry-contract';

function getEndpoint() {
  const configured = process.env.NEXT_PUBLIC_FRONTEND_EVENTS_ENDPOINT?.trim();
  return configured || '/api/telemetry';
}

export async function sendTelemetry(kind: TelemetryKind, payload: Omit<TelemetryEnvelope, 'kind'>) {
  if (typeof window === 'undefined') return;
  const endpoint = getEndpoint();
  if (!endpoint) return;

  const envelope: TelemetryEnvelope = {
    kind,
    timestamp: payload.timestamp,
    route: payload.route,
    data: redactTelemetryValue(payload.data) as Record<string, unknown>,
  };

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
      keepalive: true,
    });
  } catch {
    // Silent by design: telemetry must never block UX.
  }
}
