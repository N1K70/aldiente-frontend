# ALDIENTE Frontend

Frontend web de ALDIENTE (Next.js) con integración a:

- `aldiente-backend` (API REST)
- `chatsvc` (Socket.IO)
- PostgreSQL local para desarrollo

## Levantar todo con Docker Compose

Desde `aldiente-frontend`:

```bash
docker compose up --build
```

Servicios expuestos:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- ChatSvc: `http://localhost:3002`
- PostgreSQL: `localhost:5432`

## Base de datos (volumen existente)

Este setup usa el volumen Docker externo `aldiente-frontend_postgres_data` para reutilizar datos locales ya existentes.

Para que backend/chatsvc conecten correctamente con ese volumen, las credenciales quedan alineadas a:

- `DB_USER=postgres`
- `DB_PASSWORD=postgres`
- `DB_NAME=aldiente`

Si tu volumen fue creado con otras credenciales, deberás ajustar variables en `docker-compose.yml` o recrear el volumen.

Para apagar:

```bash
docker compose down
```

Para apagar y limpiar volúmenes (DB + node_modules en volúmenes):

```bash
docker compose down -v
```

## Nota sobre dependencias locales

Si no tienes `node`/`npm` instalados en tu máquina, puedes trabajar solo con Docker Compose.

## Estructura esperada de carpetas

Este compose asume estas rutas vecinas:

- `../aldiente-backend`
- `../ALDIENTE/chatsvc`

Si cambian, actualiza los `context` y `volumes` en `docker-compose.yml`.
