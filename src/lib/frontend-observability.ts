type ErrorSeverity = 'info' | 'warning' | 'error';

export type FrontendErrorPayload = {
  module: string;
  action: string;
  route?: string;
  severity?: ErrorSeverity;
  message: string;
  details?: Record<string, unknown>;
};

function getUserContext() {
  if (typeof window === 'undefined') return { userId: null, role: null };
  try {
    const raw = window.localStorage.getItem('authUser');
    if (!raw) return { userId: null, role: null };
    const parsed = JSON.parse(raw) as { id?: string; role?: string };
    return {
      userId: parsed?.id ?? null,
      role: parsed?.role ?? null,
    };
  } catch {
    return { userId: null, role: null };
  }
}

function currentRoute() {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname + window.location.search;
}

export function reportFrontendError(payload: FrontendErrorPayload) {
  const user = getUserContext();
  const normalized = {
    timestamp: new Date().toISOString(),
    severity: payload.severity ?? 'error',
    module: payload.module,
    action: payload.action,
    route: payload.route ?? currentRoute(),
    userId: user.userId,
    role: user.role,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    message: payload.message,
    details: payload.details ?? {},
  };

  console.error('[frontend-error]', normalized);
}
