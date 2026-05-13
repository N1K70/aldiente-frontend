export type FunnelEventName =
  | 'funnel_visit'
  | 'funnel_signup_completed'
  | 'funnel_service_viewed'
  | 'funnel_booking_started'
  | 'funnel_payment_started'
  | 'funnel_payment_completed';

export type FunnelEventPayload = Record<string, unknown>;
export type FunnelEvent = {
  name: FunnelEventName;
  timestamp: string;
  route?: string;
  payload: FunnelEventPayload;
};

const FUNNEL_STORAGE_KEY = 'funnelEvents';
const FUNNEL_STORAGE_LIMIT = 200;

function currentRoute() {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname + window.location.search;
}

export function trackFunnelEvent(name: FunnelEventName, payload: FunnelEventPayload = {}) {
  const event: FunnelEvent = {
    name,
    timestamp: new Date().toISOString(),
    route: currentRoute(),
    payload,
  };

  if (typeof window !== 'undefined') {
    const w = window as Window & { dataLayer?: Array<Record<string, unknown>> };
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: name, ...event });
    }

    try {
      const raw = window.localStorage.getItem(FUNNEL_STORAGE_KEY);
      const previous = raw ? (JSON.parse(raw) as FunnelEvent[]) : [];
      const next = [...previous, event].slice(-FUNNEL_STORAGE_LIMIT);
      window.localStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors in private mode or restricted environments.
    }
  }

  console.info('[frontend-event]', event);
}

export function getStoredFunnelEvents(): FunnelEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FUNNEL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FunnelEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearStoredFunnelEvents() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(FUNNEL_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}
