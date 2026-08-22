import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setDevMode(Boolean(res.data?.devMode));
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass-card rounded-2xl p-8 space-y-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            If an account exists for <span className="text-slate-200 font-semibold">{email}</span>,
            we sent a password reset link.
          </p>
          {devMode ? (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[11px] text-blue-300 text-left">
              <strong>Development mode:</strong> SMTP credentials are not configured in your <code>.env</code> file.
              The reset link is printed in the backend terminal.
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 text-left">
              <strong>Email dispatched!</strong> Please check your email inbox and spam folder for the password reset link.
            </div>
          )}
          <Link to="/login" className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition glow-blue">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-2xl p-8 space-y-6">

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Reset Your Password</h2>
          <p className="text-xs text-slate-400">Enter your email and we'll send you a reset link</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-400 mb-1">Email Address</label>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-transparent text-white w-full focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition shadow-lg glow-blue flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
          </button>
        </form>

        <Link to="/login" className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition">
          <ArrowLeft className="w-3 h-3" /> Back to Sign In
        </Link>

      </div>
    </div>
  );
}
