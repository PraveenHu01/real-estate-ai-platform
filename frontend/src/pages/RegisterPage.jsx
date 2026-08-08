import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Building2, User, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Buyer');
  const { register, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(name, email, password, role);
    if (res.success) {
      navigate('/');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-2xl p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Platform Account</h2>
          <p className="text-xs text-slate-400">Join as a Buyer, Seller, or Investment Analyst</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-400 mb-1">Full Name</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <User className="w-4 h-4 text-slate-400" />
              <input 
                type="text" required
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Verma"
                className="bg-transparent text-white w-full focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Email Address</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <input 
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
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

          <div>
            <label className="block text-slate-400 mb-1">Select Account Role</label>
            <div className="grid grid-cols-3 gap-2">
              {['Buyer', 'Seller', 'Admin'].map((r) => (
                <button
                  type="button" key={r}
                  onClick={() => setRole(r)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    role === r 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg glow-blue"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already have an account? <Link to="/login" className="text-blue-400 font-bold hover:underline">Sign in here</Link>
        </p>

      </div>
    </div>
  );
}
