# Plataforma de Búsqueda de Proyectos (PR-26)

Este proyecto es una plataforma SaaS diseñada para facilitar la colaboración en proyectos entre estudiantes, profesionales independientes y empresas. Permite la gestión completa del ciclo de vida de un proyecto, desde su publicación hasta su ejecución mediante herramientas ágiles.

## 🚀 Arquitectura del Proyecto

El proyecto está dividido en dos partes principales:

1. **Frontend (`/src` y raíz):** Desarrollado con **React**, **Vite** y **Tailwind CSS**. Proporciona una interfaz moderna, responsive y con estética premium.
2. **Backend (`/backend`):** Desarrollado con **NestJS** y **TypeORM**. Maneja la lógica de negocio, autenticación JWT y la persistencia de datos en una base de datos **PostgreSQL** local dockerizada.

---

## 🛠️ Requisitos Previos

- **Node.js** (v18 o superior recomendado)
- **Docker** y **Docker Compose** (para levantar la base de datos PostgreSQL local)
- **npm** (Gestor de paquetes)

---

## ⚙️ Configuración y Ejecución

Tienes **dos opciones** para iniciar el sistema: la opción 1 (completamente automatizada en Docker) o la opción 2 (ejecución manual de cada servicio por separado).

---

### Opción 1: Levantar TODO el Sistema con Docker (Recomendado 🚀)

Esta opción compila, orquesta y arranca el frontend, el backend y la base de datos de manera 100% automatizada en contenedores aislados.

#### A. A partir de los archivos de código fuente (Compilación Automática)

1. Asegúrate de tener Docker abierto en tu computadora.
2. Abre una terminal en la raíz del proyecto y ejecuta:
   ```bash
   docker compose up --build
   ```
3. Docker automáticamente:
   * Levantará la base de datos PostgreSQL en el puerto `5435`.
   * Inicializará la base de datos con los datos de prueba (`data/buscador_proyectos.sql`).
   * Compilará y ejecutará el Backend (NestJS) en el puerto `3000`.
   * Compilará el Frontend (Vite) y lo servirá de forma optimizada mediante Nginx en `http://localhost:5173`.

#### B. A partir de los archivos `.tar` del instalador (Modo Copia de Seguridad / Offline)

Si has descargado las imágenes precompiladas desde OneDrive, puedes cargarlas directamente en tu Docker local sin necesidad de compilarlas:

1. Importa las imágenes `.tar` a tu motor local de Docker:
   ```bash
   docker load -i postgres_image.tar
   docker load -i backend_image.tar
   docker load -i frontend_image.tar
   ```
2. Una vez importadas, levanta los servicios directamente con:
   ```bash
   docker compose up
   ```

Para apagar el sistema y detener todos los servicios:
```bash
docker compose down
```
*Si quieres reiniciar la base de datos y limpiarla por completo para cargar de nuevo los scripts SQL originales de `/data`, usa: `docker compose down -v`.*

---

### Opción 2: Ejecución Manual (Desarrollo Local)

Si prefieres ejecutar los servicios directamente en tu sistema operativo:

#### 1. Levantar la Base de Datos con Docker
Inicia el contenedor exclusivo de PostgreSQL:
```bash
docker compose up -d postgres
```

#### 2. Configurar las Variables de Entorno del Backend
Crea o verifica el archivo `.env` dentro de la carpeta `/backend` con las siguientes credenciales:
```env
DATABASE_URL=postgresql://postgres:12345@localhost:5435/buscador
JWT_SECRET=super_secret_key_123
PORT=3000
```

#### 3. Ejecutar el Backend (NestJS)
```bash
cd backend
npm install
   npm run start:dev
```

#### 4. Ejecutar el Frontend (React + Vite)
En otra terminal en la raíz del proyecto:
```bash
npm install
npm run dev
```

La aplicación estará disponible de forma local en `http://localhost:5173`.


---

## 📋 Características Principales

- **Gestión de Empresas:** Registro y validación de organizaciones por administradores.
- **Explorador de Proyectos:** Búsqueda avanzada de proyectos por categorías y etiquetas.
- **Colaboración Real:** Sistema de solicitudes para unirse a equipos de trabajo.
- **Tablero Kanban:** Gestión de tareas integrada para cada proyecto.
- **Chat de Proyecto:** Comunicación en tiempo real entre los miembros del equipo.
- **Gestor de Recursos:** Carga y organización de archivos y documentos del proyecto.

---

## 📁 Estructura del Repositorio

- `backend/`: Código fuente de la API NestJS.
- `src/`: Código fuente del frontend (React).
- `data/`: Contiene el esquema SQL y dumps de la base de datos (también montados en el contenedor Docker para la inicialización).
- `docker-compose.yml`: Definición del servicio PostgreSQL dockerizado.
- `public/`: Assets estáticos del frontend.
- `dist/`: Carpeta generada tras el proceso de build (excluida por git).


 migraciones 
docker exec -i buscador_postgres psql -U postgres -d buscador < "/d/UMA/ProjectHub/PR-26-Busqueda-Proyectos-main/data/migrations/001_empresa_logo_imagenes_enlaces.sql"

docker exec -i buscador_postgres psql -U postgres -d buscador < "/d/UMA/ProjectHub/PR-26-Busqueda-Proyectos-main/data/migrations/002_usuario_foto_perfil.sql"

por porwersell
Get-Content "C:\Users\user\Documents\UMA\ProjectHub\PR-26-Busqueda-Proyectos-main\data\migrations\001_empresa_logo_imagenes_enlaces.sql" | docker exec -i buscador_postgres psql -U postgres -d buscador

Get-Content "C:\Users\user\Documents\UMA\ProjectHub\PR-26-Busqueda-Proyectos-main\data\migrations\002_usuario_foto_perfil.sql" | docker exec -i buscador_postgres psql -U postgres -d buscador
