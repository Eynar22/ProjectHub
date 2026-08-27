import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import type { UserRole } from '@/shared/types/user.types';

/** Protege rutas que requieren un rol concreto (por defecto, superadmin). */
export function RutaPorRol({
  children,
  rol = 'superadmin',
}: {
  children: ReactNode;
  rol?: UserRole;
}) {
  const { currentUser, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!currentUser || currentUser.rol !== rol) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
