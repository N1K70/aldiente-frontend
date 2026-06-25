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

- Usa un volumen **anónimo** para `/app/node_modules`. **No** reutilices el
  volumen `frontend_node_modules` del `docker compose up`: queda en estado stale
  (React duplicado) y rompe el build de `/_global-error`.
- `rm -rf .next` evita que artefactos corruptos de `next dev` (p. ej.
  `.next/dev/types/validator.ts`) hagan fallar el `typecheck`.
- No necesita levantar Postgres/backend/chat: `qa:gate` es solo typecheck + build.
