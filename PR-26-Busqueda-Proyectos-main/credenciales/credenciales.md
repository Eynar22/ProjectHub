# 🔑 Credenciales e Información del Sistema

Este documento contiene las credenciales de acceso, enlaces de despliegue y detalles de configuración para los entornos **Local** y **Hospedado (Vercel)** de la Plataforma de Búsqueda de Proyectos.

---

## 👤 Acceso de Administrador (Superadmin)

> [!IMPORTANT]  
> Estas credenciales de acceso son **exactamente las mismas** tanto para el entorno **Local (desarrollo)** como para el entorno **Hospedado (Vercel / Producción)**.

* **Usuario / Correo:** `admin@platform.com`
* **Contraseña:** `admin123`
* **Rol asignado:** `superadmin` (Acceso total a la administración, validación de empresas, notificaciones globales y control de proyectos).

---

## 🔗 Enlaces de Despliegue e Instalación

### 🌐 Entorno de Producción (Hospedado)
* **Link de la Aplicación en Vercel:** 
https://busquedaproyectos.vercel.app/

### 📦 Entorno Dockerizado (Copia de Seguridad / OneDrive)
* **Link del Entorno en OneDrive:** 
https://univalleedu-my.sharepoint.com/:f:/g/personal/csc0034382_est_univalle_edu/IgB9AWnrVa6MSZGQ1EEb8eLDAa65RHJoDILd4Twvl_5pxsA?e=5T6jLt

---

## 🗄️ Entorno de Desarrollo Local

### 1. Base de Datos (PostgreSQL en Docker)
El sistema utiliza un contenedor local configurado a través de Docker Compose:
* **Host:** `localhost`
* **Puerto:** `5435`
* **Base de Datos:** `buscador`
* **Usuario:** `postgres`
* **Contraseña:** `12345`
* **Cadena de Conexión (`.env`):** `postgresql://postgres:12345@localhost:5435/buscador`

### 2. Puertos y Direcciones Locales
* **Frontend (React + Vite):** `http://localhost:5173`
* **Backend (NestJS API):** `http://localhost:3000/api`

---

## 🚀 Guía Rápida de Comandos para Servidores Locales

Para iniciar el proyecto de forma local desde cero, ejecute estos comandos en la terminal en la raíz del proyecto:

### Paso 1: Levantar Base de Datos (Docker)
```powershell
docker-compose down -v  # Limpia volúmenes previos
docker-compose up -d     # Descarga e inicia la BD con la estructura limpia
```

### Paso 2: Iniciar el Backend (NestJS)
```powershell
cd backend
npm install
npm run start:dev
```

### Paso 3: Iniciar el Frontend (React)
Abre otra terminal en la raíz del proyecto y corre:
```powershell
npm install
npm run dev
```
