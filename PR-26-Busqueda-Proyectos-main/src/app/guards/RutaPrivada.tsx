import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { ForceChangePassword } from '@/pages/ForceChangePassword';

/** Protege rutas que requieren sesión iniciada. */
export function RutaPrivada({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Empleados creados desde el wizard de bienvenida reciben una contraseña
  // temporal por correo: se bloquea el resto de la app hasta que la cambien.
  if (currentUser.debe_cambiar_password) {
    return <ForceChangePassword />;
  }

  return <>{children}</>;
}
