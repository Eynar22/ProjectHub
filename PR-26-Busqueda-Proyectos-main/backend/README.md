# Backend - Plataforma de Búsqueda de Proyectos

Este es el servidor de API para la plataforma, construido con el framework [NestJS](https://github.com/nestjs/nest).

## 🛠️ Stack Tecnológico

- **Framework:** NestJS (Node.js)
- **ORM:** TypeORM
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT (JSON Web Tokens) + Passport
- **Validación:** Class-validator

---

## 📂 Estructura de Carpetas (`src/`)

- `auth/`: Lógica de autenticación, registro de empresas y empleados.
- `empresa/`: Gestión de perfiles corporativos y flujos de aprobación.
- `usuario/`: Gestión de usuarios, roles y solicitudes de membresía.
- `proyecto/`: Creación, edición y exploración de proyectos.
- `tarea/`: Implementación del tablero Kanban y comentarios.
- `chat/`: Historial de mensajes y comunicación entre participantes.
- `recurso/`: Gestión de archivos y documentos (con soporte para Base64).
- `entities/`: Definiciones de tablas y relaciones de la base de datos.

---

## ⚙️ Configuración

1.  Crea un archivo `.env` en esta carpeta con las siguientes variables:
    ```env
    DB_HOST=localhost
    DB_PORT=5432
    DB_USERNAME=tu_usuario
    DB_PASSWORD=tu_password
    DB_DATABASE=buscador
    JWT_SECRET=tu_secreto_super_seguro
    ```

---

## 🏃 Ejecución

```bash
# Instalación de dependencias
npm install

# Modo desarrollo (con recarga automática)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

---

## 🧪 Base de Datos
El esquema relacional se gestiona externamente mediante el archivo `data/buscador.sql` ubicado en la raíz del proyecto. Este archivo contiene la definición de todas las tablas, relaciones y disparadores (triggers) necesarios para el correcto funcionamiento de la plataforma.
