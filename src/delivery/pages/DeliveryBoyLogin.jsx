import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';

const DeliveryBoyLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const targetUrl = `${API_BASE}/api/delivery/login`;
      console.log('Sending delivery boy login request to:', targetUrl, { username });
      const res = await axios.post(targetUrl, {
        username,
        password
      });

      if (res.data.success) {
        localStorage.setItem('delivery_boy', JSON.stringify(res.data.data));
        toast.success('Logged in successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Delivery boy login failed. Error details:', err);
      toast.error(err.response?.data?.message || 'Login failed');
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
              className="flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg bg-primary text-on-primary shadow-md transition-all"
            >
              Delivery Login
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

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
              placeholder="Username"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary rounded-lg text-sm font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In as Delivery Partner'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeliveryBoyLogin;
