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

  // Set default auth header if token exists and configure interceptors
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url.includes('/auth/login') &&
          !originalRequest.url.includes('/auth/refresh')
        ) {
          originalRequest._retry = true;
          const currentRefreshToken = localStorage.getItem(TOKEN_KEY + '_refresh');
          if (currentRefreshToken) {
            try {
              const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: currentRefreshToken });
              if (res.data?.success) {
                const newToken = res.data.token;
                const newRefreshToken = res.data.refreshToken;
                
                localStorage.setItem(TOKEN_KEY, newToken);
                if (newRefreshToken) {
                  localStorage.setItem(TOKEN_KEY + '_refresh', newRefreshToken);
                }
                
                axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                
                if (originalRequest.headers) {
                  originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                  originalRequest.headers['authorization'] = `Bearer ${newToken}`;
                  if (typeof originalRequest.headers.set === 'function') {
                    originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
                    originalRequest.headers.set('authorization', `Bearer ${newToken}`);
                  }
                }
                
                return axios(originalRequest);
              }
            } catch (refreshErr) {
              console.error('Failed to refresh token:', refreshErr);
              const role = user?.role;
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(TOKEN_KEY + '_refresh');
              localStorage.removeItem(USER_KEY);
              delete axios.defaults.headers.common['Authorization'];
              if (role === 'staff' || window.location.pathname.startsWith('/staff')) {
                window.location.href = '/staff/login?expired=true';
              } else {
                window.location.href = '/login?expired=true';
              }
            }
          } else {
            const hasAuth = originalRequest.headers && (originalRequest.headers['Authorization'] || originalRequest.headers['authorization']);
            if (hasAuth) {
              const role = user?.role;
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
              delete axios.defaults.headers.common['Authorization'];
              if (role === 'staff' || window.location.pathname.startsWith('/staff')) {
                window.location.href = '/staff/login?expired=true';
              } else {
                window.location.href = '/login?expired=true';
              }
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [TOKEN_KEY]);

  // Customer Login
  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, refreshToken, user: loggedInUser } = response.data;
      
      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(TOKEN_KEY + '_refresh', refreshToken);
      }
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
      const { token, refreshToken, user: loggedInUser } = response.data;
      
      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(TOKEN_KEY + '_refresh', refreshToken);
      }
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

  // Staff Login
  const staffLogin = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/staff/login`, { username, password });
      const { token, refreshToken, staff: loggedInUser } = response.data;
      
      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(TOKEN_KEY + '_refresh', refreshToken);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(loggedInUser);
      setLoading(false);
      return loggedInUser;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Invalid Staff Credentials';
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
      const { token, refreshToken, user: registeredUser } = response.data;
      
      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(TOKEN_KEY + '_refresh', refreshToken);
      }
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
    localStorage.removeItem(TOKEN_KEY + '_refresh');
    localStorage.removeItem(USER_KEY);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        adminLogin,
        staffLogin,
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
