import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useApp } from '../context/AppContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('superadmin' | 'admin' | 'empleado')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.rol)) {
    // Si no tiene el rol, mandarlo al inicio (o login)
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
