# ALDIENTE - Entorno Dev con Docker

## Requisitos

Este `docker-compose.yml` asume esta estructura de carpetas:

- `aldiente-frontend` (este repo)
- `../aldiente-backend`
- `../ALDIENTE/chatsvc`

Si esas rutas no existen, corrige los `context` y `volumes` en `docker-compose.yml`.

## Levantar entorno

```bash
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Chat: `http://localhost:3002`
- Postgres: `localhost:5432`

## Apagar entorno

```bash
docker compose down
```

## Reinicio limpio (opcional)

Si quieres reconstruir contenedores y dependencias:

```bash
docker compose down
docker compose up --build
```

## QA en Docker (typecheck + build)

El QA local nativo es inestable en este entorno (WSL1/Node) y el `node_modules`
del host trae binarios de Windows que rompen `tsc`/`next` al correr dentro de un
contenedor Linux. Por eso el `qa:gate` se corre en Docker con un `node_modules`
**aislado**.

Forma recomendada (si el host puede correr `npm`):

```bash
npm run qa:gate:docker
```

Equivalente sin depender de `npm` en el host (PowerShell):

```powershell
docker run --rm -v "${PWD}:/app" -v "/app/node_modules" -w /app node:20-alpine `
  sh -c "rm -rf .next && npm ci && npm run qa:gate"
```

Notas:

- Usa volúmenes **anónimos** para `/app/node_modules` y `/app/.next`. Esto evita
  dos problemas: (a) reutilizar el `frontend_node_modules` del `docker compose up`
  (queda stale con React duplicado y rompe el build de `/_global-error`), y
  (b) escribir el `.next` del host, que colisionaría con el dev server.
- Al aislar `.next`, el comando se puede correr **aunque el dev server esté
  levantado**.
- No necesita levantar Postgres/backend/chat: `qa:gate` es solo typecheck + build.

## CI local en un comando

Para correr **toda la suite** (gate + guards + contratos + smokes + E2E) en una
sola pasada reproducible, sin depender de `docker compose up`:

```bash
npm run qa:ci:local
```

Corre todo dentro de un único contenedor (imagen Playwright = Node + Chromium),
con `node_modules` y `.next` aislados. Es el comando recomendado **antes de un
merge o una demo**. Fases: install → guards → contratos → gate → servir build de
prod + smokes → E2E de navegación.

## E2E / visual con Playwright en Docker

Los tests Playwright (`qa:navigation`, `qa:visual:snapshots`) necesitan Chromium
y librerías del sistema que `node:20-alpine` no trae. Se corren con la **imagen
oficial de Playwright** (la versión se detecta automáticamente para que matchee
el paquete instalado).

Requisito: la app debe estar **levantada** (el wrapper apunta por defecto al dev
server en `host.docker.internal:3000`):

```bash
docker compose up            # deja el stack corriendo
npm run qa:e2e:docker        # corre qa:navigation (click-through real por la UI)
npm run qa:e2e:docker qa:visual:snapshots   # captura visual desktop/mobile
```

Apuntar a otra URL (p. ej. un build de producción en :3100):

```bash
QA_BASE_URL=http://host.docker.internal:3100 npm run qa:e2e:docker
```

Notas:

- Corre contra la app ya servida: **no construye ni toca `.next`**, así que no
  colisiona con el dev server.
- El reporte de navegación queda en `tmp/navigation-qa/report.json` (gitignored).
- Validado: 15/15 checks de navegación PASS contra el dev server (2026-06-24).
