const baseUrl = process.env.QA_BASE_URL || 'http://localhost:3000';

const routes = [
  '/',
  '/login',
  '/signup',
  '/home',
  '/explorar',
  '/reservar',
  '/citas',
  '/chat',
  '/perfil',
];

async function checkRoute(path) {
  const url = `${baseUrl}${path}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const ok = res.status >= 200 && res.status < 400;
    return { path, status: res.status, ok };
  } catch {
    return { path, status: 'network-error', ok: false };
  }
}

async function main() {
  const results = await Promise.all(routes.map(checkRoute));
  let hasFailures = false;

  for (const result of results) {
    const marker = result.ok ? 'PASS' : 'FAIL';
    console.log(`${marker} ${result.path} -> ${result.status}`);
    if (!result.ok) hasFailures = true;
  }

  if (hasFailures) {
    console.error(`Smoke routes failed against ${baseUrl}`);
    process.exit(1);
  }

  console.log(`Smoke routes passed against ${baseUrl}`);
}

main();
