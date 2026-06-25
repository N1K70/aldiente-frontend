// E2E/visual con Playwright dentro de Docker.
//
// Por que existe: los tests Playwright (qa:navigation, qa:visual:snapshots)
// necesitan navegadores + libs del sistema que node:20-alpine no trae (musl).
// Este wrapper usa la imagen oficial de Playwright (Ubuntu jammy, con Chromium
// preinstalado) en la version que matchea el paquete instalado.
//
// Corre contra una app YA levantada (no construye ni toca .next, asi no
// colisiona con el dev server). Por defecto apunta al dev server local en
// host.docker.internal:3000, asi que primero: `docker compose up`.
//
// Uso:
//   npm run qa:e2e:docker                 -> corre qa:navigation
//   npm run qa:e2e:docker qa:visual:snapshots
//   QA_BASE_URL=http://host.docker.internal:3100 npm run qa:e2e:docker
//
// El reporte de qa:navigation queda en tmp/navigation-qa/ (gitignored).

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function playwrightVersion() {
  // Preferir la version exacta instalada; si no, caer al rango de package.json.
  const candidates = [
    'node_modules/@playwright/test/package.json',
    'node_modules/playwright-core/package.json',
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, 'utf8')).version;
    } catch {}
  }
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    const range = pkg.devDependencies?.['@playwright/test'] || '';
    const m = range.match(/\d+\.\d+\.\d+/);
    if (m) return m[0];
  } catch {}
  return '1.60.0';
}

const version = playwrightVersion();
const image = `mcr.microsoft.com/playwright:v${version}-jammy`;
const script = process.argv[2] || 'qa:navigation';
const baseUrl = process.env.QA_BASE_URL || 'http://host.docker.internal:3000';
const cwd = process.cwd();

const args = [
  'run', '--rm',
  '-v', `${cwd}:/app`,
  '-v', '/app/node_modules', // node_modules limpio del contenedor (Linux)
  '-w', '/app',
  '-e', `QA_BASE_URL=${baseUrl}`,
  image,
  'sh', '-c', `npm ci --silent && npm run ${script}`,
];

console.log(`> playwright image: ${image}`);
console.log(`> base url: ${baseUrl} (la app debe estar levantada)`);
console.log(`> script: ${script}`);

const res = spawnSync('docker', args, { stdio: 'inherit' });

if (res.error) {
  console.error('No se pudo ejecutar docker:', res.error.message);
  process.exit(1);
}

process.exit(res.status ?? 1);
