import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../shared/context/AuthContext';
import { AppProvider } from '../shared/context/AppContext';

// Layouts
import AuthLayout from '../shared/components/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Management from './pages/Management';
import ProductManagement from './pages/ProductManagement';
import AdminOrders from './pages/AdminOrders';
import AdminBilling from './pages/AdminBilling';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import CouponManagement from './pages/CouponManagement';
import MembershipManagement from './pages/MembershipManagement';
import LoyaltySettings from './pages/LoyaltySettings';
import CancellationRequests from './pages/CancellationRequests';
import RefundManagement from './pages/RefundManagement';
import LeaveManagement from './pages/LeaveManagement';
import AdminAttendance from './pages/AdminAttendance';
import StaffPayouts from './pages/StaffPayouts';
import DeliveryBoyManagement from './pages/DeliveryBoyManagement';
import { Toaster } from '../shared/components/ui/sonner';

// Helper to check if role belongs to staff
const isStaffUser = (user) => {
  if (!user || !user.role) return false;
  return user.role !== 'admin' && user.role !== 'customer' && user.role !== 'delivery' && user.role !== 'delivery_boy';
};

// Role-based Route Guard for Admin Portal
const ProtectedRoute = ({ children, allowedRoles = ['admin'] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = allowedRoles.includes(user.role) || (allowedRoles.includes('staff') && isStaffUser(user));

  if (!isAllowed) {
    if (isStaffUser(user)) {
      return <Navigate to="/staff-dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Root Redirect based on login status
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (isStaffUser(user)) {
    // Redirect staff to the delivery/staff portal
    window.location.href = window.location.origin.replace('5174', '5175') + '/delivery-portal/index.html#/staff-dashboard';
    return null;
  }
  return <Navigate to="/dashboard" replace />;
};

const getBasename = () => {
  return window.location.pathname.startsWith('/admin') ? '/admin' : '';
};

function App() {
  return (
    <BrowserRouter basename={getBasename()}>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <AuthLayout>
                  <AdminLogin />
                </AuthLayout>
              }
            />

            {/* Admin Portal Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Management />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminNotificationsPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Management />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery-boys"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <DeliveryBoyManagement />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payouts"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <StaffPayouts />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Management />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ProductManagement />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminOrders />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminBilling />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Management />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Management />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/coupons"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <CouponManagement />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/memberships"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <MembershipManagement />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loyalty"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <LoyaltySettings />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cancellations"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <CancellationRequests />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/refunds"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <RefundManagement />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaves"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <LeaveManagement />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Management />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-attendance"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminAttendance />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Default Navigation Fallbacks */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
