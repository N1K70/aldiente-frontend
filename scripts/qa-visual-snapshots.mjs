import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const outputDir = process.env.QA_VISUAL_OUTPUT_DIR || path.join('tmp', 'visual-qa');
const mojibakePattern = /Ã|Â|â|ð|Å¸|ƒ|�/;

const pages = [
  { name: 'funnel-qa-desktop', path: '/funnel-qa', role: 'admin', viewport: { width: 1440, height: 1000 } },
  { name: 'funnel-qa-mobile', path: '/funnel-qa', role: 'admin', viewport: { width: 390, height: 844 } },
  { name: 'login-mobile', path: '/login', viewport: { width: 390, height: 844 } },
  { name: 'signup-mobile', path: '/signup', viewport: { width: 390, height: 844 } },
  { name: 'landing-desktop', path: '/landing', viewport: { width: 1440, height: 1000 } },
  { name: 'landing-mobile', path: '/landing', viewport: { width: 390, height: 844 } },
  { name: 'home-mobile', path: '/home', role: 'patient', seedOnboarding: true, viewport: { width: 390, height: 844 } },
  { name: 'explorar-mobile', path: '/explorar', role: 'patient', seedOnboarding: true, viewport: { width: 390, height: 844 } },
  { name: 'reservar-public-mobile', path: '/reservar', viewport: { width: 390, height: 844 } },
  { name: 'citas-mobile', path: '/citas', role: 'patient', viewport: { width: 390, height: 844 } },
  { name: 'documentos-mobile', path: '/documentos', role: 'patient', viewport: { width: 390, height: 844 } },
  { name: 'chat-mobile', path: '/chat', role: 'patient', viewport: { width: 390, height: 844 } },
];

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = [];

for (const spec of pages) {
  const context = await browser.newContext({ viewport: spec.viewport });
  if (spec.role) {
    const user = {
      id: `qa-${spec.role}`,
      email: `qa-${spec.role}@aldiente.local`,
      role: spec.role,
      name: spec.role === 'admin' ? 'QA Admin' : 'QA Paciente',
    };
    await context.addCookies([
      { name: 'authToken', value: 'visual-qa-token', url: baseUrl },
      { name: 'authRole', value: spec.role, url: baseUrl },
    ]);
    await context.addInitScript(({ user }) => {
      window.localStorage.setItem('authToken', 'visual-qa-token');
      window.localStorage.setItem('authUser', JSON.stringify(user));
    }, { user });
  }

  if (spec.seedOnboarding) {
    const userId = `qa-${spec.role ?? 'patient'}`;
    const university = {
      id: 'visual-qa-university',
      name: 'Universidad Visual QA',
      short_name: 'Visual QA',
      city: 'Santiago',
      latitude: -33.45,
      longitude: -70.66,
    };
    await context.addInitScript(({ userId, university }) => {
      window.localStorage.setItem('aldiente_patient_onboarding_completed', 'true');
      window.localStorage.setItem(`aldiente_patient_onboarding_completed:${userId}`, 'true');
      window.localStorage.setItem('aldiente_selected_university', JSON.stringify(university));
      window.localStorage.setItem(`aldiente_selected_university:${userId}`, JSON.stringify(university));
    }, { userId, university });
  }

  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const failedResponses = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  const url = `${baseUrl}${spec.path}`;
  const screenshotPath = path.join(outputDir, `${spec.name}.png`);

  try {
    const mainResponse = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const mainStatus = mainResponse?.status() ?? null;
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => document.body?.innerText.trim().length > 0, null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    const finalUrl = new URL(page.url());

    await page.screenshot({ path: screenshotPath, fullPage: true });

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      text: document.body.innerText.slice(0, 700),
      textLength: document.body.innerText.trim().length,
    }));

    report.push({
      name: spec.name,
      url,
      finalUrl: page.url(),
      screenshotPath,
      viewport: spec.viewport,
      unexpectedRedirect: finalUrl.pathname !== spec.path,
      horizontalOverflow: metrics.scrollWidth > metrics.clientWidth,
      mojibakeDetected: mojibakePattern.test(metrics.text),
      blankPage: metrics.textLength === 0,
      mainStatus,
      navigationError: null,
      consoleMessages,
      pageErrors,
      failedResponses,
      metrics,
    });
  } catch (error) {
    report.push({
      name: spec.name,
      url,
      finalUrl: page.url(),
      screenshotPath: null,
      viewport: spec.viewport,
      unexpectedRedirect: false,
      horizontalOverflow: false,
      mojibakeDetected: false,
      blankPage: false,
      mainStatus: null,
      navigationError: error instanceof Error ? error.message : String(error),
      consoleMessages,
      pageErrors,
      failedResponses,
      metrics: null,
    });
  }

  await context.close();
}

await browser.close();

const reportPath = path.join(outputDir, 'report.json');
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

console.log(`Visual QA snapshots written to ${outputDir}`);
let failures = 0;
for (const item of report) {
  if (item.navigationError) {
    failures += 1;
    console.log(`FAIL ${item.name}: ${item.navigationError}`);
    continue;
  }

  if (item.blankPage) {
    failures += 1;
    console.log(`FAIL ${item.name}: blank page rendered`);
    if (item.consoleMessages.length > 0) console.log(`  console: ${item.consoleMessages.slice(0, 3).join(' | ')}`);
    if (item.pageErrors.length > 0) console.log(`  page errors: ${item.pageErrors.slice(0, 3).join(' | ')}`);
    if (item.failedResponses.length > 0) console.log(`  failed responses: ${item.failedResponses.slice(0, 3).join(' | ')}`);
    continue;
  }

  if (item.mainStatus && item.mainStatus >= 500) {
    failures += 1;
    console.log(`FAIL ${item.name}: main document returned ${item.mainStatus}`);
    if (item.consoleMessages.length > 0) console.log(`  console: ${item.consoleMessages.slice(0, 3).join(' | ')}`);
    if (item.pageErrors.length > 0) console.log(`  page errors: ${item.pageErrors.slice(0, 3).join(' | ')}`);
    if (item.failedResponses.length > 0) console.log(`  failed responses: ${item.failedResponses.slice(0, 3).join(' | ')}`);
    continue;
  }

  const hasDiagnostics = item.consoleMessages.length > 0 || item.pageErrors.length > 0 || item.failedResponses.length > 0;
  const status = item.horizontalOverflow || item.unexpectedRedirect || item.mojibakeDetected || hasDiagnostics ? 'WARN' : 'PASS';
  console.log(`${status} ${item.name}: ${item.screenshotPath}`);
  if (item.unexpectedRedirect) console.log(`  unexpected redirect: ${item.finalUrl}`);
  if (item.mojibakeDetected) console.log('  mojibake-like text detected in visible copy');
  if (item.consoleMessages.length > 0) console.log(`  console: ${item.consoleMessages.slice(0, 3).join(' | ')}`);
  if (item.pageErrors.length > 0) console.log(`  page errors: ${item.pageErrors.slice(0, 3).join(' | ')}`);
  if (item.failedResponses.length > 0) console.log(`  failed responses: ${item.failedResponses.slice(0, 3).join(' | ')}`);
}

if (failures > 0) {
  process.exitCode = 1;
}
