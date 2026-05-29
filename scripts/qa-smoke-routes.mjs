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
  '/funnel-qa',
];

const redirects = [
  { path: '/appointments', location: '/citas' },
  { path: '/messages', location: '/chat' },
  { path: '/profile', location: '/perfil' },
  { path: '/reservations', location: '/reservas' },
  { path: '/services', location: '/servicios' },
  { path: '/professionals', location: '/profesionales' },
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

async function checkRedirect({ path, location }) {
  const url = `${baseUrl}${path}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const actual = res.headers.get('location') || '';
    const ok = res.status >= 300 && res.status < 400 && (actual === location || actual.startsWith(location));
    return { path, status: res.status, ok, location: actual, expectedLocation: location, type: 'redirect' };
  } catch {
    return { path, status: 'network-error', ok: false, location: '', expectedLocation: location, type: 'redirect' };
  }
}

async function main() {
  const results = [
    ...(await Promise.all(routes.map(checkRoute))),
    ...(await Promise.all(redirects.map(checkRedirect))),
  ];
  let hasFailures = false;

  for (const result of results) {
    const marker = result.ok ? 'PASS' : 'FAIL';
    const suffix = result.type === 'redirect' ? ` -> ${result.location}` : '';
    console.log(`${marker} ${result.path} -> ${result.status}${suffix}`);
    if (!result.ok) {
      hasFailures = true;
      if (result.expectedLocation) console.error(`Expected location prefix: ${result.expectedLocation}`);
    }
  }

  if (hasFailures) {
    console.error(`Smoke routes failed against ${baseUrl}`);
    process.exit(1);
  }

  console.log(`Smoke routes passed against ${baseUrl}`);
}

main();
