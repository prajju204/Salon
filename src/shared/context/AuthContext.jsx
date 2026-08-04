import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_URL = 'http://localhost:5000/api';

// Dynamically determine the storage keys based on the current portal port (Admin: 5174, User: 5173)
const isAdminPortal = () => window.location.port === '5174' || document.title.includes('Admin');
const TOKEN_KEY = isAdminPortal() ? 'luxe_admin_token' : 'luxe_user_token';
const USER_KEY = isAdminPortal() ? 'luxe_admin' : 'luxe_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default auth header if token exists
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Customer Login
  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user: loggedInUser } = response.data;
      
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(loggedInUser);
      setLoading(false);
      return loggedInUser;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Invalid email or password.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Admin Login
  const adminLogin = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/admin/login`, { email, password });
      const { token, user: loggedInUser } = response.data;
      
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(loggedInUser);
      setLoading(false);
      return loggedInUser;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Invalid Admin Credentials';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Customer Register
  const register = async (name, email, mobile, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, mobile, password });
      const { token, user: registeredUser } = response.data;
      
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(registeredUser));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(registeredUser);
      setLoading(false);
      return registeredUser;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Forgot Password (Customer)
  const forgotPassword = async (email) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Forgot password failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Reset Password (Customer)
  const resetPassword = async (resetToken, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, { resetToken, password });
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Reset password failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Forgot Password (Admin)
  const adminForgotPassword = async (email) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/admin/forgot-password`, { email });
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Forgot password failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Reset Password (Admin)
  const adminResetPassword = async (resetToken, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/admin/reset-password`, { resetToken, password });
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Reset password failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Logout
  const logout = async () => {
    try {
      const role = user?.role;
      if (role === 'admin') {
        await axios.post(`${API_URL}/admin/logout`);
      } else {
        await axios.post(`${API_URL}/auth/logout`);
      }
    } catch (err) {
      // Ignore network errors on logout
    }
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        adminLogin,
        register,
        logout,
        forgotPassword,
        resetPassword,
        adminForgotPassword,
        adminResetPassword,
        loading,
        error,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
