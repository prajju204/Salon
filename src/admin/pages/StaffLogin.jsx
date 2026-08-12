import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { toast } from 'sonner';

const StaffLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { staffLogin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }
    try {
      await staffLogin(username, password);
      toast.success('Login successful!');
      navigate('/staff-dashboard');
    } catch (err) {
      // Error is handled in context, but we can show toast
      toast.error(err.message || 'Invalid Credentials');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-headline text-primary mb-2 tracking-tight">Staff Portal</h1>
        <p className="text-on-surface-variant text-sm">Sign in to your stylist account</p>
      </div>

      <div className="glass-panel p-8 rounded-[24px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold ml-1">Username</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-xl z-10">person</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all relative z-0"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold ml-1">Password</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-xl z-10">lock</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all relative z-0"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary text-sm font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-50 mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>

      <div className="text-center mt-8">
        <button onClick={() => navigate('/login')} className="text-sm text-on-surface-variant hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-0.5">
          Admin Login
        </button>
      </div>
    </div>
  );
};

export default StaffLogin;
