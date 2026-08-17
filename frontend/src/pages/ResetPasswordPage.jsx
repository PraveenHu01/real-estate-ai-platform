import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldAlert } from 'lucide-react';
import PasswordStrength from '../components/PasswordStrength';
import api from '../services/api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [breached, setBreached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setBreached(false);

    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const d = err.response?.data || {};
      setError(d.message || 'Reset failed');
      setBreached(!!d.breached);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass-card rounded-2xl p-8 space-y-4 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Invalid Reset Link</h2>
          <p className="text-xs text-slate-400">This link is missing its token. Request a new one.</p>
          <Link to="/forgot-password" className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass-card rounded-2xl p-8 space-y-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Password Updated</h2>
          <p className="text-xs text-slate-400">All other sessions were signed out. Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Set a New Password</h2>
          <p className="text-xs text-slate-400">Choose a strong password you haven't used before</p>
        </div>

        {error && (
          <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
            breached ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                     : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {breached ? <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-400 mb-1">New Password</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input type={showPw ? 'text' : 'password'} required autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="bg-transparent text-white w-full focus:outline-none" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="text-slate-400 hover:text-slate-200 transition shrink-0">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Confirm New Password</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input type={showPw ? 'text' : 'password'} required autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="bg-transparent text-white w-full focus:outline-none" />
            </div>
            {confirm && password !== confirm && (
              <p className="text-[10px] text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition shadow-lg glow-blue flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
