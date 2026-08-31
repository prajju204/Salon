import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail, resendVerification, user } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'enter-otp'
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [showResendInput, setShowResendInput] = useState(false);
  
  // OTP verification states
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('enter-otp');
      if (user?.email) {
        setOtpEmail(user.email);
        setResendEmail(user.email);
      } else {
        setShowResendInput(true);
      }
      return;
    }

    const performVerification = async () => {
      try {
        const data = await verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully.');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification link has expired. Resend verification.');
        if (user?.email) {
          setOtpEmail(user.email);
          setResendEmail(user.email);
        } else {
          setShowResendInput(true);
        }
      }
    };

    performVerification();
  }, [token, verifyEmail, user]);

  const handleResend = async (e) => {
    if (e) e.preventDefault();
    const emailToUse = resendEmail || otpEmail || (user && user.email);
    if (!emailToUse) {
      setMessage('Please enter your email address.');
      setShowResendInput(true);
      return;
    }

    setResending(true);
    try {
      const res = await resendVerification(emailToUse);
      
      // If we are in dev mode, alert the developer what the OTP/Link is!
      if (res.devVerificationOtp) {
        setMessage(`[DEV MODE] OTP generated: ${res.devVerificationOtp}. Verification email sent.`);
      } else {
        setMessage('Verification email sent. Please check your inbox.');
      }
      
      setStatus('enter-otp');
    } catch (err) {
      setMessage(err.message || 'Failed to resend verification email.');
      setStatus('error');
    } finally {
      setResending(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const emailToUse = otpEmail || (user && user.email);
    if (!emailToUse) {
      setMessage('Email address is required.');
      return;
    }
    if (otpCode.length !== 6) {
      setMessage('Please enter a valid 6-digit OTP.');
      return;
    }

    setVerifyingOtp(true);
    setMessage('');
    try {
      const data = await verifyEmail(null, otpCode, emailToUse);
      setStatus('success');
      setMessage(data.message || 'Email verified successfully.');
    } catch (err) {
      setMessage(err.message || 'Verification failed. Invalid or expired OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative w-full max-w-md mx-auto my-12 text-center font-body">
      <div className="mb-6">
        <h1 className="text-headline-lg font-headline-lg font-bold text-primary tracking-widest mb-2">LUXE GROOM</h1>
        <p className="text-on-surface-variant font-label-md text-sm uppercase tracking-widest">Email Verification</p>
      </div>

      <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
        {status === 'verifying' && (
          <>
            <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">sync</span>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {message || 'Verifying your email address, please wait...'}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <span className="material-symbols-outlined text-4xl text-green-400 mb-4 animate-bounce">check_circle</span>
            <h3 className="text-md font-bold text-green-400 mb-2">Verification Successful</h3>
            <p className="text-sm text-on-surface leading-relaxed mb-6">
              {message || 'Email verified successfully.'}
            </p>
            <Link
              to="/dashboard"
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 block"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'enter-otp' && (
          <div className="w-full">
            <span className="material-symbols-outlined text-4xl text-primary mb-4">pin</span>
            <h3 className="text-md font-bold text-on-surface mb-2">Verify via OTP</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Enter the 6-digit OTP code sent to your email.
            </p>

            {message && (
              <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-primary">
                {message}
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              {(!user || !user.email) && (
                <div>
                  <input
                    type="email"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary text-center"
                    required
                  />
                </div>
              )}
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface text-2xl font-bold focus:outline-none focus:border-primary tracking-[8px] text-center"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={verifyingOtp || otpCode.length !== 6}
                className="w-full py-3 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
              >
                {verifyingOtp ? 'Verifying OTP...' : 'Verify OTP Code'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-2">
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-primary hover:underline cursor-pointer disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <>
            <span className="material-symbols-outlined text-4xl text-red-400 mb-4">cancel</span>
            <h3 className="text-md font-bold text-red-400 mb-2">Verification Failed</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              {message}
            </p>

            {showResendInput && (
              <form onSubmit={handleResend} className="w-full mb-4">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => {
                    setResendEmail(e.target.value);
                    setOtpEmail(e.target.value);
                  }}
                  placeholder="Enter your registered email"
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary mb-3 text-center"
                  required
                />
              </form>
            )}

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
              
              <button
                onClick={() => setStatus('enter-otp')}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-lg font-label-md text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-white/10 transition-all cursor-pointer"
              >
                Enter OTP Code Instead
              </button>
            </div>
          </>
        )}
      </div>

      <div className="text-center">
        <Link to="/login" className="text-label-sm text-primary hover:underline font-bold">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
