import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';

const DeliveryBoyLogin = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const targetUrl = `${API_BASE}/api/delivery/register`;
        const res = await axios.post(targetUrl, formData);
        if (res.data.success) {
          toast.success('Registration submitted! Please wait for admin approval.');
          setIsRegistering(false);
          setFormData({ name: '', username: '', password: '', phone: '' });
        }
      } else {
        const targetUrl = `${API_BASE}/api/delivery/login`;
        const res = await axios.post(targetUrl, {
          username: formData.username,
          password: formData.password
        });

        if (res.data.success) {
          localStorage.setItem('luxe_delivery_token', res.data.token);
          localStorage.setItem('delivery_boy', JSON.stringify(res.data.data));
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
          
          const { subscribeUserToPush } = await import('@/shared/utils/pushNotifications');
          await subscribeUserToPush('delivery');

          toast.success('Logged in successfully!');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Delivery auth failed. Error details:', err);
      toast.error(err.response?.data?.message || (isRegistering ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-on-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-background to-background" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
      
      <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative w-full max-w-md z-10 bg-surface/50 backdrop-blur-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-widest mb-2">LUXE GROOM</h1>
          <p className="text-on-surface-variant text-xs uppercase tracking-widest mb-4">Partner & Staff Portal</p>
          
          <div className="flex justify-center gap-1 bg-surface-container/80 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              className="flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg bg-primary text-on-primary shadow-md transition-all cursor-default"
            >
              {isRegistering ? 'Delivery Register' : 'Delivery Login'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/staff/login')}
              className="flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all cursor-pointer"
            >
              Staff Login
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
                  placeholder="9876543210"
                  pattern="^[0-9]{10}$"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
              placeholder="Username"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-surface-container border border-white/10 rounded-lg pl-4 pr-12 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
                placeholder="••••••••"
                required
                minLength={isRegistering ? 6 : 1}
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
            className="w-full py-4 bg-primary text-on-primary rounded-lg text-sm font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Register as Partner' : 'Sign In as Partner')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setFormData({ name: '', username: '', password: '', phone: '' });
            }}
            className="text-primary text-xs hover:underline uppercase tracking-widest cursor-pointer"
          >
            {isRegistering ? 'Already a partner? Login' : 'Become a partner? Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryBoyLogin;
