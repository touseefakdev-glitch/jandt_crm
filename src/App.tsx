import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Queries } from './pages/Queries';
import { QueryDetail } from './pages/QueryDetail';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { OutOfStock } from './pages/OutOfStock';
import { Notifications } from './pages/Notifications';
import { ShiftHandover } from './pages/ShiftHandover';
import { WhatsAppSimulator } from './pages/WhatsAppSimulator';
import { WhatsAppConversations } from './pages/WhatsAppConversations';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminUserProfile } from './pages/admin/AdminUserProfile';
import { AdminTeams } from './pages/admin/AdminTeams';
import { AdminRoles } from './pages/admin/AdminRoles';
import { AdminQueryCategories } from './pages/admin/AdminQueryCategories';
import { AdminProductCategories } from './pages/admin/AdminProductCategories';
import { AdminProductBrands } from './pages/admin/AdminProductBrands';
import { AdminShifts } from './pages/admin/AdminShifts';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminImport } from './pages/admin/AdminImport';
import { AdminImportHistory } from './pages/admin/AdminImportHistory';
import { AdminRouteSchedules } from './pages/admin/AdminRouteSchedules';
import { AdminOrderRequests } from './pages/admin/AdminOrderRequests';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

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
            <Route path="whatsapp-conversations" element={<WhatsAppConversations />} />
            <Route path="whatsapp-simulator" element={<WhatsAppSimulator />} />
            
            {/* Step 9: Admin Panel Sub-Routes */}
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserProfile />} />
              <Route path="teams" element={<AdminTeams />} />
              <Route path="roles" element={<AdminRoles />} />
              <Route path="routes" element={<AdminRouteSchedules />} />
              <Route path="order-requests" element={<AdminOrderRequests />} />
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

