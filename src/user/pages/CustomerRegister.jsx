import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from "@/shared/context/AuthContext";

const CustomerRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register(name, email, mobile, password);
      const from = location.state?.from?.pathname || '/book-appointment';
      navigate(from, { replace: true });
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-headline-lg font-headline-lg font-bold text-primary tracking-widest mb-2">LUXE GROOM</h1>
        <p className="text-on-surface-variant font-label-md text-sm uppercase tracking-widest">Create Client Account</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-label-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-1 text-[11px]">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-1 text-[11px]">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
            placeholder="name@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-1 text-[11px]">Mobile Number</label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
            placeholder="+1234567890"
            required
          />
        </div>

        <div>
          <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-1 text-[11px]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-1 text-[11px]">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-primary text-on-primary rounded-lg font-label-md text-sm font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 cursor-pointer mt-2"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-label-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-bold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerRegister;
