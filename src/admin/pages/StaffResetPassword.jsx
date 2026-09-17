import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '@/shared/utils/api';

const StaffResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken;

  if (!resetToken) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-8">
        <h2 className="text-xl text-red-500 mb-4">Invalid Access</h2>
        <p className="text-on-surface-variant mb-4">No reset token found. Please request a new password reset link.</p>
        <button
          onClick={() => navigate('/staff/forgot-password')}
          className="text-primary hover:underline"
        >
          Go to Forgot Password
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      const res = await axios.post(`${API_BASE}/api/staff/reset-password`, { resetToken, password });
      if (res.data.success) {
        setMessage('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/staff/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-center relative overflow-hidden py-12 sm:px-6 lg:px-8">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-headline-lg font-headline-lg font-bold text-primary tracking-widest mb-2">LUXE GROOM</h1>
          <p className="text-on-surface-variant font-label-md text-sm uppercase tracking-widest">Reset Password</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-label-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-950/20 border border-green-500/30 text-green-300 text-label-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary rounded-lg font-label-md text-sm font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Updating...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffResetPassword;
