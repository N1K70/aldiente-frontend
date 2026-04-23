import { api } from '@/lib/api';

type RecoveryPayload = Record<string, unknown>;

async function postWithFallback(paths: string[], payload: RecoveryPayload) {
  let lastError: unknown = null;

  for (const path of paths) {
    try {
      const response = await api.post(path, payload);
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function requestPasswordReset(email: string) {
  return postWithFallback(
    ['/api/auth/password/forgot', '/api/auth/forgot-password'],
    { email }
  );
}

export async function submitPasswordReset(payload: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return postWithFallback(
    ['/api/auth/password/reset', '/api/auth/reset-password'],
    payload
  );
}
