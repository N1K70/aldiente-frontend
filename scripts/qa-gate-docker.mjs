// QA gate dentro de Docker, sin depender de Node nativo en el host.
//
// Por que existe: en este entorno (Windows) el QA local nativo es inestable
// (WSL1/Node) y el node_modules del host trae binarios Windows que rompen
// tsc/next al correr en un contenedor Linux. Este script corre `qa:gate`
// (typecheck + build) en node:20-alpine con un node_modules AISLADO.
//
// Importante: usa volumenes anonimos para /app/node_modules y /app/.next, asi:
//   - node_modules: instalacion limpia del contenedor (NO el volumen
//     `frontend_node_modules` del `docker compose up`, que puede quedar stale
//     con React duplicado y romper el build de /_global-error).
//   - .next: build aislado dentro del contenedor; NO toca el .next del host, asi
//     no colisiona con el dev server (`aldiente_frontend`) si esta corriendo.
//
// Uso:  npm run qa:gate:docker
// Si el host no puede correr ni `npm`, ver el comando equivalente en
// docs/docker-dev.md (seccion "QA en Docker").

import { spawnSync } from 'node:child_process';

const cwd = process.cwd();

const args = [
  'run', '--rm',
  '-v', `${cwd}:/app`,
  '-v', '/app/node_modules', // volumen anonimo: node_modules limpio del contenedor
  '-v', '/app/.next',        // volumen anonimo: .next aislado (no colisiona con dev)
  '-w', '/app',
  'node:20-alpine',
  'sh', '-c', 'npm ci && npm run qa:gate',
];

console.log('> docker', args.join(' '));

const res = spawnSync('docker', args, { stdio: 'inherit' });

if (res.error) {
  console.error('No se pudo ejecutar docker:', res.error.message);
  process.exit(1);
}

process.exit(res.status ?? 1);
