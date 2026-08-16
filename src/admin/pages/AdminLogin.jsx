import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from "@/shared/context/AuthContext";

const AdminLogin = () => {
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'staff'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { adminLogin, staffLogin, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Your session has expired. Please sign in again to continue.');
    }
  }, [location.search, setError]);

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setError(''); // clear errors when switching tabs
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (loginType === 'admin') {
        await adminLogin(email, password);
        navigate('/dashboard');
      } else {
        await staffLogin(username, password);
        navigate('/staff-dashboard');
      }
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-headline-lg font-headline-lg font-bold text-primary tracking-widest mb-2">LUXE GROOM</h1>
        <p className="text-red-400 font-label-md text-[10px] uppercase tracking-widest font-bold">Portal Administration</p>
      </div>

      {/* Toggle Tab */}
      <div className="flex bg-white/5 p-1.5 rounded-xl mb-6 border border-white/10">
        <button
          type="button"
          onClick={() => handleLoginTypeChange('admin')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            loginType === 'admin'
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Admin Login
        </button>
        <button
          type="button"
          onClick={() => handleLoginTypeChange('staff')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            loginType === 'staff'
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Staff Login
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-label-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {loginType === 'admin' ? (
          <div>
            <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
              placeholder="admin@gmail.com"
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Staff Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
              placeholder="Enter username"
              required
            />
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant">Password</label>
            {loginType === 'admin' && (
              <Link to="/forgot-password" state={{ role: 'admin' }} className="text-xs text-primary hover:underline font-semibold">
                Forgot?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm pr-12"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-white/10 bg-surface-container text-primary focus:ring-primary accent-primary"
          />
          <label htmlFor="rememberMe" className="ml-2 text-xs text-on-surface-variant uppercase tracking-wider font-semibold cursor-pointer">
            Remember Me
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-on-primary rounded-lg font-label-md text-sm font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Authenticating...' : `Sign In As ${loginType === 'admin' ? 'Admin' : 'Staff'}`}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
