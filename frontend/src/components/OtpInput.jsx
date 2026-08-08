import React, { useRef, useEffect } from 'react';

/**
 * 6-digit OTP input with auto-focus and paste support.
 */
export default function OtpInput({ value, onChange, onComplete }) {
  const inputs = useRef([]);

  useEffect(() => {
    if (inputs.current[0]) inputs.current[0].focus();
  }, []);

  const handleChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const digits = value.split('');
    digits[idx] = val.slice(-1);
    const next = digits.join('');
    onChange(next);

    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (next.length === 6) onComplete?.();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    if (pasted.length === 6) {
      inputs.current[5]?.focus();
      onComplete?.();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-2xl font-bold bg-slate-900 border-2 border-slate-700 rounded-xl text-white focus:border-violet-500 focus:outline-none transition"
        />
      ))}
    </div>
  );
}
