type ErrorSeverity = 'info' | 'warning' | 'error';

export type FrontendErrorPayload = {
  module: string;
  action: string;
  route?: string;
  severity?: ErrorSeverity;
  message: string;
  details?: Record<string, unknown>;
};

function currentRoute() {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname + window.location.search;
}

export function reportFrontendError(payload: FrontendErrorPayload) {
  const normalized = {
    timestamp: new Date().toISOString(),
    severity: payload.severity ?? 'error',
    module: payload.module,
    action: payload.action,
    route: payload.route ?? currentRoute(),
    message: payload.message,
    details: payload.details ?? {},
  };

  console.error('[frontend-error]', normalized);
}
