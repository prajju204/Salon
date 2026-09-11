import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';

const DeliveryBoyLogin = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const res = await axios.post(`${API_BASE}/api/delivery/register`, formData);
        if (res.data.success) {
          toast.success('Registration submitted! Please wait for admin approval.');
          setIsRegistering(false);
          setFormData({ name: '', username: '', password: '', phone: '' });
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/delivery/login`, {
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
          navigate('/delivery-dashboard');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isRegistering ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-on-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-background to-background" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
      
      <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headline font-bold text-primary tracking-widest mb-2">LUXE GROOM</h1>
          <p className="text-on-surface-variant font-label-md text-sm uppercase tracking-widest">
            {isRegistering ? 'Delivery Partner Registration' : 'Delivery Portal Login'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <>
              <div>
                <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
                  placeholder="9876543210"
                  pattern="^[0-9]{10}$"
                  required
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
              placeholder="Username"
              required
            />
          </div>
          <div>
            <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors font-body text-sm"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary rounded-lg font-label-md text-sm font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-primary text-sm hover:underline font-label-md uppercase tracking-widest cursor-pointer"
          >
            {isRegistering ? 'Already have an account? Login' : 'Become a Partner? Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryBoyLogin;
