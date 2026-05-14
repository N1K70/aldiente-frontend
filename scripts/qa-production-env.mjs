import process from 'node:process';

const required = [
  'NEXT_PUBLIC_BACKEND_URL',
  'NEXT_PUBLIC_CHAT_URL',
];
const optionalWithContract = ['NEXT_PUBLIC_FRONTEND_EVENTS_ENDPOINT'];

function isValidProductionUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (/localhost|127\.0\.0\.1/i.test(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

function main() {
  const failures = [];

  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      failures.push(`${key} is missing`);
      continue;
    }
    if (!isValidProductionUrl(value)) {
      failures.push(`${key} must be a valid https URL and not localhost (got: ${value})`);
    }
  }

  for (const key of optionalWithContract) {
    const value = process.env[key];
    if (!value) continue;
    const trimmed = value.trim();
    const isRelativePath = trimmed.startsWith('/api/');
    const isValidAbsolute = isValidProductionUrl(trimmed);
    if (!isRelativePath && !isValidAbsolute) {
      failures.push(`${key} must be either /api/... or a valid https URL (got: ${value})`);
    }
  }

  if (failures.length > 0) {
    console.error('Production env check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('Production env check passed.');
}

main();
