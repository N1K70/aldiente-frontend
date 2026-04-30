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
