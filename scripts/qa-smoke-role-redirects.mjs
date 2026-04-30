const baseUrl = process.env.QA_BASE_URL || 'http://localhost:3000';

function cookieForRole(role) {
  return `authToken=dummy-token; authRole=${role}`;
}

async function check({ name, path, role, expectLocationPrefix }) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    redirect: 'manual',
    headers: role ? { Cookie: cookieForRole(role) } : undefined,
  });

  const location = res.headers.get('location') || '';
  const ok = res.status >= 300 && res.status < 400 && (location === expectLocationPrefix || location.startsWith(expectLocationPrefix));
  return { name, status: res.status, location, ok, expectLocationPrefix };
}

async function main() {
  const checks = [
    {
      name: 'student from /login -> /dashboard',
      path: '/login',
      role: 'student',
      expectLocationPrefix: '/dashboard',
    },
    {
      name: 'patient from /login -> /home',
      path: '/login',
      role: 'patient',
      expectLocationPrefix: '/home',
    },
    {
      name: 'patient from /dashboard -> /home',
      path: '/dashboard',
      role: 'patient',
      expectLocationPrefix: '/home',
    },
    {
      name: 'student from /home -> /dashboard',
      path: '/home',
      role: 'student',
      expectLocationPrefix: '/dashboard',
    },
  ];

  const results = await Promise.all(checks.map(check));
  let hasFailures = false;

  for (const result of results) {
    const marker = result.ok ? 'PASS' : 'FAIL';
    console.log(`${marker} ${result.name} (${result.status}) -> ${result.location}`);
    if (!result.ok) {
      hasFailures = true;
      console.error(`Expected location prefix: ${result.expectLocationPrefix}`);
    }
  }

  if (hasFailures) {
    process.exit(1);
  }

  console.log(`Role redirect smoke passed against ${baseUrl}`);
}

main().catch((err) => {
  console.error('Role redirect smoke crashed:', err);
  process.exit(1);
});
