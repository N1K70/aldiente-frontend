export type TelemetryEnvelope = {
  kind: 'funnel_event' | 'frontend_error';
  timestamp: string;
  route?: string;
  data: Record<string, unknown>;
};

const STORE_LIMIT = 200;

function getGlobalStore() {
  const g = globalThis as typeof globalThis & { __telemetryStore?: TelemetryEnvelope[] };
  if (!g.__telemetryStore) g.__telemetryStore = [];
  return g.__telemetryStore;
}

export function pushTelemetry(envelope: TelemetryEnvelope) {
  const store = getGlobalStore();
  store.push(envelope);
  if (store.length > STORE_LIMIT) {
    store.splice(0, store.length - STORE_LIMIT);
  }
}

export function readTelemetry() {
  return [...getGlobalStore()].reverse();
}
