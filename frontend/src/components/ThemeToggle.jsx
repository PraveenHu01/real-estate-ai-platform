import React, { useContext } from 'react';
import { ThemeContext, THEMES } from '../context/ThemeContext';
import { Sun, Sparkles } from 'lucide-react';

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme, isWhite } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isWhite ? "Switch to OLED Black Mode" : "Switch to White Light Mode"}
      aria-label={isWhite ? "Switch to OLED Black Mode" : "Switch to White Light Mode"}
      className={`relative inline-flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all duration-200 group ${
        isWhite
          ? 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 shadow-sm'
          : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:text-white hover:border-neutral-700 shadow-sm'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {isWhite ? (
          <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
        ) : (
          <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
        )}
      </div>

      <span className="text-xs font-semibold tracking-wide">
        {isWhite ? 'White Mode' : 'OLED Black'}
      </span>

      {/* Mini indicator pill */}
      <span
        className={`w-2 h-2 rounded-full transition-colors ${
          isWhite ? 'bg-amber-500 ring-2 ring-amber-400/30' : 'bg-purple-500 ring-2 ring-purple-400/30'
        }`}
      />
    </button>
  );
}
