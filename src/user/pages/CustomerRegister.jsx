import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from "@/shared/context/AuthContext";

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

const CustomerRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState('Male');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { register, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || !email.includes('@')) {
      errors.email = "Please enter a valid email containing '@'.";
    }

    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
      errors.mobile = "Mobile number must be exactly 10 digits.";
    }

    const passwordRegex = /^(?=.*[@#$%!]).{8,}$/;
    if (!passwordRegex.test(password)) {
      errors.password = "Password must be at least 8 characters and contain a special character (@, #, $, %, !).";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      const res = await register(name, email, mobile, password, gender);
      if (res?.autoVerified || res?.user?.email_verified) {
        navigate('/login', { 
          replace: true, 
          state: { successMessage: 'Account created successfully! You can now sign in.' } 
        });
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
      }
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
            onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({...prev, email: ''})); }}
            className={`w-full bg-surface-container border ${fieldErrors.email ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm`}
            placeholder="name@example.com"
            required
          />
          {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-1 text-[11px]">Mobile Number</label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => { setMobile(e.target.value.replace(/\\D/g, '')); setFieldErrors(prev => ({...prev, mobile: ''})); }}
            className={`w-full bg-surface-container border ${fieldErrors.mobile ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm`}
            placeholder="1234567890"
            maxLength="10"
            required
          />
          {fieldErrors.mobile && <p className="text-red-400 text-xs mt-1">{fieldErrors.mobile}</p>}
        </div>

        <div>
          <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-1 text-[11px]">Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Male ♂', value: 'Male' },
              { label: 'Female ♀', value: 'Female' },
              { label: 'Other', value: 'Other' }
            ].map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGender(g.value)}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  gender === g.value
                    ? 'bg-primary/20 border-primary text-primary font-bold shadow-sm'
                    : 'bg-surface-container border-white/10 text-on-surface-variant hover:border-white/30'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-1 text-[11px]">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({...prev, password: ''})); }}
              className={`w-full bg-surface-container border ${fieldErrors.password ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2.5 pr-10 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm`}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
        </div>

        <div>
          <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-1 text-[11px]">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({...prev, confirmPassword: ''})); }}
              className={`w-full bg-surface-container border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2.5 pr-10 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm`}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
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
