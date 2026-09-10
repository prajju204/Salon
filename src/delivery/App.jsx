import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../shared/context/AuthContext';
import { AppProvider } from '../shared/context/AppContext';

// Layouts
import AuthLayout from '../shared/components/AuthLayout';
import AdminLayout from '../admin/layouts/AdminLayout';

// Delivery Pages
import DeliveryBoyLogin from './pages/DeliveryBoyLogin';
import DeliveryBoyDashboard from './pages/DeliveryBoyDashboard';

// Staff Pages
import StaffLogin from '../admin/pages/StaffLogin';
import StaffDashboard from '../admin/pages/StaffDashboard';
import StaffAttendance from '../admin/pages/StaffAttendance';

import { Toaster } from '../shared/components/ui/sonner';

// Helper to check if role belongs to staff
const isStaffUser = (user) => {
  if (!user || !user.role) return false;
  return user.role !== 'admin' && user.role !== 'customer' && user.role !== 'delivery' && user.role !== 'delivery_boy';
};

// Role-based Route Guard for Staff
const ProtectedRoute = ({ children, allowedRoles = ['staff'] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/staff/login" replace />;
  }

  const isAllowed = allowedRoles.includes(user.role) || (allowedRoles.includes('staff') && isStaffUser(user));

  if (!isAllowed) {
    if (isStaffUser(user)) {
      return <Navigate to="/staff-dashboard" replace />;
    }
    return <Navigate to="/staff/login" replace />;
  }

  return children;
};

const RootRedirect = () => {
  const deliveryUser = localStorage.getItem('delivery_boy');
  if (deliveryUser) return <Navigate to="/dashboard" replace />;
  
  // Try to use auth for staff redirect if needed
  const staffToken = localStorage.getItem('luxe_admin_token') || localStorage.getItem('luxe_user_token') || localStorage.getItem('luxe_token');
  const staffUser = localStorage.getItem('luxe_admin') || localStorage.getItem('luxe_user');
  
  if (staffToken && staffUser) {
     return <Navigate to="/staff-dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

const getBasename = () => {
  return window.location.pathname.startsWith('/delivery') ? '/delivery' : '';
};

function App() {
  return (
    <BrowserRouter basename={getBasename()}>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Delivery Routes */}
            <Route path="/login" element={<DeliveryBoyLogin />} />
            <Route path="/dashboard" element={<DeliveryBoyDashboard />} />

            {/* Staff Auth Routes */}
            <Route
              path="/staff/login"
              element={
                <AuthLayout>
                  <StaffLogin />
                </AuthLayout>
              }
            />

            {/* Staff Portal Routes */}
            <Route
              path="/staff-dashboard"
              element={
                <ProtectedRoute allowedRoles={['staff', 'Creative Stylist', 'Master Barber', 'Barber Stylist']}>
                  <AdminLayout>
                    <StaffDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-attendance"
              element={
                <ProtectedRoute allowedRoles={['staff', 'Creative Stylist', 'Master Barber', 'Barber Stylist']}>
                  <AdminLayout>
                    <StaffAttendance />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

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
