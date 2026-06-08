import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const outputDir = process.env.QA_NAV_OUTPUT_DIR || path.join('tmp', 'navigation-qa');

const checks = [
  {
    name: 'welcome create account',
    path: '/welcome',
    viewport: { width: 390, height: 844 },
    href: '/signup',
    expectedPath: '/signup',
  },
  {
    name: 'welcome existing account',
    path: '/welcome',
    viewport: { width: 390, height: 844 },
    href: '/login',
    expectedPath: '/login',
  },
  {
    name: 'landing mobile signup cta',
    path: '/landing',
    viewport: { width: 390, height: 844 },
    href: '/signup',
    expectedPath: '/signup',
  },
  {
    name: 'landing desktop signup cta',
    path: '/landing',
    viewport: { width: 1440, height: 1000 },
    href: '/signup',
    expectedPath: '/signup',
  },
  {
    name: 'patient bottom nav explorar',
    path: '/home',
    role: 'patient',
    viewport: { width: 390, height: 844 },
    href: '/explorar',
    expectedPath: '/explorar',
  },
  {
    name: 'patient bottom nav citas',
    path: '/home',
    role: 'patient',
    viewport: { width: 390, height: 844 },
    href: '/citas',
    expectedPath: '/citas',
  },
  {
    name: 'patient bottom nav chat',
    path: '/home',
    role: 'patient',
    viewport: { width: 390, height: 844 },
    href: '/chat',
    expectedPath: '/chat',
  },
  {
    name: 'patient bottom nav perfil',
    path: '/home',
    role: 'patient',
    viewport: { width: 390, height: 844 },
    href: '/perfil',
    expectedPath: '/perfil',
  },
  {
    name: 'patient sidebar search',
    path: '/home',
    role: 'patient',
    viewport: { width: 1440, height: 1000 },
    href: '/explorar',
    expectedPath: '/explorar',
  },
  {
    name: 'patient sidebar appointments',
    path: '/home',
    role: 'patient',
    viewport: { width: 1440, height: 1000 },
    href: '/citas',
    expectedPath: '/citas',
  },
  {
    name: 'patient sidebar documents',
    path: '/home',
    role: 'patient',
    viewport: { width: 1440, height: 1000 },
    href: '/documentos',
    expectedPath: '/documentos',
  },
  {
    name: 'student sidebar agenda',
    path: '/dashboard',
    role: 'student',
    viewport: { width: 1440, height: 1000 },
    href: '/agenda',
    expectedPath: '/agenda',
  },
  {
    name: 'student sidebar services',
    path: '/dashboard',
    role: 'student',
    viewport: { width: 1440, height: 1000 },
    href: '/servicios',
    expectedPath: '/servicios',
  },
  {
    name: 'student sidebar messages',
    path: '/dashboard',
    role: 'student',
    viewport: { width: 1440, height: 1000 },
    href: '/chat',
    expectedPath: '/chat',
  },
  {
    name: 'student sidebar profile',
    path: '/dashboard',
    role: 'student',
    viewport: { width: 1440, height: 1000 },
    href: '/perfil',
    expectedPath: '/perfil',
  },
];

function userForRole(role) {
  return {
    id: `qa-${role}`,
    email: `qa-${role}@aldiente.local`,
    role,
    name: role === 'student' ? 'QA Estudiante' : 'QA Paciente',
  };
}

async function seedAuth(context, role) {
  if (!role) return;
  const user = userForRole(role);
  await context.addCookies([
    { name: 'authToken', value: 'navigation-qa-token', url: baseUrl },
    { name: 'authRole', value: role, url: baseUrl },
  ]);
  await context.addInitScript(({ user }) => {
    window.localStorage.setItem('authToken', 'navigation-qa-token');
    window.localStorage.setItem('authUser', JSON.stringify(user));
    window.localStorage.setItem('aldiente_patient_onboarding_completed', 'true');
    window.localStorage.setItem(`aldiente_patient_onboarding_completed:${user.id}`, 'true');
  }, { user });
}

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = [];

for (const check of checks) {
  const context = await browser.newContext({ viewport: check.viewport });
  await seedAuth(context, check.role);
  const page = await context.newPage();
  const url = `${baseUrl}${check.path}`;

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const initialStatus = response?.status() ?? null;
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});

    const locator = page.locator(`a[href="${check.href}"]`).first();
    await locator.waitFor({ state: 'visible', timeout: 15000 });
    await locator.click({ timeout: 15000 });
    await page.waitForURL(
      target => new URL(target).pathname === check.expectedPath,
      { timeout: 15000 },
    );

    report.push({
      name: check.name,
      status: 'PASS',
      initialStatus,
      finalUrl: page.url(),
      expectedPath: check.expectedPath,
    });
  } catch (error) {
    report.push({
      name: check.name,
      status: 'FAIL',
      finalUrl: page.url(),
      expectedPath: check.expectedPath,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  await context.close();
}

await browser.close();

const reportPath = path.join(outputDir, 'report.json');
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

let failures = 0;
for (const item of report) {
  console.log(`${item.status} ${item.name}: ${item.finalUrl}`);
  if (item.status === 'FAIL') {
    failures += 1;
    console.log(`  expected: ${item.expectedPath}`);
    console.log(`  error: ${item.error}`);
  }
}

console.log(`Navigation QA report written to ${reportPath}`);
if (failures > 0) {
  process.exitCode = 1;
}
