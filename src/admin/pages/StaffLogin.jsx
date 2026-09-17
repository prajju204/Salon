import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { toast } from 'sonner';

const StaffLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { staffLogin, loading, error, setError, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (user && user.role === 'staff') {
      navigate('/staff-dashboard', { replace: true });
    }
  }, [user, navigate]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      toast.error('Your session has expired. Please sign in again to continue.');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter both username/email and password');
      return;
    }
    try {
      await staffLogin(username.trim(), password);
      toast.success('Login successful!');
      navigate('/staff-dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Invalid Credentials');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-headline text-primary mb-2 tracking-tight">LUXE GROOM</h1>
        <p className="text-on-surface-variant text-xs uppercase tracking-widest mb-4">Partner & Staff Portal</p>
        
        <div className="flex justify-center gap-1 bg-surface-container/80 p-1 rounded-xl border border-white/10 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all cursor-pointer"
          >
            Delivery Login
          </button>
          <button
            type="button"
            className="flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg bg-primary text-on-primary shadow-md transition-all"
          >
            Staff Login
          </button>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-[24px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold ml-1">Username or Email</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-xl z-10">person</span>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="w-full bg-background border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all relative z-0"
                placeholder="username or staff@luxegroom.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold ml-1">Password</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-xl z-10">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-background border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all relative z-0"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer z-10"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary rounded-lg text-sm font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In as Staff'}
          </button>
          
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate('/staff/forgot-password')}
              className="text-xs text-primary hover:underline font-semibold cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>

      <div className="text-center mt-8">
        <button onClick={() => navigate('/login')} className="text-sm text-on-surface-variant hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-0.5 cursor-pointer">
          Delivery Partner Login
        </button>
      </div>
    </div>
  );
};

export default StaffLogin;
