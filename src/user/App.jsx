import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../shared/context/AuthContext';
import { AppProvider } from '../shared/context/AppContext';

// Layouts
import AuthLayout from '../shared/components/AuthLayout';
import CustomerLayout from './layouts/CustomerLayout';

// Pages
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LandingPage from './pages/LandingPage';

import CustomerDashboard from './pages/CustomerDashboard';
import BookingWizard from './pages/BookingWizard';
import CustomerSubpages from './pages/CustomerSubpages';
import ServiceCatalog from './pages/ServiceCatalog';
import AppointmentHistory from './pages/AppointmentHistory';
import WalletPage from './pages/WalletPage';
import ReviewsPage from './pages/ReviewsPage';
import NotificationsPage from './pages/NotificationsPage';
import MyCoupons from './pages/MyCoupons';
import MyRewards from './pages/MyRewards';
import CancellationHistoryPage from './pages/CancellationHistoryPage';
import { Toaster } from '../shared/components/ui/sonner';

// Role-based Route Guard for Customer Portal
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'customer') {
    // Admins are not allowed in customer portal
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Root Redirect based on login status
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <AuthLayout>
                  <CustomerLogin />
                </AuthLayout>
              }
            />
            <Route
              path="/register"
              element={
                <AuthLayout>
                  <CustomerRegister />
                </AuthLayout>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <AuthLayout>
                  <ForgotPassword />
                </AuthLayout>
              }
            />
            <Route
              path="/reset-password"
              element={
                <AuthLayout>
                  <ResetPassword />
                </AuthLayout>
              }
            />

            {/* Customer Portal Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <CustomerDashboard />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/book-appointment"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <BookingWizard />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <ServiceCatalog />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <AppointmentHistory />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <WalletPage />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <WalletPage />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reviews"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <ReviewsPage />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <NotificationsPage />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <CustomerSubpages />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/coupons"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <MyCoupons />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewards"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <MyRewards />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cancellations"
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <CancellationHistoryPage />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />

            {/* Default Navigation Fallbacks */}
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
