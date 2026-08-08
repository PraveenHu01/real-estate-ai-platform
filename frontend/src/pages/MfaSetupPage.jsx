import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import OtpInput from '../components/OtpInput';
import api from '../services/api';

export default function MfaSetupPage() {
  const [secret, setSecret] = useState('');
  const [qrData, setQrData] = useState('');
  const [otp, setOtp] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.post('/auth/mfa/setup');
        setSecret(res.data.secret);
        // Backend returns a ready-to-render data URL (qrcode runs server-side).
        setQrData(res.data.qrDataUrl);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to generate MFA secret');
      }
    };
    init();
  }, []);

  const handleVerify = async (e) => {
    e?.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/mfa/enable', { code: otp });
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSkip = () => navigate('/');

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-card rounded-2xl p-8 space-y-6">

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Secure Your Account with MFA</h2>
          <p className="text-xs text-slate-400">Two-factor authentication adds an extra layer of security</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="text-center space-y-3">
            <p className="text-xs text-slate-400 font-semibold">Step 1: Scan QR Code</p>
            {qrData ? (
              <div className="inline-block p-3 bg-white rounded-xl">
                <img src={qrData} alt="MFA QR Code" className="w-48 h-48" />
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto bg-slate-900 rounded-xl animate-pulse" />
            )}
            <p className="text-[10px] text-slate-500">Use Google Authenticator, Authy, or any TOTP app</p>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-semibold mb-2 text-center">Step 2: Or enter this code manually</p>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
              <code className="flex-1 text-center text-sm font-mono text-slate-200 tracking-wider select-all">
                {secret || '...'}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                aria-label="Copy secret"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-semibold mb-3 text-center">Step 3: Enter the 6-digit code</p>
            <form onSubmit={handleVerify} className="space-y-4">
              <OtpInput value={otp} onChange={setOtp} onComplete={handleVerify} />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold transition shadow-lg glow-violet flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Enable MFA'}
              </button>
            </form>
          </div>
        </div>

        <button
          onClick={handleSkip}
          className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition"
        >
          Skip for now
        </button>

        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[10px] text-blue-300 space-y-1">
          <p className="font-bold">Why enable MFA?</p>
          <p>Even if your password is compromised, your account stays secure.</p>
        </div>

      </div>
    </div>
  );
}
