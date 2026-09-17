import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '@/shared/utils/api';

const StaffForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const res = await axios.post(`${API_BASE}/api/staff/forgot-password`, { email });
      if (res.data.success) {
        setMessage('Password reset code generated successfully.');
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
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
          <p className="text-on-surface-variant font-label-md text-sm uppercase tracking-widest">Staff Forgot Password</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-label-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-950/20 border border-green-500/30 text-green-300 text-label-sm">
            {message}
            {resetToken && (
              <div className="mt-4 p-2 bg-black/40 rounded border border-white/5 font-mono text-[10px] break-all select-all text-primary">
                Token: {resetToken}
              </div>
            )}
          </div>
        )}

        {!resetToken ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
                placeholder="staff@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-on-primary rounded-lg font-label-md text-sm font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Sending request...' : 'Send Reset Link'}
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/staff/login')}
                className="text-xs text-primary hover:underline font-semibold cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => navigate('/staff/reset-password', { state: { resetToken } })}
              className="w-full py-4 bg-primary text-on-primary rounded-lg font-label-md text-sm font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-90 cursor-pointer"
            >
              Proceed to Reset Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffForgotPassword;
