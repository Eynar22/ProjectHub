import { createBrowserRouter, Navigate } from 'react-router';
import { ReactNode } from 'react';
import { useApp } from './context/AppContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { ForceChangePassword } from './pages/ForceChangePassword';
import Explore from './pages/Explore';
import ProjectDetail from './pages/ProjectDetail';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminCompanies from './pages/AdminCompanies';
import AdminProjects from './pages/AdminProjects';
import CreateProject from './pages/CreateProject';
import Workspace from './pages/Workspace';
import CompanyProfile from './pages/CompanyProfile';
import MyProjects from './pages/MyProjects';
import ProjectRequests from './pages/ProjectRequests';
import CompanyMembers from './pages/CompanyMembers';
import AdminCompanyUsers from './pages/AdminCompanyUsers';
import AdminCompanyRequest from './pages/AdminCompanyRequest';
import AdminUsers from './pages/AdminUsers';

// ── Protected Route Wrapper ────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Empleados creados por el admin desde el wizard de bienvenida reciben una
  // contraseña temporal por correo — se bloquea el resto de la app hasta que
  // la cambien, sin importar a qué ruta protegida hayan entrado.
  if (currentUser.debe_cambiar_password) {
    return <ForceChangePassword />;
  }

  return <>{children}</>;
}

// ── Superadmin Route Wrapper ────────────────────────────────────────────────────────
function AdminRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser || currentUser.rol !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register',
    Component: Register,
  },
  {
    path: '/forgot-password',
    Component: ForgotPassword,
  },
  {
    path: '/reset-password',
    Component: ResetPassword,
  },
  {
    path: '/explore',
    Component: Explore,
  },
  {
    path: '/project/:id',
    Component: ProjectDetail,
  },
  
  // ── Protected User Routes ──
  {
    path: '/dashboard',
    element: <ProtectedRoute><CompanyDashboard /></ProtectedRoute>,
  },
  {
    path: '/dashboard/projects',
    element: <ProtectedRoute><MyProjects /></ProtectedRoute>,
  },
  {
    path: '/dashboard/create-project',
    element: <ProtectedRoute><CreateProject /></ProtectedRoute>,
  },
  {
    path: '/dashboard/profile',
    element: <ProtectedRoute><CompanyProfile /></ProtectedRoute>,
  },
  {
    path: '/dashboard/members',
    element: <ProtectedRoute><CompanyMembers /></ProtectedRoute>,
  },
  {
    path: '/grupo-trabajo/:id',
    element: <ProtectedRoute><Workspace /></ProtectedRoute>,
  },
  {
    path: '/project/:id/requests',
    element: <ProtectedRoute><ProjectRequests /></ProtectedRoute>,
  },

  // ── Protected Admin Routes ──
  {
    path: '/admin',
    element: <AdminRoute><AdminDashboard /></AdminRoute>,
  },
  {
    path: '/admin/companies',
    element: <AdminRoute><AdminCompanies /></AdminRoute>,
  },
  {
    path: '/admin/projects',
    element: <AdminRoute><AdminProjects /></AdminRoute>,
  },
  {
    path: '/admin/users',
    element: <AdminRoute><AdminUsers /></AdminRoute>,
  },
  {
    path: '/admin/companies/:id/users',
    element: <AdminRoute><AdminCompanyUsers /></AdminRoute>,
  },
  {
    path: '/admin/companies/:id/review',
    element: <AdminRoute><AdminCompanyRequest /></AdminRoute>,
  },
]);