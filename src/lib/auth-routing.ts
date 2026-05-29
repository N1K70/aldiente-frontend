export type AuthRole = 'student' | 'patient' | 'admin';

const STUDENT_ROLE_ALIASES = new Set(['student', 'admin']);

export function normalizeAuthRole(role: unknown): AuthRole | undefined {
  if (typeof role !== 'string') return undefined;
  const normalized = role.trim().toLowerCase();
  if (normalized === 'student' || normalized === 'admin' || normalized === 'patient') {
    return normalized;
  }
  return undefined;
}

export function getRoleHome(role: unknown) {
  const normalized = normalizeAuthRole(role);
  return normalized && STUDENT_ROLE_ALIASES.has(normalized) ? '/dashboard' : '/home';
}
