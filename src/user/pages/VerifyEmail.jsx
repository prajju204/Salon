import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { API_URL } from '@/shared/utils/api';
import { toast } from 'sonner';
import axios from 'axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'waiting-link'
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendEmail, setResendEmail] = useState(emailParam || '');
  const [showResendInput, setShowResendInput] = useState(!emailParam);

  // 1. Handle actual verification when a link is clicked
  useEffect(() => {
    if (!token) {
      setStatus('waiting-link');
      setMessage('A verification email has been sent to your Gmail address. Please check your inbox and click the verification link to activate your account.');
      return;
    }

    const performVerification = async () => {
      try {
        setStatus('verifying');
        const data = await verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully.');
        toast.success('Email verified successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 4000);
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Your verification link has expired. Click \'Resend Verification Email\' to receive a new one.');
      }
    };

    performVerification();
  }, [token, verifyEmail, navigate]);

  // 2. Poll server if waiting for verification link to be clicked
  useEffect(() => {
    if (status !== 'waiting-link' || !resendEmail) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/check-verification?email=${encodeURIComponent(resendEmail)}`);
        if (res.data?.success && res.data?.verified) {
          setStatus('success');
          setMessage('Email verified successfully! You can now log in.');
          toast.success('Email verified successfully!');
          clearInterval(interval);
          setTimeout(() => {
            navigate('/login');
          }, 4000);
        }
      } catch (err) {
        // Suppress errors during polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, resendEmail, navigate]);

  const handleResend = async (e) => {
    if (e) e.preventDefault();
    const emailToUse = resendEmail;
    if (!emailToUse) {
      toast.error('Please enter your email address.');
      setShowResendInput(true);
      return;
    }

    setResending(true);
    try {
      await resendVerification(emailToUse);
      setMessage('A verification email has been sent to your Gmail address. Please check your inbox and click the verification link to activate your account.');
      toast.success('Verification email resent successfully.');
      setStatus('waiting-link');
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification.');
      setMessage(err.message || 'Failed to resend verification email.');
      setStatus('error');
    } finally {
      setResending(false);
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
              Verifying your email address, please wait...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <span className="material-symbols-outlined text-4xl text-green-400 mb-4 animate-bounce">check_circle</span>
            <h3 className="text-md font-bold text-green-400 mb-2">Verification Successful</h3>
            <p className="text-sm text-on-surface leading-relaxed mb-6">
              {message}
            </p>
            <Link
              to="/login"
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 block"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === 'waiting-link' && (
          <div className="w-full">
            <span className="material-symbols-outlined text-4xl text-primary mb-4 animate-pulse">mail</span>
            <h3 className="text-md font-bold text-on-surface mb-2">Check Your Inbox</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              {message}
            </p>

            {showResendInput && (
              <form onSubmit={handleResend} className="w-full mb-4">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary mb-3 text-center"
                  required
                />
              </form>
            )}

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>
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
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-2 text-on-surface text-sm focus:outline-none focus:border-primary mb-3 text-center"
                  required
                />
              </form>
            )}

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-label-md text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>
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
