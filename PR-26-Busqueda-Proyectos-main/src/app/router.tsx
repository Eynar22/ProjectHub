/* ============================================================================
 * src/app/router.tsx
 * Definición de todas las rutas de la aplicación (Anexo B2).
 * Las rutas protegidas se envuelven con los guards de app/guards.
 * ========================================================================= */

import { createBrowserRouter } from 'react-router';
import { RutaPrivada } from './guards/RutaPrivada';
import { RutaPorRol } from './guards/RutaPorRol';
import { TitleSync } from './TitleSync';

import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Explore from '@/pages/Explore';
import ProjectDetail from '@/pages/ProjectDetail';
import CompanyDashboard from '@/pages/CompanyDashboard';
import MyProjects from '@/pages/MyProjects';
import CreateProject from '@/pages/CreateProject';
import CompanyProfile from '@/pages/CompanyProfile';
import CompanyMembers from '@/pages/CompanyMembers';
import Workspace from '@/pages/Workspace';
import ProjectRequests from '@/pages/ProjectRequests';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminCompanies from '@/pages/AdminCompanies';
import AdminProjects from '@/pages/AdminProjects';
import AdminUsers from '@/pages/AdminUsers';
import AdminCompanyUsers from '@/pages/AdminCompanyUsers';
import AdminCompanyRequest from '@/pages/AdminCompanyRequest';

export const router = createBrowserRouter([
  {
    element: <TitleSync />,
    children: [
      // ── Rutas públicas ──
      { path: '/', Component: Home, handle: { titulo: 'Conecta empresas y proyectos' } },
      { path: '/login', Component: Login, handle: { titulo: 'Iniciar sesión' } },
      { path: '/register', Component: Register, handle: { titulo: 'Crear cuenta' } },
      { path: '/forgot-password', Component: ForgotPassword, handle: { titulo: 'Recuperar contraseña' } },
      { path: '/reset-password', Component: ResetPassword, handle: { titulo: 'Restablecer contraseña' } },
      { path: '/explore', Component: Explore, handle: { titulo: 'Explorar proyectos' } },
      { path: '/project/:id', Component: ProjectDetail, handle: { titulo: 'Detalle del proyecto' } },

      // ── Rutas de usuario autenticado ──
      { path: '/dashboard', element: <RutaPrivada><CompanyDashboard /></RutaPrivada>, handle: { titulo: 'Panel de empresa' } },
      { path: '/dashboard/projects', element: <RutaPrivada><MyProjects /></RutaPrivada>, handle: { titulo: 'Mis proyectos' } },
      { path: '/dashboard/create-project', element: <RutaPrivada><CreateProject /></RutaPrivada>, handle: { titulo: 'Crear proyecto' } },
      { path: '/dashboard/profile', element: <RutaPrivada><CompanyProfile /></RutaPrivada>, handle: { titulo: 'Perfil' } },
      { path: '/dashboard/members', element: <RutaPrivada><CompanyMembers /></RutaPrivada>, handle: { titulo: 'Miembros de la empresa' } },
      { path: '/grupo-trabajo/:id', element: <RutaPrivada><Workspace /></RutaPrivada>, handle: { titulo: 'Grupo de trabajo' } },
      { path: '/project/:id/requests', element: <RutaPrivada><ProjectRequests /></RutaPrivada>, handle: { titulo: 'Solicitudes del proyecto' } },

      // ── Rutas de superadmin ──
      { path: '/admin', element: <RutaPorRol><AdminDashboard /></RutaPorRol>, handle: { titulo: 'Administración' } },
      { path: '/admin/companies', element: <RutaPorRol><AdminCompanies /></RutaPorRol>, handle: { titulo: 'Gestión de empresas' } },
      { path: '/admin/projects', element: <RutaPorRol><AdminProjects /></RutaPorRol>, handle: { titulo: 'Gestión de proyectos' } },
      { path: '/admin/users', element: <RutaPorRol><AdminUsers /></RutaPorRol>, handle: { titulo: 'Gestión de usuarios' } },
      { path: '/admin/companies/:id/users', element: <RutaPorRol><AdminCompanyUsers /></RutaPorRol>, handle: { titulo: 'Equipo de la empresa' } },
      { path: '/admin/companies/:id/review', element: <RutaPorRol><AdminCompanyRequest /></RutaPorRol>, handle: { titulo: 'Revisión de empresa' } },
    ],
  },
]);
