import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { ForceChangePassword } from '@/pages/ForceChangePassword';

/**
 * Protege rutas que requieren sesión iniciada. `redirigirA` es a dónde se manda
 * al visitante sin sesión (por defecto, al inicio).
 */
export function RutaPrivada({ children, redirigirA = '/' }: { children: ReactNode; redirigirA?: string }) {
  const { currentUser, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={redirigirA} replace />;
  }

  // Empleados creados desde el wizard de bienvenida reciben una contraseña
  // temporal por correo: se bloquea el resto de la app hasta que la cambien.
  if (currentUser.debe_cambiar_password) {
    return <ForceChangePassword />;
  }

  return <>{children}</>;
}
