import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Building2, LogIn, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message || 'Login failed');
    }
  };

  const handleDemoFill = (type) => {
    if (type === 'buyer') {
      setEmail('buyer@realestateai.com');
      setPassword('buyer123');
    } else if (type === 'seller') {
      setEmail('seller@realestateai.com');
      setPassword('seller123');
    } else if (type === 'admin') {
      setEmail('admin@realestateai.com');
      setPassword('admin123');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-2xl p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome Back to InvestAI</h2>
          <p className="text-xs text-slate-400">Sign in to manage saved properties, ROI analytics, &amp; chat</p>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-400 mb-1">Email Address</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <input 
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@realestateai.com"
                className="bg-transparent text-white w-full focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Password</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <Lock className="w-4 h-4 text-slate-400" />
              <input 
                type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent text-white w-full focus:outline-none"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg glow-blue"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="pt-3 border-t border-slate-800 text-center space-y-2">
          <span className="text-[11px] text-slate-400 font-semibold block">Quick Demo One-Click Login</span>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
            <button onClick={() => handleDemoFill('buyer')} className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800">
              Buyer
            </button>
            <button onClick={() => handleDemoFill('seller')} className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800">
              Seller
            </button>
            <button onClick={() => handleDemoFill('admin')} className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800">
              Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account? <Link to="/register" className="text-blue-400 font-bold hover:underline">Register here</Link>
        </p>

      </div>
    </div>
  );
}
