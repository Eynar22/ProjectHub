/* ============================================================================
 * src/app/router.tsx
 * Definición de todas las rutas de la aplicación (Anexo B2).
 * Las rutas protegidas se envuelven con los guards de app/guards.
 * ========================================================================= */

import { createBrowserRouter } from 'react-router';
import { RutaPrivada } from './guards/RutaPrivada';
import { RutaPorRol } from './guards/RutaPorRol';

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
  // ── Rutas públicas ──
  { path: '/', Component: Home },
  { path: '/login', Component: Login },
  { path: '/register', Component: Register },
  { path: '/forgot-password', Component: ForgotPassword },
  { path: '/reset-password', Component: ResetPassword },
  { path: '/explore', Component: Explore },
  { path: '/project/:id', Component: ProjectDetail },

  // ── Rutas de usuario autenticado ──
  { path: '/dashboard', element: <RutaPrivada><CompanyDashboard /></RutaPrivada> },
  { path: '/dashboard/projects', element: <RutaPrivada><MyProjects /></RutaPrivada> },
  { path: '/dashboard/create-project', element: <RutaPrivada><CreateProject /></RutaPrivada> },
  { path: '/dashboard/profile', element: <RutaPrivada><CompanyProfile /></RutaPrivada> },
  { path: '/dashboard/members', element: <RutaPrivada><CompanyMembers /></RutaPrivada> },
  { path: '/grupo-trabajo/:id', element: <RutaPrivada><Workspace /></RutaPrivada> },
  { path: '/project/:id/requests', element: <RutaPrivada><ProjectRequests /></RutaPrivada> },

  // ── Rutas de superadmin ──
  { path: '/admin', element: <RutaPorRol><AdminDashboard /></RutaPorRol> },
  { path: '/admin/companies', element: <RutaPorRol><AdminCompanies /></RutaPorRol> },
  { path: '/admin/projects', element: <RutaPorRol><AdminProjects /></RutaPorRol> },
  { path: '/admin/users', element: <RutaPorRol><AdminUsers /></RutaPorRol> },
  { path: '/admin/companies/:id/users', element: <RutaPorRol><AdminCompanyUsers /></RutaPorRol> },
  { path: '/admin/companies/:id/review', element: <RutaPorRol><AdminCompanyRequest /></RutaPorRol> },
]);
