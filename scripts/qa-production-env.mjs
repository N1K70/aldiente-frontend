import process from 'node:process';
import { readFileSync } from 'node:fs';

const required = [
  'NEXT_PUBLIC_BACKEND_URL',
  'NEXT_PUBLIC_CHAT_URL',
];
const optionalWithContract = ['NEXT_PUBLIC_FRONTEND_EVENTS_ENDPOINT'];
const allowedRelativeEndpoints = ['/api/'];

function parseArgs(argv) {
  const args = { envFile: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--env-file') {
      args.envFile = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (arg.startsWith('--env-file=')) {
      args.envFile = arg.slice('--env-file='.length);
      continue;
    }
    if (!arg.startsWith('--') && !args.envFile) {
      args.envFile = arg;
    }
  }

  return args;
}

function parseEnvFile(path) {
  const values = {};
  const text = readFileSync(path, 'utf8');

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

function getEnvValue(env, key) {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
}

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

function isAllowedRelativeEndpoint(value) {
  return allowedRelativeEndpoints.some((prefix) => value.startsWith(prefix));
}

function redactValue(value) {
  if (!value) return '(missing)';
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}${url.pathname === '/' ? '' : url.pathname}`;
  } catch {
    if (value.startsWith('/')) return value;
    return '(configured)';
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = {
    ...process.env,
    ...(args.envFile ? parseEnvFile(args.envFile) : {}),
  };
  const failures = [];
  const checked = [];

  for (const key of required) {
    const value = getEnvValue(env, key);
    if (!value) {
      failures.push(`${key} is missing`);
      continue;
    }
    if (!isValidProductionUrl(value)) {
      failures.push(`${key} must be a valid https URL and not localhost (got: ${value})`);
      continue;
    }
    checked.push(`${key}=${redactValue(value)}`);
  }

  for (const key of optionalWithContract) {
    const value = getEnvValue(env, key);
    if (!value) continue;
    const isRelativePath = isAllowedRelativeEndpoint(value);
    const isValidAbsolute = isValidProductionUrl(value);
    if (!isRelativePath && !isValidAbsolute) {
      failures.push(`${key} must be either /api/... or a valid https URL (got: ${value})`);
      continue;
    }
    checked.push(`${key}=${redactValue(value)}`);
  }

  if (failures.length > 0) {
    console.error('Production env check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('Production env check passed.');
  if (args.envFile) console.log(`Source: ${args.envFile}`);
  for (const item of checked) console.log(`- ${item}`);
}

main();
