import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { AdminLayout } from './components/admin/AdminLayout';
import { PageSkeleton } from './components/ui/Skeleton';

/**
 * Route-level code splitting: every page is loaded in its own chunk on first
 * visit, so the initial bundle only contains the app shell, auth, and the
 * small set of shared UI components.
 */
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Customers = lazy(() => import('./pages/Customers').then((m) => ({ default: m.Customers })));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail').then((m) => ({ default: m.CustomerDetail })));
const Queries = lazy(() => import('./pages/Queries').then((m) => ({ default: m.Queries })));
const QueryDetail = lazy(() => import('./pages/QueryDetail').then((m) => ({ default: m.QueryDetail })));
const Orders = lazy(() => import('./pages/Orders').then((m) => ({ default: m.Orders })));
const OrderDetail = lazy(() => import('./pages/OrderDetail').then((m) => ({ default: m.OrderDetail })));
const Products = lazy(() => import('./pages/Products').then((m) => ({ default: m.Products })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const OutOfStock = lazy(() => import('./pages/OutOfStock').then((m) => ({ default: m.OutOfStock })));
const Notifications = lazy(() => import('./pages/Notifications').then((m) => ({ default: m.Notifications })));
const ShiftHandover = lazy(() => import('./pages/ShiftHandover').then((m) => ({ default: m.ShiftHandover })));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminUserProfile = lazy(() => import('./pages/admin/AdminUserProfile').then((m) => ({ default: m.AdminUserProfile })));
const AdminTeams = lazy(() => import('./pages/admin/AdminTeams').then((m) => ({ default: m.AdminTeams })));
const AdminRoles = lazy(() => import('./pages/admin/AdminRoles').then((m) => ({ default: m.AdminRoles })));
const AdminQueryCategories = lazy(() => import('./pages/admin/AdminQueryCategories').then((m) => ({ default: m.AdminQueryCategories })));
const AdminProductCategories = lazy(() => import('./pages/admin/AdminProductCategories').then((m) => ({ default: m.AdminProductCategories })));
const AdminProductBrands = lazy(() => import('./pages/admin/AdminProductBrands').then((m) => ({ default: m.AdminProductBrands })));
const AdminShifts = lazy(() => import('./pages/admin/AdminShifts').then((m) => ({ default: m.AdminShifts })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs').then((m) => ({ default: m.AdminAuditLogs })));
const AdminImport = lazy(() => import('./pages/admin/AdminImport').then((m) => ({ default: m.AdminImport })));
const AdminImportHistory = lazy(() => import('./pages/admin/AdminImportHistory').then((m) => ({ default: m.AdminImportHistory })));
const AdminRouteSchedules = lazy(() => import('./pages/admin/AdminRouteSchedules').then((m) => ({ default: m.AdminRouteSchedules })));

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Login />
              </Suspense>
            }
          />

          {/* Protected Application Routes inside AppShell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="queries" element={<Queries />} />
            <Route path="queries/:id" element={<QueryDetail />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<Navigate to="/orders" replace />} />
            <Route path="daily-operations" element={<Navigate to="/orders" replace />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="out-of-stock" element={<OutOfStock />} />
            <Route path="inventory" element={<Navigate to="/products" replace />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="shift-handover" element={<ShiftHandover />} />

            {/* Admin Panel Sub-Routes */}
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserProfile />} />
              <Route path="teams" element={<AdminTeams />} />
              <Route path="roles" element={<AdminRoles />} />
              <Route path="routes" element={<AdminRouteSchedules />} />
              <Route path="import" element={<AdminImport />} />
              <Route path="import/history" element={<AdminImportHistory />} />
              <Route path="query-categories" element={<AdminQueryCategories />} />
              <Route path="product-categories" element={<AdminProductCategories />} />
              <Route path="product-brands" element={<AdminProductBrands />} />
              <Route path="shifts" element={<AdminShifts />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
