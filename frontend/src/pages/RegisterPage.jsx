import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Building2, User, Mail, Lock, Phone, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import PasswordStrength from '../components/PasswordStrength';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'Buyer', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [breached, setBreached] = useState(false);
  const [done, setDone] = useState(false);

  const { register, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setBreached(false);

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }

    const res = await register({
      name: form.name, email: form.email, password: form.password,
      role: form.role, phone: form.phone,
    });

    if (res.success) { setDone(true); return; }
    setError(res.message);
    setBreached(!!res.breached);
  };

  // ---- Post-registration: verification required ----
  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass-card rounded-2xl p-8 space-y-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            We sent a verification link to <span className="text-slate-200 font-semibold">{form.email}</span>.
            You must verify before signing in.
          </p>
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[11px] text-blue-300 text-left">
            <strong>Development mode:</strong> email isn't actually sent. Open your
            backend terminal — the verification link is printed there.
          </div>
          <Link to="/login" className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition glow-blue">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-2xl p-8 space-y-6">

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Platform Account</h2>
          <p className="text-xs text-slate-400">Join as a Buyer or Seller</p>
        </div>

        {error && (
          <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
            breached
              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {breached ? <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-400 mb-1">Full Name</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <input type="text" required value={form.name} onChange={set('name')}
                placeholder="Rahul Verma" autoComplete="name"
                className="bg-transparent text-white w-full focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Email Address</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input type="email" required value={form.email} onChange={set('email')}
                placeholder="rahul@example.com" autoComplete="email"
                className="bg-transparent text-white w-full focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Phone <span className="text-slate-600">(optional)</span></label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <input type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+91 98765 43210" autoComplete="tel"
                className="bg-transparent text-white w-full focus:outline-none" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Encrypted at rest with AES-256</p>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Password</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                placeholder="At least 8 characters" autoComplete="new-password"
                className="bg-transparent text-white w-full focus:outline-none" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="text-slate-400 hover:text-slate-200 transition shrink-0">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Confirm Password</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input type={showPw ? 'text' : 'password'} required value={form.confirm} onChange={set('confirm')}
                placeholder="Re-enter password" autoComplete="new-password"
                className="bg-transparent text-white w-full focus:outline-none" />
            </div>
            {form.confirm && form.password !== form.confirm && (
              <p className="text-[10px] text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['Buyer', 'Seller'].map(r => (
                <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`py-2.5 rounded-xl border font-bold transition ${
                    form.role === r
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">Agent and Admin roles are assigned by an administrator</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition shadow-lg glow-blue flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already have an account? <Link to="/login" className="text-blue-400 font-bold hover:underline">Sign in</Link>
        </p>

      </div>
    </div>
  );
}
