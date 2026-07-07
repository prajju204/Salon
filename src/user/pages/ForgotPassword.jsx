import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/shared/context/AuthContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('customer'); // Default to customer
  const [resetToken, setResetToken] = useState('');
  const [message, setMessage] = useState('');
  
  const { forgotPassword, adminForgotPassword, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Prefill role if navigated from Admin page
  React.useEffect(() => {
    if (location.state?.role) {
      setRole(location.state.role);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      let res;
      if (role === 'admin') {
        res = await adminForgotPassword(email);
      } else {
        res = await forgotPassword(email);
      }
      
      setMessage('Password reset code generated successfully.');
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err) {
      // Handled by context
    }
  };

  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-headline-lg font-headline-lg font-bold text-primary tracking-widest mb-2">LUXE GROOM</h1>
        <p className="text-on-surface-variant font-label-md text-sm uppercase tracking-widest">Forgot Password</p>
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
            <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Select User Type</label>
            <div className="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  role === 'customer' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  role === 'admin' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <div>
            <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
              placeholder="name@example.com"
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
        </form>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => navigate('/reset-password', { state: { resetToken, role } })}
            className="w-full py-4 bg-primary text-on-primary rounded-lg font-label-md text-sm font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-90 cursor-pointer"
          >
            Proceed to Reset Password
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
