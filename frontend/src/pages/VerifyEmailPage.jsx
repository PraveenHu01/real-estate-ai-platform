import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, MailCheck } from 'lucide-react';
import api from '../services/api';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState(token ? 'verifying' : 'missing'); // verifying | success | error | missing
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;   // StrictMode double-invokes effects; the token is single-use.

    api.post('/auth/verify-email', { token })
      .then((res) => { setState('success'); setMessage(res.data.message); })
      .catch((err) => { setState('error'); setMessage(err.response?.data?.message || 'Verification failed'); });
  }, [token]);

  const icon = {
    verifying: <Loader2 className="w-6 h-6 animate-spin" />,
    success: <CheckCircle2 className="w-6 h-6" />,
    error: <AlertCircle className="w-6 h-6" />,
    missing: <AlertCircle className="w-6 h-6" />,
  }[state];

  const bg = {
    verifying: 'bg-blue-600',
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    missing: 'bg-red-600',
  }[state];

  const title = {
    verifying: 'Verifying Your Email',
    success: 'Email Verified',
    error: 'Verification Failed',
    missing: 'Invalid Link',
  }[state];

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-2xl p-8 space-y-5 text-center">
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center text-white mx-auto`}>
          {icon}
        </div>

        <h2 className="text-2xl font-bold text-white">{title}</h2>

        <p className="text-xs text-slate-400 leading-relaxed">
          {state === 'verifying' && 'One moment...'}
          {state === 'success' && (message || 'Your email is confirmed. You can now sign in.')}
          {state === 'error' && (message || 'This link is invalid or has expired.')}
          {state === 'missing' && 'This link is missing its verification token.'}
        </p>

        {state === 'success' && (
          <Link to="/login" className="block w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition glow-emerald">
            Continue to Sign In
          </Link>
        )}

        {(state === 'error' || state === 'missing') && (
          <div className="space-y-2">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[11px] text-blue-300 text-left flex items-start gap-2">
              <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Verification links expire after 24 hours. Register again to receive a fresh link — it's printed in the backend console.</span>
            </div>
            <Link to="/register" className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition">
              Back to Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
