export type FunnelEventName =
  | 'funnel_visit'
  | 'funnel_signup_completed'
  | 'funnel_service_viewed'
  | 'funnel_booking_started'
  | 'funnel_payment_started'
  | 'funnel_payment_completed';

export type FunnelEventPayload = Record<string, unknown>;

function currentRoute() {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname + window.location.search;
}

export function trackFunnelEvent(name: FunnelEventName, payload: FunnelEventPayload = {}) {
  const event = {
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
  }

  console.info('[frontend-event]', event);
}
