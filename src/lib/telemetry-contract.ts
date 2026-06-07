export type TelemetryKind = 'funnel_event' | 'frontend_error';

export type TelemetryEnvelope = {
  kind: TelemetryKind;
  timestamp: string;
  route?: string;
  data: Record<string, unknown>;
};

const REDACTED_KEYS = ['email', 'phone', 'rut', 'token', 'password', 'authorization', 'cookie'];

export function isValidTelemetryEnvelope(value: unknown): value is TelemetryEnvelope {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  const validKind = candidate.kind === 'funnel_event' || candidate.kind === 'frontend_error';
  const validTimestamp = typeof candidate.timestamp === 'string' && candidate.timestamp.trim().length > 0;
  const validRoute = candidate.route === undefined || typeof candidate.route === 'string';
  const validData = typeof candidate.data === 'object' && candidate.data !== null && !Array.isArray(candidate.data);
  return validKind && validTimestamp && validRoute && validData;
}

export function redactTelemetryValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactTelemetryValue);
  if (!value || typeof value !== 'object') return value;

  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(source)) {
    const lowered = key.toLowerCase();
    if (REDACTED_KEYS.some(blocked => lowered.includes(blocked))) {
      out[key] = '[REDACTED]';
      continue;
    }
    out[key] = redactTelemetryValue(nested);
  }
  return out;
}
