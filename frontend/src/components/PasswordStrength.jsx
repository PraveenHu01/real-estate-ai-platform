import React from 'react';
import { Check, X } from 'lucide-react';

/**
 * Live password strength meter + rule checklist.
 * Mirrors the server policy in backend/utils/password.js — the server remains
 * authoritative; this is UX feedback only.
 */
const RULES = [
  { label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'A number', test: (p) => /[0-9]/.test(p) },
  { label: 'A symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
  { label: 'No 4+ repeated characters', test: (p) => p.length > 0 && !/(.)\1{3,}/.test(p) },
];

const LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
const BAR_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];
const TEXT_COLORS = ['text-red-400', 'text-orange-400', 'text-amber-400', 'text-lime-400', 'text-emerald-400'];

function scoreOf(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 12) s++;
  if (pw.length >= 16) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

export default function PasswordStrength({ password = '', showRules = true }) {
  if (!password) return null;

  const score = scoreOf(password);
  const passed = RULES.filter(r => r.test(password)).length;

  return (
    <div className="space-y-2.5 pt-1">
      {/* Segmented strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < score ? BAR_COLORS[score] : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-bold ${TEXT_COLORS[score]} w-16 text-right`}>
          {LABELS[score]}
        </span>
      </div>

      {showRules && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {RULES.map((r) => {
            const ok = r.test(password);
            return (
              <div key={r.label} className="flex items-center gap-1.5">
                {ok
                  ? <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  : <X className="w-3 h-3 text-slate-600 shrink-0" />}
                <span className={`text-[10px] ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {r.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        {passed}/{RULES.length} requirements met · checked against known breaches on submit
      </p>
    </div>
  );
}
