import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Building2, Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import OtpInput from '../components/OtpInput';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');

  // MFA challenge state
  const [mfaTicket, setMfaTicket] = useState(null);
  const [otp, setOtp] = useState('');

  const { login, verifyMfa, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setErrorCode('');

    const res = await login(email, password);

    if (res.mfaRequired) {
      setMfaTicket(res.mfaTicket);
      return;
    }
    if (res.success) {
      navigate(res.mfaEnrollmentRequired ? '/mfa-setup' : '/');
      return;
    }
    setError(res.message);
    setErrorCode(res.code || '');
  };

  const handleMfaSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    const res = await verifyMfa(mfaTicket, otp);
    if (res.success) navigate('/');
    else { setError(res.message); setOtp(''); }
  };

  const handleDemoFill = (type) => {
    // Real credentials, seeded with Argon2id hashes by backend/utils/seedUsers.js
    const creds = {
      buyer: ['buyer@realestateai.com', 'BuyerDemo2026!'],
      seller: ['seller@realestateai.com', 'SellerDemo2026!'],
      admin: ['admin@realestateai.com', 'AdminDemo2026!'],
    }[type];
    setEmail(creds[0]);
    setPassword(creds[1]);
  };

  // ---- MFA challenge view ----
  if (mfaTicket) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Two-Factor Verification</h2>
            <p className="text-xs text-slate-400">Enter the 6-digit code from your authenticator app</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleMfaSubmit} className="space-y-5">
            <OtpInput value={otp} onChange={setOtp} onComplete={handleMfaSubmit} />
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition shadow-lg glow-violet flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify & Sign In'}
            </button>
          </form>

          <button
            onClick={() => { setMfaTicket(null); setOtp(''); setError(''); }}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ---- Password view ----
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

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {errorCode === 'EMAIL_UNVERIFIED' && (
              <p className="text-[11px] text-slate-400 pl-6">
                Check the backend console for your verification link.
              </p>
            )}
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-400">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-blue-400 hover:underline">Forgot?</Link>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-transparent text-white w-full focus:outline-none"
              />
              <button
                type="button" onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="text-slate-400 hover:text-slate-200 transition shrink-0"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition shadow-lg glow-blue flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800 text-center space-y-2">
          <span className="text-[11px] text-slate-400 font-semibold block">Quick Demo Login</span>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
            <button onClick={() => handleDemoFill('buyer')} className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 transition">Buyer</button>
            <button onClick={() => handleDemoFill('seller')} className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 transition">Seller</button>
            <button onClick={() => handleDemoFill('admin')} className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition">Admin</button>
          </div>
          <p className="text-[10px] text-slate-500">Fills real credentials — authentication is genuine</p>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account? <Link to="/register" className="text-blue-400 font-bold hover:underline">Register here</Link>
        </p>

      </div>
    </div>
  );
}
