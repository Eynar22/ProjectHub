# ProjectHub — Plataforma de búsqueda y colaboración en proyectos (PR-26)

Plataforma SaaS para que estudiantes, profesionales y empresas publiquen proyectos,
soliciten unirse a equipos y trabajen con tablero Kanban, chat y gestor de recursos.
esta listo ?
## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 · Vite 6 · TypeScript · Tailwind CSS v4 · TanStack Query · React Router 7 |
| Backend | NestJS 11 · TypeORM · PostgreSQL |
| Infra | Docker Compose (Postgres) · Nginx (frontend en producción) |

## Requisitos

- **Node.js 18+**
- **Docker** y **Docker Compose** (para la base de datos)
- **npm**

## Cómo levantarlo

### Opción A — Todo con Docker (recomendado)

```bash
docker compose up --build
```

Levanta Postgres (`:5435`, inicializado con `data/buscador_proyectos.sql`), el backend NestJS
(`:3000`) y el frontend servido por Nginx (`http://localhost:5173`).

Apagar: `docker compose down` · Reset de datos: `docker compose down -v`

### Opción B — Desarrollo local

```bash
# 1. Base de datos
docker compose up -d postgres

# 2. Backend (carpeta backend/, con su propio .env — ver más abajo)
cd backend && npm install && npm run start:dev

# 3. Frontend (raíz del repo, en otra terminal)
npm install
cp .env.example .env.local   # ajustar si el backend no está en localhost:3000
npm run dev                  # http://localhost:5173
```

## Variables de entorno

### Frontend (`.env.local` en la raíz — plantilla en `.env.example`)

| Variable | Qué hace |
|---|---|
| `VITE_API_URL` | URL base del backend NestJS, sin barra final ni `/api`. Si se deja vacía: `http://localhost:3000` en dev y `/api` (proxy nginx) en producción. |
| `VITE_APP_NOMBRE` | Nombre visible de la app. |
| `VITE_DEBUG` | `true` activa logs detallados en consola (solo desarrollo). |

> Nunca pongas secretos en variables `VITE_*`: quedan visibles en el bundle.

### Backend (`backend/.env`)

| Variable | Qué hace |
|---|---|
| `DATABASE_URL` | Conexión a Postgres, p. ej. `postgresql://postgres:12345@localhost:5435/buscador`. |
| `JWT_SECRET` | Clave de firma de los tokens JWT. |
| `PORT` | Puerto del backend (por defecto `3000`). |

## Comandos (frontend)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite). |
| `npm run build` | Build de producción a `dist/`. |
| `npm run preview` | Sirve el build de producción localmente. |
| `npm run lint` | ESLint sobre `src/`. |
| `npm run lint:fix` | ESLint con autocorrección. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run format` | Prettier (escribe). |
| `npm run format:check` | Prettier (solo verifica). |

## Estructura del frontend (`src/`)

Organizado por **funcionalidad**, no por tipo de archivo (Anexo B):

```
src/
  App.tsx · main.tsx
  app/          router.tsx · providers.tsx · guards/ · context/   (config global)
  pages/        una carpeta/archivo por pantalla; solo componen
  features/     auth · empresas · proyectos · usuarios · workspace
                cada una: { services/ · hooks/ · types/ · index.ts }
  shared/       components/{ui,layout} · hooks · utils · types · constants
  lib/          api/{client,endpoints,errors} · config · storage · queryClient
  styles/       tokens.css · theme.css · index.css
```

**Regla de la capa de API:** ningún componente llama a la API directamente.
`componente → hook → servicio → lib/api/client`. Todas las rutas del backend
viven en `src/lib/api/endpoints.ts`.

## Estructura del repositorio

- `src/` — frontend (React)
- `backend/` — API NestJS
- `data/` — esquema SQL y dumps (montados en el contenedor para inicializar)
- `docker-compose.yml` · `Dockerfile` · `nginx.conf` — infraestructura
- `public/` — assets estáticos · `dist/` — build (ignorado por git)

### Migraciones de base de datos

```bash
# bash
docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/001_empresa_logo_imagenes_enlaces.sql

# PowerShell
Get-Content data/migrations/001_empresa_logo_imagenes_enlaces.sql | docker exec -i buscador_postgres psql -U postgres -d buscador
```
