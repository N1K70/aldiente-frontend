import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const outputDir = process.env.QA_VISUAL_OUTPUT_DIR || path.join('tmp', 'visual-qa');

const pages = [
  { name: 'funnel-qa-desktop', path: '/funnel-qa', role: 'admin', viewport: { width: 1440, height: 1000 } },
  { name: 'funnel-qa-mobile', path: '/funnel-qa', role: 'admin', viewport: { width: 390, height: 844 } },
  { name: 'landing-desktop', path: '/landing', viewport: { width: 1440, height: 1000 } },
  { name: 'landing-mobile', path: '/landing', viewport: { width: 390, height: 844 } },
  { name: 'home-mobile', path: '/home', role: 'patient', viewport: { width: 390, height: 844 } },
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

  const page = await context.newPage();
  const url = `${baseUrl}${spec.path}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  const finalUrl = new URL(page.url());

  const screenshotPath = path.join(outputDir, `${spec.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    text: document.body.innerText.slice(0, 700),
  }));

  report.push({
    name: spec.name,
    url,
    finalUrl: page.url(),
    screenshotPath,
    viewport: spec.viewport,
    unexpectedRedirect: finalUrl.pathname !== spec.path,
    horizontalOverflow: metrics.scrollWidth > metrics.clientWidth,
    metrics,
  });

  await context.close();
}

await browser.close();

const reportPath = path.join(outputDir, 'report.json');
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

console.log(`Visual QA snapshots written to ${outputDir}`);
for (const item of report) {
  const status = item.horizontalOverflow || item.unexpectedRedirect ? 'WARN' : 'PASS';
  console.log(`${status} ${item.name}: ${item.screenshotPath}`);
  if (item.unexpectedRedirect) console.log(`  unexpected redirect: ${item.finalUrl}`);
}
