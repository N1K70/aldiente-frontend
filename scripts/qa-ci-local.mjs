// CI local en un solo comando, reproducible y autocontenido.
//
// Corre TODA la suite de QA dentro de un unico contenedor (imagen oficial de
// Playwright = Node 20 + Chromium), con node_modules y .next AISLADOS en
// volumenes anonimos. No necesita el stack `docker compose up` ni toca el
// .next del host, asi que no colisiona con el dev server.
//
// Fases:
//   1. install (npm ci)
//   2. guards estaticos: mock-guard, encoding-guard
//   3. contratos: funnel-event, chat-attachment
//   4. gate: typecheck + build
//   5. servir build de produccion + smokes (rutas, roles)
//   6. E2E real (Playwright): qa:navigation
//
// Uso:  npm run qa:ci:local
//
// La version de la imagen Playwright se autodetecta para matchear el paquete
// instalado (igual que qa:e2e:docker).

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function playwrightVersion() {
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
    const m = (pkg.devDependencies?.['@playwright/test'] || '').match(/\d+\.\d+\.\d+/);
    if (m) return m[0];
  } catch {}
  return '1.60.0';
}

const image = `mcr.microsoft.com/playwright:v${playwrightVersion()}-jammy`;
const cwd = process.cwd();

// Orquestacion dentro del contenedor. `set -e` corta en el primer fallo.
const inner = [
  'set -e',
  'echo "== install =="',
  'npm ci --silent',
  'echo "== guards =="',
  'npm run qa:mock-guard',
  'npm run qa:encoding-guard',
  'echo "== contracts =="',
  'npm run qa:funnel:event-contract',
  'npm run qa:chat:attachment-contract',
  'echo "== gate (typecheck + build) =="',
  'npm run qa:gate',
  'echo "== serve prod build =="',
  'npm run start &',
  // Esperar hasta 90s a que el server responda.
  'node -e "(async()=>{for(let i=0;i<90;i++){try{const r=await fetch(\'http://localhost:3000/login\');if(r.status>0)process.exit(0)}catch{}await new Promise(s=>setTimeout(s,1000))}console.error(\'server no respondio\');process.exit(1)})()"',
  'echo "== smokes =="',
  'npm run qa:smoke:routes',
  'npm run qa:smoke:roles',
  'echo "== e2e (navigation) =="',
  'QA_BASE_URL=http://localhost:3000 npm run qa:navigation',
  'echo "== CI local OK =="',
].join('\n');

const args = [
  'run', '--rm',
  '-v', `${cwd}:/app`,
  '-v', '/app/node_modules',
  '-v', '/app/.next',
  '-w', '/app',
  '-e', 'NEXT_TELEMETRY_DISABLED=1',
  image,
  'bash', '-c', inner,
];

console.log(`> CI local en ${image} (node_modules y .next aislados)`);

const res = spawnSync('docker', args, { stdio: 'inherit' });
if (res.error) {
  console.error('No se pudo ejecutar docker:', res.error.message);
  process.exit(1);
}
process.exit(res.status ?? 1);
