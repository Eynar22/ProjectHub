-- Migración: onboarding del administrador (wizard de bienvenida) y contraseña
-- temporal obligatoria para empleados creados rápido desde ese wizard.
--
-- Igual que 001/002/003: el SQL en data/buscador_proyectos.sql solo corre en un
-- volumen de Postgres nuevo. Para una base ya existente (dev local o
-- producción), aplicar a mano:
--
--   docker exec -i buscador_postgres psql -U postgres -d buscador < data/migrations/004_usuario_onboarding.sql

BEGIN;

ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS onboarding_completado boolean DEFAULT false NOT NULL;

ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS debe_cambiar_password boolean DEFAULT false NOT NULL;

-- Backfill: los usuarios que ya existen no deben ver el wizard de bienvenida
-- (solo lo verán administradores aprobados de aquí en adelante).
UPDATE public.usuario SET onboarding_completado = true;

COMMIT;
