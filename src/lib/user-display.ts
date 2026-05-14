const MOCK_NAMES = ['maria rodriguez', 'usuario demo', 'test user'] as const;

function normalizeNameForCompare(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function levenshteinDistance(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

export function isLikelyMockName(name?: string | null) {
  const raw = (name ?? '').trim();
  if (!raw) return false;

  const normalized = normalizeNameForCompare(raw);
  if (!normalized) return false;

  if (MOCK_NAMES.includes(normalized as (typeof MOCK_NAMES)[number])) return true;

  if (normalized.includes('usuario demo') || normalized.includes('test user')) return true;

  // Tolerates mojibake variants like "MarÃ­a RodrÃ­guez" => "maraa rodraguez"
  const mariaDistance = levenshteinDistance(normalized, 'maria rodriguez');
  return mariaDistance <= 3;
}

export function resolveDisplayName(name?: string | null, email?: string | null, fallback = 'Usuario') {
  const trimmedName = (name ?? '').trim();
  if (trimmedName && !isLikelyMockName(trimmedName)) return trimmedName;
  if (email && email.includes('@')) return email.split('@')[0];
  return fallback;
}

export function getInitials(name: string, fallback = 'U') {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return initials || fallback;
}

export function getFirstName(name: string, fallback = 'Usuario') {
  return name.split(' ')[0] || fallback;
}

