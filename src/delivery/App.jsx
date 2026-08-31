import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DeliveryBoyLogin from './pages/DeliveryBoyLogin';
import DeliveryBoyDashboard from './pages/DeliveryBoyDashboard';
import { Toaster } from '../shared/components/ui/sonner';

const RootRedirect = () => {
  const user = localStorage.getItem('delivery_boy');
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
};

const getBasename = () => {
  return window.location.pathname.startsWith('/delivery') ? '/delivery' : '';
};

function App() {
  return (
    <BrowserRouter basename={getBasename()}>
      <Routes>
        <Route path="/login" element={<DeliveryBoyLogin />} />
        <Route path="/dashboard" element={<DeliveryBoyDashboard />} />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
