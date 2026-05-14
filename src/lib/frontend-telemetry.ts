type TelemetryKind = 'funnel_event' | 'frontend_error';

type TelemetryEnvelope = {
  kind: TelemetryKind;
  timestamp: string;
  route?: string;
  data: Record<string, unknown>;
};

const REDACTED_KEYS = ['email', 'phone', 'rut', 'token', 'password', 'authorization', 'cookie'];

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (!value || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(source)) {
    const lowered = key.toLowerCase();
    if (REDACTED_KEYS.some(blocked => lowered.includes(blocked))) {
      out[key] = '[REDACTED]';
      continue;
    }
    out[key] = redactValue(nested);
  }
  return out;
}

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
    data: redactValue(payload.data) as Record<string, unknown>,
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
